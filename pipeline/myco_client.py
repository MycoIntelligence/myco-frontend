"""
Myco Secondary Review Client and Configuration Validator.

Handles validation of GitHub repository secrets and variables required by the
official Myco bundled GitHub Action, provides bounded retries with exponential backoff
for transient failures, and ensures that sensitive secrets are never leaked into
logs, PR comments, or error diagnostics.
"""

import os
import re
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from pipeline.types import ReviewResult, ReviewStatus


@dataclass
class MycoConfig:
    """Holds validated Myco configuration metadata without exposing secret contents."""
    is_configured: bool
    missing_secrets: List[str]
    missing_variables: List[str]
    client_id: Optional[str] = None
    metrics_endpoint: Optional[str] = None
    has_llM_key: bool = False
    has_metrics_key: bool = False

    def get_status_summary(self) -> str:
        """Returns non-sensitive status report suitable for logs and pull request comments."""
        if self.is_configured:
            return f"Myco configuration verified (Client ID: {self.client_id or 'configured'})."
        missing = self.missing_secrets + self.missing_variables
        return (
            f"Myco configuration incomplete. Missing required items: {', '.join(missing)}. "
            "Please configure under GitHub Repository -> Settings -> Secrets and variables -> Actions."
        )


class MycoConfigValidator:
    """Validates presence and format of required Myco Action secrets and variables."""

    REQUIRED_SECRETS = ["MYCO_LLM_API_KEY", "MYCO_METRICS_API_KEY"]
    REQUIRED_VARIABLES = ["MYCO_METRICS_ENDPOINT", "MYCO_CLIENT_ID"]

    @classmethod
    def validate(cls, env: Optional[Dict[str, str]] = None) -> MycoConfig:
        """
        Inspects environment variables for Myco Action requirements.
        Never echoes or leaks secret values in outputs or exceptions.
        """
        source = env if env is not None else os.environ
        missing_secrets: List[str] = []
        missing_vars: List[str] = []

        llm_key = source.get("MYCO_LLM_API_KEY", "").strip()
        metrics_key = source.get("MYCO_METRICS_API_KEY", "").strip()
        endpoint = source.get("MYCO_METRICS_ENDPOINT", "").strip()
        client_id = source.get("MYCO_CLIENT_ID", "").strip()

        if not llm_key:
            missing_secrets.append("MYCO_LLM_API_KEY (secret)")
        if not metrics_key:
            missing_secrets.append("MYCO_METRICS_API_KEY (secret)")
        if not endpoint:
            missing_vars.append("MYCO_METRICS_ENDPOINT (variable)")
        if not client_id:
            missing_vars.append("MYCO_CLIENT_ID (variable)")

        is_configured = len(missing_secrets) == 0 and len(missing_vars) == 0

        return MycoConfig(
            is_configured=is_configured,
            missing_secrets=missing_secrets,
            missing_variables=missing_vars,
            client_id=client_id if client_id else None,
            metrics_endpoint=endpoint if endpoint else None,
            has_llM_key=bool(llm_key),
            has_metrics_key=bool(metrics_key),
        )

    @staticmethod
    def mask_secret(secret: Optional[str]) -> str:
        """Masks a secret token to prevent accidental exposure."""
        if not secret:
            return "<not-set>"
        if len(secret) <= 8:
            return "***"
        return f"{secret[:3]}...{secret[-3:]}"


class MycoReviewClient:
    """
    Client for coordinating fallback reviews with Myco.
    Implements bounded retries, transient error handling, and findings preservation.
    """

    def __init__(self, max_retries: int = 3, base_backoff_sec: float = 0.5):
        self.max_retries = max_retries
        self.base_backoff_sec = base_backoff_sec

    def prepare_escalation_payload(
        self,
        pr_link: str,
        little_my_result: ReviewResult,
        untrusted_code_sanitized: bool = True,
    ) -> Dict[str, Any]:
        """
        Prepares a non-sensitive escalation payload for the Myco action.
        Preserves Little My's existing findings so they are not lost.
        """
        return {
            "pr_link": pr_link,
            "escalation_reason": (
                little_my_result.escalation_reason.value
                if little_my_result.escalation_reason
                else "UNKNOWN"
            ),
            "little_my_status": little_my_result.status.value,
            "preserved_findings": [
                f.to_dict() if hasattr(f, "to_dict") else f
                for f in little_my_result.findings
            ],
            "unsupported_files": little_my_result.unsupported_files,
            "unresolved_cases": little_my_result.unresolved_cases,
            "untrusted_code_sanitized": untrusted_code_sanitized,
        }

    def execute_with_retry(
        self,
        action_fn,
        *args,
        **kwargs,
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Executes a callable with bounded retries for transient failures.
        Returns (success: bool, response_dict, error_message).
        """
        last_error = None
        for attempt in range(1, self.max_retries + 1):
            try:
                res = action_fn(*args, **kwargs)
                return True, res, None
            except Exception as exc:
                last_error = str(exc)
                if attempt < self.max_retries:
                    time.sleep(self.base_backoff_sec * (2 ** (attempt - 1)))

        # Sanitize error to prevent accidental token leakage
        sanitized_error = re.sub(r"(?:sk_[a-zA-Z0-9_\-]+|AKIA[A-Z0-9]{16})", "[REDACTED_SECRET]", last_error or "Unknown error")
        return False, None, f"Myco escalation failed after {self.max_retries} attempts: {sanitized_error}"


myco_validator = MycoConfigValidator()
myco_client = MycoReviewClient()
