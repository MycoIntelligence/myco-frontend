"""
Centralized Configuration for the Public Product Demo Pipeline.

Provides:
- Demo allowance limits (finite runs per session/day, input character/diff limits).
- Anti-abuse settings (sliding-window RPM, idempotency deduplication, concurrency).
- Future Myco backend integration settings and fallback policies.
- SSRF and sensitive credential redaction settings.
"""

import os
from dataclasses import dataclass, field
from typing import Dict, List, Set


@dataclass(frozen=True)
class DemoAllowancePolicy:
    """Configurable usage limits for the public product demo."""
    # Run Limits
    max_analyses_per_window: int = int(os.getenv("DEMO_MAX_ANALYSES", "5"))          # 5 free runs
    window_duration_seconds: int = int(os.getenv("DEMO_WINDOW_SECONDS", "86400"))     # 24 hours rolling
    
    # Input Ceilings
    max_body_size_bytes: int = int(os.getenv("DEMO_MAX_BODY_BYTES", str(256 * 1024))) # 256 KB
    max_characters_per_request: int = int(os.getenv("DEMO_MAX_CHARS", "25000"))       # 25k chars
    max_estimated_tokens_per_request: int = int(os.getenv("DEMO_MAX_TOKENS", "6500")) # 6.5k tokens
    max_files_per_request: int = int(os.getenv("DEMO_MAX_FILES", "5"))               # 5 files max
    max_diff_lines: int = int(os.getenv("DEMO_MAX_DIFF_LINES", "400"))               # 400 diff lines
    
    # Rate Limiting & Concurrency
    requests_per_minute: int = int(os.getenv("DEMO_RPM_LIMIT", "5"))                 # 5 RPM spam guard
    max_concurrent_requests: int = int(os.getenv("DEMO_CONCURRENCY_LIMIT", "1"))      # 1 concurrent job
    execution_timeout_seconds: float = float(os.getenv("DEMO_TIMEOUT_SECONDS", "10.0"))# 10s deadline


@dataclass
class PipelineConfig:
    """Master Pipeline Configuration for Public Demo with Future Myco Integration."""
    env: str = os.getenv("APP_ENV", "development")
    service_name: str = "myco-public-demo-pipeline"
    version: str = "1.0.0"

    # Demo Usage Allowance
    demo_policy: DemoAllowancePolicy = field(default_factory=DemoAllowancePolicy)

    # Future Myco External Backend Integration Settings
    myco_backend_enabled: bool = os.getenv("MYCO_BACKEND_ENABLED", "false").lower() in ("true", "1", "yes")
    myco_backend_url: str = os.getenv("MYCO_BACKEND_URL", "https://api.myco.internal/v1")
    myco_backend_api_key: str = os.getenv("MYCO_BACKEND_API_KEY", "")
    myco_backend_timeout_seconds: float = float(os.getenv("MYCO_BACKEND_TIMEOUT_SEC", "15.0"))
    myco_backend_max_retries: int = int(os.getenv("MYCO_BACKEND_MAX_RETRIES", "2"))
    myco_backend_retry_backoff: float = float(os.getenv("MYCO_BACKEND_RETRY_BACKOFF", "0.5"))
    
    # Behavior when complex request requires Myco but backend is not yet available
    # Options: "candidate_notice_200", "reject_503", "awaiting_integration_202"
    myco_unavailable_policy: str = os.getenv("MYCO_UNAVAILABLE_POLICY", "candidate_notice_200").lower()

    # Circuit Breaker Defaults
    circuit_breaker_failure_threshold: int = int(os.getenv("CB_FAILURE_THRESHOLD", "5"))
    circuit_breaker_recovery_timeout_sec: float = float(os.getenv("CB_RECOVERY_TIMEOUT_SEC", "30.0"))
    circuit_breaker_half_open_successes: int = int(os.getenv("CB_HALF_OPEN_SUCCESSES", "2"))

    # Security & SSRF
    allowed_repo_hosts: Set[str] = field(default_factory=lambda: {"github.com", "gitlab.com", "bitbucket.org"})
    enforce_ssrf_protection: bool = True
    mask_sensitive_findings: bool = True

    # Administrative bypass token for team testing / demonstrations
    admin_bypass_token: str = os.getenv("DEMO_ADMIN_BYPASS_TOKEN", "myco_team_eval_token_2026")


config = PipelineConfig()
