"""
Core Types, Enums, and Data Models for the API Request Pipeline.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class ProcessingRoute(str, Enum):
    """Destination target decided by Request Classifier."""
    INTERNAL = "INTERNAL"
    EXTERNAL_MYCO = "EXTERNAL_MYCO"
    REJECTED = "REJECTED"


class BackendStatus(str, Enum):
    """External Backend Connection State."""
    CONNECTED = "CONNECTED"
    UNCONFIGURED = "UNCONFIGURED"
    CIRCUIT_OPEN = "CIRCUIT_OPEN"
    TIMEOUT = "TIMEOUT"
    DEGRADED = "DEGRADED"


class FindingSeverity(str, Enum):
    """Finding severity levels matching Myco standard specification."""
    CLEAN = "CLEAN"
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class SourceRange:
    start_line: int
    end_line: int
    start_col: Optional[int] = 1
    end_col: Optional[int] = 1

    def to_dict(self) -> Dict[str, Any]:
        return {
            "startLine": self.start_line,
            "endLine": self.end_line,
            "startCol": self.start_col,
            "endCol": self.end_col,
        }


@dataclass
class AnalysisFinding:
    """Standardized finding schema shared across Internal & External engines."""
    id: str
    category: str
    severity: FindingSeverity
    title: str
    explanation: str
    impact: str
    file_path: str
    source_range: SourceRange
    evidence_snippet: str
    suggested_action: str
    is_merge_blocking: bool
    evidence_rule: Optional[str] = None
    validation_status: str = "CONFIRMED"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "category": self.category,
            "severity": self.severity.value,
            "validationStatus": self.validation_status,
            "title": self.title,
            "explanation": self.explanation,
            "impact": self.impact,
            "filePath": self.file_path,
            "sourceRange": self.source_range.to_dict(),
            "evidenceSnippet": self.evidence_snippet,
            "evidenceRule": self.evidence_rule or "SYSTEM_RULE",
            "suggestedAction": self.suggested_action,
            "isMergeBlocking": self.is_merge_blocking,
        }


@dataclass
class UserContext:
    """Authenticated user context with plan tier and identity attributes."""
    user_id: str
    org_id: str
    tier: str = "free"
    client_ip: str = "127.0.0.1"
    user_agent: str = ""
    is_authenticated: bool = False
    is_admin: bool = False
    api_key_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "userId": self.user_id,
            "orgId": self.org_id,
            "tier": self.tier,
            "clientIp": self.client_ip,
            "userAgent": self.user_agent,
            "isAuthenticated": self.is_authenticated,
            "isAdmin": self.is_admin,
        }


@dataclass
class CodeInputFile:
    path: str
    content: str

    def to_dict(self) -> Dict[str, Any]:
        return {"path": self.path, "content": self.content}


@dataclass
class ClassificationResult:
    """Structured result from Request Classifier."""
    route: ProcessingRoute
    confidence: float
    detected_format: str
    is_code: bool
    is_diff: bool
    file_count: int
    total_characters: int
    estimated_tokens: int
    requires_cross_repo_graph: bool
    requires_deep_symbolic: bool
    reason: str
    structural_features: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "route": self.route.value,
            "confidence": self.confidence,
            "detectedFormat": self.detected_format,
            "isCode": self.is_code,
            "isDiff": self.is_diff,
            "fileCount": self.file_count,
            "totalCharacters": self.total_characters,
            "estimatedTokens": self.estimated_tokens,
            "requiresCrossRepoGraph": self.requires_cross_repo_graph,
            "requiresDeepSymbolic": self.requires_deep_symbolic,
            "reason": self.reason,
            "features": self.structural_features,
        }


@dataclass
class UsageMetadata:
    """Resource consumption and metering metadata attached to request & response."""
    character_count: int
    estimated_tokens: int
    actual_tokens: int
    diff_lines: int
    file_count: int
    processing_time_ms: float
    daily_quota_consumed: int
    daily_quota_remaining: int
    rate_limit_remaining: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "characterCount": self.character_count,
            "estimatedTokens": self.estimated_tokens,
            "actualTokens": self.actual_tokens,
            "diffLines": self.diff_lines,
            "fileCount": self.file_count,
            "processingTimeMs": round(self.processing_time_ms, 2),
            "dailyQuotaConsumed": self.daily_quota_consumed,
            "dailyQuotaRemaining": self.daily_quota_remaining,
            "rateLimitRemaining": self.rate_limit_remaining,
        }


@dataclass
class NormalizedResponse:
    """Canonical response format guaranteed for all clients."""
    request_id: str
    status_code: int
    success: bool
    route_executed: str
    message: str
    findings: List[Dict[str, Any]]
    summary: Dict[str, Any]
    usage: Dict[str, Any]
    quota: Dict[str, Any]
    errors: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "requestId": self.request_id,
            "statusCode": self.status_code,
            "success": self.success,
            "routeExecuted": self.route_executed,
            "message": self.message,
            "findings": self.findings,
            "summary": self.summary,
            "usage": self.usage,
            "quota": self.quota,
            "errors": self.errors,
        }
