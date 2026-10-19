# Hybrid Code Review Pipeline: Little My Primary Review with Myco Fallback

## 1. Architectural Overview and Execution Flow

This document details the hybrid code review architecture that integrates **Little My** as the primary review engine and **Myco** as an automated secondary review fallback system.

The pipeline ensures:
1. **Little My reviews code first** on every pull request event (`opened`, `reopened`, `synchronize`).
2. **Little My handles all cases it can reliably detect and process**, including syntax validation, delimiter balancing, SQL injection boundaries, tenant isolation, hardcoded secret exposure, arithmetic boundaries, and unhandled asynchronous Promise boundaries.
3. **Escalation occurs only for uncertain, unsupported, or unclassified cases**, such as unsupported programming languages, parser failures, stage timeouts, and cross-repository dependencies.
4. **Clean scans are never escalated** simply because zero findings were detected; a fully completed clean scan is treated as complete and merge-ready.
5. **Myco receives pull requests conditionally** via GitHub Actions workflow orchestration, invoking the official Myco Action (`MycoIntelligence/myco-bundled-action@v1`).

```
+---------------------------------------------------------------------------------------------------+
|                                     Pull Request Event                                            |
|                               (opened, reopened, synchronize)                                     |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                               Job 1: little-my-review (Ubuntu Latest)                             |
|  - Ingests changed files and diff via pipeline.pr_reviewer                                        |
|  - Executes Little My AST & Static Policy Verification (internal_engine.review_pr)                |
|  - Evaluates Capability Registry (SUPPORTED_EXTENSIONS)                                           |
|  - Checks Idempotency Cache to prevent duplicate reviews on identical commit SHAs                 |
+---------------------------------------------------------------------------------------------------+
                                                  |
                        +-------------------------+-------------------------+
                        |                                                   |
            [Confidently Handled]                               [Escalation Required]
        (All files supported, complete)                     (Unsupported language, parser failure,
                        |                                    timeout, or inconclusive construct)
                        v                                                   |
+-----------------------------------------------+                           v
|      Little My Review Report Generated        |       +---------------------------------------+
|  - status: "complete"                         |       |  Little My Exports Step Outputs:      |
|  - escalation_required: "false"               |       |  - escalation_required = "true"       |
|  - escalation_reason: "NONE"                  |       |  - escalation_reason = "<REASON>"     |
|  - Little My findings posted to PR            |       |  - little_my_status = "partial/..."   |
+-----------------------------------------------+       |  - Little My findings preserved!      |
                        |                               +---------------------------------------+
                        |                                                   |
                        |                                                   v
                        |                       +---------------------------------------------------+
                        |                       |         Job 2: myco-review (Ubuntu Latest)        |
                        |                       |  Condition: needs.little-my-review.outputs.       |
                        |                       |             escalation_required == 'true'         |
                        |                       |                                                   |
                        |                       |  Step 1: Validate Secrets & Variables             |
                        |                       |          (MYCO_LLM_API_KEY, MYCO_CLIENT_ID, etc.) |
                        |                       |  Step 2: Invoke Myco Action                       |
                        |                       |          (MycoIntelligence/myco-bundled-action@v1)|
                        |                       |  Step 3: Fallback Failure Notice if Action fails   |
                        |                       +---------------------------------------------------+
                        v                                                   v
                Pipeline Complete                                   Pipeline Complete
           (No external API call needed)                      (Myco review appended to PR)
```

---

## 2. Distinction Between Clean Scans and Incomplete Scans

A core design principle of this pipeline is that **a successful scan with zero findings must never be conflated with an incomplete or unperformed review**:

| Review State | Little My Status | Escalation Required | Action Taken |
| :--- | :--- | :--- | :--- |
| **Clean Review** | `complete` | `false` | All files belong to supported languages, parsers parsed without error, and AST checks detected zero defects. Code is marked clean and merge-ready. **Myco is not invoked.** |
| **Handled Findings** | `complete` | `false` | Supported files analyzed; issues detected and reported with remediation steps. **Myco is not invoked.** |
| **Unsupported Language** | `incomplete` / `partial` | `true` | Changed files contain languages unsupported by Little My (e.g. Go, Rust, Java, C++). **Escalated to Myco.** |
| **Partial Review** | `partial` | `true` | Some files analyzed with Little My findings preserved, but other files or constructs were unresolvable. **Escalated to Myco with Little My findings intact.** |
| **Parser / Syntax Error** | `failed` / `incomplete` | `true` | Parser crashed or encountered unsupported grammar constructs. **Escalated to Myco.** |
| **Stage Timeout** | `failed` / `partial` | `true` | Little My execution exceeded the allotted stage timeout. **Escalated to Myco.** |

---

## 3. Explicit Escalation Conditions

Little My evaluates changed files against its capability registry (`InternalProcessingEngine.SUPPORTED_EXTENSIONS`):
- Supported extensions: `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.py`, `.sql`, `.json`, `.yaml`, `.yml`, `.env`, `.md`, `.markdown`, `.diff`, `.patch`.

Escalation is triggered if any of the following conditions occur:

1. **`UNSUPPORTED_LANGUAGE`**:
   Any changed file extension is outside Little My's supported extensions (e.g., `.go`, `.rs`, `.java`, `.cpp`, `.cs`, `.rb`, `.php`, `.swift`, `.kt`).
2. **`PARSER_FAILURE`**:
   The AST parser cannot parse the code structure, or encounters syntax that breaks grammar delimiters.
3. **`CAPABILITY_EXCEEDED`**:
   The code imports cross-repository internal packages (`@company/*`, `@enterprise/*`, `@internal/*`, `@myco-core/*`) or exceeds single-repository boundaries.
4. **`INCONCLUSIVE_ANALYSIS`**:
   The file contains dynamic reflection or is explicitly tagged with `@little-my: inconclusive` / `@review: inconclusive`.
5. **`STAGE_TIMEOUT`**:
   Little My execution exceeds the configured time budget (default: 30 seconds).
6. **`ANALYSIS_ERROR`**:
   An unexpected internal runtime exception occurs during analysis.

---

## 4. GitHub Actions Workflow and Conditional Orchestration

The integration is implemented in [.github/workflows/myco-review.yml](file:///Users/radhikatiwari/Desktop/myco1/myco-frontend/.github/workflows/myco-review.yml).

### Orchestration Mechanism

The baseline Myco workflow runs on `pull_request` events (`opened`, `reopened`, `synchronize`). Because the bundled action does not include internal fallback filtering, running it in isolation would invoke Myco on every PR.

To enforce the hybrid model, the workflow employs two dependent jobs:

1. **Job 1: `little-my-review`**:
   - Checks out the repository.
   - Runs `python3 -m pipeline.pr_reviewer`.
   - Exports step outputs: `escalation_required`, `escalation_reason`, `little_my_status`, `findings_count`, and `is_clean`.
2. **Job 2: `myco-review`**:
   - Declares `needs: little-my-review`.
   - Evaluates conditional guard:
     ```yaml
     if: always() && needs.little-my-review.outputs.escalation_required == 'true'
     ```
   - Executes only when Little My explicitly flags escalation.
   - Invokes the official action:
     ```yaml
     - uses: MycoIntelligence/myco-bundled-action@v1
       with:
         pr_link: ${{ github.event.pull_request.html_url }}
         api_key: ${{ secrets.MYCO_LLM_API_KEY }}
         metrics_endpoint: ${{ vars.MYCO_METRICS_ENDPOINT }}
         metrics_api_key: ${{ secrets.MYCO_METRICS_API_KEY }}
         client_id: ${{ vars.MYCO_CLIENT_ID }}
     ```

---

## 5. GitHub Repository Secrets and Variables Configuration

Configure the following parameters in your repository under:
**GitHub Repository -> Settings -> Secrets and variables -> Actions**

### Secrets (Encrypted)
- `MYCO_LLM_API_KEY`: The LLM provider API key required by the Myco Action.
- `MYCO_METRICS_API_KEY`: The metrics API key supplied by Myco.

### Variables (Repository Variables)
- `MYCO_METRICS_ENDPOINT`: The HTTPS endpoint provided by Myco for metrics ingestion.
- `MYCO_CLIENT_ID`: The unique client or organizational identifier assigned by Myco.

### Security Guarantees
- Secrets are never printed in console output, pull request comments, logs, or error diagnostics.
- The workflow validates that all four items are configured prior to executing the external action. If any are missing, non-sensitive diagnostic messages are emitted.

---

## 6. Private Action Collaborator Access Requirement

Because `MycoIntelligence/myco-bundled-action@v1` resides in a private repository:
1. The repository administrator must accept the Myco collaborator invitation sent to the organization or repository owner.
2. Under **Organization Settings -> Actions -> General -> Access**, ensure that workflows have access to private actions shared within the organization.
3. If GitHub Actions reports `Action not found` or `Resource not accessible`, verify that the GitHub token permissions include `actions: read` and that the collaborator invitation has been formally accepted.
4. If collaborator access cannot be resolved, Little My's findings remain fully preserved and available.

---

## 7. Reliability, Retries, and Duplicate Prevention

- **Commit SHA Idempotency**: [pipeline/pr_reviewer.py](file:///Users/radhikatiwari/Desktop/myco1/myco-frontend/pipeline/pr_reviewer.py) computes and caches review results keyed by commit SHA in `.pr_review_cache.json`. Repeated `synchronize` events on identical commit trees return the cached decision, preventing duplicate comment generation and redundant API usage.
- **Bounded Retries**: [pipeline/myco_client.py](file:///Users/radhikatiwari/Desktop/myco1/myco-frontend/pipeline/myco_client.py) implements exponential backoff retries (default: 3 attempts) for transient 429 and 5xx network errors.
- **Partial Review Preservation**: When escalating a partial review, Little My's findings are retained in the PR review report, so maintainers do not lose local findings if Myco experiences transient downtime.
- **Untrusted Code Isolation**: Pull request code strings are sanitized to eliminate null bytes and control characters via [pipeline/security.py](file:///Users/radhikatiwari/Desktop/myco1/myco-frontend/pipeline/security.py). No pull request code is ever executed or evaluated dynamically.

---

## 8. How to Enable, Test, and Disable the Integration

### To Enable
1. Configure the 2 secrets and 2 variables listed in Section 5.
2. Accept the private action collaborator invitation.
3. Commit and push [.github/workflows/myco-review.yml](file:///Users/radhikatiwari/Desktop/myco1/myco-frontend/.github/workflows/myco-review.yml) to the default branch.

### To Test
Run the comprehensive automated test suite locally:
```bash
python3 -m unittest test_hybrid_pipeline.py
```
To run the full suite including demo pipeline tests:
```bash
python3 -m unittest discover -s . -p "test_*.py"
```

### To Disable Without Breaking Little My
If Myco needs to be temporarily paused or decommissioned:
1. In [.github/workflows/myco-review.yml](file:///Users/radhikatiwari/Desktop/myco1/myco-frontend/.github/workflows/myco-review.yml), set the `myco-review` job condition to `if: false`.
2. Little My will continue to review every pull request and generate complete reports as the primary system without interruption.
