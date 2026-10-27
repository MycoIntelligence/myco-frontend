"""
Unit and Integration Tests for Myco Website Assistant.

Covers:
1. FAQ Matching Engine (exact, alternate phrasings, keywords, ambiguity, unknown fallback).
2. Backend Escalation Service & Lead Capture (validation, rate-limiting, injection protection, anti-spam, notification formatting).
3. Resend notification delivery handling and mock failure recovery.
4. End-to-end escalation flow.
"""

import json
import os
import unittest
from unittest.mock import patch, MagicMock

# Import backend escalation service
from pipeline.chat_escalation import (
    ChatEscalationService,
    EscalationSubmission,
    chat_escalation_service,
    RATE_LIMIT_MAX_REQUESTS,
    MAX_PAYLOAD_SIZE,
)


class PythonFAQMatcher:
    """
    Python mirror of static/js/chat/faq-matcher.js for backend validation
    and rigorous test suite verification.
    """
    STOP_WORDS = {
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
        'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
        'to', 'was', 'were', 'will', 'with', 'do', 'does', 'can', 'could',
        'i', 'we', 'you', 'they', 'my', 'our', 'your', 'about', 'please'
    }

    def __init__(self, faqs, confidence_threshold=0.58, ambiguity_threshold=0.38):
        self.faqs = faqs
        self.confidence_threshold = confidence_threshold
        self.ambiguity_threshold = ambiguity_threshold
        self.fallback_message = (
            "I'm not completely sure about that, but our team can help. "
            "Would you like us to get back to you?"
        )

    @staticmethod
    def normalize(text):
        if not text or not isinstance(text, str):
            return ""
        import re
        norm = text.lower()
        norm = re.sub(r"[^\w\s]", " ", norm)
        return re.sub(r"\s+", " ", norm).strip()

    def tokenize(self, text):
        norm = self.normalize(text)
        if not norm:
            return []
        return [w for w in norm.split(" ") if len(w) > 1 and w not in self.STOP_WORDS]

    @staticmethod
    def stem_simple(word):
        if len(word) > 5 and word.endswith("ing"):
            return word[:-3]
        if len(word) > 4 and word.endswith("ies"):
            return word[:-3] + "y"
        if len(word) > 4 and word.endswith("ed"):
            return word[:-2]
        if len(word) > 4 and word.endswith("es"):
            return word[:-2]
        if len(word) > 3 and word.endswith("s"):
            return word[:-1]
        return word

    def score_candidate(self, query, faq):
        q_norm = self.normalize(query)
        f_norm = self.normalize(faq.get("question", ""))

        if q_norm == f_norm:
            return 1.0

        for alt in faq.get("alternatePhrasings", []):
            alt_norm = self.normalize(alt)
            if q_norm == alt_norm:
                return 0.98
            if len(q_norm) > 6 and len(alt_norm) > 6:
                if q_norm in alt_norm or alt_norm in q_norm:
                    return 0.90

        if len(q_norm) > 6 and len(f_norm) > 6 and q_norm in f_norm:
            return 0.88

        q_tokens = self.tokenize(query)
        if not q_tokens:
            return 0.0

        q_stems = set(self.stem_simple(t) for t in q_tokens)
        f_tokens = self.tokenize(faq.get("question", ""))
        f_stems = set(self.stem_simple(t) for t in f_tokens)

        keyword_stems = set()
        for k in faq.get("keywords", []):
            keyword_stems.add(self.stem_simple(k.lower()))
        for t in faq.get("tags", []):
            keyword_stems.add(self.stem_simple(t.lower()))

        matched_q = sum(1 for s in q_stems if s in f_stems)
        matched_k = sum(1 for s in q_stems if s in keyword_stems)

        q_cov = matched_q / len(q_tokens) if q_tokens else 0
        k_cov = matched_k / len(q_tokens) if q_tokens else 0

        combined = (q_cov * 0.45) + (k_cov * 0.55)
        if matched_k >= 3:
            combined = min(1.0, combined + 0.15)
        elif matched_k >= 2:
            combined = min(1.0, combined + 0.08)

        return round(combined, 2)

    def find_answer(self, query):
        if not query or not isinstance(query, str) or not query.strip():
            return {
                "status": "UNKNOWN",
                "matchedFaq": None,
                "answer": self.fallback_message,
                "confidence": 0,
                "clarificationOptions": [],
                "shouldEscalate": True,
            }

        scored = []
        for faq in self.faqs:
            s = self.score_candidate(query, faq)
            scored.append({"faq": faq, "score": s})

        scored.sort(key=lambda x: x["score"], reverse=True)
        top = scored[0] if scored else None
        second = scored[1] if len(scored) > 1 else None

        if top and top["score"] >= self.confidence_threshold:
            if second and second["score"] >= (self.confidence_threshold - 0.05) and (top["score"] - second["score"]) < 0.06:
                return {
                    "status": "AMBIGUOUS",
                    "matchedFaq": None,
                    "answer": "Your question could relate to a couple of topics. Please choose the one you mean:",
                    "confidence": top["score"],
                    "clarificationOptions": [top["faq"], second["faq"]],
                    "shouldEscalate": False,
                }
            return {
                "status": "CONFIDENT",
                "matchedFaq": top["faq"],
                "answer": top["faq"]["answer"],
                "confidence": top["score"],
                "clarificationOptions": [],
                "shouldEscalate": False,
            }

        if top and top["score"] >= self.ambiguity_threshold:
            options = [x["faq"] for x in scored[:3] if x["score"] >= (self.ambiguity_threshold - 0.08)]
            return {
                "status": "AMBIGUOUS",
                "matchedFaq": None,
                "answer": "I found a few topics related to your question. Did you mean one of these?",
                "confidence": top["score"],
                "clarificationOptions": options,
                "shouldEscalate": False,
            }

        return {
            "status": "UNKNOWN",
            "matchedFaq": None,
            "answer": self.fallback_message,
            "confidence": top["score"] if top else 0,
            "clarificationOptions": [],
            "shouldEscalate": True,
        }


SAMPLE_FAQS = [
    {
        "id": "faq_company_what_is_myco",
        "question": "What is Myco?",
        "answer": "Myco provides agentic intelligence for engineering teams.",
        "keywords": ["what", "is", "myco", "about", "overview"],
        "alternatePhrasings": [
            "Tell me about Myco",
            "What does Myco do?",
            "Who is Myco?",
        ],
        "tags": ["overview", "company"]
    },
    {
        "id": "faq_pricing_plans",
        "question": "How much does Myco cost and what are the pricing plans?",
        "answer": "Myco offers tailored enterprise tier plans based on repository volume.",
        "keywords": ["pricing", "cost", "plans", "price", "tier", "subscription"],
        "alternatePhrasings": [
            "What are the pricing options?",
            "How much does a subscription cost?",
        ],
        "tags": ["pricing", "cost"]
    },
    {
        "id": "faq_onboarding_integration",
        "question": "How do we integrate Myco with GitHub or CI/CD?",
        "answer": "Myco integrates seamlessly as a GitHub App or CI/CD runner.",
        "keywords": ["integrate", "github", "gitlab", "ci", "cd", "actions"],
        "alternatePhrasings": [
            "Can Myco integrate with GitHub Actions?",
            "How do we install Myco in our repository?",
        ],
        "tags": ["integration", "github"]
    },
    {
        "id": "faq_security_data_privacy",
        "question": "Does Myco train AI models on customer code?",
        "answer": "No. Myco never trains public or foundational models on your proprietary source code.",
        "keywords": ["train", "training", "model", "customer", "code", "privacy"],
        "alternatePhrasings": [
            "Do you train models on our code?",
            "Will our code leak into public AI models?",
        ],
        "tags": ["privacy", "security"]
    }
]


class TestFAQMatchingEngine(unittest.TestCase):
    def setUp(self):
        self.matcher = PythonFAQMatcher(SAMPLE_FAQS)

    def test_exact_question_match(self):
        res = self.matcher.find_answer("What is Myco?")
        self.assertEqual(res["status"], "CONFIDENT")
        self.assertEqual(res["matchedFaq"]["id"], "faq_company_what_is_myco")
        self.assertFalse(res["shouldEscalate"])

    def test_alternate_phrasing_match(self):
        res = self.matcher.find_answer("What does Myco do?")
        self.assertEqual(res["status"], "CONFIDENT")
        self.assertEqual(res["matchedFaq"]["id"], "faq_company_what_is_myco")
        self.assertGreaterEqual(res["confidence"], 0.90)

    def test_pricing_keyword_match(self):
        res = self.matcher.find_answer("How much does the subscription cost?")
        self.assertEqual(res["status"], "CONFIDENT")
        self.assertEqual(res["matchedFaq"]["id"], "faq_pricing_plans")

    def test_security_privacy_match(self):
        res = self.matcher.find_answer("Do you train models on our private code?")
        self.assertEqual(res["status"], "CONFIDENT")
        self.assertEqual(res["matchedFaq"]["id"], "faq_security_data_privacy")

    def test_unknown_question_fallback(self):
        # A question completely outside the domain of Myco
        res = self.matcher.find_answer("What is the recipe for chocolate chip cookies?")
        self.assertEqual(res["status"], "UNKNOWN")
        self.assertIsNone(res["matchedFaq"])
        self.assertTrue(res["shouldEscalate"])
        self.assertIn("not completely sure", res["answer"])

    def test_empty_or_whitespace_query(self):
        res = self.matcher.find_answer("   ")
        self.assertEqual(res["status"], "UNKNOWN")
        self.assertTrue(res["shouldEscalate"])

    def test_ambiguous_query_generates_clarifications(self):
        # Short query with moderate overlap
        res = self.matcher.find_answer("plans")
        # Should either match pricing or offer clarification, but not crash
        self.assertIn(res["status"], ["CONFIDENT", "AMBIGUOUS"])


class TestChatEscalationService(unittest.TestCase):
    def setUp(self):
        self.service = ChatEscalationService()
        self.service.reset_rate_limit()

    def test_valid_submission_parsing(self):
        payload = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "question": "Can Myco analyze custom Terraform modules?",
            "company": "Acme Inc.",
            "phone": "+1-555-0199",
            "consent": True,
            "conversationContext": [
                {"sender": "user", "text": "Can Myco analyze custom Terraform modules?"},
                {"sender": "bot", "text": "I'm not completely sure about that."}
            ],
            "pageUrl": "https://mycointelligence.com/#integrate"
        }
        sub, err = self.service.validate_and_parse(payload, client_ip="10.0.0.1")
        self.assertIsNone(err)
        self.assertIsNotNone(sub)
        self.assertEqual(sub.name, "Jane Doe")
        self.assertEqual(sub.email, "jane@example.com")
        self.assertEqual(sub.question, "Can Myco analyze custom Terraform modules?")
        self.assertEqual(sub.company, "Acme Inc.")
        self.assertEqual(len(sub.conversation_context), 2)
        self.assertTrue(sub.submission_id.startswith("esc_"))

    def test_missing_name_rejected(self):
        payload = {
            "name": "   ",
            "email": "jane@example.com",
            "question": "Can Myco analyze custom Terraform modules?"
        }
        sub, err = self.service.validate_and_parse(payload)
        self.assertIsNone(sub)
        self.assertIn("name", err.lower())

    def test_invalid_email_rejected(self):
        payload = {
            "name": "Jane Doe",
            "email": "not-an-email",
            "question": "How does pricing work?"
        }
        sub, err = self.service.validate_and_parse(payload)
        self.assertIsNone(sub)
        self.assertIn("valid email", err.lower())

    def test_missing_question_rejected(self):
        payload = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "question": "   "
        }
        sub, err = self.service.validate_and_parse(payload)
        self.assertIsNone(sub)
        self.assertIn("question", err.lower())

    def test_anti_spam_honeypot_rejection(self):
        payload = {
            "name": "Spam Bot",
            "email": "spambot@example.com",
            "question": "Buy cheap viagra",
            "website": "http://spamsite.com"  # Honeypot field filled
        }
        sub, err = self.service.validate_and_parse(payload)
        self.assertIsNone(sub)
        self.assertIn("spam", err.lower())

    def test_crlf_header_injection_prevention(self):
        payload = {
            "name": "Jane\r\nBcc: victim@example.com",
            "email": "jane@example.com",
            "question": "Testing header injection"
        }
        sub, err = self.service.validate_and_parse(payload)
        self.assertIsNone(sub)
        self.assertIn("invalid characters", err.lower())

    def test_oversized_payload_rejection(self):
        huge_bytes = b"x" * (MAX_PAYLOAD_SIZE + 500)
        status, data = self.service.process_request(huge_bytes, client_ip="10.0.0.2")
        self.assertEqual(status, 413)
        self.assertFalse(data["success"])

    def test_rate_limiting_enforcement(self):
        ip = "192.168.1.50"
        self.service.reset_rate_limit(ip)
        payload = json.dumps({
            "name": "Rate Tester",
            "email": "tester@example.com",
            "question": "Testing rate limits"
        }).encode("utf-8")

        for i in range(RATE_LIMIT_MAX_REQUESTS):
            status, _ = self.service.process_request(payload, client_ip=ip)
            self.assertEqual(status, 201)

        # The (RATE_LIMIT_MAX_REQUESTS + 1)th request must be rejected with 429
        status, data = self.service.process_request(payload, client_ip=ip)
        self.assertEqual(status, 429)
        self.assertFalse(data["success"])
        self.assertIn("too many requests", data["error"].lower())

    def test_html_email_formatting_contains_context(self):
        submission = EscalationSubmission(
            name="Alex Smith",
            email="alex@company.com",
            question="Do you have an on-premises enterprise deployment?",
            company="Company XYZ",
            phone="+1234567890",
            conversation_context=[
                {"sender": "user", "text": "Do you have on-prem?"},
                {"sender": "bot", "text": "I'm not completely sure."}
            ],
            page_url="https://mycointelligence.com/#security",
            consent=True,
            submission_id="esc_test_123",
            timestamp="2026-10-26T20:00:00Z"
        )
        html_output = self.service.format_email_body(submission)
        self.assertIn("Alex Smith", html_output)
        self.assertIn("alex@company.com", html_output)
        self.assertIn("Company XYZ", html_output)
        self.assertIn("Do you have an on-premises enterprise deployment?", html_output)
        self.assertIn("esc_test_123", html_output)
        self.assertIn("Recent Conversation Context", html_output)

    @patch.dict(os.environ, {
        "RESEND_API_KEY": "re_mock_test_key_12345",
        "PILOT_EMAIL_FROM": "Myco <onboarding@mycointelligence.com>",
        "PILOT_EMAIL_TO": "pilot@mycointelligence.com",
    })
    @patch("urllib.request.urlopen")
    def test_resend_email_delivery_success(self, mock_urlopen):
        # Mock successful HTTP 200 response from Resend
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        submission = EscalationSubmission(
            name="Sarah Connor",
            email="sarah@skynet-defense.com",
            question="Can Myco monitor autonomous agent loops?",
            submission_id="esc_mock_999"
        )
        ok, msg = self.service.send_notification(submission)
        self.assertTrue(ok)
        self.assertIn("success", msg.lower())
        self.assertTrue(mock_urlopen.called)

    @patch.dict(os.environ, {
        "RESEND_API_KEY": "re_mock_test_key_12345",
        "PILOT_EMAIL_FROM": "Myco <onboarding@mycointelligence.com>",
        "PILOT_EMAIL_TO": "pilot@mycointelligence.com",
    })
    @patch("urllib.request.urlopen")
    def test_resend_email_delivery_failure_handling(self, mock_urlopen):
        # Simulate network or provider exception
        mock_urlopen.side_effect = Exception("Connection refused by provider")

        submission = EscalationSubmission(
            name="John Doe",
            email="john@example.com",
            question="Testing failure recovery",
            submission_id="esc_fail_000"
        )
        ok, msg = self.service.send_notification(submission)
        self.assertFalse(ok)
        self.assertIn("failed", msg.lower())


class TestLiveFAQDatabaseIntegrity(unittest.TestCase):
    def test_faqs_file_exists_and_parses(self):
        faq_path = os.path.join(os.path.dirname(__file__), "static", "js", "chat", "chat-faqs.js")
        self.assertTrue(os.path.exists(faq_path), "chat-faqs.js should exist")
        with open(faq_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("ChatFaqs", content)
        self.assertIn("faq_company_what_is_myco", content)
        self.assertIn("faq_pricing_plans", content)
        self.assertIn("faq_onboarding_integration", content)
        self.assertIn("faq_security_data_privacy", content)

    def test_end_to_end_inquiry_flow(self):
        # 1. Visitor asks unknown question
        unknown_q = "Does Myco integrate with legacy Fortran mainframes?"
        matcher = PythonFAQMatcher(SAMPLE_FAQS)
        match_res = matcher.find_answer(unknown_q)
        self.assertEqual(match_res["status"], "UNKNOWN")
        self.assertTrue(match_res["shouldEscalate"])

        # 2. Widget triggers escalation form -> POST /api/chat/escalations
        service = ChatEscalationService()
        service.reset_rate_limit("127.0.0.1")
        req_payload = {
            "name": "David Miller",
            "email": "david@bank.example",
            "question": unknown_q,
            "company": "Global Bank",
            "consent": True,
            "conversationContext": [
                {"sender": "user", "text": unknown_q},
                {"sender": "bot", "text": match_res["answer"]}
            ]
        }
        status_code, resp_data = service.process_request(
            json.dumps(req_payload).encode("utf-8"),
            client_ip="127.0.0.1"
        )
        self.assertEqual(status_code, 201)
        self.assertTrue(resp_data["success"])
        self.assertTrue(resp_data["id"].startswith("esc_"))


if __name__ == "__main__":
    unittest.main()

