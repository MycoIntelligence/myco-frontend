"""
Internal Processing Engine.

Executes static analysis, AST pattern matching, and policy checks internally without
invoking any external backend. Normalizes findings and computes execution metrics.
"""

import os
import re
import subprocess
import time
from typing import Any, Dict, List, Optional

from pipeline.types import (
    AnalysisFinding,
    CodeInputFile,
    EscalationReason,
    FindingSeverity,
    ReviewResult,
    ReviewStatus,
    SourceRange,
)

JSC_PATH = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"
INTELLIGENCE_CORE_JS = os.path.join(os.path.dirname(__file__), "..", "static", "js", "intelligence-core.js")


class InternalProcessingEngine:
    """
    Executes internal static code analysis and policy verification (Little My).
    """

    SUPPORTED_EXTENSIONS = {
        ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
        ".py", ".sql", ".json", ".yaml", ".yml", ".env", ".md", ".markdown", ".diff", ".patch"
    }

    @classmethod
    def is_file_supported(cls, path: str) -> bool:
        """Determines if the given file path is supported by Little My native parsers and rules."""
        if not path:
            return True
        p_lower = path.lower()
        base = os.path.basename(p_lower)
        if base in ("dockerfile", "makefile", ".env") or base.startswith(".env."):
            return True
        _, ext = os.path.splitext(p_lower)
        return ext in cls.SUPPORTED_EXTENSIONS

    def process(
        self,
        primary_file: CodeInputFile,
        context_files: List[CodeInputFile],
        prd_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes internal analysis and returns standardized result structure.
        """
        start_time = time.time()
        findings: List[AnalysisFinding] = []
        unsupported_files: List[str] = []
        unresolved_cases: List[str] = []

        code = primary_file.content or ""
        file_path = primary_file.path or "code.ts"
        lines = code.splitlines()
        trimmed_code = code.strip()

        # Capability check: Verify primary file extension
        if not self.is_file_supported(file_path):
            unsupported_files.append(file_path)

        # Capability check: Verify context files
        for cf in context_files:
            if cf.path and not self.is_file_supported(cf.path):
                if cf.path not in unsupported_files:
                    unsupported_files.append(cf.path)

        # Boundary check: Cross-repository internal package dependencies
        if re.search(r'import\s+.*?from\s+["\']@(?:company|enterprise|internal|myco-core)/', code):
            unresolved_cases.append(f"Cross-repository dependency detected in {file_path}")

        # Inconclusive analysis check
        if "@little-my: inconclusive" in code or "@review: inconclusive" in code:
            unresolved_cases.append(f"Explicit inconclusive static analysis marker in {file_path}")

        # 0. Rule: Grammar & Syntax Integrity (Bare Identifier & Delimiter Stack)
        clean_tokens = re.sub(r"/\*[\s\S]*?\*/|//.*|#.*", "", trimmed_code).strip()
        if re.match(r"^[a-zA-Z_$][a-zA-Z0-9_$]*$", clean_tokens):
            bare_token = clean_tokens
            if bare_token not in ("return", "break", "continue", "debugger", "pass", "yield"):
                findings.append(
                    AnalysisFinding(
                        id="SYNTAX-1-bare_identifier",
                        category="syntax",
                        severity=FindingSeverity.CRITICAL,
                        title=f"Syntax Error: Unresolved Bare Identifier '{bare_token}'",
                        explanation=f"The bare identifier '{bare_token}' exists outside any statement, declaration, or function invocation. In TypeScript/JavaScript, this throws a ReferenceError at runtime (TS2304); in SQL or Python, this is invalid syntax.",
                        impact="Code cannot execute or compile. Evaluation raises an immediate ReferenceError or SyntaxError.",
                        file_path=file_path,
                        source_range=SourceRange(start_line=1, end_line=1),
                        evidence_snippet=bare_token,
                        evidence_rule="SYNTAX-01 · GRAMMAR & REFERENCE INTEGRITY",
                        suggested_action=f"Declare '{bare_token}' with a declaration keyword (e.g., 'const {bare_token} = ...;') or provide a valid statement or query.",
                        is_merge_blocking=True,
                    )
                )

        # Delimiter balancing check
        bracket_stack = []
        for l_idx, l_text in enumerate(lines, start=1):
            for c_char in l_text:
                if c_char in "({[":
                    bracket_stack.append((c_char, l_idx))
                elif c_char in ")}]":
                    if not bracket_stack:
                        findings.append(
                            AnalysisFinding(
                                id=f"SYNTAX-UNMATCHED-DELIM-L{l_idx}",
                                category="syntax",
                                severity=FindingSeverity.CRITICAL,
                                title=f"Syntax Error: Unexpected Closing Delimiter '{c_char}'",
                                explanation=f"Found unmatched closing delimiter '{c_char}' without an opening counterpart.",
                                impact="Unbalanced delimiters break code parsing and execution.",
                                file_path=file_path,
                                source_range=SourceRange(start_line=l_idx, end_line=l_idx),
                                evidence_snippet=l_text.strip(),
                                evidence_rule="SYNTAX-02 · DELIMITER INTEGRITY",
                                suggested_action=f"Remove the extra '{c_char}' or provide matching opening bracket.",
                                is_merge_blocking=True,
                            )
                        )
                        break
                    last_open, last_line = bracket_stack.pop()
                    expected = ")" if last_open == "(" else "}" if last_open == "{" else "]"
                    if c_char != expected:
                        findings.append(
                            AnalysisFinding(
                                id=f"SYNTAX-MISMATCHED-DELIM-L{l_idx}",
                                category="syntax",
                                severity=FindingSeverity.CRITICAL,
                                title=f"Syntax Error: Mismatched Delimiter: Opened '{last_open}' but closed with '{c_char}'",
                                explanation=f"Opened delimiter '{last_open}' at line {last_line} was closed with '{c_char}' at line {l_idx}.",
                                impact="Mismatched delimiters break structural compilation.",
                                file_path=file_path,
                                source_range=SourceRange(start_line=l_idx, end_line=l_idx),
                                evidence_snippet=l_text.strip(),
                                evidence_rule="SYNTAX-02 · DELIMITER INTEGRITY",
                                suggested_action=f"Replace '{c_char}' with matching '{expected}'.",
                                is_merge_blocking=True,
                            )
                        )
                        break
            if findings:
                break

        # Python Native AST Parsing & Rules
        if (file_path.endswith(".py") or re.search(r"^\s*(?:def\s+[a-zA-Z_]|import\s+[a-zA-Z_]|from\s+[a-zA-Z_]|class\s+[a-zA-Z_])", code, re.MULTILINE)) and not findings:
            import ast
            try:
                tree = ast.parse(code)
                for node in ast.walk(tree):
                    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        for default in node.args.defaults:
                            if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                                findings.append(
                                    AnalysisFinding(
                                        id=f"BUG-PY-MUTABLE-DEFAULT-L{node.lineno}",
                                        category="logic",
                                        severity=FindingSeverity.HIGH,
                                        title=f"Mutable Default Argument in Function '{node.name}'",
                                        explanation=f"Function '{node.name}' defines a mutable default argument. Mutable defaults are shared across all calls, leaking state between invocations.",
                                        impact="Silent state accumulation and cross-call data pollution.",
                                        file_path=file_path,
                                        source_range=SourceRange(start_line=node.lineno, end_line=node.lineno),
                                        evidence_snippet=lines[node.lineno - 1] if node.lineno <= len(lines) else f"def {node.name}(...)",
                                        evidence_rule="BUG-02 · IMMUTABLE_DEFAULT_ARGUMENTS",
                                        suggested_action="Use None as default parameter and assign inside function body.",
                                        is_merge_blocking=True,
                                    )
                                )
                    if isinstance(node, ast.ExceptHandler) and node.type is None:
                        findings.append(
                            AnalysisFinding(
                                id=f"REL-PY-BARE-EXCEPT-L{node.lineno}",
                                category="reliability",
                                severity=FindingSeverity.HIGH,
                                title="Bare Except Handler (Catches BaseException)",
                                explanation="Using 'except:' without specifying an exception class suppresses critical interrupts and process termination signals.",
                                impact="Hangs background tasks and masks crash diagnostics.",
                                file_path=file_path,
                                source_range=SourceRange(start_line=node.lineno, end_line=node.lineno),
                                evidence_snippet=lines[node.lineno - 1] if node.lineno <= len(lines) else "except:",
                                evidence_rule="REL-02 · EXPLICIT_EXCEPTION_HANDLING",
                                suggested_action="Catch explicit exceptions, e.g. 'except Exception as err:'.",
                                is_merge_blocking=True,
                            )
                        )
            except SyntaxError as e:
                findings.append(
                    AnalysisFinding(
                        id=f"SYNTAX-PY-L{e.lineno or 1}",
                        category="syntax",
                        severity=FindingSeverity.CRITICAL,
                        title=f"Python Syntax Error: {e.msg}",
                        explanation=f"Python parser encountered an unrecoverable syntax error: '{e.msg}' at line {e.lineno}, column {e.offset}.",
                        impact="Code fails compilation and throws an immediate SyntaxError on execution.",
                        file_path=file_path,
                        source_range=SourceRange(start_line=e.lineno or 1, end_line=e.lineno or 1),
                        evidence_snippet=lines[e.lineno - 1] if e.lineno and e.lineno <= len(lines) else (e.text or code[:60]),
                        evidence_rule="SYNTAX-01 · AST_PARSE_INTEGRITY",
                        suggested_action=f"Correct syntax near line {e.lineno}.",
                        is_merge_blocking=True,
                    )
                )

        # SQL Query Intelligence
        is_sql = file_path.endswith(".sql") or bool(re.search(r"^\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH)\b", trimmed_code, re.IGNORECASE))
        if is_sql:
            mod_match = re.search(r"\b(UPDATE\s+([a-zA-Z0-9_.]+)\s+SET\b|DELETE\s+FROM\s+([a-zA-Z0-9_.]+)\b)", code, re.IGNORECASE)
            if mod_match and not re.search(r"\bWHERE\b", code, re.IGNORECASE):
                line_no = self._find_line_number(lines, mod_match.group(0)[:15])
                table = mod_match.group(2) or mod_match.group(3) or "table"
                findings.append(
                    AnalysisFinding(
                        id=f"SQL-UNBOUNDED-MOD-L{line_no}",
                        category="security",
                        severity=FindingSeverity.CRITICAL,
                        title="Critical: Unbounded Table Modification (Missing WHERE Clause)",
                        explanation=f"The operation executes without a WHERE clause filter. In production, this query will permanently modify or delete all records across the entire '{table}' table.",
                        impact="Catastrophic permanent data loss or database corruption across all tenants.",
                        file_path=file_path,
                        source_range=SourceRange(start_line=line_no, end_line=line_no),
                        evidence_snippet=lines[line_no - 1] if line_no <= len(lines) else mod_match.group(0),
                        evidence_rule="SQL-01 · UNBOUNDED_TABLE_MODIFICATION",
                        suggested_action="Specify a bounded WHERE clause (e.g. 'WHERE id = :id').",
                        is_merge_blocking=True,
                    )
                )
            select_match = re.search(r"\bSELECT\s+\*\s+FROM\s+([a-zA-Z0-9_.]+)", code, re.IGNORECASE)
            if select_match and not re.search(r"\bLIMIT\s+\d+|\bFETCH\s+FIRST|\bTOP\s+\d+", code, re.IGNORECASE):
                line_no = self._find_line_number(lines, "SELECT")
                table = select_match.group(1)
                findings.append(
                    AnalysisFinding(
                        id=f"SQL-UNBOUNDED-SELECT-L{line_no}",
                        category="performance",
                        severity=FindingSeverity.MEDIUM,
                        title=f"Advisory: Unbounded Column Projection (SELECT * Without LIMIT)",
                        explanation=f"Query executes 'SELECT * FROM {table}' without a LIMIT or pagination boundary. In production, this causes high I/O overhead and memory buffer saturation.",
                        impact="Database connection pool exhaustion and memory pressure under scale.",
                        file_path=file_path,
                        source_range=SourceRange(start_line=line_no, end_line=line_no),
                        evidence_snippet=lines[line_no - 1] if line_no <= len(lines) else select_match.group(0),
                        evidence_rule="SQL-02 · UNBOUNDED_PROJECTION",
                        suggested_action=f"Explicitly project required columns and append a LIMIT clause.",
                        is_merge_blocking=False,
                    )
                )
            sens_match = re.search(r"\bFROM\s+([a-zA-Z0-9_.]*(?:users|accounts|invoices|tenants|organizations|projects|records|billing|orders|profiles)[a-zA-Z0-9_.]*)", code, re.IGNORECASE)
            if sens_match and not re.search(r"\b(?:tenant_id|org_id|tenantId|orgId|account_id|accountId)\b", code, re.IGNORECASE):
                line_no = self._find_line_number(lines, "FROM")
                table = sens_match.group(1)
                findings.append(
                    AnalysisFinding(
                        id=f"SQL-TENANT-LEAK-L{line_no}",
                        category="security",
                        severity=FindingSeverity.HIGH,
                        title=f"Tenant Boundary Violation: Missing Tenant Isolation Filter on '{table}'",
                        explanation=f"The query accesses the multi-tenant collection '{table}' without filtering by 'tenant_id' or 'org_id'. In multi-tenant systems, this permits cross-tenant data exposure.",
                        impact="Cross-tenant authorization bypass and zero-trust policy violation.",
                        file_path=file_path,
                        source_range=SourceRange(start_line=line_no, end_line=line_no),
                        evidence_snippet=lines[line_no - 1] if line_no <= len(lines) else sens_match.group(0),
                        evidence_rule="TENANT-02 · STRICT_MULTI_TENANT_ISOLATION",
                        suggested_action="Append tenant filter to WHERE clause: 'WHERE tenant_id = :tenant_id'.",
                        is_merge_blocking=True,
                    )
                )

        # JS/TS Logic & Defect Rules
        assign_if = re.search(r"\bif\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^=][^)]*)\)", code)
        if assign_if:
            line_no = self._find_line_number(lines, "if")
            findings.append(
                AnalysisFinding(
                    id=f"LOGIC-ACCIDENTAL-ASSIGN-L{line_no}",
                    category="logic",
                    severity=FindingSeverity.HIGH,
                    title="Logic Defect: Accidental Variable Assignment in 'if' Condition",
                    explanation=f"Condition assigns a value to '{assign_if.group(1)}' ('=') instead of testing equality ('===').",
                    impact="Severe logical defect: branch behaves unpredictably and mutates variable.",
                    file_path=file_path,
                    source_range=SourceRange(start_line=line_no, end_line=line_no),
                    evidence_snippet=lines[line_no - 1] if line_no <= len(lines) else assign_if.group(0),
                    evidence_rule="LOGIC-01 · ACCIDENTAL_ASSIGNMENT",
                    suggested_action=f"Replace assignment '=' with strict equality '==='.",
                    is_merge_blocking=True,
                )
            )

        nan_match = re.search(r"(?:===|==|!==|!=)\s*NaN\b|\bNaN\s*(?:===|==|!==|!=)", code)
        if nan_match:
            line_no = self._find_line_number(lines, "NaN")
            findings.append(
                AnalysisFinding(
                    id=f"LOGIC-NAN-EQUALITY-L{line_no}",
                    category="logic",
                    severity=FindingSeverity.HIGH,
                    title="Logic Defect: Invalid Direct Equality Comparison Against NaN",
                    explanation="In IEEE 754 floating-point standard, NaN !== NaN is always true. Direct comparison with NaN will never match.",
                    impact="Conditional check will never match, causing unreachable code paths.",
                    file_path=file_path,
                    source_range=SourceRange(start_line=line_no, end_line=line_no),
                    evidence_snippet=lines[line_no - 1] if line_no <= len(lines) else nan_match.group(0),
                    evidence_rule="LOGIC-02 · IEEE754_NAN_EQUALITY",
                    suggested_action="Use 'Number.isNaN(value)' instead of direct equality comparison.",
                    is_merge_blocking=False,
                )
            )

        empty_catch = re.search(r"\bcatch\s*(?:\([^)]*\))?\s*\{\s*(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/|\s*)*\}", code)
        if empty_catch:
            line_no = self._find_line_number(lines, "catch")
            findings.append(
                AnalysisFinding(
                    id=f"REL-EMPTY-CATCH-L{line_no}",
                    category="reliability",
                    severity=FindingSeverity.HIGH,
                    title="Reliability Risk: Silent Exception Swallowing in Catch Block",
                    explanation="Catch block completely swallows exceptions without logging, telemetry, or rethrowing.",
                    impact="Masks runtime failures and leaves systems in an inconsistent state.",
                    file_path=file_path,
                    source_range=SourceRange(start_line=line_no, end_line=line_no),
                    evidence_snippet=lines[line_no - 1] if line_no <= len(lines) else "catch (err) {}",
                    evidence_rule="REL-01 · EXPLICIT_ERROR_HANDLING",
                    suggested_action="Add structured logging with logger.error(err) or implement a fallback recovery path.",
                    is_merge_blocking=True,
                )
            )

        insecure_http = re.search(r'["\']http://(?!(?:localhost|127\.0\.0\.1|0\.0\.0\.0|example\.com)[/:"\'])([a-zA-Z0-9_.-]+[^"\']*)', code, re.IGNORECASE)
        if insecure_http:
            line_no = self._find_line_number(lines, "http://")
            findings.append(
                AnalysisFinding(
                    id=f"SEC-INSECURE-HTTP-L{line_no}",
                    category="security",
                    severity=FindingSeverity.HIGH,
                    title="Security Risk: Insecure Plaintext HTTP Protocol in Remote Endpoint",
                    explanation=f"Endpoint '{insecure_http.group(0)}' uses unencrypted 'http://' protocol. Plaintext transmission is vulnerable to interception and MitM tampering.",
                    impact="Violates transport security standards. Exposes tokens and data in transit.",
                    file_path=file_path,
                    source_range=SourceRange(start_line=line_no, end_line=line_no),
                    evidence_snippet=lines[line_no - 1] if line_no <= len(lines) else insecure_http.group(0),
                    evidence_rule="SEC-01 · ENCRYPTED_TRANSPORT_ENFORCEMENT",
                    suggested_action="Upgrade endpoint URL to use TLS encryption ('https://').",
                    is_merge_blocking=False,
                )
            )

        # 1. Rule: Secret Credential Detection (SEC-04)
        stripe_match = re.search(r"['\"](sk_live_[a-zA-Z0-9]{24,})['\"]", code)
        if stripe_match:
            line_no = self._find_line_number(lines, stripe_match.group(1))
            findings.append(
                AnalysisFinding(
                    id=f"SEC-{line_no}-stripe_live",
                    category="security",
                    severity=FindingSeverity.CRITICAL,
                    title="Hardcoded Stripe Live Secret Key in Source Code",
                    explanation="A live production Stripe secret key was detected directly in client/server code. This permits unauthorized payment operations and balance modifications.",
                    impact="Potential unauthorized financial transactions, credit card manipulation, and PCI-DSS compliance failure.",
                    file_path=file_path,
                    source_range=SourceRange(start_line=line_no, end_line=line_no),
                    evidence_snippet=lines[line_no - 1] if line_no <= len(lines) else stripe_match.group(0),
                    evidence_rule="SEC-04 · ZERO HARDCODED CREDENTIALS",
                    suggested_action="Migrate the Stripe key to a server-side environment secret (e.g., process.env.STRIPE_SECRET_KEY) accessed via runtime vault.",
                    is_merge_blocking=True,
                )
            )

        aws_match = re.search(r"\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b", code)
        if aws_match:
            line_no = self._find_line_number(lines, aws_match.group(0))
            findings.append(
                AnalysisFinding(
                    id=f"SEC-{line_no}-aws_key",
                    category="security",
                    severity=FindingSeverity.CRITICAL,
                    title="Hardcoded AWS Access Key ID",
                    explanation="An active AWS access key was committed to code. This exposes AWS cloud resources to credential theft.",
                    impact="Complete AWS account compromise and resource exfiltration.",
                    file_path=file_path,
                    source_range=SourceRange(start_line=line_no, end_line=line_no),
                    evidence_snippet=lines[line_no - 1] if line_no <= len(lines) else aws_match.group(0),
                    evidence_rule="SEC-04 · ZERO HARDCODED CREDENTIALS",
                    suggested_action="Store AWS credentials in AWS Secrets Manager or use IAM Roles.",
                    is_merge_blocking=True,
                )
            )

        # 2. Rule: DOM XSS Vulnerability (SEC-02)
        inner_html_match = re.search(r"\.innerHTML\s*=\s*([^;]+)", code)
        if inner_html_match:
            expr = inner_html_match.group(1).strip()
            # If not explicitly sanitized
            if not ("DOMPurify.sanitize" in expr or "sanitizeHtml" in expr or "escapeHtml" in expr):
                line_no = self._find_line_number(lines, ".innerHTML")
                findings.append(
                    AnalysisFinding(
                        id=f"XSS-{line_no}-inner_html",
                        category="security",
                        severity=FindingSeverity.HIGH,
                        title="Direct Unsanitized HTML Injection (XSS Vulnerability)",
                        explanation="Untrusted data is assigned directly to .innerHTML without cryptographic or schema-based HTML sanitization.",
                        impact="Cross-Site Scripting (XSS) allowing session hijacking, credential theft, and DOM tampering.",
                        file_path=file_path,
                        source_range=SourceRange(start_line=line_no, end_line=line_no),
                        evidence_snippet=lines[line_no - 1] if line_no <= len(lines) else inner_html_match.group(0),
                        evidence_rule="SEC-02 · UNTRUSTED INPUT SANITIZATION",
                        suggested_action="Use DOMPurify.sanitize() before assigning to innerHTML or use textContent instead.",
                        is_merge_blocking=True,
                    )
                )

        # 3. Rule: SQL Injection & Tenant Isolation (TENANT-02 / SEC-01)
        sql_concat_match = re.search(r"SELECT\s+.*\s+FROM\s+.*WHERE\s+.*['\"]\s*\+\s*[a-zA-Z0-9_.]+", code, re.IGNORECASE)
        if not sql_concat_match:
            sql_concat_match = re.search(r"SELECT\s+.*WHERE\s+user_id\s*=\s*['\"]\s*\+", code, re.IGNORECASE)
        if sql_concat_match:
            line_no = self._find_line_number(lines, "SELECT")
            findings.append(
                AnalysisFinding(
                    id=f"SQL-{line_no}-tenant_concat",
                    category="security",
                    severity=FindingSeverity.CRITICAL,
                    title="SQL Injection & Unsafe Tenant Query Construction",
                    explanation="Dynamic SQL query is assembled via string concatenation with unparameterized variables.",
                    impact="Cross-tenant data exposure and arbitrary SQL execution.",
                    file_path=file_path,
                    source_range=SourceRange(start_line=line_no, end_line=line_no),
                    evidence_snippet=lines[line_no - 1] if line_no <= len(lines) else sql_concat_match.group(0),
                    evidence_rule="TENANT-02 · STRICT MULTI-TENANT ISOLATION",
                    suggested_action="Replace string concatenation with parameterized SQL queries (e.g. $1, $2 placeholders).",
                    is_merge_blocking=True,
                )
            )

        # 4. Rule: Unhandled Async Boundary (AGENT-12 / REL-01)
        if re.search(r"async\s+function|export\s+const\s+[a-zA-Z0-9_]+\s*=\s*async", code):
            has_await = "await " in code
            has_try = "try {" in code or "try{" in code or ".catch(" in code
            if has_await and not has_try:
                line_no = self._find_line_number(lines, "await")
                findings.append(
                    AnalysisFinding(
                        id=f"ASYNC-{line_no}-unhandled",
                        category="reliability",
                        severity=FindingSeverity.HIGH,
                        title="Unhandled Asynchronous Boundary & Rejection Leak",
                        explanation="Asynchronous await operations are executed without an enclosing try/catch or .catch() handler.",
                        impact="Uncaught Promise rejections causing server process crash or hung HTTP connections.",
                        file_path=file_path,
                        source_range=SourceRange(start_line=line_no, end_line=line_no),
                        evidence_snippet=lines[line_no - 1] if line_no <= len(lines) else "await ...",
                        evidence_rule="AGENT-12 · RESILIENT ASYNC BOUNDARIES",
                        suggested_action="Wrap asynchronous await calls inside a try/catch block with explicit error logging.",
                        is_merge_blocking=True,
                    )
                )

        # 5. Rule: PRD / Policy Mismatch Check (PRD-402)
        has_policy_file = any("tenant" in (f.path or "").lower() or "policy" in (f.path or "").lower() for f in context_files)
        if has_policy_file or prd_text:
            if "orgId !== org_id" not in code and "session.orgId" not in code and "org_id" not in code:
                # If code is accessing user data without verifying org boundary
                if "userId" in code and ("org" in (prd_text or "").lower() or has_policy_file):
                    line_no = 1
                    findings.append(
                        AnalysisFinding(
                            id="POLICY-TENANT-MISMATCH",
                            category="specification",
                            severity=FindingSeverity.HIGH,
                            title="PRD / Policy Mismatch: Missing Multi-Tenant Boundary Enforcement",
                            explanation="Specification requires tenant boundary validation before querying resource collections.",
                            impact="Potential authorization bypass across organizations.",
                            file_path=file_path,
                            source_range=SourceRange(start_line=line_no, end_line=line_no),
                            evidence_snippet=lines[0] if lines else "",
                            evidence_rule="PRD-402 · MANDATORY TENANT AUTHENTICATION",
                            suggested_action="Verify session.orgId against target resource orgId before executing query.",
                            is_merge_blocking=True,
                        )
                    )

        # 6. Rule: Division by Zero & Arithmetic Boundary Integrity (BUG-01 / RESILIENCY-08)
        code_no_comments = re.sub(r"/\*[\s\S]*?\*/|//.*", "", code)
        for idx, line in enumerate(lines, start=1):
            if re.match(r"^\s*(?://|/\*|\*|#)", line):
                continue
            div_match = re.search(r"(?:const|let|var|return|=)\s*[^;/]+\/\s*([a-zA-Z_$][a-zA-Z0-9_$]*)", line)
            if div_match:
                divisor = div_match.group(1)
                if divisor not in ("2", "10", "100", "1000", "60", "24", "365", "Math", "true", "false", "undefined"):
                    guard_pat = re.compile(rf"(?:if\s*\([^)]*\b{re.escape(divisor)}\b[^)]*(?:<=|===|==|<=?)\s*0|!{re.escape(divisor)}\b|{re.escape(divisor)}\s*&&)")
                    has_guard = bool(guard_pat.search(code_no_comments))
                    div_lower = divisor.lower()
                    if not has_guard and any(k in div_lower for k in ("total", "count", "length", "entrant", "completer", "stage", "size", "denom", "divisor", "val", "b", "y", "num")):
                        findings.append(
                            AnalysisFinding(
                                id=f"BUG-DIV-ZERO-L{idx}",
                                category="logic_boundary",
                                severity=FindingSeverity.MEDIUM,
                                title="Unhandled Zero Denominator (Division by Zero / NaN Risk)",
                                explanation=f"Arithmetic division operation divides by '{divisor}' without verifying that '{divisor} !== 0'. When '{divisor}' is 0, JavaScript evaluates to NaN or Infinity, corrupting downstream calculations.",
                                impact="Produces corrupted analytics metrics ('NaN%' or Infinity) and crashes downstream aggregation pipelines or threshold checks.",
                                file_path=file_path,
                                source_range=SourceRange(start_line=idx, end_line=idx),
                                evidence_snippet=line.strip(),
                                evidence_rule="BUG-01 · ARITHMETIC BOUNDARY INTEGRITY",
                                suggested_action=f"Add boundary check: if ({divisor} <= 0) return safe fallback metrics.",
                                is_merge_blocking=False,
                            )
                        )
                        break

        # Calculate metrics and summary
        duration_ms = (time.time() - start_time) * 1000.0
        critical_count = len([f for f in findings if f.severity == FindingSeverity.CRITICAL])
        high_count = len([f for f in findings if f.severity == FindingSeverity.HIGH])
        medium_count = len([f for f in findings if f.severity == FindingSeverity.MEDIUM])
        is_clean = len(findings) == 0
        is_merge_blocking = any(f.is_merge_blocking for f in findings)

        primary_finding = findings[0].to_dict() if findings else {
            "id": "CLEAN-PROJECT",
            "category": "quality",
            "severity": FindingSeverity.CLEAN.value,
            "validationStatus": "VERIFIED",
            "title": "Clean Analysis — No Defects Detected",
            "explanation": "All AST static analysis rules and security policies verified clean.",
            "impact": "Code complies with standard security and reliability requirements.",
            "filePath": file_path,
            "sourceRange": {"startLine": 1, "endLine": max(1, len(lines))},
            "evidenceSnippet": "",
            "evidenceRule": "ALL_RULES_VERIFIED",
            "suggestedAction": "Proceed with merge.",
            "isMergeBlocking": False,
        }

        # Determine escalation state for single-file analysis
        escalation_required = False
        escalation_reason = EscalationReason.NONE

        if unsupported_files:
            escalation_required = True
            escalation_reason = EscalationReason.UNSUPPORTED_LANGUAGE
        elif unresolved_cases:
            escalation_required = True
            if any("cross-repository" in c.lower() for c in unresolved_cases):
                escalation_reason = EscalationReason.CAPABILITY_EXCEEDED
            else:
                escalation_reason = EscalationReason.INCONCLUSIVE_ANALYSIS

        if escalation_required:
            review_status = ReviewStatus.PARTIAL if findings or (self.is_file_supported(file_path) and not unsupported_files) else ReviewStatus.INCOMPLETE
            confidence = 0.5
        else:
            review_status = ReviewStatus.COMPLETE
            confidence = 1.0

        return {
            "status": "completed" if review_status == ReviewStatus.COMPLETE else review_status.value,
            "reviewStatus": review_status.value,
            "executionTimeMs": round(duration_ms, 2),
            "findings": [f.to_dict() for f in findings],
            "primaryFinding": primary_finding,
            "isClean": is_clean,
            "isMergeBlocking": is_merge_blocking,
            "unsupportedFiles": unsupported_files,
            "unresolvedCases": unresolved_cases,
            "escalationRequired": escalation_required,
            "escalationReason": escalation_reason.value if escalation_reason else None,
            "unsupported_files": unsupported_files,
            "unresolved_cases": unresolved_cases,
            "escalation_required": escalation_required,
            "escalation_reason": escalation_reason.value if escalation_reason else None,
            "confidence": confidence,
            "summary": {
                "totalFindings": len(findings),
                "criticalCount": critical_count,
                "highCount": high_count,
                "mediumCount": medium_count,
                "cleanVerified": is_clean,
                "escalationRequired": escalation_required,
                "escalationReason": escalation_reason.value if escalation_reason else None,
            },
        }

    def review_file(
        self,
        file_input: CodeInputFile,
        prd_text: Optional[str] = None,
    ) -> ReviewResult:
        """Convenience method to review a single file and return a canonical ReviewResult."""
        res = self.process(primary_file=file_input, context_files=[], prd_text=prd_text)
        return ReviewResult(
            status=ReviewStatus(res.get("reviewStatus", "complete")),
            findings=res.get("findings", []),
            unsupported_files=res.get("unsupported_files", []),
            unresolved_cases=res.get("unresolved_cases", []),
            escalation_required=res.get("escalation_required", False),
            escalation_reason=EscalationReason(res["escalation_reason"]) if res.get("escalation_reason") else EscalationReason.NONE,
            confidence=res.get("confidence", 1.0),
            execution_time_ms=res.get("executionTimeMs", 0.0),
            is_clean=res.get("isClean", True),
            is_merge_blocking=res.get("isMergeBlocking", False),
            metadata={"file": file_input.path or "code.ts", "engine": "Little My"},
        )

    def review_pr(
        self,
        files: List[CodeInputFile],
        prd_text: Optional[str] = None,
        timeout_sec: float = 30.0,
    ) -> ReviewResult:
        """
        Reviews a pull request with multiple files under Little My.
        Preserves all detected findings while explicitly identifying unsupported files,
        parser failures, and unresolved constructs requiring Myco escalation.
        """
        start_time = time.time()
        findings: List[Any] = []
        unsupported_files: List[str] = []
        unresolved_cases: List[str] = []
        escalation_required = False
        escalation_reason: Optional[EscalationReason] = None
        analyzed_supported_files = 0

        if not files:
            return ReviewResult(
                status=ReviewStatus.COMPLETE,
                findings=[],
                unsupported_files=[],
                unresolved_cases=[],
                escalation_required=False,
                escalation_reason=EscalationReason.NONE,
                confidence=1.0,
                execution_time_ms=0.0,
                is_clean=True,
                is_merge_blocking=False,
                metadata={"totalFiles": 0, "engine": "Little My"},
            )

        for file_input in files:
            elapsed = time.time() - start_time
            if elapsed >= timeout_sec or timeout_sec <= 0:
                unresolved_cases.append(f"Little My review timeout exceeded after {elapsed:.2f}s (budget: {timeout_sec}s)")
                escalation_required = True
                escalation_reason = EscalationReason.STAGE_TIMEOUT
                break

            file_path = file_input.path or "code.ts"

            if not self.is_file_supported(file_path):
                if file_path not in unsupported_files:
                    unsupported_files.append(file_path)
                escalation_required = True
                if escalation_reason is None or escalation_reason == EscalationReason.NONE:
                    escalation_reason = EscalationReason.UNSUPPORTED_LANGUAGE
                continue

            try:
                res = self.process(primary_file=file_input, context_files=[], prd_text=prd_text)
                analyzed_supported_files += 1

                for f_item in res.get("findings", []):
                    f_id = f_item.get("id") if isinstance(f_item, dict) else getattr(f_item, "id", None)
                    existing_ids = [
                        (f.get("id") if isinstance(f, dict) else getattr(f, "id", None))
                        for f in findings
                    ]
                    if f_id not in existing_ids:
                        findings.append(f_item)

                if res.get("unsupported_files"):
                    for uf in res["unsupported_files"]:
                        if uf not in unsupported_files:
                            unsupported_files.append(uf)
                    escalation_required = True
                    if escalation_reason is None or escalation_reason == EscalationReason.NONE:
                        escalation_reason = EscalationReason.UNSUPPORTED_LANGUAGE

                if res.get("unresolved_cases"):
                    for uc in res["unresolved_cases"]:
                        if uc not in unresolved_cases:
                            unresolved_cases.append(uc)
                    escalation_required = True
                    if escalation_reason is None or escalation_reason == EscalationReason.NONE:
                        if res.get("escalation_reason"):
                            escalation_reason = EscalationReason(res["escalation_reason"])
                        else:
                            escalation_reason = EscalationReason.INCONCLUSIVE_ANALYSIS

            except SyntaxError as syn_err:
                unresolved_cases.append(f"Parser failure in '{file_path}': {str(syn_err)}")
                escalation_required = True
                if escalation_reason is None or escalation_reason == EscalationReason.NONE:
                    escalation_reason = EscalationReason.PARSER_FAILURE
            except Exception as err:
                unresolved_cases.append(f"Analysis error in '{file_path}': {str(err)}")
                escalation_required = True
                if escalation_reason is None or escalation_reason == EscalationReason.NONE:
                    escalation_reason = EscalationReason.ANALYSIS_ERROR

        total_time_ms = (time.time() - start_time) * 1000.0

        if escalation_required:
            if escalation_reason == EscalationReason.STAGE_TIMEOUT:
                status = ReviewStatus.PARTIAL if findings or analyzed_supported_files > 0 else ReviewStatus.FAILED
            elif escalation_reason == EscalationReason.ANALYSIS_ERROR and analyzed_supported_files == 0:
                status = ReviewStatus.FAILED
            elif analyzed_supported_files > 0:
                status = ReviewStatus.PARTIAL
            else:
                status = ReviewStatus.INCOMPLETE
            confidence = 0.5
        else:
            status = ReviewStatus.COMPLETE
            escalation_reason = EscalationReason.NONE
            confidence = 1.0

        is_clean = len(findings) == 0
        is_merge_blocking = any(
            (f.get("isMergeBlocking") if isinstance(f, dict) else getattr(f, "is_merge_blocking", False))
            for f in findings
        )

        return ReviewResult(
            status=status,
            findings=findings,
            unsupported_files=unsupported_files,
            unresolved_cases=unresolved_cases,
            escalation_required=escalation_required,
            escalation_reason=escalation_reason,
            confidence=confidence,
            execution_time_ms=total_time_ms,
            is_clean=is_clean,
            is_merge_blocking=is_merge_blocking,
            metadata={
                "totalFiles": len(files),
                "analyzedFiles": analyzed_supported_files,
                "unsupportedCount": len(unsupported_files),
                "unresolvedCount": len(unresolved_cases),
                "engine": "Little My",
            },
        )

    def _find_line_number(self, lines: List[str], target: str) -> int:
        for idx, line in enumerate(lines, start=1):
            if target in line:
                return idx
        return 1


internal_engine = InternalProcessingEngine()
