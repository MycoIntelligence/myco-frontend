"""
Demo Usage Metering and Fair Usage Enforcement Service.

Enforces:
- Finite demo allowance (e.g. 5 free analyses per rolling 24-hour window).
- Input ceilings (25k characters, 400 diff lines, 5 files, 256 KB body size).
- Idempotency & request deduplication (submitting identical code does not deduct demo allowance).
- Fair-usage guarantee (failed, invalid, or interrupted requests are never charged).
- Sliding-window anti-spam rate limiting (5 RPM).
- Concurrency limit (1 active operation per demo session).
- Graceful exhaustion state with reset timestamps and pilot request guidance.
"""

import hashlib
import json
import os
from pathlib import Path
import threading
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from pipeline.config import DemoAllowancePolicy, config


@dataclass
class DemoQuotaCheckResult:
    allowed: bool
    status_code: int = 200
    error_code: str = ""
    message: str = ""
    limit_type: str = ""
    current_value: int = 0
    max_limit: int = 0
    reset_at: Optional[str] = None
    next_action: str = ""
    is_cached: bool = False
    cached_response: Optional[Dict[str, Any]] = None


class TokenEstimator:
    """Estimates code tokens for quota projections."""

    @staticmethod
    def estimate_tokens(content: str) -> int:
        if not content:
            return 0
        char_count = len(content)
        symbol_count = len([c for c in content if c in "{}[]();:,.<>!=+-*/&|~^"])
        estimated = int((char_count / 3.8) + (symbol_count * 0.15))
        return max(1, estimated)

    @staticmethod
    def count_diff_lines(diff_text: str) -> int:
        if not diff_text:
            return 0
        return len([line for line in diff_text.splitlines() if line.startswith(("+", "-", "@@"))])


class DemoQuotaService:
    """
    Thread-safe Central Demo Quota and Fair Usage Service with Anti-Bypass Enforcement.

    Enforces:
    - Finite demo allowance (5 free analyses per rolling 24-hour window).
    - Persistent state via lightweight JSON flat file (survives restarts without a database).
    - Anti-bypass protection combining client session ID and IP/User-Agent fingerprint.
    - True sliding-window 24-hour rolling reset based on run epoch timestamps.
    - Input ceilings (25k characters, 400 diff lines, 5 files, 256 KB body size).
    - Idempotency & request deduplication (submitting identical code does not deduct demo allowance).
    - Fair-usage guarantee (failed, invalid, or interrupted requests are never charged).
    - Sliding-window anti-spam rate limiting (5 RPM).
    - Concurrency limit (1 active operation per demo session).
    - Graceful exhaustion state with reset timestamps and pilot request guidance.
    """

    def __init__(self, persistence_file: Optional[Path] = None):
        self._lock = threading.Lock()
        self._persistence_file = (
            persistence_file
            if persistence_file is not None
            else Path(__file__).resolve().parent / ".demo_allowance.json"
        )
        # Session & IP run records: key -> list of execution epoch timestamps
        self._session_runs: Dict[str, List[float]] = {}
        # RPM rate limit windows: key -> list of timestamps
        self._rpm_windows: Dict[str, List[float]] = {}
        # Active concurrency: key -> int
        self._active_concurrency: Dict[str, int] = {}
        # Idempotency deduplication cache: (key + content_hash) -> cached NormalizedResponse dict
        self._idempotency_cache: Dict[str, Dict[str, Any]] = {}

        self._load_from_disk()

    def _load_from_disk(self):
        """Loads persisted demo run timestamps from flat file if present."""
        if not self._persistence_file.exists():
            return
        try:
            with open(self._persistence_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict):
                now = time.time()
                # Prune runs older than 48 hours on startup
                cutoff = now - (config.demo_policy.window_duration_seconds * 2)
                pruned: Dict[str, List[float]] = {}
                for k, timestamps in data.items():
                    if isinstance(timestamps, list):
                        valid = [float(t) for t in timestamps if isinstance(t, (int, float)) and t > cutoff]
                        if valid:
                            pruned[k] = valid
                self._session_runs = pruned
        except Exception:
            # Resilient fallback: start fresh if file is unreadable or malformed
            pass

    def _save_to_disk(self):
        """Persists run timestamps to flat file atomically."""
        try:
            now = time.time()
            cutoff = now - (config.demo_policy.window_duration_seconds * 2)
            cleaned = {}
            for k, timestamps in self._session_runs.items():
                valid = [t for t in timestamps if t > cutoff]
                if valid:
                    cleaned[k] = valid
            self._session_runs = cleaned

            tmp_file = self._persistence_file.with_suffix(".tmp")
            with open(tmp_file, "w", encoding="utf-8") as f:
                json.dump(cleaned, f)
            os.replace(tmp_file, self._persistence_file)
        except Exception:
            pass

    def reset_all(self, clear_disk: bool = False):
        """Helper for test suites and maintenance to reset all in-memory usage state."""
        with self._lock:
            self._session_runs.clear()
            self._rpm_windows.clear()
            self._active_concurrency.clear()
            self._idempotency_cache.clear()
            if clear_disk and self._persistence_file.exists():
                try:
                    self._persistence_file.unlink()
                except Exception:
                    pass

    def reset_allowance(self, *keys: Optional[str]):
        """Resets run records and rate limits for specified keys (or clears all if no keys)."""
        with self._lock:
            filter_keys = [k for k in keys if k]
            if not filter_keys:
                self._session_runs.clear()
                self._rpm_windows.clear()
                self._active_concurrency.clear()
            else:
                for k in filter_keys:
                    self._session_runs.pop(k, None)
                    self._rpm_windows.pop(k, None)
                    self._active_concurrency.pop(k, None)
            self._save_to_disk()

    def get_session_key(self, session_id: Optional[str]) -> Optional[str]:
        """Derives primary session token hash."""
        clean = (session_id or "").strip()
        if not clean or clean == "demo_sess_anon":
            return None
        return f"sess_{hashlib.sha256(clean.encode('utf-8')).hexdigest()[:16]}"

    def get_ip_key(self, client_ip: str = "127.0.0.1", user_agent: str = "") -> str:
        """
        Derives secondary network & browser composite fingerprint.
        Combines client IP and User-Agent to catch Incognito/cache-clearing bypasses
        while avoiding false positives across different devices on a shared Wi-Fi.
        """
        clean_ip = (client_ip or "127.0.0.1").strip()
        clean_ua = (user_agent or "").strip().lower()
        composite = f"{clean_ip}:{clean_ua}" if clean_ua else clean_ip
        return f"ip_{hashlib.sha256(composite.encode('utf-8')).hexdigest()[:16]}"

    def get_session_fingerprint(
        self,
        session_id: Optional[str],
        client_ip: str = "127.0.0.1",
        user_agent: str = "",
    ) -> str:
        """
        Maintains backward compatibility for callers expecting a single fingerprint string.
        """
        clean_session = (session_id or "").strip()
        if clean_session and clean_session != "demo_sess_anon":
            return f"sess_{hashlib.sha256(clean_session.encode('utf-8')).hexdigest()[:16]}"
        return self.get_ip_key(client_ip, user_agent)

    def compute_content_hash(self, content_str: str) -> str:
        """Generates SHA-256 fingerprint of submitted code/diff for deduplication."""
        return hashlib.sha256((content_str or "").strip().encode("utf-8")).hexdigest()[:16]

    def check_and_reserve(
        self,
        session_key: str,
        content_hash: str,
        payload_bytes: int,
        content_chars: int,
        file_count: int,
        diff_lines: int,
        is_admin_bypass: bool = False,
        is_sample_demo: bool = False,
        ip_key: Optional[str] = None,
    ) -> DemoQuotaCheckResult:
        """
        Enforces input limits, rate limits, and demo run allowance before processing begins.
        Checks both session key and IP composite key to prevent bypasses.
        """
        policy: DemoAllowancePolicy = config.demo_policy
        now = time.time()

        # 1. Check Idempotency Cache (Deduplication)
        cache_key = f"{session_key}:{content_hash}"
        with self._lock:
            if cache_key in self._idempotency_cache:
                cached_data = self._idempotency_cache[cache_key]
                return DemoQuotaCheckResult(
                    allowed=True,
                    is_cached=True,
                    cached_response=cached_data,
                    message="Result retrieved from deduplication cache (demo allowance preserved).",
                )

        # Admin bypass for internal team demonstrations
        if is_admin_bypass:
            return DemoQuotaCheckResult(allowed=True, message="Admin bypass active.")

        # 2. Input Size Checks (HTTP 413 / 400)
        if payload_bytes > policy.max_body_size_bytes:
            max_kb = policy.max_body_size_bytes // 1024
            curr_kb = payload_bytes // 1024
            return DemoQuotaCheckResult(
                allowed=False,
                status_code=413,
                error_code="PAYLOAD_TOO_LARGE",
                message=f"Demo payload size ({curr_kb} KB) exceeds maximum allowed size of {max_kb} KB.",
                limit_type="body_size_bytes",
                current_value=payload_bytes,
                max_limit=policy.max_body_size_bytes,
                next_action="reduce_payload_size",
            )

        if file_count > policy.max_files_per_request:
            return DemoQuotaCheckResult(
                allowed=False,
                status_code=400,
                error_code="FILE_COUNT_EXCEEDED",
                message=f"Request contains {file_count} files, exceeding the demo limit of {policy.max_files_per_request} files per request.",
                limit_type="file_count",
                current_value=file_count,
                max_limit=policy.max_files_per_request,
                next_action="submit_single_file_or_diff",
            )

        if diff_lines > policy.max_diff_lines:
            return DemoQuotaCheckResult(
                allowed=False,
                status_code=400,
                error_code="DIFF_SIZE_EXCEEDED",
                message=f"PR diff contains {diff_lines} lines, exceeding the demo limit of {policy.max_diff_lines} lines. For whole-repository PR analysis, request a pilot.",
                limit_type="diff_lines",
                current_value=diff_lines,
                max_limit=policy.max_diff_lines,
                next_action="request_pilot",
            )

        if content_chars > policy.max_characters_per_request:
            return DemoQuotaCheckResult(
                allowed=False,
                status_code=400,
                error_code="CHARACTER_COUNT_EXCEEDED",
                message=f"Input length ({content_chars} characters) exceeds the demo limit of {policy.max_characters_per_request} characters.",
                limit_type="characters",
                current_value=content_chars,
                max_limit=policy.max_characters_per_request,
                next_action="trim_code_input",
            )

        # Thread-safe allowance check and reservation
        with self._lock:
            # 3. Concurrency Lock Check (HTTP 429)
            active_sess = self._active_concurrency.get(session_key, 0)
            active_ip = self._active_concurrency.get(ip_key, 0) if (ip_key and ip_key != session_key) else 0
            if active_sess >= policy.max_concurrent_requests or active_ip >= policy.max_concurrent_requests:
                return DemoQuotaCheckResult(
                    allowed=False,
                    status_code=429,
                    error_code="CONCURRENCY_LIMIT_REACHED",
                    message="Another analysis is already in progress for this session. Please wait for it to complete.",
                    limit_type="concurrent_requests",
                    current_value=max(active_sess, active_ip),
                    max_limit=policy.max_concurrent_requests,
                )

            # 4. Demo Allowance Check (Rolling 24-hour Window across session and IP)
            window_start = now - policy.window_duration_seconds
            sess_runs = [t for t in self._session_runs.get(session_key, []) if t > window_start]
            self._session_runs[session_key] = sess_runs

            ip_runs = []
            if ip_key and ip_key != session_key:
                ip_runs = [t for t in self._session_runs.get(ip_key, []) if t > window_start]
                self._session_runs[ip_key] = ip_runs

            used_count = max(len(sess_runs), len(ip_runs))
            governing_runs = sess_runs if len(sess_runs) >= len(ip_runs) else ip_runs

            if not is_sample_demo and used_count >= policy.max_analyses_per_window:
                # Calculate when the earliest run in this window resets
                earliest_run = min(governing_runs) if governing_runs else (now - policy.window_duration_seconds)
                reset_timestamp = earliest_run + policy.window_duration_seconds
                reset_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(reset_timestamp))
                hours_remaining = max(1, int((reset_timestamp - now) // 3600))

                return DemoQuotaCheckResult(
                    allowed=False,
                    status_code=429,
                    error_code="DEMO_ALLOWANCE_EXHAUSTED",
                    message=(
                        f"Demo allowance used: You have completed all {policy.max_analyses_per_window} free demo analyses "
                        f"for this session. Your allowance will reset in approximately {hours_remaining} hour(s) ({reset_iso}). "
                        f"To analyze full repositories without demo limits, please request a pilot."
                    ),
                    limit_type="demo_analyses",
                    current_value=used_count,
                    max_limit=policy.max_analyses_per_window,
                    reset_at=reset_iso,
                    next_action="request_pilot",
                )

            # 5. Anti-spam Sliding Window Rate Limit (HTTP 429) - Applied to custom code submissions
            if not is_sample_demo:
                timestamps = self._rpm_windows.setdefault(session_key, [])
                one_min_ago = now - 60.0
                self._rpm_windows[session_key] = [t for t in timestamps if t > one_min_ago]
                if len(self._rpm_windows[session_key]) >= policy.requests_per_minute:
                    return DemoQuotaCheckResult(
                        allowed=False,
                        status_code=429,
                        error_code="RATE_LIMIT_EXCEEDED",
                        message=f"Rate limit of {policy.requests_per_minute} analyses per minute reached. Please pause a few moments before retrying.",
                        limit_type="requests_per_minute",
                        current_value=len(self._rpm_windows[session_key]),
                        max_limit=policy.requests_per_minute,
                    )

                # Reserve rate limit timestamp for custom code
                self._rpm_windows[session_key].append(now)

            # Reserve concurrency slot
            self._active_concurrency[session_key] = active_sess + 1
            if ip_key and ip_key != session_key:
                self._active_concurrency[ip_key] = active_ip + 1

            return DemoQuotaCheckResult(
                allowed=True,
                current_value=used_count,
                max_limit=policy.max_analyses_per_window,
            )

    def record_success_and_cache(
        self,
        session_key: str,
        content_hash: str,
        response_data: Dict[str, Any],
        is_admin_bypass: bool = False,
        is_sample_demo: bool = False,
        ip_key: Optional[str] = None,
    ):
        """
        Counts a completed successful analysis towards the demo allowance across session and IP,
        persists run state to flat file, caches response for deduplication, and releases concurrency.
        """
        now = time.time()
        cache_key = f"{session_key}:{content_hash}"

        with self._lock:
            # Release concurrency
            active_sess = self._active_concurrency.get(session_key, 1)
            self._active_concurrency[session_key] = max(0, active_sess - 1)
            if ip_key and ip_key != session_key:
                active_ip = self._active_concurrency.get(ip_key, 1)
                self._active_concurrency[ip_key] = max(0, active_ip - 1)

            # Record run towards allowance if custom code
            if not is_admin_bypass and not is_sample_demo:
                self._session_runs.setdefault(session_key, []).append(now)
                if ip_key and ip_key != session_key:
                    self._session_runs.setdefault(ip_key, []).append(now)
                self._save_to_disk()

            # Cache response for duplicate submissions
            if content_hash:
                self._idempotency_cache[cache_key] = response_data
                if len(self._idempotency_cache) > 1000:
                    first_key = next(iter(self._idempotency_cache))
                    del self._idempotency_cache[first_key]

    def release_on_failure(self, session_key: str, ip_key: Optional[str] = None):
        """
        Releases the concurrency slot WITHOUT deducting from the user's demo allowance.
        Fair-usage guarantee: Failed or interrupted requests are never charged.
        """
        with self._lock:
            active_sess = self._active_concurrency.get(session_key, 1)
            self._active_concurrency[session_key] = max(0, active_sess - 1)
            if ip_key and ip_key != session_key:
                active_ip = self._active_concurrency.get(ip_key, 1)
                self._active_concurrency[ip_key] = max(0, active_ip - 1)

    def get_allowance_info(self, session_key: str, ip_key: Optional[str] = None) -> Dict[str, Any]:
        """Provides current demo allowance state for client UI indicators."""
        policy: DemoAllowancePolicy = config.demo_policy
        now = time.time()
        window_start = now - policy.window_duration_seconds

        with self._lock:
            sess_runs = [t for t in self._session_runs.get(session_key, []) if t > window_start]
            ip_runs = []
            if ip_key and ip_key != session_key:
                ip_runs = [t for t in self._session_runs.get(ip_key, []) if t > window_start]

            used_count = max(len(sess_runs), len(ip_runs))
            governing_runs = sess_runs if len(sess_runs) >= len(ip_runs) else ip_runs
            remaining = max(0, policy.max_analyses_per_window - used_count)
            is_exhausted = (remaining == 0)

            reset_iso = None
            reset_in_seconds = 0
            if governing_runs:
                earliest_run = min(governing_runs)
                reset_timestamp = earliest_run + policy.window_duration_seconds
                reset_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(reset_timestamp))
                reset_in_seconds = max(0, int(reset_timestamp - now))

        return {
            "maxRuns": policy.max_analyses_per_window,
            "usedRuns": used_count,
            "remainingRuns": remaining,
            "isExhausted": is_exhausted,
            "resetAt": reset_iso,
            "resetInSeconds": reset_in_seconds,
            "nextAction": "request_pilot" if is_exhausted else "analyze",
            "limits": {
                "maxCharacters": policy.max_characters_per_request,
                "maxDiffLines": policy.max_diff_lines,
                "maxFiles": policy.max_files_per_request,
            },
        }


quota_service = DemoQuotaService()
