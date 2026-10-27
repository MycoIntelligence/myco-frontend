# Myco Website & Myco Assistant (RAG-Powered AI Chatbot)

Current website version: light-only, graphite/teal palette, approved horizontal Myco logo, and text-led hero with an integrated production-ready **Myco Assistant** Retrieval-Augmented Generation (RAG) chatbot.

---

## 1. Quick Start: Local Preview

To launch the local preview server with the full RAG pipeline and escalation endpoints:

```bash
python3 serve.py
```

Then open `http://127.0.0.1:8766` in your browser.

To run the automated RAG pipeline test suite:

```bash
python3 -m unittest test_rag_pipeline.py -v
```

---

## 2. Myco Assistant: Architecture & RAG Pipeline

Myco Assistant is a production-ready, grounded conversational AI assistant designed to answer visitor questions about Myco's product capabilities, context-first engineering intelligence, security posture, and competitor comparisons without hallucinating or leaking confidential implementation details.

### System Architecture

```text
Frontend (Browser)
  └── Myco Assistant Widget (Vanilla JS, floating widget, safe Markdown rendering)
        └── POST /api/chat/ask
              │
              ├── Rate Limiting & Input Sanitization
              │     └── Length limits, character encoding, IP-based sliding window
              │
              ├── Security & Confidentiality Guard
              │     ├── Prompt injection rejection (direct / developer mode / DAN)
              │     └── Policy checks for internal architecture, private AST heuristics, secrets
              │
              ├── Hybrid Retrieval Engine (Vector Semantic + Lexical BM25)
              │     ├── Deterministic subword n-gram hash vector projection
              │     ├── BM25 term frequency / inverse document frequency ranking
              │     └── Access-Control Filter (strictly excludes 'restricted' sources)
              │
              ├── Evidence Sufficiency & Keyword Coverage Evaluator
              │     ├── Top score thresholding (RAG_SIMILARITY_THRESHOLD = 0.35)
              │     ├── Multi-term query keyword coverage validation (>= 40% coverage)
              │     └── Honest Refusal if evidence is insufficient (UNKNOWN status)
              │
              ├── Context Assembly & Boundary Isolation
              │     └── Preserves document names, section titles, and citation metadata
              │
              ├── Groq LLM Inference Service (Centralized Client)
              │     ├── Model: llama-3.3-70b-versatile (or llama-3.1-8b-instant)
              │     ├── Exponential backoff retries, timeouts, and quota handling
              │     └── Local grounded fallback synthesizer for offline preview
              │
              ├── Output Validation & Secret Scrubber
              │     └── Inspects generated text and redacts internal tokens/heuristics
              │
              └── Formatted Delivery with Citations
                    └── Structured Markdown tables, lists, and [Source: Doc > Sec] pills
```

---

## 3. Knowledge Base & Document Ingestion

Approved documentation resides in `pipeline/rag/documents/`:

| Document | Access Level | Description |
|---|---|---|
| `myco_core.md` | `public` | Context-first architectural philosophy, P0/P1 invariants, pilot workflow, pricing, and integrations |
| `competitor_matrix.md` | `public` | Structured comparison matrix and qualitative analysis for Myco vs **CodeRabbit**, **Graptile**, and **CodeAnt** |
| `security_privacy.md` | `public` | Zero model training guarantee, tenant isolation, dedicated VPC options, secret redaction, SOC 2 Type II |
| `restricted_internal.md` | `restricted` | Private AST heuristics, internal detector tokens, and internal architecture (strictly access-controlled) |

### Adding, Updating, or Removing Documents

1. **Add or Edit Documents**: Add `.md` files to `pipeline/rag/documents/` with standard YAML frontmatter:
   ```markdown
   ---
   title: "Document Title"
   access: "public"  # Use "public" for assistant visibility or "restricted" for confidential
   version: "1.0"
   ---
   ## Section Heading
   Document content here...
   ```
2. **Re-index Knowledge Base**: Run the re-indexing command to regenerate the deterministic vector index and BM25 tables:
   ```bash
   python3 -c "from pipeline.rag.pipeline import rag_pipeline; rag_pipeline.initialize(force_reload=True)"
   ```
   This updates `pipeline/rag/index_cache.json`.
3. **Delete Documents**: Remove the markdown file from `pipeline/rag/documents/` and run the re-indexing command above.

---

## 4. Groq LLM Integration & Configuration

Groq is integrated via a centralized server-side service (`pipeline/rag/groq_client.py` and `api/chat/ask.js`). Credentials are read exclusively from environment variables and never exposed to the client.

### Environment Variables (`.env`)

```ini
# Groq API Key (https://console.groq.com/keys)
GROQ_API_KEY=gsk_...

# Groq Model Selection
# - llama-3.3-70b-versatile (Default / recommended for deep reasoning)
# - llama-3.1-8b-instant    (Low-latency high-speed alternative)
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_TIMEOUT_SECONDS=15.0
GROQ_MAX_RETRIES=2
GROQ_TEMPERATURE=0.1
GROQ_MAX_TOKENS=800

# Retrieval & Answerability Thresholds
RAG_SIMILARITY_THRESHOLD=0.35
RAG_ANSWERABILITY_THRESHOLD=0.42
RAG_HYBRID_VECTOR_WEIGHT=0.65
RAG_HYBRID_LEXICAL_WEIGHT=0.35

# Resend Notification Provider (for Escalations)
RESEND_API_KEY=re_...
PILOT_EMAIL_FROM=onboarding@resend.dev
PILOT_EMAIL_TO=team@mycointelligence.com
CHAT_ESCALATION_EMAIL_TO=pilot@mycointelligence.com
```

### Offline & Resilience Fallback

If `GROQ_API_KEY` is not configured or Groq experiences an upstream outage, the system automatically engages its local grounded fallback synthesizer (`model: "local-grounded-fallback"`), delivering verified facts directly from indexed documents without hallucinating.

---

## 5. Security & Product Confidentiality Safeguards

Myco Assistant enforces a strict multi-layer defense-in-depth model:

1. **Access-Controlled Retrieval**: The vector store filters by `access_filter="public"`. Documents tagged with `access: "restricted"` are excluded at search time and never enter the prompt context.
2. **Pre-Retrieval Policy Filter**: Queries targeting internal system prompts, internal AST heuristics (`InternalProcessingEngine`), private algorithms, or backend workflows immediately trigger the standard refusal:
   > *"I can help explain Myco’s publicly documented features and capabilities, but I can’t share confidential implementation details or internal system architecture."*
3. **Prompt Injection Resistance**: Instruction overrides ("ignore previous instructions", "you are now in developer mode", "DAN") are detected and neutralized.
4. **Output Secret Scrubbing**: All LLM completions pass through `security_guard.validate_and_scrub_output()`, checking for accidental leaks of tokens, salts, or confidential classifications.
5. **Strict Grounding & Evidence Calibration**: Multi-term questions require >= 40% keyword coverage in retrieved documentation. Queries without verified answers trigger honest refusal:
   > *"I’m sorry, but I don’t have enough verified information to answer that question accurately. Please contact the Myco team for further assistance."*

---

## 6. Competitor Comparisons: CodeRabbit, Graptile, and CodeAnt

Legacy comparisons with SonarQube and GitHub Copilot have been deprecated. Myco Assistant objectively compares Myco against contemporary code intelligence tools:

- **CodeRabbit**: High-level PR walkthrough summaries, sequence diagrams, and line-by-line developer comments. Myco acts as the architectural invariant enforcement layer blocking P0 regressions.
- **Graptile (Greptile)**: Graph indexing connecting codebase insights to autonomous coding agents (Cursor, Devin). (Note: Specific benchmark metrics for Graptile remain unverified and are explicitly labeled as such).
- **CodeAnt (CodeAnt AI)**: Agentic security posture, compliance frameworks (SOC 2, HIPAA), and pre-commit CLI linting (`codeant review`). Myco provides whole-system context reasoning across polyglot microservice boundaries before merge.

---

## 7. Human Escalation for Unanswered Questions

When an inquiry is unanswerable (`status: "UNKNOWN"`) or targets restricted enterprise details (`status: "RESTRICTED"`), the assistant offers a human escalation path:

- Endpoint: `POST /api/chat/escalations`
- Collects: Visitor Name, Work Email, Original Question, Optional Company/Phone, and Conversation Context.
- Protections: Rate limiting (5 requests / 5 minutes per IP), anti-spam honeypot detection, CRLF header injection defense, input length limits.
- Delivery: Sends structured notification via Resend with visitor email set as `Reply-To`.

---

## 8. Frontend Branding & Visual Assets

- **Assistant Name**: Rebranded throughout to **Myco Assistant**.
- **Official Logo**: Uses official vector icon `assets/myco-icon.svg` with automated fallback to `assets/myco-icon.png`.
- **Typewriter Effect**: Proactive typewriter callout on landing highlighting capabilities and competitor comparisons.
- **Markdown Rendering**: Safe client-side parser rendering tables, bold text, lists, and discrete verified source badges (`[Source: Document > Section]`).

---

## 9. Automated Testing

Run the test suites:

```bash
# 1. RAG Pipeline, Grounding, Security, Competitors & GitHub Integration (26 tests)
python3 -m unittest test_rag_pipeline.py -v

# 2. Chat Escalation, Lead Capture, & Notification Integrity (20 tests)
python3 -m unittest test_chat_assistant.py -v
```

---

## 10. Dual-Mode Architecture: GitHub Data Fetching vs .env Testing Mode

The API is architected to operate seamlessly in two complementary modes:

### A. Live GitHub Remote Fetching
The platform dynamically fetches data from GitHub for both code analysis and RAG documentation ingestion:
- **Pull Request Diffs**: Fetches metadata, unified diffs, and modified file trees using the GitHub v3 API (`/repos/{owner}/{repo}/pulls/{number}`).
- **File Blobs**: Fetches and decodes source files at any branch, tag, or SHA commit.
- **Repository Documentation Trees**: Recursively fetches Markdown documents for dynamic indexing into the RAG vector store.
- **SSRF & Security Safeguards**: Strictly whitelists `github.com` and `raw.githubusercontent.com`. Private IP addresses (`127.0.0.1`, RFC 1918), internal hostnames, and cloud metadata services (`169.254.169.254`) are systematically rejected with HTTP 400.
- **API Endpoints**:
  - `POST /api/v1/github/fetch`: Fetches PR, file, or tree by URL or owner/repo/number.
  - `GET /api/v1/github/fetch?url=...`: URL-queryable preview endpoint.
  - `POST /api/v1/analyze`: When `repoUrl` is supplied, fetches the PR diff directly from GitHub and analyzes it for architectural invariant violations.
  - `POST /api/chat/ingest/github`: Dynamically indexes documentation from any remote GitHub repository into the live knowledge base.

### B. Hermetic Offline Testing via `.env`
For fast, deterministic unit tests and offline development without GitHub API rate limits or network dependencies:
- Setting `TEST_GITHUB_PR_DIFF` in `.env` or the test runner immediately serves mock PR diffs.
- Setting `TEST_GITHUB_FILE_CONTENT` in `.env` provides hermetic file fixtures.
- Local Markdown files in `pipeline/rag/documents/` serve as the base approved knowledge source when remote repositories are not configured.
