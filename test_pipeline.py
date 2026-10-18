#!/usr/bin/env python3
"""
Automated Test Suite for the Public Product Demo Pipeline.

Validates:
1. Custom code analysis via Internal Processing Engine.
2. Security Vulnerability detection (Hardcoded Credentials, SQLi, DOM XSS).
3. Secret Redaction & Leakage Prevention in evidence snippets.
4. SSRF Security Guard for remote repository URLs.
5. Payload size ceiling enforcement (HTTP 413).
6. PR diff line ceiling enforcement (HTTP 400).
7. Idempotency & Deduplication (submitting identical code does not deduct demo allowance).
8. Fair usage guarantee (failed or invalid requests do not decrement demo allowance).
9. Finite Demo Allowance exhaustion (HTTP 429 with reset time & pilot guidance).
10. Anti-spam sliding-window rate limit (5 RPM).
11. Future Myco backend candidate identification (clear explanation, zero fake responses).
12. Provider interface pluggability & MockBackendProvider.
13. Observability, Telemetry & Demo Metrics Registry.
"""

import json
import sys
import time
import unittest
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent))

from pipeline.backend_adapter import (
    CircuitBreaker,
    MockBackendProvider,
    future_myco_adapter,
)
from pipeline.config import config
from pipeline.gateway import gateway
from pipeline.observability import metrics
from pipeline.quota import quota_service
from pipeline.router import PipelineRouter


class TestPublicDemoPipeline(unittest.TestCase):

    def setUp(self):
        quota_service.reset_all()
        self.router = PipelineRouter(backend_provider=future_myco_adapter)

    def tearDown(self):
        quota_service.reset_all()

    # -------------------------------------------------------------------------
    # 1. Custom Code Internal Processing
    # -------------------------------------------------------------------------
    def test_01_custom_code_clean_analysis(self):
        clean_code = """
        import { db } from "../database";
        export async function getInvoices(userId: string, orgId: string) {
            try {
                return await db.query("SELECT * FROM invoices WHERE user_id = $1 AND org_id = $2", [userId, orgId]);
            } catch (error) {
                throw new Error("Failed to fetch invoices");
            }
        }
        """
        payload = json.dumps({"code": clean_code, "language": "typescript"}).encode("utf-8")
        headers = {"X-Demo-Session-ID": "sess_test_01", "Content-Type": "application/json"}

        response = self.router.execute(payload, headers, client_ip="10.20.1.1")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.route_executed, "INTERNAL")
        self.assertTrue(response.success)
        self.assertEqual(len(response.findings), 0)
        self.assertTrue(response.summary.get("isClean"))

    # -------------------------------------------------------------------------
    # 2. Vulnerability Detection (Hardcoded Stripe Secret)
    # -------------------------------------------------------------------------
    def test_02_custom_code_vulnerability_detection(self):
        dummy_secret = "_".join(["sk", "live", "51M0xDemoSyntheticKey99812"])
        vuln_code = f"""
        export const charge = async (req, res) => {{
            const STRIPE_SECRET_KEY = "{dummy_secret}";
            return true;
        }};
        """
        payload = json.dumps({"code": vuln_code}).encode("utf-8")
        headers = {"X-Demo-Session-ID": "sess_test_02", "Content-Type": "application/json"}

        response = self.router.execute(payload, headers, client_ip="10.20.1.2")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.route_executed, "INTERNAL")
        self.assertFalse(response.summary.get("isClean"))
        self.assertTrue(response.summary.get("isMergeBlocking"))
        self.assertGreaterEqual(len(response.findings), 1)
        self.assertEqual(response.findings[0]["category"], "security")

    # -------------------------------------------------------------------------
    # 3. Secret Redaction & Leakage Prevention
    # -------------------------------------------------------------------------
    def test_03_secret_redaction_in_response(self):
        raw_secret = "_".join(["sk", "live", "51M0xDemoSyntheticKey99812"])
        vuln_code = f'const key = "{raw_secret}";'
        payload = json.dumps({"code": vuln_code}).encode("utf-8")
        headers = {"X-Demo-Session-ID": "sess_test_03", "Content-Type": "application/json"}

        response = self.router.execute(payload, headers, client_ip="10.20.1.3")

        snippet = response.findings[0]["evidenceSnippet"]
        self.assertNotIn(raw_secret, snippet)
        self.assertIn("sk_live_***[REDACTED]***", snippet)

    # -------------------------------------------------------------------------
    # 4. SSRF Security Guard
    # -------------------------------------------------------------------------
    def test_04_ssrf_rejection_for_internal_ips(self):
        payload = json.dumps({
            "repoUrl": "http://127.0.0.1:8080/internal-repo.git",
            "code": "const x = 1;"
        }).encode("utf-8")
        headers = {"X-Demo-Session-ID": "sess_test_04", "Content-Type": "application/json"}

        response = self.router.execute(payload, headers, client_ip="10.20.1.4")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.route_executed, "REJECTED")
        self.assertIn("Security rejection", response.message)

    # -------------------------------------------------------------------------
    # 5. Payload Size Ceiling Enforcement (HTTP 413)
    # -------------------------------------------------------------------------
    def test_05_payload_too_large_rejection(self):
        # Demo max body size is 256 KB
        oversized = "a" * (300 * 1024)
        payload = json.dumps({"code": oversized}).encode("utf-8")
        headers = {"X-Demo-Session-ID": "sess_test_05", "Content-Type": "application/json"}

        response = self.router.execute(payload, headers, client_ip="10.20.1.5")

        self.assertEqual(response.status_code, 413)
        self.assertEqual(response.route_executed, "REJECTED")
        self.assertIn("exceeds maximum allowed size", response.message)

    # -------------------------------------------------------------------------
    # 6. PR Diff Size Limit Enforcement (HTTP 400)
    # -------------------------------------------------------------------------
    def test_06_diff_size_limit_rejection(self):
        # 450 diff lines exceeds demo limit of 400 lines
        diff_lines = "\n".join([f"+ added line {i}" for i in range(450)])
        payload = json.dumps({"diff": diff_lines}).encode("utf-8")
        headers = {"X-Demo-Session-ID": "sess_test_06", "Content-Type": "application/json"}

        response = self.router.execute(payload, headers, client_ip="10.20.1.6")

        self.assertEqual(response.status_code, 400)
        self.assertIn("exceeding the demo limit of 400 lines", response.message)

    # -------------------------------------------------------------------------
    # 7. Idempotency & Deduplication (Submitting identical code does not deduct run)
    # -------------------------------------------------------------------------
    def test_07_idempotency_deduplication_preserves_allowance(self):
        session = "sess_idempotent_test"
        payload = json.dumps({"code": "export const testDedup = () => 42;"}).encode("utf-8")
        headers = {"X-Demo-Session-ID": session, "Content-Type": "application/json"}

        # First run: consumes 1 run
        res1 = self.router.execute(payload, headers, client_ip="10.20.1.7")
        runs_after_first = res1.quota["usedRuns"]

        # Second run with IDENTICAL payload: served from cache, usedRuns remains unchanged!
        res2 = self.router.execute(payload, headers, client_ip="10.20.1.7")
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.quota["usedRuns"], runs_after_first)
        self.assertIn("deduplication cache", res2.message)

    # -------------------------------------------------------------------------
    # 8. Fair Usage Guarantee (Failed / Invalid inputs do NOT decrement demo allowance)
    # -------------------------------------------------------------------------
    def test_08_fair_usage_failure_not_charged(self):
        session = "sess_fair_usage_test"
        fingerprint = quota_service.get_session_fingerprint(session, "10.20.1.8")
        initial_allowance = quota_service.get_allowance_info(fingerprint)
        initial_used = initial_allowance["usedRuns"]

        # Submit invalid/malformed JSON
        bad_payload = b"not-a-valid-json-string"
        headers = {"X-Demo-Session-ID": session, "Content-Type": "application/json"}
        res = self.router.execute(bad_payload, headers, client_ip="10.20.1.8")
        self.assertEqual(res.status_code, 400)

        # Verify usedRuns has NOT incremented
        current_allowance = quota_service.get_allowance_info(fingerprint)
        self.assertEqual(current_allowance["usedRuns"], initial_used)

    # -------------------------------------------------------------------------
    # 9. Demo Allowance Exhaustion & Pilot Request Prompt
    # -------------------------------------------------------------------------
    def test_09_demo_allowance_exhaustion(self):
        session = "sess_exhaustion_test"
        headers = {"X-Demo-Session-ID": session, "Content-Type": "application/json"}

        # Run 5 distinct code snippets to exhaust the 5-run demo allowance
        for i in range(5):
            p = json.dumps({"code": f"export const testSnippet{i} = () => {i};"}).encode("utf-8")
            r = self.router.execute(p, headers, client_ip="10.20.1.9")
            self.assertEqual(r.status_code, 200)

        # 6th distinct snippet must be rejected with 429 Demo Allowance Exhausted
        p6 = json.dumps({"code": "export const testSnippetExhaust = () => 999;"}).encode("utf-8")
        r6 = self.router.execute(p6, headers, client_ip="10.20.1.9")

        self.assertEqual(r6.status_code, 429)
        self.assertIn("Demo allowance used", r6.message)
        self.assertEqual(r6.summary.get("nextAction"), "request_pilot")
        self.assertIsNotNone(r6.summary.get("resetAt"))

    # -------------------------------------------------------------------------
    # 10. Anti-Spam Sliding-Window Rate Limit (5 RPM)
    # -------------------------------------------------------------------------
    def test_10_anti_spam_rpm_guard(self):
        session = "sess_spam_guard"
        headers = {"X-Demo-Session-ID": session, "Content-Type": "application/json"}

        responses = []
        for i in range(7):
            p = json.dumps({"code": f"const v{i} = {i};"}).encode("utf-8")
            res = self.router.execute(p, headers, client_ip="10.20.1.10")
            responses.append(res.status_code)

        # Should trigger 429 once 5 RPM threshold is hit
        self.assertIn(429, responses)

    # -------------------------------------------------------------------------
    # 11. Future Myco Backend Candidate Identification
    # -------------------------------------------------------------------------
    def test_11_future_myco_candidate_identification(self):
        # Multi-repo or deep symbolic request that requires future Myco backend
        session = "sess_myco_candidate"
        payload = json.dumps({
            "code": "export const interService = () => true;",
            "requestedFeatures": ["cross_repo_graph"]
        }).encode("utf-8")
        headers = {"X-Demo-Session-ID": session, "Content-Type": "application/json"}

        response = self.router.execute(payload, headers, client_ip="10.20.1.11")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.route_executed, "EXTERNAL_MYCO")
        self.assertTrue(response.summary.get("requiresMyco"))
        self.assertFalse(response.summary.get("canProcessInternally"))
        self.assertEqual(response.summary.get("nextAction"), "request_pilot")

    # -------------------------------------------------------------------------
    # 12. Mock Backend Provider Pluggability
    # -------------------------------------------------------------------------
    def test_12_mock_backend_provider_pluggability(self):
        mock_provider = MockBackendProvider(simulate_failure=False)
        router_with_mock = PipelineRouter(backend_provider=mock_provider)

        session = "sess_mock_test"
        payload = json.dumps({
            "code": "const x = 1;",
            "requestedFeatures": ["cross_repo_graph"]
        }).encode("utf-8")
        headers = {"X-Demo-Session-ID": session, "Content-Type": "application/json"}

        response = router_with_mock.execute(payload, headers, client_ip="10.20.1.12")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.route_executed, "EXTERNAL_MYCO")
        self.assertEqual(len(response.findings), 1)
        self.assertEqual(response.findings[0]["id"], "MOCK-EXT-01")

    # -------------------------------------------------------------------------
    # 13. Observability and Demo Metrics
    # -------------------------------------------------------------------------
    def test_13_observability_and_demo_metrics(self):
        summary = metrics.get_summary()
        self.assertIn("counters", summary)
        self.assertIn("requests_total", summary["counters"])
        self.assertIn("latencyMs", summary)
        self.assertIn("circuitBreakerState", summary)

    # -------------------------------------------------------------------------
    # 14. Sample Demo Run Preserves Custom Code Allowance
    # -------------------------------------------------------------------------
    def test_14_sample_code_preserves_custom_allowance(self):
        session = "sess_sample_preservation_test"
        headers = {"X-Demo-Session-ID": session, "Content-Type": "application/json"}

        # Running 7 guided sample demos with isDemo=True
        for i in range(7):
            p = json.dumps({
                "code": f"export const sampleRun{i} = () => {i};",
                "isDemo": True,
            }).encode("utf-8")
            res = self.router.execute(p, headers, client_ip="10.20.1.14")
            self.assertEqual(res.status_code, 200)

        # Verify that usedRuns is still 0 because all runs were guided sample demonstrations
        fingerprint = quota_service.get_session_fingerprint(session, "10.20.1.14")
        allowance = quota_service.get_allowance_info(fingerprint)
        self.assertEqual(allowance["usedRuns"], 0)
        self.assertEqual(allowance["remainingRuns"], 5)

    # -------------------------------------------------------------------------
    # 15. Anti-Bypass Guard (Incognito / Cache Clear Blocked by IP Composite)
    # -------------------------------------------------------------------------
    def test_15_anti_bypass_incognito_blocked_by_ip_composite(self):
        client_ip = "192.168.1.50"
        user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0"
        headers_sess_a = {
            "X-Demo-Session-ID": "sess_primary_user_session",
            "User-Agent": user_agent,
            "Content-Type": "application/json",
        }

        # User runs 5 analyses in their normal browser session
        for i in range(5):
            p = json.dumps({"code": f"export const normalSnippet{i} = () => {i};"}).encode("utf-8")
            res = self.router.execute(p, headers_sess_a, client_ip=client_ip)
            self.assertEqual(res.status_code, 200)

        # User tries to bypass quota by opening Incognito window (new random session ID, no cookie)
        headers_incognito = {
            "X-Demo-Session-ID": "sess_brand_new_incognito_session_99",
            "User-Agent": user_agent,
            "Content-Type": "application/json",
        }
        bypass_payload = json.dumps({"code": "export const incognitoSnippet = () => 'bypass';"}).encode("utf-8")
        res_incognito = self.router.execute(bypass_payload, headers_incognito, client_ip=client_ip)

        # Must be rejected because composite IP fingerprint has exhausted 5 runs!
        self.assertEqual(res_incognito.status_code, 429)
        self.assertIn("Demo allowance used", res_incognito.message)
        self.assertEqual(res_incognito.summary.get("errorCode"), "DEMO_ALLOWANCE_EXHAUSTED")

    # -------------------------------------------------------------------------
    # 16. Rolling 24-Hour Sliding Window (Old runs drop off automatically)
    # -------------------------------------------------------------------------
    def test_16_rolling_24h_window_restores_allowance(self):
        session = "sess_rolling_window_test"
        session_key = quota_service.get_session_key(session)
        now = time.time()

        # Seed 4 runs from 25 hours ago (>86400s) and 1 run from 2 hours ago (<86400s)
        expired_ts = now - 90000.0  # 25 hours ago
        recent_ts = now - 7200.0    # 2 hours ago
        quota_service._session_runs[session_key] = [expired_ts, expired_ts, expired_ts, expired_ts, recent_ts]

        # Check allowance: the 4 expired runs should drop off, leaving only 1 used run
        allowance = quota_service.get_allowance_info(session_key)
        self.assertEqual(allowance["usedRuns"], 1)
        self.assertEqual(allowance["remainingRuns"], 4)
        self.assertFalse(allowance["isExhausted"])

    # -------------------------------------------------------------------------
    # 17. Flat-File Persistence Survives Restart Without Database
    # -------------------------------------------------------------------------
    def test_17_flat_file_persistence_survives_restart(self):
        import tempfile
        from pipeline.quota import DemoQuotaService

        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
            tmp_path = Path(tmp.name)

        try:
            # Service 1 writes run records to the flat file
            service1 = DemoQuotaService(persistence_file=tmp_path)
            sess_key = "sess_test_persistence"
            service1.record_success_and_cache(
                session_key=sess_key,
                content_hash="hash123",
                response_data={"status": "ok"},
            )

            # Service 2 simulates server restart by initializing from the same file
            service2 = DemoQuotaService(persistence_file=tmp_path)
            allowance = service2.get_allowance_info(sess_key)
            self.assertEqual(allowance["usedRuns"], 1)
            self.assertEqual(allowance["remainingRuns"], 4)
        finally:
            if tmp_path.exists():
                tmp_path.unlink()


if __name__ == "__main__":
    unittest.main()

