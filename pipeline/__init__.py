"""
API Request Pipeline Package for Public Demo.
"""

from pipeline.backend_adapter import (
    BackendProvider,
    BackendRoutingRequest,
    BackendRoutingResponse,
    FutureMycoAdapter,
    MockBackendProvider,
    future_myco_adapter,
)
from pipeline.classifier import RequestClassifier, classifier
from pipeline.config import DemoAllowancePolicy, PipelineConfig, config
from pipeline.gateway import ApiGateway, gateway
from pipeline.internal_engine import InternalProcessingEngine, internal_engine
from pipeline.normalizer import ResponseNormalizer, response_normalizer
from pipeline.observability import MetricsRegistry, StructuredLogger, metrics
from pipeline.quota import DemoQuotaService, TokenEstimator, quota_service
from pipeline.router import PipelineRouter, pipeline_router
from pipeline.security import SecurityManager
from pipeline.types import (
    AnalysisFinding,
    ClassificationResult,
    CodeInputFile,
    NormalizedResponse,
    ProcessingRoute,
    UsageMetadata,
    UserContext,
)

# Backward-compatibility alias
TierQuotaPolicy = DemoAllowancePolicy
QuotaService = DemoQuotaService

__all__ = [
    "config",
    "PipelineConfig",
    "DemoAllowancePolicy",
    "TierQuotaPolicy",
    "ProcessingRoute",
    "AnalysisFinding",
    "UserContext",
    "CodeInputFile",
    "ClassificationResult",
    "UsageMetadata",
    "NormalizedResponse",
    "SecurityManager",
    "MetricsRegistry",
    "StructuredLogger",
    "metrics",
    "TokenEstimator",
    "DemoQuotaService",
    "QuotaService",
    "quota_service",
    "RequestClassifier",
    "classifier",
    "InternalProcessingEngine",
    "internal_engine",
    "BackendProvider",
    "BackendRoutingRequest",
    "BackendRoutingResponse",
    "FutureMycoAdapter",
    "MockBackendProvider",
    "future_myco_adapter",
    "ResponseNormalizer",
    "response_normalizer",
    "ApiGateway",
    "gateway",
    "PipelineRouter",
    "pipeline_router",
]
