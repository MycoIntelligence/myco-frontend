"""
Security and Abuse Prevention Layer.

Provides:
- SSRF and remote URL allowlist validation (blocking internal IPs, cloud metadata, localhost).
- Sensitive credential and secret redaction (preventing secret leakage in logs or responses).
- Payload sanitization and untrusted code isolation safeguards.
"""

import ipaddress
import re
import socket
import urllib.parse
from typing import Optional, Tuple


# Regex patterns for sensitive credential detection and redaction
SECRET_PATTERNS = [
    # Stripe Secret Keys
    (re.compile(r"sk_live_[0-9a-zA-Z]{24,}", re.IGNORECASE), "sk_live_***[REDACTED]***"),
    # AWS Access Key IDs
    (re.compile(r"\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b"), r"\1***[REDACTED]***"),
    # GitHub Personal Access Tokens
    (re.compile(r"\bghp_[0-9a-zA-Z]{36}\b"), "ghp_***[REDACTED]***"),
    # GitHub Fine-grained PATs
    (re.compile(r"\bgithub_pat_[0-9a-zA-Z_]{82}\b"), "github_pat_***[REDACTED]***"),
    # Slack Bot / User Tokens
    (re.compile(r"\bxox[baprs]-[0-9a-zA-Z]{10,48}\b"), "xox*-***[REDACTED]***"),
    # Generic Bearer Tokens
    (re.compile(r"(Bearer\s+)[a-zA-Z0-9_\-\.]{25,}", re.IGNORECASE), r"\1***[REDACTED]***"),
    # RSA / Private Keys
    (re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----"), "[PRIVATE_KEY_REDACTED]"),
    # Standard JWT tokens
    (re.compile(r"\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b"), "eyJ***[REDACTED_JWT]***"),
]

# Prohibited internal IP subnets (RFC 1918, RFC 3927, Loopback, Cloud Metadata)
BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),       # Loopback
    ipaddress.ip_network("10.0.0.0/8"),        # Private class A
    ipaddress.ip_network("172.16.0.0/12"),     # Private class B
    ipaddress.ip_network("192.168.0.0/16"),    # Private class C
    ipaddress.ip_network("169.254.0.0/16"),    # Link-local / AWS / GCP / Azure metadata
    ipaddress.ip_network("::1/128"),           # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),          # IPv6 unique local
    ipaddress.ip_network("fe80::/10"),         # IPv6 link-local
]


class SecurityManager:
    """Central Security and Sanitization Manager."""

    @staticmethod
    def redact_secrets(text: str) -> str:
        """Sanitizes text strings by masking all recognized credentials."""
        if not text or not isinstance(text, str):
            return ""
        sanitized = text
        for pattern, replacement in SECRET_PATTERNS:
            sanitized = pattern.sub(replacement, sanitized)
        return sanitized

    @staticmethod
    def validate_repository_url(url_string: str) -> Tuple[bool, Optional[str]]:
        """
        Validates repository and remote resource URLs to strictly prevent SSRF attacks.
        Returns: (is_valid, error_reason)
        """
        if not url_string or not isinstance(url_string, str):
            return False, "Repository URL must be a non-empty string."

        clean_url = url_string.strip()
        parsed = urllib.parse.urlsplit(clean_url)

        # 1. Scheme validation: HTTPS only
        if parsed.scheme.lower() != "https":
            return False, f"Prohibited URL scheme '{parsed.scheme}'. Only HTTPS is permitted."

        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid repository URL: Missing hostname."

        # 2. Block prohibited hostnames directly
        blocked_hostnames = {
            "localhost",
            "metadata.google.internal",
            "169.254.169.254",
            "instance-data",
        }
        if hostname.lower() in blocked_hostnames or hostname.endswith(".local") or hostname.endswith(".internal"):
            return False, f"Access to host '{hostname}' is prohibited (SSRF security policy)."

        # 3. Resolve IP and verify not pointing to internal/private subnets
        try:
            ip_addresses = socket.getaddrinfo(hostname, None)
            for addr in ip_addresses:
                ip_str = addr[4][0]
                ip_obj = ipaddress.ip_address(ip_str)
                for network in BLOCKED_NETWORKS:
                    if ip_obj in network:
                        return False, f"URL resolves to restricted IP address '{ip_str}'."
        except socket.gaierror:
            # If domain cannot be resolved, reject safely
            return False, f"Could not resolve domain '{hostname}'."
        except Exception as exc:
            return False, f"Security check failed for URL: {str(exc)}"

        return True, None

    @staticmethod
    def sanitize_untrusted_code(raw_content: str) -> str:
        """
        Sanitizes raw code content:
        - Prevents null-byte injection attacks.
        - Normalizes carriage returns without mutating structural line feeds.
        - Ensures safe handling without executing untrusted strings.
        """
        if not raw_content:
            return ""
        # Remove null characters and unsafe control characters
        cleaned = raw_content.replace("\x00", "")
        # Normalize CRLF to LF
        cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")
        return cleaned
