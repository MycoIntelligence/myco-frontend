# Public Product Demo with Custom Code Analysis and Future Myco Integration

## Executive Summary

This architecture enables prospective users, evaluating developers, and engineering leaders to experience Myco's code analysis capabilities on their own custom code snippets and Pull Request diffs in a controlled public demo.

The system is designed with a **finite, measurable, and protected public demo model** rather than a complex multi-tier subscription system. Users can evaluate real results with zero friction, while server-side safeguards, idempotency deduplication, and resource controls prevent unlimited resource consumption. Requests requiring full-repository indexing or cross-repo dependency resolution are cleanly identified as candidates for the future **Myco backend** without fabricated responses.

---

## 1. Public Demo Experience

### User Interaction Model
1. **Frictionless Entry**: Visitors access the public interactive workspace without mandatory account creation or credit card entry.
2. **Custom Input Editor**: Users can:
   - Type or paste arbitrary custom source code (TypeScript, JavaScript, Python, JSON, YAML, etc.).
   - Submit a Pull Request diff with standard unified diff headers (`diff --git`, `@@ -a,b +c,d @@`).
   - Provide an optional specification or policy context (PRD or security policy).
3. **Execution**: Clicking "Run Myco" initiates a transparent 5-stage pipeline (`Ingest`, `Build Context`, `Reason`, `Validate`, `Score & Surface`).
4. **Actionable Results**: The system displays real findings, file line locations, impacted systems, policy traceability, and suggested remediation patches.
5. **Session Identity**: A lightweight client session identifier (`X-Demo-Session-ID`) is generated and preserved in browser `localStorage`. When limits are approached or abuse is detected, the UI prompts for lightweight email verification to protect service availability.

---

## 2. Request Processing and Routing Architecture

```
                                  PUBLIC DEMO INGRESS
                                (POST /api/v1/demo/analyze)
                                             |
                                             v
                      +----------------------------------------------+
                      |          STEP 1: VALIDATE REQUEST            |
                      | - Check Content-Length (<= 256 KB)           |
                      | - Enforce max chars (<= 25,000)              |
                      | - Enforce diff lines (<= 400 lines)          |
                      | - Enforce file count (<= 5 files)            |
                      | - Strip null bytes and control characters    |
                      +----------------------------------------------+
                                             |
                                             v
                      +----------------------------------------------+
                      |         DEMO QUOTA & DEDUPLICATION           |
                      | - Check Idempotency Cache (Content SHA-256)  |
                      |   -> If identical: return cached result free |
                      | - Check Concurrency (<= 1 active per session)|
                      | - Check Anti-Spam Rate Limit (<= 5 RPM)      |
                      | - Check Demo Allowance (<= 5 runs / 24h)     |
                      +----------------------------------------------+
                                             |
                                             v
                      +----------------------------------------------+
                      |      STEP 2: DETERMINE PROCESSING PATH       |
                      |            (Request Classifier)              |
                      +----------------------------------------------+
                                      /              \
                                     /                \
        +-----------------------------------+   +-----------------------------------+
        |     STEP 3: PROCESS INTERNALLY    |   |     STEP 4: FUTURE MYCO ROUTING   |
        | (Single-file & local diff AST)    |   | (Multi-repo & whole-repo graphs)  |
        | - Execute deterministic detectors |   | - Provider abstraction interface  |
        | - SEC-04 (Credential Exposure)    |   | - Fallback policy (candidate_200) |
        | - SEC-02 (DOM/XSS Injection)      |   | - Circuit breaker protection      |
        | - TENANT-02 (SQL Injection)       |   | - Zero fake external responses    |
        | - AGENT-12 (Async Boundary)       |   | - Prompt for Pilot Request        |
        | - PRD-402 (Policy Alignment)      |   |                                   |
        +-----------------------------------+   +-----------------------------------+
                                     \                /
                                      \              /
                      +----------------------------------------------+
                      |           FAIR USAGE RECONCILIATION          |
                      | - Success: Deduct 1 run & cache result       |
                      | - Failure / Error: 100% refund of allowance  |
                      | - Release active concurrency lock            |
                      +----------------------------------------------+
                                             |
                                             v
                      +----------------------------------------------+
                      |          RESPONSE NORMALIZATION & LOGS       |
                      | - Canonical JSON schema                      |
                      | - Mask credentials (sk_live_, AKIA, ghp_)    |
                      | - Record demo analytics & latency metrics    |
                      +----------------------------------------------+
```

### Detailed Pipeline Steps

#### Step 1: Validate the Request
- **Payload Limits**: Max body size of 256 KB. Payloads exceeding this ceiling are rejected immediately with HTTP 413.
- **Input Ceilings**: Max 25,000 characters, max 6,500 estimated tokens, max 5 files, and max 400 diff lines.
- **Format Integrity**: Validates UTF-8 encoding and strips null bytes (`\x00`). Non-code binaries and empty submissions are rejected with HTTP 400.

#### Step 2: Determine the Processing Path
The Request Classifier analyzes the structural and semantic needs of the submission:
- **`INTERNAL`**: Single files (TypeScript, JavaScript, Python, JSON, YAML) or local Git diffs that can be parsed and verified via our internal AST analysis engine.
- **`EXTERNAL_MYCO`**: Requests requiring capabilities not supported in single-file AST parsing:
  - Multi-repository dependency graphs.
  - Remote repository indexing via URL.
  - Whole-project inter-procedural symbolic taint analysis.
  - Projects with > 10 files or > 5,000 diff lines.
- **`REJECTED`**: Malformed payloads, compiled binaries, or remote URLs pointing to private IP addresses (SSRF violations).

#### Step 3: Process Internally
Supported requests are processed via `InternalProcessingEngine`. The engine:
- Evaluates code without executing untrusted strings.
- Executes pattern and AST detectors for credentials (SEC-04), DOM/XSS vulnerabilities (SEC-02), multi-tenant SQL injection (TENANT-02), unhandled async boundaries (AGENT-12), and specification mismatches (PRD-402).
- Returns structured findings with line numbers, code snippets, impact assessments, and remediation suggestions.
- Enforces an execution timeout deadline of 10.0 seconds.

#### Step 4: Prepare for Future Myco Integration
The `FutureMycoAdapter` implements the `BackendProvider` abstraction:
- When a candidate request requires Myco capabilities, the adapter checks if the integration is enabled via configuration.
- **Current Behavior (Unconnected)**: Returns a clear, transparent status (`status: "requires_myco_backend"`) with HTTP 200 or 202, stating:
  > *"This workload requires full-repository AST indexing and cross-repository symbol resolution, which is handled by our future Myco backend. In this public demo, only single-file and isolated diff analyses run internally. To connect your organization's repository, request a pilot with our engineering team."*
- **Circuit Breaker**: An automated circuit breaker (Closed, Open, Half-Open) isolates downstream failures.
- **No Fake Calls**: The system never simulates fake network calls or invents undocumented endpoints.

---

## 3. Demo Usage Limits and Fair Usage Policy

### A. Initial Demo Allowance
- **Runs per Session**: **5 completed analyses** per rolling 24-hour window per session/IP.
- **Max Characters**: 25,000 characters per request (~6,500 tokens).
- **Max PR Diff Size**: 400 diff lines.
- **Max Files**: Up to 5 files per request.
- **Anti-Spam Rate Limit**: 5 requests per minute (RPM).
- **Max Concurrency**: 1 active analysis per session.
- **Deadline**: 10.0 seconds execution deadline per request.

### B. Fair Usage Enforcement

1. **Server-Side Enforcement**: All limits, token checks, and concurrency locks are enforced by `DemoQuotaService` on the server before CPU-intensive parsing begins.
2. **Idempotency & Deduplication**:
   - The server computes `SHA-256(code + diff + context)`.
   - If a user submits identical code again or refreshes the browser, the cached result is returned instantly without deducting from their remaining demo allowance.
3. **Fair Usage Refund on Failure**:
   - If a request fails due to syntax errors, SSRF rejections, infrastructure timeouts, or service exceptions, **no demo run is charged**. The user's allowance is preserved in full.
4. **Anti-Abuse Fingerprinting**:
   - Primary tracking is keyed to `session_id` (from `X-Demo-Session-ID`).
   - Anonymous access falls back to a hashed IP fingerprint.
   - Prevents shared-IP false positives while reducing easy refresh-clearing bypasses.

### C. When Demo Allowance Is Exhausted
When a user completes their 5th distinct analysis:
1. The server returns HTTP `429 Too Many Requests` with a clear explanation:
   ```json
   {
     "statusCode": 429,
     "success": false,
     "routeExecuted": "REJECTED",
     "message": "Demo allowance used: You have completed all 5 free demo analyses for this session. Your allowance will reset in approximately 23 hour(s) (2026-10-17T12:00:00Z). To analyze full repositories without demo limits, please request a pilot.",
     "summary": {
       "quotaExceeded": true,
       "errorCode": "DEMO_ALLOWANCE_EXHAUSTED",
       "resetAt": "2026-10-17T12:00:00Z",
       "nextAction": "request_pilot"
     }
   }
   ```
2. The UI preserves their previous analysis results in the report panel.
3. The UI displays an explicit reset countdown and provides a direct call-to-action to **Request a Pilot** (opening the pilot request form).
4. No complex paid subscription or credit card forms are displayed.

---

## 4. Protection Against Excessive Resource Consumption

| Resource Vector | Technical Ceiling | Enforcement Mechanism |
| :--- | :--- | :--- |
| **Request Payload** | 256 KB | Content-Length checked before body stream consumption |
| **Character Length** | 25,000 characters | String length measured prior to tokenizer allocation |
| **Code Tokens** | 6,500 tokens | Upfront token projection heuristic: $\frac{\text{chars}}{3.8} + (\text{symbols} \times 0.15)$ |
| **PR Diff Size** | 400 lines | Verified by counting `+`, `-`, and `@@` line headers |
| **File Count** | 5 files | Array length validation |
| **Concurrency** | 1 per session | Atomic in-memory lock released on response completion |
| **Spam Bursting** | 5 requests / min | Sliding-window timestamp queue per session |
| **Execution Timeout**| 10.0 seconds | Per-request deadline timer terminates hung AST operations |
| **Circuit Breaker** | 5 failures / 30s | Fast-fails downstream requests when external services degrade |

---

## 5. Abuse Prevention and Security Strategy

1. **Untrusted Code Isolation**:
   - User submissions are treated as untrusted data structures (token streams and AST node trees).
   - Code is **never executed** with `eval()`, `exec()`, or subshell processes.
2. **Server-Side SSRF Protection**:
   - All repository and webhook URLs are strictly restricted to `https://`.
   - Hostnames are resolved via DNS and checked against prohibited subnets:
     - Loopback (`127.0.0.0/8`, `::1/128`).
     - Private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
     - Cloud metadata services (`169.254.169.254`, `metadata.google.internal`).
3. **Sensitive Credential Redaction**:
   - Before any code snippet, evidence finding, or error trace is emitted or logged, it passes through `SecurityManager.redact_secrets()`.
   - Patterns for Stripe Live Keys (`sk_live_...`), AWS Access Keys (`AKIA...`), GitHub Personal Access Tokens (`ghp_...`), private keys, and JWTs are replaced with `***[REDACTED]***`.
   - Raw source code is never stored in persistent log files.

---

## 6. Observability and Demo Analytics

The in-memory telemetry system aggregates operational metrics without storing users' source code:

- `requests_total`: Total inbound demo analysis attempts.
- `requests_internal`: Volume of requests processed by the internal AST engine.
- `requests_external_myco`: Requests identified as candidates for future Myco backend.
- `requests_rejected`: Invalid format, payload size, or SSRF violations.
- `quota_exceeded_total`: Sessions that exhausted their 5-run demo allowance.
- `rate_limited_total`: Requests blocked by the 5 RPM anti-spam filter.
- `circuit_breaker_trips`: Circuit breaker transitions to `OPEN`.
- `latencyMs`: Sliding-window latency averages for internal AST execution and external routing.

Telemetry is available via `GET /api/v1/metrics` and `GET /api/v1/demo/allowance`.

---

## 7. Architecture Components

1. **Public Demo UI (`playground.js`)**:
   - Interactive code editor supporting custom snippets and PR diffs.
   - Dynamic 5-step animation (`Ingest` -> `Build Context` -> `Reason` -> `Validate` -> `Score & Surface`).
   - Real-time demo allowance indicator (`Demo: 4 / 5 runs remaining`).
   - Direct integration with pilot request modal upon allowance exhaustion.
2. **API Gateway (`pipeline/gateway.py`)**:
   - Ingests HTTP requests, resolves `X-Demo-Session-ID`, and validates JSON schemas.
3. **Demo Quota Service (`pipeline/quota.py`)**:
   - Enforces the 5-run allowance, sliding-window rate limit, concurrency lock, and idempotency deduplication cache.
4. **Request Classifier (`pipeline/classifier.py`)**:
   - Performs syntactic inspection to route inputs between internal engine and future backend.
5. **Internal Processing Engine (`pipeline/internal_engine.py`)**:
   - Executes AST rules and policy invariants deterministically.
6. **Future Myco Adapter (`pipeline/backend_adapter.py`)**:
   - Provider interface, request/response contracts, and circuit breaker.
7. **Response Normalizer (`pipeline/normalizer.py`)**:
   - Produces uniform JSON responses and redacts sensitive credentials.
8. **Structured Logger & Metrics (`pipeline/observability.py`)**:
   - Emits structured JSON audit entries and aggregates telemetry.

---

## 8. Implementation Phases

| Phase | Scope & Deliverables | Status |
| :--- | :--- | :--- |
| **Phase 1: Build the Demo** | - Custom code and diff submission editor.<br>- Server-side validation and size limits.<br>- Internal AST processing for supported inputs.<br>- Configurable 5-run demo allowance and idempotency deduplication.<br>- Automated test suite covering 13 acceptance cases. | **Completed** |
| **Phase 2: Prepare for Myco** | - Provider interface abstraction (`BackendProvider`).<br>- Standardized `BackendRoutingRequest` and `BackendRoutingResponse` contracts.<br>- Circuit breaker implementation.<br>- Transparent fallback policy (`candidate_notice_200`) without fake API calls. | **Completed** |
| **Phase 3: Measure and Tune** | - Monitor demo completion rates, token consumption, and latencies.<br>- Adjust demo limits based on operational cost data.<br>- Refine anti-abuse heuristics. | **Active / Production-Ready** |
| **Phase 4: Connect Myco Later** | - Receive official Myco backend API specification.<br>- Implement HTTPS transport client with mTLS/API key.<br>- Enable via `MYCO_BACKEND_ENABLED=true`.<br>- Run end-to-end integration tests. | **Awaiting External API** |

---

## 9. Acceptance Criteria Verification

- [x] **Custom Code & Diff Analysis**: Public users can paste custom code or diffs and receive real, meaningful results when supported internally.
- [x] **Future Myco Candidate Identification**: Requests requiring whole-repo indexing or cross-repo graphs are cleanly identified as candidates for future Myco routing.
- [x] **Zero Fake Responses**: The absence of Myco produces a clear explanation and pilot request prompt, never simulated fake findings.
- [x] **Server-Side Demo Quota**: Enforces a 5-run allowance, 25k character limit, 400 diff lines, and 5 RPM rate limit on the server.
- [x] **Idempotency Deduplication**: Resubmitting identical code is served from cache without burning the user's demo allowance.
- [x] **Fair Usage Refund**: Failed or invalid submissions are never charged against the demo allowance.
- [x] **Clear Exhaustion Explanations**: When allowance is reached, the user receives an explicit reset time and a direct call to request a pilot.
- [x] **Security & Secret Redaction**: SSRF attacks on repo URLs are blocked; secrets (`sk_live_...`) are masked in all output snippets.
- [x] **No Unnecessary Subscriptions**: Avoids complex Free/Pro/Enterprise billing, focusing purely on a controlled public demo.
- [x] **Automated Tests**: 13/13 tests pass in `test_pipeline.py` and 12/12 tests pass in `test_intelligence_core.py`.
