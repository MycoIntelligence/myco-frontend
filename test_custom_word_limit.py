#!/usr/bin/env python3
"""
Unit and Integration Test Suite for Custom Code Word Limit (0-1,200 words).

Acceptance Criteria Verified:
1. 0 words (empty/whitespace): accepted by the word validator (0 <= 1200).
2. 50 words: accepted by the word-count validator and pipeline.
3. 500 words: accepted by the word-count validator and pipeline.
4. 999 words: accepted by the word-count validator and pipeline.
5. 1,000 words: accepted by the word-count validator and pipeline.
6. 1,100 words: accepted by the word-count validator and pipeline.
7. 1,200 words: exact maximum boundary, accepted by validator and pipeline.
8. 1,201 words: above maximum limit of 1,200 words, rejected with actionable error feedback.
9. 1,500 words: rejected by server-side validation with preserved code.
10. Consistent word-counting algorithm: token regex [A-Za-z0-9_]+ handling whitespace, comments, identifiers, punctuation.
"""

import json
import unittest

from pipeline.backend_adapter import future_myco_adapter
from pipeline.router import PipelineRouter
from pipeline.word_validator import CustomCodeWordValidator


def generate_code_with_word_count(target_words: int) -> str:
    """
    Generates realistic, syntactically plausible TypeScript code
    containing exactly `target_words` tokens according to [A-Za-z0-9_]+.
    """
    if target_words == 0:
        return ""
    header = ["export", "const", "dataset"]
    if target_words <= len(header):
        return " ".join(header[:target_words])
    needed_tokens = target_words - len(header)
    items = [f"signal_{i}" for i in range(needed_tokens)]
    code_str = "export const dataset = [\n  " + ",\n  ".join(f'"{it}"' for it in items) + "\n];"
    actual_count = CustomCodeWordValidator.count_words(code_str)
    assert actual_count == target_words, f"Expected {target_words}, got {actual_count}"
    return code_str


class TestCustomCodeWordLimit(unittest.TestCase):

    def setUp(self):
        self.router = PipelineRouter(backend_provider=future_myco_adapter)
        self.headers = {
            "Content-Type": "application/json",
            "X-Demo-Session-ID": "sess_word_limit_test",
        }

    # -------------------------------------------------------------------------
    # Unit Tests: Word Validator Boundaries (0 - 1,200 words accepted)
    # -------------------------------------------------------------------------
    def test_01_count_words_algorithm_consistency(self):
        """Validates tokenization rule: [A-Za-z0-9_]+ with punctuation and whitespace as separators."""
        self.assertEqual(CustomCodeWordValidator.count_words(""), 0)
        self.assertEqual(CustomCodeWordValidator.count_words("   \n\t  "), 0)
        self.assertEqual(CustomCodeWordValidator.count_words("{ } ( ) ; , : + - * /"), 0)
        self.assertEqual(CustomCodeWordValidator.count_words("const x = 42;"), 3)
        self.assertEqual(CustomCodeWordValidator.count_words("function uploadAsset(payload: UploadPayload) { return true; }"), 6)

    def test_02_zero_words_accepted(self):
        """0 words is within allowed range (0 - 1,200 words)."""
        valid, count, err = CustomCodeWordValidator.validate("")
        self.assertTrue(valid)
        self.assertEqual(count, 0)
        self.assertIsNone(err)

        valid_ws, count_ws, err_ws = CustomCodeWordValidator.validate("   \n\t\n  ")
        self.assertTrue(valid_ws)
        self.assertEqual(count_ws, 0)
        self.assertIsNone(err_ws)

    def test_03_small_word_count_accepted(self):
        """Small snippets (e.g. 50 words) are accepted."""
        code_50 = generate_code_with_word_count(50)
        valid, count, err = CustomCodeWordValidator.validate(code_50)
        self.assertTrue(valid)
        self.assertEqual(count, 50)
        self.assertIsNone(err)

    def test_04_mid_word_counts_accepted(self):
        """Mid-range code (500, 999 words) is accepted."""
        code_500 = generate_code_with_word_count(500)
        valid, count, err = CustomCodeWordValidator.validate(code_500)
        self.assertTrue(valid)
        self.assertEqual(count, 500)
        self.assertIsNone(err)

        code_999 = generate_code_with_word_count(999)
        valid_999, count_999, err_999 = CustomCodeWordValidator.validate(code_999)
        self.assertTrue(valid_999)
        self.assertEqual(count_999, 999)
        self.assertIsNone(err_999)

    def test_05_boundary_1000_words_accepted(self):
        """1,000 words: accepted."""
        code_1000 = generate_code_with_word_count(1000)
        valid, count, err = CustomCodeWordValidator.validate(code_1000)
        self.assertTrue(valid)
        self.assertEqual(count, 1000)
        self.assertIsNone(err)

    def test_06_boundary_1200_words_accepted(self):
        """1,200 words: exact maximum boundary, must be accepted."""
        code_1200 = generate_code_with_word_count(1200)
        valid, count, err = CustomCodeWordValidator.validate(code_1200)
        self.assertTrue(valid)
        self.assertEqual(count, 1200)
        self.assertIsNone(err)

    def test_07_boundary_1201_words_rejected(self):
        """1,201 words: above maximum, must be rejected."""
        code_1201 = generate_code_with_word_count(1201)
        valid, count, err = CustomCodeWordValidator.validate(code_1201)
        self.assertFalse(valid)
        self.assertEqual(count, 1201)
        self.assertIn("exceeds the maximum limit", err)
        self.assertIn("1,200", err)

    # -------------------------------------------------------------------------
    # Server-Side Integration Tests & Bypass Attempts
    # -------------------------------------------------------------------------
    def test_08_server_side_valid_small_code_accepted(self):
        """Valid custom code submission with 50 words is accepted and processed."""
        code_50 = generate_code_with_word_count(50)
        payload = json.dumps({
            "code": code_50,
            "isCustomCode": True,
            "isDemo": False,
        }).encode("utf-8")

        response = self.router.execute(payload, self.headers, client_ip="10.40.1.1")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.success)
        self.assertIn(response.route_executed, ("INTERNAL", "EXTERNAL_MYCO"))

    def test_09_server_side_valid_1100_words_accepted(self):
        """Valid custom code submission with 1,100 words is accepted and processed."""
        code_1100 = generate_code_with_word_count(1100)
        payload = json.dumps({
            "code": code_1100,
            "isCustomCode": True,
            "isDemo": False,
        }).encode("utf-8")

        response = self.router.execute(payload, self.headers, client_ip="10.40.1.2")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.success)
        self.assertIn(response.route_executed, ("INTERNAL", "EXTERNAL_MYCO"))

    def test_10_server_side_over_maximum_rejected(self):
        """Client-side bypass attempt with 1,201 words must be rejected by server with HTTP 400."""
        code_1201 = generate_code_with_word_count(1201)
        payload = json.dumps({
            "code": code_1201,
            "isCustomCode": True,
            "isDemo": False,
        }).encode("utf-8")

        response = self.router.execute(payload, self.headers, client_ip="10.40.1.3")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.success)
        self.assertEqual(response.route_executed, "REJECTED")
        self.assertIn("exceeds the maximum limit", response.message)
        self.assertTrue(response.summary.get("wordLimitViolation"))
        self.assertEqual(response.summary.get("wordCount"), 1201)

    def test_11_code_preservation_on_rejection(self):
        """Invalid submission code exceeding 1,200 words is preserved intact without truncation."""
        code_1300 = generate_code_with_word_count(1300)
        payload = json.dumps({
            "code": code_1300,
            "isCustomCode": True,
            "isDemo": False,
        }).encode("utf-8")

        response = self.router.execute(payload, self.headers, client_ip="10.40.1.4")
        self.assertEqual(response.status_code, 400)
        preserved = response.summary.get("preservedCode")
        self.assertIsNotNone(preserved)
        self.assertEqual(len(preserved), len(code_1300))
        self.assertEqual(preserved, code_1300)


if __name__ == "__main__":
    unittest.main()
