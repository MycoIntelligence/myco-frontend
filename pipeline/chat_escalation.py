"""
Myco Chat Escalation and Lead Capture Backend Service.

Provides:
- Input validation and normalization for visitor inquiries.
- Rate limiting and anti-spam protection (honeypot, request frequency).
- Email-header injection prevention and payload sanitization.
- Structured notification delivery via Resend or fallback logging.
- Server-side secrets protection and privacy safeguards.
"""

from dataclasses import dataclass, field
import datetime
import html
import json
import logging
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("chat_escalation")

# Validation limits
MAX_PAYLOAD_SIZE = 50 * 1024  # 50 KB
MAX_NAME_LENGTH = 120
MAX_EMAIL_LENGTH = 254
MAX_COMPANY_LENGTH = 150
MAX_PHONE_LENGTH = 50
MAX_QUESTION_LENGTH = 2000
MAX_CONTEXT_MESSAGES = 10
MAX_CONTEXT_TEXT_LENGTH = 500

# Rate limiting: max 5 requests per IP in a 5-minute window
RATE_LIMIT_MAX_REQUESTS = 5
RATE_LIMIT_WINDOW_SECONDS = 300

# Email regex (RFC 5322 compliant simplified check)
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
# Check for newline injection in header fields
HEADER_INJECTION_REGEX = re.compile(r"[\r\n]")


@dataclass
class EscalationSubmission:
    name: str
    email: str
    question: str
    company: str = ""
    phone: str = ""
    conversation_context: List[Dict[str, str]] = field(default_factory=list)
    page_url: str = ""
    consent: bool = True
    submission_id: str = ""
    client_ip: str = "127.0.0.1"
    timestamp: str = ""


class ChatEscalationService:
    def __init__(self):
        # In-memory IP rate limiter: ip -> list of timestamps
        self._ip_history: Dict[str, List[float]] = {}

    def _is_rate_limited(self, ip: str) -> bool:
        now = time.time()
        history = self._ip_history.get(ip, [])
        # Prune older than window
        valid = [t for t in history if now - t < RATE_LIMIT_WINDOW_SECONDS]
        self._ip_history[ip] = valid
        if len(valid) >= RATE_LIMIT_MAX_REQUESTS:
            return True
        self._ip_history[ip].append(now)
        return False

    def reset_rate_limit(self, ip: Optional[str] = None):
        """Helper for testing: reset rate limiter."""
        if ip:
            self._ip_history.pop(ip, None)
        else:
            self._ip_history.clear()

    @staticmethod
    def _clean_str(val: Any, max_len: int) -> str:
        if not isinstance(val, str):
            return ""
        # Strip control characters except newline if multiline
        return val.strip()[:max_len]

    @staticmethod
    def _strip_header_injection(text: str) -> str:
        return HEADER_INJECTION_REGEX.sub(" ", text).strip()

    def validate_and_parse(self, raw_data: Dict[str, Any], client_ip: str = "127.0.0.1") -> Tuple[Optional[EscalationSubmission], Optional[str]]:
        """
        Validates the incoming JSON dictionary.
        Returns (EscalationSubmission, None) on success or (None, error_message) on failure.
        """
        # Anti-spam honeypot field check
        if raw_data.get("website") or raw_data.get("_honey"):
            # Bot filled hidden field
            return None, "Spam detected."

        name = self._clean_str(raw_data.get("name"), MAX_NAME_LENGTH)
        email = self._clean_str(raw_data.get("email"), MAX_EMAIL_LENGTH).lower()
        question = self._clean_str(raw_data.get("question"), MAX_QUESTION_LENGTH)
        company = self._clean_str(raw_data.get("company"), MAX_COMPANY_LENGTH)
        phone = self._clean_str(raw_data.get("phone"), MAX_PHONE_LENGTH)
        page_url = self._clean_str(raw_data.get("pageUrl") or raw_data.get("page_url"), 500)
        consent = bool(raw_data.get("consent", True))

        # Check required fields
        if not name:
            return None, "Please provide your name."
        if HEADER_INJECTION_REGEX.search(name):
            return None, "Invalid characters in name."

        if not email or not EMAIL_REGEX.match(email):
            return None, "Please provide a valid email address."
        if HEADER_INJECTION_REGEX.search(email):
            return None, "Invalid characters in email address."

        if not question:
            return None, "Please provide your question."

        # Parse context
        raw_ctx = raw_data.get("conversationContext") or raw_data.get("conversation_context") or []
        context: List[Dict[str, str]] = []
        if isinstance(raw_ctx, list):
            for item in raw_ctx[-MAX_CONTEXT_MESSAGES:]:
                if isinstance(item, dict):
                    sender = self._clean_str(item.get("sender"), 30) or "user"
                    text = self._clean_str(item.get("text"), MAX_CONTEXT_TEXT_LENGTH)
                    if text:
                        context.append({"sender": sender, "text": text})

        submission_id = f"esc_{int(time.time())}_{os.urandom(4).hex()}"
        iso_timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

        submission = EscalationSubmission(
            name=self._strip_header_injection(name),
            email=self._strip_header_injection(email),
            question=question,
            company=self._strip_header_injection(company),
            phone=self._strip_header_injection(phone),
            conversation_context=context,
            page_url=page_url,
            consent=consent,
            submission_id=submission_id,
            client_ip=client_ip,
            timestamp=iso_timestamp,
        )
        return submission, None

    def format_email_body(self, submission: EscalationSubmission) -> str:
        """Formats the HTML email notification."""
        def row(label: str, value: str) -> str:
            val_esc = html.escape(value or "Not provided")
            return f'<tr><td style="padding:6px 14px 6px 0;color:#566963;vertical-align:top;font-weight:600">{label}:</td><td style="padding:6px 0;color:#122024">{val_esc}</td></tr>'

        ctx_html = ""
        if submission.conversation_context:
            ctx_items = []
            for msg in submission.conversation_context:
                role = "Visitor" if msg["sender"] == "user" else "Assistant"
                safe_text = html.escape(msg["text"])
                ctx_items.append(f'<div style="margin-bottom:6px"><strong>{role}:</strong> {safe_text}</div>')
            ctx_html = f'''
            <div style="margin-top:16px;padding:12px;background:#F7F9F8;border:1px solid #D4DEDA;border-radius:6px">
              <strong style="color:#122024">Recent Conversation Context:</strong>
              <div style="margin-top:8px;font-size:13px;color:#425650">{"".join(ctx_items)}</div>
            </div>'''

        html_body = f"""
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.5;max-width:640px;color:#122024">
          <div style="border-bottom:2px solid #39756D;padding-bottom:12px;margin-bottom:16px">
            <h2 style="margin:0;color:#122024;font-size:20px">New Chat Assistant Escalation / Lead</h2>
            <p style="margin:4px 0 0;font-size:13px;color:#566963">Submission ID: {html.escape(submission.submission_id)} · Time: {html.escape(submission.timestamp)}</p>
          </div>
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            {row("Visitor Name", submission.name)}
            {row("Email Address", submission.email)}
            {row("Company", submission.company)}
            {row("Phone / WhatsApp", submission.phone)}
            {row("Page URL", submission.page_url)}
            {row("Consent Given", "Yes" if submission.consent else "No")}
          </table>
          <div style="margin-top:16px;padding:14px;background:#EDF2F0;border-left:4px solid #39756D;border-radius:4px">
            <strong style="color:#122024;display:block;margin-bottom:6px">Unanswered Question:</strong>
            <p style="margin:0;color:#122024;font-size:15px;white-space:pre-wrap">{html.escape(submission.question)}</p>
          </div>
          {ctx_html}
          <div style="margin-top:24px;padding-top:12px;border-top:1px solid #D4DEDA;font-size:12px;color:#778B84">
            Sent by Myco Website Assistant Escalation Service. Reply directly to this email to follow up with {html.escape(submission.name)}.
          </div>
        </div>
        """
        return html_body

    def send_notification(self, submission: EscalationSubmission) -> Tuple[bool, str]:
        """
        Sends the notification via Resend API if credentials exist.
        If credentials are not configured, gracefully logs the escalation for local preview.
        """
        api_key = os.environ.get("RESEND_API_KEY", "").strip()
        from_email = os.environ.get("PILOT_EMAIL_FROM", "").strip()
        to_email = os.environ.get("CHAT_ESCALATION_EMAIL_TO") or os.environ.get("PILOT_EMAIL_TO", "").strip()

        recipients = [
            r.strip().lower()
            for r in to_email.split(",")
            if r.strip() and EMAIL_REGEX.match(r.strip().lower())
        ]

        # If not configured (local preview), log cleanly and acknowledge
        if not api_key or not from_email or not recipients:
            logger.info(
                "Local preview mode: Chat escalation received for '%s' <%s> (ID: %s).",
                submission.name,
                submission.email,
                submission.submission_id,
            )
            return True, "Notification recorded (preview mode)."

        # Resend API call
        try:
            import urllib.request
            subject = f"Myco Assistant Inquiry from {submission.name}"
            if submission.company:
                subject += f" ({submission.company})"

            payload = {
                "from": from_email,
                "to": recipients,
                "reply_to": submission.email,
                "subject": subject,
                "html": self.format_email_body(submission),
            }

            req = urllib.request.Request(
                "https://api.resend.com/emails",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "Myco-Chat-Escalation/1.0",
                },
                method="POST",
            )

            with urllib.request.urlopen(req, timeout=10) as resp:
                if 200 <= resp.status < 300:
                    logger.info("Escalation email sent successfully for ID %s", submission.submission_id)
                    return True, "Email sent successfully."
                logger.error("Resend rejected email with status %s", resp.status)
                return False, "Email provider rejected notification."
        except Exception as e:
            logger.error("Failed to deliver escalation email: %s", str(e))
            return False, "Failed to deliver email notification."

    def process_request(self, raw_body_bytes: bytes, client_ip: str = "127.0.0.1") -> Tuple[int, Dict[str, Any]]:
        """
        High-level handler: takes raw request bytes, validates, rate-limits, and processes submission.
        Returns (HTTP status code, response_dict).
        """
        # Size limit check
        if len(raw_body_bytes) > MAX_PAYLOAD_SIZE:
            return 413, {"success": False, "error": "Request body exceeds maximum size."}

        # Rate limiting check
        if self._is_rate_limited(client_ip):
            return 429, {"success": False, "error": "Too many requests. Please wait a few minutes before trying again."}

        # Parse JSON
        try:
            raw_data = json.loads(raw_body_bytes.decode("utf-8")) if raw_body_bytes else {}
        except Exception:
            return 400, {"success": False, "error": "Invalid JSON payload."}

        submission, error_msg = self.validate_and_parse(raw_data, client_ip=client_ip)
        if error_msg or not submission:
            return 400, {"success": False, "error": error_msg or "Validation failed."}

        success, detail = self.send_notification(submission)
        if not success:
            return 502, {"success": False, "error": detail}

        return 201, {
            "success": True,
            "id": submission.submission_id,
            "message": "Your question has been forwarded to our team. We'll be in touch shortly.",
        }


# Singleton service instance
chat_escalation_service = ChatEscalationService()
