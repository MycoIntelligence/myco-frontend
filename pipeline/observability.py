"""
Observability and Telemetry Subsystem.

Provides:
- Privacy-aware structured JSON logging with correlation IDs.
- Automatic secret masking in all logged payloads.
- Real-time in-memory metrics aggregation (counters, latencies, quota drops, circuit state).
"""

import json
import logging
import time
import uuid
from typing import Any, Dict
from pipeline.security import SecurityManager

logger = logging.getLogger("myco.pipeline")


class MetricsRegistry:
    """In-memory telemetry and metrics aggregator for the API request pipeline."""

    def __init__(self):
        self._counts = {
            "requests_total": 0,
            "requests_internal": 0,
            "requests_external_myco": 0,
            "requests_rejected": 0,
            "quota_exceeded_total": 0,
            "rate_limited_total": 0,
            "circuit_breaker_trips": 0,
            "backend_retries": 0,
            "backend_failures": 0,
        }
        self._counts_by_tier = {
            "free": 0,
            "pro": 0,
            "enterprise": 0,
            "admin": 0,
        }
        self._active_concurrency = 0
        self._latencies_internal = []
        self._latencies_external = []
        self._circuit_state = "CLOSED"

    def increment(self, metric: str, amount: int = 1):
        if metric in self._counts:
            self._counts[metric] += amount

    def record_tier_request(self, tier: str):
        tier_key = (tier or "free").lower()
        if tier_key in self._counts_by_tier:
            self._counts_by_tier[tier_key] += 1
        else:
            self._counts_by_tier[tier_key] = 1

    def record_latency(self, route: str, duration_ms: float):
        if route == "INTERNAL":
            self._latencies_internal.append(duration_ms)
            if len(self._latencies_internal) > 500:
                self._latencies_internal.pop(0)
        elif route == "EXTERNAL_MYCO":
            self._latencies_external.append(duration_ms)
            if len(self._latencies_external) > 500:
                self._latencies_external.pop(0)

    def set_circuit_state(self, state: str):
        self._circuit_state = state

    def set_concurrency(self, active: int):
        self._active_concurrency = max(0, active)

    def get_summary(self) -> Dict[str, Any]:
        """Produces a health and metrics summary payload."""
        avg_internal = sum(self._latencies_internal) / len(self._latencies_internal) if self._latencies_internal else 0.0
        avg_external = sum(self._latencies_external) / len(self._latencies_external) if self._latencies_external else 0.0

        return {
            "counters": dict(self._counts),
            "tierCounts": dict(self._counts_by_tier),
            "activeConcurrency": self._active_concurrency,
            "circuitBreakerState": self._circuit_state,
            "latencyMs": {
                "internalAverage": round(avg_internal, 2),
                "externalAverage": round(avg_external, 2),
                "internalSamples": len(self._latencies_internal),
                "externalSamples": len(self._latencies_external),
            },
            "timestamp": time.time(),
        }


metrics = MetricsRegistry()


class StructuredLogger:
    """Privacy-preserving structured logger with secret redaction."""

    @staticmethod
    def generate_request_id() -> str:
        return f"req_{int(time.time())}_{uuid.uuid4().hex[:8]}"

    @staticmethod
    def log(level: str, event: str, request_id: str, data: Dict[str, Any]):
        entry = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "level": level.upper(),
            "event": event,
            "requestId": request_id,
            "data": data,
        }
        # Serialize to JSON and redact any accidental secrets
        raw_json = json.dumps(entry, default=str)
        safe_json = SecurityManager.redact_secrets(raw_json)
        # Output clean log message without emoji
        print(f"[{entry['level']}] [{entry['requestId']}] {event}: {safe_json}")
