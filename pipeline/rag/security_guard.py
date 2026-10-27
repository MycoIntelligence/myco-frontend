"""
Security Guardrails and Confidentiality Enforcement for Myco Assistant.

Enforces:
1. Classification policy for public vs confidential/restricted queries.
2. Prompt-injection and instruction-override detection.
3. Access-control boundaries (verifying only public documentation is accessed).
4. Output scrubbing for credentials, internal paths, and restricted implementation secrets.
"""

import re
from typing import Optional, Tuple

from pipeline.rag.config import rag_config
from pipeline.security import SecurityManager

# Patterns indicating attempts to extract confidential/internal implementation details
RESTRICTED_QUERY_PATTERNS = [
    re.compile(r"\b(system\s+prompt|internal\s+(system\s+)?prompt|system\s+instructions?)\b", re.IGNORECASE),
    re.compile(r"\b(private\s+source\s+code|proprietary\s+(algorithms?|code)|internal\s+codebase)\b", re.IGNORECASE),
    re.compile(r"\b(internal\s+(ast\s+)?heuristics?|ast\s+heuristic\s+tokens?|ast\s+visitors?)\b", re.IGNORECASE),
    re.compile(r"\b(internal\s+processing\s+engine|internal_engine|word_validator|circuit_breaker_threshold)\b", re.IGNORECASE),
    re.compile(r"\b(secret\s+(salt|tokens?|keys?)|api\s+keys?|credentials?|internal\s+pepper)\b", re.IGNORECASE),
    re.compile(r"\b(internal\s+endpoints?|backend\s+(processing|service\s+workflows?)|cluster\s+keys?)\b", re.IGNORECASE),
    re.compile(r"\b(internal\s+(system\s+)?architecture|private\s+system\s+architecture|how\s+(does\s+)?myco\s+works?\s+internally|works?\s+internally)\b", re.IGNORECASE),
    re.compile(r"\b(confidential\s+implementation(\s+details)?|internal\s+implementation\s+details?)\b", re.IGNORECASE),
    re.compile(r"\b(detector\s+regex(es)?|heuristic\s+source\s+code|salt\s+tokens?)\b", re.IGNORECASE),
]

# Patterns attempting prompt injection or instruction overrides
PROMPT_INJECTION_PATTERNS = [
    re.compile(r"\bignore\s+(all\s+)?(previous|prior|above|system)\s+instructions?\b", re.IGNORECASE),
    re.compile(r"\bdisregard\s+(the\s+)?(security\s+)?(policy|rules?|guardrails?)\b", re.IGNORECASE),
    re.compile(r"\byou\s+are\s+now\s+(in\s+)?(developer\s+mode|dan|unrestricted|jailbroken)\b", re.IGNORECASE),
    re.compile(r"\brepeat\s+(your\s+)?(system\s+prompt|initial\s+instructions?)\b", re.IGNORECASE),
    re.compile(r"\bprint\s+(the\s+)?(hidden|confidential|internal|system\s+prompt)\b", re.IGNORECASE),
    re.compile(r"\breveal\s+(the\s+)?(internal|hidden|confidential|system\s+prompt|credentials?)\b", re.IGNORECASE),
    re.compile(r"<\s*script\s*>", re.IGNORECASE),
    re.compile(r"javascript\s*:", re.IGNORECASE),
]

# Restricted internal keywords that must NEVER leak into generated answers
RESTRICTED_OUTPUT_KEYWORDS = [
    "SYSTEM_PROMPT_V4_SECURE_HASH",
    "X_MYCO_INTERNAL_PEPPER",
    "InternalProcessingEngine",
    "SECRET_PATTERNS",
    "classification: STRICTLY_CONFIDENTIAL",
    "STRICTLY_CONFIDENTIAL_INTERNAL_ONLY",
]


class SecurityGuard:
    @staticmethod
    def is_restricted_query(query: str) -> bool:
        """
        Determines if the user query targets confidential, internal, or restricted implementation details.
        """
        if not query or not isinstance(query, str):
            return False

        if SecurityGuard.detect_prompt_injection(query):
            return True

        for pattern in RESTRICTED_QUERY_PATTERNS:
            if pattern.search(query):
                return True
        return False

    @staticmethod
    def detect_prompt_injection(query: str) -> bool:
        """
        Detects adversarial attempts to override system instructions or bypass policies.
        """
        if not query or not isinstance(query, str):
            return False

        for pattern in PROMPT_INJECTION_PATTERNS:
            if pattern.search(query):
                return True
        return False

    @staticmethod
    def sanitize_input(query: str, max_chars: int = 1500) -> str:
        """
        Normalizes and sanitizes user input, stripping dangerous control characters.
        """
        if not query or not isinstance(query, str):
            return ""

        # Strip null bytes and control chars (except standard whitespace)
        cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", query)
        return cleaned.strip()[:max_chars]

    @classmethod
    def validate_and_scrub_output(cls, output_text: str) -> Tuple[bool, str]:
        """
        Scans LLM output for leaked secrets, credentials, or restricted internal markers.
        Returns (is_clean: bool, scrubbed_text: str).
        """
        if not output_text:
            return True, ""

        # Check for presence of prohibited internal tokens
        for restricted_token in RESTRICTED_OUTPUT_KEYWORDS:
            if restricted_token in output_text:
                return False, rag_config.refusal_confidential_message

        # Redact any discovered credentials via SecurityManager
        scrubbed = SecurityManager.redact_secrets(output_text)
        return True, scrubbed


# Singleton security guard instance
security_guard = SecurityGuard()
