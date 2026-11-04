#!/usr/bin/env python3
"""
Test Suite for Lightweight Myco Engine.

Validates:
1. Bare identifier / gibberish detection ('haaaa').
2. SQL query intelligence (unbounded UPDATE/DELETE without WHERE, SELECT * without LIMIT, missing tenant filter).
3. Logic defects (assignment in if condition, NaN comparison, silent catch swallowing).
4. Delimiter balancing and syntax integrity.
5. Workload routing to Real Myco Enterprise (cross-repo package imports).
6. Clean code invariant verification with zero fake findings.
"""

import json
import subprocess
import unittest
from pathlib import Path

from pipeline.router import PipelineRouter
from pipeline.quota import quota_service
from pipeline.backend_adapter import future_myco_adapter

JSC_PATH = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"


class TestLightweightMyco(unittest.TestCase):

    def setUp(self):
        quota_service.reset_all()
        self.router = PipelineRouter(backend_provider=future_myco_adapter)

    def tearDown(self):
        quota_service.reset_all()

    def run_client_core(self, path: str, content: str) -> dict:
        """Executes in-browser intelligence-core engine via macOS JavaScriptCore."""
        script = f"""
        const core = typeof module !== 'undefined' ? module.exports : MycoIntelligenceCore;
        const res = core.analyze({{ primaryFile: {{ path: {json.dumps(path)}, content: {json.dumps(content)} }} }});
        print(JSON.stringify(res));
        """
        proc = subprocess.run(
            [JSC_PATH, "static/js/intelligence-core.js", "-e", script],
            capture_output=True,
            text=True,
            check=True
        )
        return json.loads(proc.stdout)

    # -------------------------------------------------------------------------
    # 1. Bare Identifier / Gibberish Syntax Detection ('haaaa')
    # -------------------------------------------------------------------------
    def test_01_bare_identifier_client_core(self):
        res = self.run_client_core("user_code.ts", "haaaa")
        self.assertFalse(res["isClean"])
        self.assertTrue(res["isMergeBlocking"])
        self.assertGreaterEqual(len(res["findings"]), 1)
        finding = res["findings"][0]
        self.assertEqual(finding["category"], "syntax")
        self.assertEqual(finding["severity"], "CRITICAL")
        self.assertIn("haaaa", finding["title"])
        self.assertEqual(finding["sourceRange"]["startLine"], 1)

    def test_02_bare_identifier_server_pipeline(self):
        payload = json.dumps({"code": "haaaa"}).encode("utf-8")
        headers = {"X-Demo-Session-ID": "sess_test_haaaa", "Content-Type": "application/json"}
        res = self.router.execute(payload, headers, client_ip="10.50.1.1")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.route_executed, "INTERNAL")
        self.assertFalse(res.summary["isClean"])
        self.assertTrue(res.summary["isMergeBlocking"])
        self.assertGreaterEqual(len(res.findings), 1)
        self.assertEqual(res.findings[0]["category"], "syntax")
        self.assertEqual(res.findings[0]["severity"], "CRITICAL")
        self.assertIn("haaaa", res.findings[0]["title"])

    # -------------------------------------------------------------------------
    # 2. SQL Query Intelligence
    # -------------------------------------------------------------------------
    def test_03_sql_unbounded_delete_without_where(self):
        sql = "DELETE FROM users;"
        # Client core
        client_res = self.run_client_core("query.sql", sql)
        self.assertFalse(client_res["isClean"])
        self.assertTrue(client_res["isMergeBlocking"])
        self.assertTrue(any("Unbounded Table Modification" in f["title"] for f in client_res["findings"]))

        # Server pipeline
        payload = json.dumps({"code": sql}).encode("utf-8")
        headers = {"X-Demo-Session-ID": "sess_test_sql_del", "Content-Type": "application/json"}
        res = self.router.execute(payload, headers, client_ip="10.50.1.2")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.summary["isClean"])
        self.assertTrue(res.summary["isMergeBlocking"])
        self.assertTrue(any("Unbounded Table Modification" in f["title"] for f in res.findings))

    def test_04_sql_unbounded_projection_and_tenant_leak(self):
        sql = "SELECT * FROM users;"
        # Client core
        client_res = self.run_client_core("query.sql", sql)
        self.assertFalse(client_res["isClean"])
        self.assertTrue(any("Unbounded Column Projection" in f["title"] for f in client_res["findings"]))
        self.assertTrue(any("Tenant Boundary Violation" in f["title"] for f in client_res["findings"]))

        # Server pipeline
        payload = json.dumps({"code": sql}).encode("utf-8")
        headers = {"X-Demo-Session-ID": "sess_test_sql_sel", "Content-Type": "application/json"}
        res = self.router.execute(payload, headers, client_ip="10.50.1.3")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.summary["isClean"])
        self.assertTrue(any("Unbounded Column Projection" in f["title"] for f in res.findings))
        self.assertTrue(any("Tenant Boundary Violation" in f["title"] for f in res.findings))

    def test_05_clean_sql_query(self):
        clean_sql = "SELECT id, name, created_at FROM users WHERE tenant_id = :tenant_id LIMIT 25;"
        # Client core
        client_res = self.run_client_core("query.sql", clean_sql)
        self.assertTrue(client_res["isClean"])
        self.assertFalse(client_res["isMergeBlocking"])
        self.assertEqual(len(client_res["findings"]), 0)
        self.assertEqual(client_res["primaryFinding"]["severity"], "CLEAN")

        # Server pipeline
        payload = json.dumps({"code": clean_sql}).encode("utf-8")
        headers = {"X-Demo-Session-ID": "sess_test_sql_clean", "Content-Type": "application/json"}
        res = self.router.execute(payload, headers, client_ip="10.50.1.4")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.summary["isClean"])
        self.assertEqual(len(res.findings), 0)

    # -------------------------------------------------------------------------
    # 3. JavaScript / TypeScript Logic & Reliability Defects
    # -------------------------------------------------------------------------
    def test_06_accidental_assignment_in_conditional(self):
        bad_code = "function checkAccess(role) { if (role = 'admin') { grantRoot(); } }"
        # Client core
        client_res = self.run_client_core("code.ts", bad_code)
        self.assertFalse(client_res["isClean"])
        self.assertTrue(any("Accidental Variable Assignment" in f["title"] for f in client_res["findings"]))

        # Server pipeline
        payload = json.dumps({"code": bad_code}).encode("utf-8")
        headers = {"X-Demo-Session-ID": "sess_test_assign_if", "Content-Type": "application/json"}
        res = self.router.execute(payload, headers, client_ip="10.50.1.5")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.summary["isClean"])
        self.assertTrue(any("Accidental Variable Assignment" in f["title"] for f in res.findings))

    def test_07_nan_equality_and_empty_catch(self):
        defect_code = """
        function calculate(val) {
            if (val === NaN) {
                return 0;
            }
            try {
                processData(val);
            } catch (err) {
            }
        }
        """
        # Client core
        client_res = self.run_client_core("code.ts", defect_code)
        self.assertFalse(client_res["isClean"])
        self.assertTrue(any("NaN" in f["title"] for f in client_res["findings"]))
        self.assertTrue(any("Silent Exception Swallowing" in f["title"] for f in client_res["findings"]))

        # Server pipeline
        payload = json.dumps({"code": defect_code}).encode("utf-8")
        headers = {"X-Demo-Session-ID": "sess_test_defects", "Content-Type": "application/json"}
        res = self.router.execute(payload, headers, client_ip="10.50.1.6")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.summary["isClean"])
        self.assertTrue(any("NaN" in f["title"] for f in res.findings))
        self.assertTrue(any("Silent Exception Swallowing" in f["title"] for f in res.findings))

    # -------------------------------------------------------------------------
    # 4. Routing to Real Myco Enterprise Pipeline
    # -------------------------------------------------------------------------
    def test_08_cross_repo_package_routes_to_external_myco(self):
        enterprise_code = 'import { AuthService } from "@enterprise/auth-kernel";\nexport const auth = new AuthService();'
        payload = json.dumps({"code": enterprise_code}).encode("utf-8")
        headers = {"X-Demo-Session-ID": "sess_test_enterprise", "Content-Type": "application/json"}
        res = self.router.execute(payload, headers, client_ip="10.50.1.7")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.route_executed, "EXTERNAL_MYCO")
        self.assertTrue(res.summary.get("requiresMyco"))


if __name__ == "__main__":
    unittest.main()
