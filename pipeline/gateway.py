"""
API Gateway and Demo Session Middleware Layer.

Handles:
- Lightweight session extraction (X-Demo-Session-ID, client IP).
- Optional email identification and admin bypass detection.
- Content-Length pre-flight inspection and JSON payload validation.
"""

import json
from typing import Any, Dict, Optional, Tuple

from pipeline.config import config
from pipeline.types import UserContext


class ApiGateway:
    """Central Gateway Controller and Middleware."""

    def authenticate_request(
        self,
        headers: Dict[str, str],
        client_ip: str = "127.0.0.1",
    ) -> UserContext:
        """
        Extracts demo session identifiers and optional credentials from request headers.
        """
        norm_headers = {k.lower(): v for k, v in headers.items()}
        auth_header = norm_headers.get("authorization", "")
        session_header = norm_headers.get("x-demo-session-id", "")
        email_header = norm_headers.get("x-demo-email", "")

        api_token = ""
        if auth_header.startswith("Bearer "):
            api_token = auth_header[7:].strip()

        # Admin / Team evaluation token check
        is_admin = bool(api_token and api_token == config.admin_bypass_token)

        # Derive user session identifier
        session_id = session_header.strip() if session_header else f"anon_{client_ip}"
        
        return UserContext(
            user_id=session_id,
            org_id=email_header.strip() if email_header else "public_demo",
            tier="demo",
            client_ip=client_ip,
            is_authenticated=bool(session_header or email_header or is_admin),
            is_admin=is_admin,
            api_key_id=api_token[:8] + "..." if api_token else None,
        )

    def parse_and_validate_payload(
        self,
        raw_body: bytes,
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Decodes and validates request JSON payload.
        Returns: (is_valid, parsed_data_dict, error_message)
        """
        if not raw_body:
            return False, None, "Request body is empty. Valid JSON code payload required."

        try:
            body_text = raw_body.decode("utf-8")
        except UnicodeDecodeError:
            return False, None, "Invalid encoding. Payload must be valid UTF-8 text."

        try:
            data = json.loads(body_text)
        except json.JSONDecodeError as err:
            return False, None, f"Malformed JSON: {str(err)}"

        if not isinstance(data, dict):
            return False, None, "JSON root must be an object."

        return True, data, None


gateway = ApiGateway()
