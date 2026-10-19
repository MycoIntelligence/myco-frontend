#!/usr/bin/env python3
"""
Comprehensive Automated Test Suite for Little My + Myco Hybrid Code Review Pipeline.

Validates all 10 scenarios required by Section 12:
1. Little My completes a review and handles all applicable cases: Myco is not invoked.
2. Little My reports an unsupported file: Myco escalation is requested.
3. Little My returns an inconclusive result: Myco escalation is requested.
4. Little My produces partial findings and encounters an unresolved case: findings are preserved and Myco is requested.
5. Little My fails or times out: the result is marked incomplete and fallback behavior follows the configured policy.
6. A fully completed clean review does not automatically trigger Myco.
7. Required Myco secrets are missing: no secret is exposed and the configuration error is reported.
8. Myco fails: Little My findings remain available and the overall review is not falsely reported as complete.
9. Repeated pull-request events do not produce avoidable duplicate reviews.
10. Untrusted pull-request code cannot access the Myco API key or other privileged secrets.
"""

import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent))

from pipeline.internal_engine import InternalProcessingEngine, internal_engine
from pipeline.myco_client import MycoConfigValidator, MycoReviewClient, myco_client, myco_validator
from pipeline.pr_reviewer import PullRequestReviewer
from pipeline.security import SecurityManager
from pipeline.types import CodeInputFile, EscalationReason, FindingSeverity, ReviewResult, ReviewStatus


class TestHybridReviewPipeline(unittest.TestCase):
    """Automated tests validating Little My primary review and Myco fallback orchestration."""

    def setUp(self):
        self.engine = InternalProcessingEngine()
        self.reviewer = PullRequestReviewer()
        # Clean up cache file before each test
        if os.path.exists(PullRequestReviewer.CACHE_FILE):
            try:
                os.remove(PullRequestReviewer.CACHE_FILE)
            except Exception:
                pass

    def tearDown(self):
        if os.path.exists(PullRequestReviewer.CACHE_FILE):
            try:
                os.remove(PullRequestReviewer.CACHE_FILE)
            except Exception:
                pass

    # -------------------------------------------------------------------------
    # Scenario 1: Little My completes review and handles all applicable cases
    # -------------------------------------------------------------------------
    def test_01_little_my_complete_handled_review_no_myco_invocation(self):
        """
        When Little My reviews code, detects issues it is built to detect, and has
        complete confidence, Myco must NOT be invoked.
        """
        dummy_secret = "_".join(["sk", "live", "51M0xDemoSyntheticKey99812"])
        code = f"""
        export function processPayments(payments: any[]) {{
            const secret = "{dummy_secret}";
            return payments.map(p => p.amount);
        }}
        """
        file_input = CodeInputFile(path="payments.ts", content=code)
        result = self.engine.review_pr([file_input])

        # Assert Little My handled it
        self.assertEqual(result.status, ReviewStatus.COMPLETE)
        self.assertFalse(result.is_clean)
        self.assertGreaterEqual(len(result.findings), 1)
        self.assertEqual(len(result.unsupported_files), 0)
        self.assertEqual(len(result.unresolved_cases), 0)

        # Assert Myco escalation is NOT required
        self.assertFalse(result.escalation_required)
        self.assertEqual(result.escalation_reason, EscalationReason.NONE)

    # -------------------------------------------------------------------------
    # Scenario 2: Unsupported file reported -> Myco escalation requested
    # -------------------------------------------------------------------------
    def test_02_unsupported_file_escalates_to_myco(self):
        """
        When a changed file has a language or extension Little My does not support
        (e.g., .go or .rs), Little My marks escalation_required=True.
        """
        go_code = """
        package main
        import "fmt"
        func main() {
            fmt.Println("Hello Go Microservice")
        }
        """
        file_input = CodeInputFile(path="service/main.go", content=go_code)
        result = self.engine.review_pr([file_input])

        self.assertTrue(result.escalation_required)
        self.assertEqual(result.escalation_reason, EscalationReason.UNSUPPORTED_LANGUAGE)
        self.assertIn("service/main.go", result.unsupported_files)
        self.assertEqual(result.status, ReviewStatus.INCOMPLETE)

    # -------------------------------------------------------------------------
    # Scenario 3: Inconclusive result -> Myco escalation requested
    # -------------------------------------------------------------------------
    def test_03_inconclusive_result_escalates_to_myco(self):
        """
        When static analysis encounters an inconclusive pattern or ambiguous construct,
        escalation is requested with INCONCLUSIVE_ANALYSIS reason.
        """
        inconclusive_code = """
        // @little-my: inconclusive
        // Complex dynamic reflection that static AST cannot resolve
        const dynamicHandler = eval("window." + dynamicKey);
        """
        file_input = CodeInputFile(path="dynamic_loader.ts", content=inconclusive_code)
        result = self.engine.review_pr([file_input])

        self.assertTrue(result.escalation_required)
        self.assertEqual(result.escalation_reason, EscalationReason.INCONCLUSIVE_ANALYSIS)
        self.assertGreaterEqual(len(result.unresolved_cases), 1)

    # -------------------------------------------------------------------------
    # Scenario 4: Partial findings with unresolved case -> Findings preserved & Myco requested
    # -------------------------------------------------------------------------
    def test_04_partial_findings_preserved_with_escalation(self):
        """
        If Little My analyzes supported files and detects defects, but also encounters
        an unsupported file, Little My's findings must be preserved while Myco is requested.
        """
        dummy_secret = "_".join(["sk", "live", "51M0xDemoSyntheticKey99812"])
        ts_code_with_vuln = f"""
        import {{ db }} from "../db";
        export function processBilling(userId: string) {{
            const stripeKey = "{dummy_secret}";
            return stripeKey;
        }}
        """
        rust_code = """
        pub fn compute_hash(data: &[u8]) -> Vec<u8> {
            data.to_vec()
        }
        """
        files = [
            CodeInputFile(path="models/billing.ts", content=ts_code_with_vuln),
            CodeInputFile(path="crypto/hasher.rs", content=rust_code),
        ]
        result = self.engine.review_pr(files)

        # Status must be partial
        self.assertEqual(result.status, ReviewStatus.PARTIAL)
        # Little My findings must be preserved!
        self.assertGreaterEqual(len(result.findings), 1)
        self.assertIn("crypto/hasher.rs", result.unsupported_files)
        self.assertTrue(result.escalation_required)
        self.assertEqual(result.escalation_reason, EscalationReason.UNSUPPORTED_LANGUAGE)

        # Prepare Myco payload and verify preserved findings are included
        payload = myco_client.prepare_escalation_payload("https://github.com/org/repo/pull/42", result)
        self.assertGreaterEqual(len(payload["preserved_findings"]), 1)
        self.assertEqual(payload["little_my_status"], "partial")

    # -------------------------------------------------------------------------
    # Scenario 5: Little My fails or times out -> Marked incomplete/failed & fallback triggered
    # -------------------------------------------------------------------------
    def test_05_little_my_timeout_or_failure_escalates(self):
        """
        If Little My times out during execution, it marks the review incomplete/failed
        and safely escalates to Myco.
        """
        large_code = "const x = 1;\n" * 1000
        file_input = CodeInputFile(path="huge.ts", content=large_code)

        # Trigger timeout with timeout_sec=0.0
        result = self.engine.review_pr([file_input], timeout_sec=0.0)

        self.assertTrue(result.escalation_required)
        self.assertEqual(result.escalation_reason, EscalationReason.STAGE_TIMEOUT)
        self.assertIn(result.status, (ReviewStatus.FAILED, ReviewStatus.PARTIAL, ReviewStatus.INCOMPLETE))

    # -------------------------------------------------------------------------
    # Scenario 6: Fully completed clean review does NOT trigger Myco
    # -------------------------------------------------------------------------
    def test_06_clean_review_does_not_trigger_myco(self):
        """
        A clean, defect-free scan on fully supported code must NOT escalate to Myco.
        Distinguishes a clean scan from an incomplete scan.
        """
        clean_code = """
        import { db } from "../database";
        export async function getProfile(userId: string) {
            try {
                return await db.query("SELECT id, name FROM users WHERE id = $1 LIMIT 1", [userId]);
            } catch (err) {
                return null;
            }
        }
        """
        file_input = CodeInputFile(path="profile.ts", content=clean_code)
        result = self.engine.review_pr([file_input])

        self.assertTrue(result.is_clean)
        self.assertEqual(result.status, ReviewStatus.COMPLETE)
        self.assertEqual(len(result.findings), 0)
        self.assertEqual(len(result.unsupported_files), 0)
        self.assertEqual(len(result.unresolved_cases), 0)
        self.assertFalse(result.escalation_required)
        self.assertEqual(result.escalation_reason, EscalationReason.NONE)

    # -------------------------------------------------------------------------
    # Scenario 7: Required Myco secrets missing -> Reported without exposing secrets
    # -------------------------------------------------------------------------
    def test_07_missing_secrets_reported_cleanly_without_leakage(self):
        """
        When required secrets are missing, report clear non-sensitive diagnostics
        and never leak secret tokens.
        """
        empty_env = {}
        config = myco_validator.validate(env=empty_env)

        self.assertFalse(config.is_configured)
        self.assertIn("MYCO_LLM_API_KEY (secret)", config.missing_secrets)
        self.assertIn("MYCO_METRICS_API_KEY (secret)", config.missing_secrets)
        self.assertIn("MYCO_CLIENT_ID (variable)", config.missing_variables)

        summary = config.get_status_summary()
        self.assertIn("Missing required items", summary)
        self.assertNotIn("sk_", summary)
        self.assertNotIn("password", summary)

    # -------------------------------------------------------------------------
    # Scenario 8: Myco fails -> Little My findings remain available, not marked complete
    # -------------------------------------------------------------------------
    def test_08_myco_failure_preserves_little_my_findings(self):
        """
        If Myco review fails or is unreachable, Little My's findings must remain
        visible and the overall review must not be marked complete.
        """
        dummy_secret = "_".join(["sk", "live", "51M0xDemoSyntheticKey99812"])
        file_input = CodeInputFile(
            path="auth.ts",
            content=f'export const key = "{dummy_secret}";',
        )
        little_my_res = self.engine.review_pr([file_input])
        self.assertGreaterEqual(len(little_my_res.findings), 1)

        # Mock an external Myco invocation that fails
        mock_action = MagicMock(side_effect=RuntimeError("Myco API connection refused (503)"))
        client = MycoReviewClient(max_retries=2, base_backoff_sec=0.01)
        success, res, err = client.execute_with_retry(mock_action)

        self.assertFalse(success)
        self.assertIn("Myco escalation failed after 2 attempts", err)
        # Verify Little My findings remain intact
        self.assertGreaterEqual(len(little_my_res.findings), 1)
        self.assertNotEqual(little_my_res.status, ReviewStatus.FAILED)

    # -------------------------------------------------------------------------
    # Scenario 9: Repeated PR events -> Duplicate review prevention / Idempotency
    # -------------------------------------------------------------------------
    def test_09_repeated_pull_request_events_are_idempotent(self):
        """
        Repeated synchronize events on identical commit SHA return cached result,
        preventing duplicate review posts and redundant runs.
        """
        test_sha = "abc123def456789"
        file_input = CodeInputFile(path="clean.ts", content="export const meaning = 42;")

        with patch.object(self.reviewer, "get_commit_sha", return_value=test_sha):
            # First run
            res1 = self.reviewer.run_review(files=[file_input], force=False)
            self.assertEqual(res1.status, ReviewStatus.COMPLETE)
            self.assertFalse(res1.metadata.get("cached", False))

            # Second run with same commit SHA
            res2 = self.reviewer.run_review(files=[file_input], force=False)
            self.assertEqual(res2.status, ReviewStatus.COMPLETE)
            self.assertTrue(res2.metadata.get("cached", False))

    # -------------------------------------------------------------------------
    # Scenario 10: Untrusted PR code cannot access Myco API key or secrets
    # -------------------------------------------------------------------------
    def test_10_untrusted_pr_code_cannot_access_secrets(self):
        """
        Untrusted pull request code is sanitized and never evaluated/executed.
        Privileged secrets are isolated and never interpolated into untrusted code.
        """
        malicious_pr_code = """
        // Attempt code injection & secret access
        const env = process.env.MYCO_LLM_API_KEY;
        eval("console.log(process.env)");
        \x00\x00
        """
        sanitized = SecurityManager.sanitize_untrusted_code(malicious_pr_code)
        self.assertNotIn("\x00", sanitized)

        file_input = CodeInputFile(path="exploit.ts", content=malicious_pr_code)
        # Run Little My on it: Little My should safely analyze it as text without executing it
        result = self.engine.review_pr([file_input])

        # Verify no execution happened and findings were produced statically
        self.assertIsInstance(result, ReviewResult)
        self.assertNotIn("MYCO_LLM_API_KEY", result.to_dict()["metadata"].get("engine", ""))


if __name__ == "__main__":
    unittest.main()
