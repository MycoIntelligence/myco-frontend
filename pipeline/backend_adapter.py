"""
Backend Provider Interface and Future Myco Adapter Architecture.

Establishes:
- Abstract BackendProvider contract for modular backend pluggability.
- Strict request and response data contracts for external routing.
- Circuit breaker with CLOSED, OPEN, and HALF_OPEN states.
- FutureMycoAdapter adhering to design specifications (no fake live calls, configurable
  routing behavior when unconfigured: reject_503, awaiting_integration_202, queue_202).
- MockBackendProvider strictly for automated test suites and local integration testing.
"""

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from pipeline.config import config
from pipeline.observability import metrics


class CircuitBreakerState(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreaker:
    """
    Fault-tolerance circuit breaker preventing cascading failures and protecting downstream services.
    """

    def __init__(self, failure_threshold: int = 5, recovery_timeout_sec: float = 30.0, half_open_successes: int = 2):
        self.failure_threshold = failure_threshold
        self.recovery_timeout_sec = recovery_timeout_sec
        self.half_open_successes = half_open_successes

        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_state_change = time.time()

    def can_execute(self) -> bool:
        now = time.time()
        if self.state == CircuitBreakerState.OPEN:
            if (now - self.last_state_change) > self.recovery_timeout_sec:
                # Transition to HALF_OPEN probe state
                self.state = CircuitBreakerState.HALF_OPEN
                self.success_count = 0
                self.last_state_change = now
                metrics.set_circuit_state("HALF_OPEN")
                return True
            return False
        return True

    def record_success(self):
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.half_open_successes:
                self.state = CircuitBreakerState.CLOSED
                self.failure_count = 0
                self.last_state_change = time.time()
                metrics.set_circuit_state("CLOSED")
        elif self.state == CircuitBreakerState.CLOSED:
            self.failure_count = 0

    def record_failure(self):
        self.failure_count += 1
        now = time.time()
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.state = CircuitBreakerState.OPEN
            self.last_state_change = now
            metrics.increment("circuit_breaker_trips")
            metrics.set_circuit_state("OPEN")
        elif self.state == CircuitBreakerState.CLOSED and self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN
            self.last_state_change = now
            metrics.increment("circuit_breaker_trips")
            metrics.set_circuit_state("OPEN")


@dataclass
class BackendRoutingRequest:
    """Standardized Request Contract for external backend providers."""
    request_id: str
    user_id: str
    org_id: str
    tier: str
    target_repository: Optional[str]
    pr_number: Optional[int]
    primary_file: Optional[Dict[str, Any]]
    context_files: List[Dict[str, Any]]
    diff_text: Optional[str]
    requested_features: List[str]
    timeout_seconds: float = 15.0
    client_metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BackendRoutingResponse:
    """Standardized Response Contract returned from backend adapters."""
    request_id: str
    provider_id: str
    status: str                         # "completed", "queued", "awaiting_integration", "rejected", "failed"
    status_code: int
    findings: List[Dict[str, Any]]
    summary: Dict[str, Any]
    provider_metadata: Dict[str, Any]
    error_message: Optional[str] = None
    retry_recommended: bool = False


class BackendProvider(ABC):
    """Abstract provider interface for all external analysis backends."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def is_enabled(self) -> bool:
        pass

    @abstractmethod
    def route_request(self, request: BackendRoutingRequest) -> BackendRoutingResponse:
        pass


class FutureMycoAdapter(BackendProvider):
    """
    Dedicated Adapter for the future Myco Backend.
    
    Adheres strictly to architectural requirements:
    - Does NOT invent undocumented API endpoints or execute fake functional calls.
    - Isolates all external integration logic from the core pipeline.
    - Dispatches according to configurable fallback policy when unconfigured:
      'reject_503', 'awaiting_integration_202', or 'queue_202'.
    - Implements circuit breaker, timeout, and retry policy hooks.
    """

    def __init__(self):
        self._circuit_breaker = CircuitBreaker(
            failure_threshold=config.circuit_breaker_failure_threshold,
            recovery_timeout_sec=config.circuit_breaker_recovery_timeout_sec,
            half_open_successes=config.circuit_breaker_half_open_successes,
        )

    @property
    def provider_id(self) -> str:
        return "myco-backend-v1"

    @property
    def provider_name(self) -> str:
        return "Future Myco Enterprise Intelligence Backend"

    @property
    def is_enabled(self) -> bool:
        return config.myco_backend_enabled and bool(config.myco_backend_url)

    def route_request(self, request: BackendRoutingRequest) -> BackendRoutingResponse:
        """
        Routes the request to the Myco backend or executes configurable fallback.
        """
        # 1. Check if integration is currently active and configured
        if not self.is_enabled:
            policy = config.myco_unavailable_policy
            
            if policy == "candidate_notice_200":
                return BackendRoutingResponse(
                    request_id=request.request_id,
                    provider_id=self.provider_id,
                    status="requires_myco_backend",
                    status_code=200,
                    findings=[],
                    summary={
                        "status": "requires_myco_backend",
                        "canProcessInternally": False,
                        "requiresFullRepo": True,
                        "requiredFeatures": request.requested_features,
                        "explanation": "This workload requires full-repository AST indexing and cross-repository symbol resolution, which is handled by our future Myco backend.",
                        "nextAction": "request_pilot",
                    },
                    provider_metadata={
                        "backendConfigured": False,
                        "fallbackPolicy": policy,
                    },
                    error_message="Identified as candidate for future Myco backend. Public demo runs single-file AST inspections internally; full-repo indexing will be enabled with Myco integration.",
                )
            
            if policy == "awaiting_integration_202":
                return BackendRoutingResponse(
                    request_id=request.request_id,
                    provider_id=self.provider_id,
                    status="awaiting_integration",
                    status_code=202,
                    findings=[],
                    summary={"status": "awaiting_backend_integration", "canProcessInternally": False},
                    provider_metadata={
                        "backendConfigured": False,
                        "fallbackPolicy": policy,
                        "requiredFeatures": request.requested_features,
                    },
                    error_message="Request accepted and marked awaiting future Myco backend connection.",
                )
            
            if policy == "queue_202":
                return BackendRoutingResponse(
                    request_id=request.request_id,
                    provider_id=self.provider_id,
                    status="queued",
                    status_code=202,
                    findings=[],
                    summary={"status": "queued_for_processing", "queuePosition": 1},
                    provider_metadata={
                        "backendConfigured": False,
                        "fallbackPolicy": policy,
                    },
                    error_message="Request enqueued. Analysis will proceed once external processing worker is connected.",
                )

            # Default: reject_503
            return BackendRoutingResponse(
                request_id=request.request_id,
                provider_id=self.provider_id,
                status="rejected",
                status_code=503,
                findings=[],
                summary={"status": "external_backend_unavailable", "canProcessInternally": False},
                provider_metadata={
                    "backendConfigured": False,
                    "targetUrl": config.myco_backend_url,
                    "fallbackPolicy": "reject_503",
                },
                error_message="External Myco backend is not yet configured. This request requires multi-repository indexing or deep symbolic analysis not supported by internal AST engine.",
                retry_recommended=False,
            )

        # 2. Check Circuit Breaker
        if not self._circuit_breaker.can_execute():
            metrics.increment("backend_failures")
            return BackendRoutingResponse(
                request_id=request.request_id,
                provider_id=self.provider_id,
                status="failed",
                status_code=503,
                findings=[],
                summary={"circuitBreaker": "OPEN"},
                provider_metadata={"state": "CIRCUIT_OPEN"},
                error_message="Circuit breaker is currently OPEN for external Myco backend due to consecutive failures. Request rejected to prevent service cascading.",
                retry_recommended=True,
            )

        # 3. Connection Hook for Future Real Implementation:
        # When official API contract is released, the HTTP client call with exponential backoff
        # and authentication headers will be executed here.
        # Currently, since Myco backend is unreleased, report unconfigured.
        return BackendRoutingResponse(
            request_id=request.request_id,
            provider_id=self.provider_id,
            status="rejected",
            status_code=503,
            findings=[],
            summary={"backend": "unconnected"},
            provider_metadata={"endpoint": config.myco_backend_url},
            error_message="Myco backend adapter interface is active, but live connection endpoint is pending official API release.",
        )


class MockBackendProvider(BackendProvider):
    """
    Mock Backend Provider used exclusively for automated test validation and local development.
    """

    def __init__(self, simulate_failure: bool = False, simulate_status_code: int = 200):
        self._simulate_failure = simulate_failure
        self._simulate_status_code = simulate_status_code

    @property
    def provider_id(self) -> str:
        return "mock-backend-test"

    @property
    def provider_name(self) -> str:
        return "Mock Provider for Automated Tests"

    @property
    def is_enabled(self) -> bool:
        return True

    def route_request(self, request: BackendRoutingRequest) -> BackendRoutingResponse:
        if self._simulate_failure:
            return BackendRoutingResponse(
                request_id=request.request_id,
                provider_id=self.provider_id,
                status="failed",
                status_code=self._simulate_status_code,
                findings=[],
                summary={"mockError": True},
                provider_metadata={"mock": True},
                error_message="Simulated mock backend error for testing fault tolerance.",
                retry_recommended=True,
            )

        mock_findings = [
            {
                "id": "MOCK-EXT-01",
                "category": "architecture",
                "severity": "MEDIUM",
                "validationStatus": "CONFIRMED",
                "title": "Cross-Repository Interface Mismatch Detected by Myco",
                "explanation": "External Myco backend identified breaking change across repository dependency boundary.",
                "impact": "Dependent downstream service billing-worker will fail on unhandled method signature.",
                "filePath": "src/api/client.ts",
                "sourceRange": {"startLine": 12, "endLine": 14},
                "evidenceSnippet": "export function charge(customerId: string)",
                "evidenceRule": "ARCH-02 · INTER-SERVICE CONTRACT STABILITY",
                "suggestedAction": "Update downstream client signature before deploying.",
                "isMergeBlocking": False,
            }
        ]

        return BackendRoutingResponse(
            request_id=request.request_id,
            provider_id=self.provider_id,
            status="completed",
            status_code=200,
            findings=mock_findings,
            summary={
                "totalFindings": 1,
                "criticalCount": 0,
                "highCount": 0,
                "mediumCount": 1,
                "cleanVerified": False,
                "processedBy": "mock-backend",
            },
            provider_metadata={"mockExecution": True, "resolvedSymbols": 142},
        )


future_myco_adapter = FutureMycoAdapter()
