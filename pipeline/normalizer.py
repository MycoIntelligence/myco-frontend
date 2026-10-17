"""
Response Normalization and Sanitization Subsystem.

Ensures every response emitted by the pipeline adheres to a unified canonical schema,
includes tracking metadata and quota headers, and redacts credentials from findings.
"""

from typing import Any, Dict, List, Optional

from pipeline.security import SecurityManager
from pipeline.types import NormalizedResponse, UsageMetadata


class ResponseNormalizer:
    """Canonical Response Normalizer."""

    @staticmethod
    def normalize(
        request_id: str,
        status_code: int,
        success: bool,
        route_executed: str,
        message: str,
        findings: List[Dict[str, Any]],
        summary: Dict[str, Any],
        usage: UsageMetadata,
        quota_info: Dict[str, Any],
        errors: Optional[List[str]] = None,
    ) -> NormalizedResponse:
        """
        Normalizes findings and returns canonical NormalizedResponse.
        """
        errors = errors or []

        # Sanitize findings to ensure no secrets or tokens are returned in evidence snippets
        sanitized_findings = []
        for finding in findings:
            cleaned = dict(finding)
            if "evidenceSnippet" in cleaned and isinstance(cleaned["evidenceSnippet"], str):
                cleaned["evidenceSnippet"] = SecurityManager.redact_secrets(cleaned["evidenceSnippet"])
            if "explanation" in cleaned and isinstance(cleaned["explanation"], str):
                cleaned["explanation"] = SecurityManager.redact_secrets(cleaned["explanation"])
            sanitized_findings.append(cleaned)

        return NormalizedResponse(
            request_id=request_id,
            status_code=status_code,
            success=success,
            route_executed=route_executed,
            message=message,
            findings=sanitized_findings,
            summary=summary,
            usage=usage.to_dict(),
            quota=quota_info,
            errors=errors,
        )


response_normalizer = ResponseNormalizer()
