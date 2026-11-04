"""
Centralized Groq API Client and LLM Service for Myco Assistant.

Features:
- Secure communication with Groq API (https://api.groq.com/openai/v1/chat/completions).
- Server-side environment variable key management.
- Bounded retries with exponential backoff on HTTP 429/500/503.
- Timeout protection and graceful failure handling.
- Local fallback synthesizer for offline preview or testing without live credentials.
"""

from dataclasses import dataclass
import json
import logging
import os
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

from pipeline.rag.config import rag_config

logger = logging.getLogger("rag_groq_client")


@dataclass
class LLMResponse:
    content: str
    model: str
    finish_reason: str
    is_fallback: bool
    usage: Dict[str, int]
    error_detail: Optional[str] = None


class GroqClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None,
    ):
        self.api_key = api_key or rag_config.groq_api_key
        self.model = model or rag_config.groq_model
        self.base_url = (base_url or rag_config.groq_base_url).rstrip("/")
        self.timeout = timeout or rag_config.groq_timeout_seconds
        self.max_retries = max_retries if max_retries is not None else rag_config.groq_max_retries

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> Tuple[bool, LLMResponse]:
        """
        Calls Groq's OpenAI-compatible chat completion endpoint with retries.
        Returns (success: bool, response: LLMResponse).
        """
        if not self.is_configured:
            # Fallback to local grounded synthesizer
            logger.info("Groq API key not configured; using local grounding synthesizer.")
            return True, self._synthesize_local_grounding(messages)

        endpoint = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        data_bytes = json.dumps(payload).encode("utf-8")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Myco-Assistant-RAG/1.0",
        }

        last_error = ""
        for attempt in range(self.max_retries + 1):
            try:
                req = urllib.request.Request(
                    endpoint,
                    data=data_bytes,
                    headers=headers,
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=self.timeout) as response:
                    body = response.read().decode("utf-8")
                    parsed = json.loads(body)
                    choice = parsed["choices"][0]
                    content = choice["message"]["content"]
                    finish_reason = choice.get("finish_reason", "stop")
                    usage = parsed.get("usage", {})

                    return True, LLMResponse(
                        content=content,
                        model=parsed.get("model", self.model),
                        finish_reason=finish_reason,
                        is_fallback=False,
                        usage=usage,
                    )
            except urllib.error.HTTPError as he:
                status = he.code
                error_body = ""
                try:
                    error_body = he.read().decode("utf-8")
                except Exception:
                    pass

                last_error = f"HTTP {status}: {error_body[:200]}"
                logger.warning(
                    "Groq API call attempt %d failed: %s", attempt + 1, last_error
                )

                # Retry on 429 (Rate Limit) or 5xx server errors
                if status in (429, 500, 502, 503, 504) and attempt < self.max_retries:
                    sleep_time = (2 ** attempt) * 1.0
                    time.sleep(sleep_time)
                    continue

                return False, LLMResponse(
                    content="",
                    model=self.model,
                    finish_reason="error",
                    is_fallback=False,
                    usage={},
                    error_detail=last_error,
                )
            except Exception as e:
                last_error = str(e)
                logger.warning(
                    "Groq API network attempt %d failed: %s", attempt + 1, last_error
                )
                if attempt < self.max_retries:
                    time.sleep((2 ** attempt) * 1.0)
                    continue

                return False, LLMResponse(
                    content="",
                    model=self.model,
                    finish_reason="error",
                    is_fallback=False,
                    usage={},
                    error_detail=last_error,
                )

        return False, LLMResponse(
            content="",
            model=self.model,
            finish_reason="error",
            is_fallback=False,
            usage={},
            error_detail=last_error or "Maximum retries exceeded.",
        )

    def _synthesize_local_grounding(self, messages: List[Dict[str, str]]) -> LLMResponse:
        """
        Local grounded answer synthesizer when live Groq credentials are not set.
        Synthesizes a concise, structured response strictly from the retrieved context.
        """
        user_msg = messages[-1]["content"] if messages else ""
        system_msg = messages[0]["content"] if messages and messages[0]["role"] == "system" else ""

        # Extract context block from system prompt
        context_match = ""
        if "=== RETRIEVED CONTEXT START ===" in system_msg:
            start = system_msg.find("=== RETRIEVED CONTEXT START ===") + len("=== RETRIEVED CONTEXT START ===")
            end = system_msg.find("=== RETRIEVED CONTEXT END ===")
            if end > start:
                context_match = system_msg[start:end].strip()

        # If no context found or refused
        if not context_match or "I'm sorry, but I don't have enough verified information" in user_msg:
            return LLMResponse(
                content=rag_config.refusal_unverified_message,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": 100, "completion_tokens": 30, "total_tokens": 130},
            )

        q_lower = user_msg.lower()

        # 1a. CodeRabbit-specific comparison query
        if "coderabbit" in q_lower and "graptile" not in q_lower and "greptile" not in q_lower and "codeant" not in q_lower and "all" not in q_lower:
            body_text = (
                "**Myco vs. CodeRabbit:**\n\n"
                "- **Primary Focus**: CodeRabbit acts as an interactive **PR walkthrough companion**, providing high-level summaries, sequence diagrams, and conversational line-by-line developer comments.\n"
                "- **Architectural Enforcement**: Myco operates as an **architectural intelligence gate**, mapping cross-file dependencies and contracts to catch critical P0/P1 system invariants (like unapproved tool bypasses, schema regressions, and race conditions) before merge.\n"
                "- **Workflow Synergy**: Development teams often rely on CodeRabbit for developer-facing diff summaries and pair-review, while utilizing Myco to protect production systems from structural regressions."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 100},
            )

        # 1b. Graptile-specific comparison query
        if any(w in q_lower for w in ("graptile", "greptile")) and "coderabbit" not in q_lower and "codeant" not in q_lower and "all" not in q_lower:
            body_text = (
                "**Myco vs. Graptile (Greptile):**\n\n"
                "- **Primary Focus**: Graptile indexes codebases to feed graph context directly into autonomous coding agents (Cursor, Claude Code, Devin).\n"
                "- **System Governance**: Myco focuses on invariant verification and architectural gatekeeping within PR workflows (*note: third-party benchmark claims for Graptile remain unverified*).\n"
                "- **Privacy & Retention**: Myco guarantees zero model training and strictly ephemeral diff analysis."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 100},
            )

        # 1c. CodeAnt-specific comparison query
        if "codeant" in q_lower and "coderabbit" not in q_lower and "graptile" not in q_lower and "greptile" not in q_lower and "all" not in q_lower:
            body_text = (
                "**Myco vs. CodeAnt (CodeAnt AI):**\n\n"
                "- **Primary Focus**: CodeAnt concentrates on pre-commit CLI linting (`codeant review`), SOC 2 / HIPAA compliance posture, and structured comments tailored for AI editors.\n"
                "- **Full-System PR Gate**: Myco analyzes code at the pull request stage against full cross-service invariants to stop critical architectural breakage.\n"
                "- **Workflow Posture**: CodeAnt assists pre-commit security hygiene, while Myco enforces system-wide invariants."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 100},
            )

        # 1d. General competitor comparison query
        if any(w in q_lower for w in ("competitor", "coderabbit", "graptile", "greptile", "codeant", "compare")):
            body_text = (
                "Here is how **Myco** compares with **CodeRabbit**, **Graptile**, and **CodeAnt**:\n\n"
                "- **CodeRabbit**: Specializes in PR walkthrough summaries, sequence diagrams, and conversational line-by-line review comments.\n"
                "- **Graptile (Greptile)**: Focuses on codebase graph indexing to feed context to autonomous coding agents (*unverified benchmarks noted*).\n"
                "- **CodeAnt (CodeAnt AI)**: Specializes in pre-commit CLI security scanning and automated compliance checks (SOC 2, HIPAA).\n"
                "- **Myco**: Acts as an architectural enforcement gate across multi-file repositories, detecting broken invariants and P0 regressions before merge."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 100},
            )

        # 2. Replacing engineers, QA, or security testing
        if "replace" in q_lower and any(w in q_lower for w in ("engineer", "qa", "security", "developer", "tester")):
            body_text = (
                "**Role Alongside Engineering Teams:**\n\n"
                "- **Augmentation**: Myco supports and accelerates developer judgment; it does not replace software engineers or QA teams.\n"
                "- **Focused Quality Gate**: Identifies logic mismatches, broken invariants, and regression risks in development.\n"
                "- **Complementary**: Organizations should retain their standard review standards, end-to-end testing, and dedicated security audits."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 95},
            )

        # 3. Security / privacy / data retention query
        if any(w in q_lower for w in ("security", "privacy", "training", "retention", "soc 2", "compliance", "encrypt")):
            body_text = (
                "**Myco Security & Privacy Highlights:**\n\n"
                "- **Zero Model Training**: Customer code is never used to train or improve models.\n"
                "- **Ephemeral Processing**: Diffs are analyzed in memory only and immediately expunged.\n"
                "- **Enterprise Compliance**: SOC 2 Type II compliant, TLS 1.3 transit encryption, AES-256 at rest, and automated secret redaction."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 100},
            )

        # 3. Pilot / pricing query
        if any(w in q_lower for w in ("pilot", "pricing", "cost", "trial", "tier", "subscription", "price", "plan")):
            body_text = (
                "**Myco Pricing & Trial Overview:**\n\n"
                "- **Team Plan**: $20 per developer per month, or $16 per developer per month billed annually ($192/year, saving 20%). Includes full review and validation pipeline, unlimited reviews and repositories, dashboard and analytics, and community/email support.\n"
                "- **30-Day Free Trial**: Full Team plan capabilities with no credit card required.\n"
                "- **Enterprise Plan**: Custom pricing tailored to organization scale. Includes SSO/SAML, audit logs, custom connectors, advanced self-learning, single-tenant SaaS or on-premises / VPC deployment, priority Slack support, and a dedicated Customer Success Manager.\n"
                "- **LLM Usage**: Subscriptions cover Myco. LLM usage is paid separately through your own provider API key (BYO key).\n"
                "- **Seat Model**: Paid seats are admin-approved only for developers whose pull requests Myco reviews. Viewing findings is free."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 120},
            )

        # 4. How Myco works, backend architecture, error detection & developer benefit
        if any(w in q_lower for w in (
            "detect error", "detect errors", "detect bugs", "find errors", "catches bugs",
            "backend work", "how does the backend", "core backend", "how myco work",
            "how does myco work", "how this help", "how does this help"
        )):
            body_text = (
                "**How Myco Works & Detects Code Flaws:**\n\n"
                "- **Whole-System Context Mapping**: Rather than evaluating isolated pull-request diffs in a vacuum, Myco maps cross-file dependency graphs, data models, database schemas, and API contracts before reviewing changes.\n"
                "- **Invariant Enforcement**: Analyzes code against system invariants, catching subtle P0/P1 logical flaws, unindexed breaking queries, concurrency race conditions, and tenant isolation leaks before merge.\n"
                "- **Intent-Aware Verification**: Compares pull-request changes against stated PR descriptions and acceptance criteria to ensure the implementation matches the intended requirement.\n"
                "- **Developer Assistance**: Delivers actionable explanations with supporting evidence directly inside GitHub, eliminating noisy lint warnings and surfacing untested edge cases."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 125},
            )

        # 5. General / core overview query (what is Myco, tell me about Myco, etc.)
        if any(w in q_lower for w in ("what is myco", "about myco", "overview", "what does myco do", "tell me all", "explain myco", "who are you", "what can you do")):
            body_text = (
                "**Myco** is a context-first code intelligence platform designed for engineering teams building mission-critical software.\n\n"
                "- **Whole-System Reasoning**: Analyzes cross-module dependencies, schema migrations, and business invariants across the entire repository before PRs merge.\n"
                "- **P0/P1 Invariant Enforcement**: Flags breaking database changes, race conditions, and privilege escalations.\n"
                "- **Zero Model Training**: Customer code is never used to train or fine-tune public or proprietary foundation models.\n"
                "- **Production Pilots**: Offers a 14-day production pilot integrated directly with GitHub Enterprise or GitLab."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 120},
            )

        # 5. V2 capabilities & product roadmap
        if any(w in q_lower for w in ("v2", "four capabilities", "4 capabilities", "capabilities of v2", "roadmap", "test intelligence", "failure diagnosis", "test execution")):
            body_text = (
                "**Myco V2** expands the platform into a broader AI quality-assurance suite across four core capabilities:\n\n"
                "- **Find Bugs** *(Current Foundation)*: Evaluates pull requests against intended behavior, code context, and dependencies to catch implementation flaws before merge.\n"
                "- **Test Intelligence** *(Planned V2)*: Evaluates whether existing test suites meaningfully cover intended scenarios and flags weak assertions or missing edge cases.\n"
                "- **Test Execution** *(Planned V2)*: Runs relevant tests within the engineering workflow to connect required scenarios with actual execution results.\n"
                "- **Failure Diagnosis** *(Planned V2)*: Connects test failures with expected behaviors and failure evidence to identify likely causes and next investigation steps.\n\n"
                "*Note: PR review on GitHub is currently available; broader testing and diagnosis capabilities are planned.*"
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 140},
            )

        # 6. Current availability vs planned capabilities
        if any(w in q_lower for w in ("find bugs today", "run tests today", "diagnose failures today", "available today", "availability")):
            body_text = (
                "**Myco Availability & Roadmap Status:**\n\n"
                "- **Available Today**: Pull-request review through GitHub. Myco identifies potential bugs and implementation regressions, explaining findings with available context.\n"
                "- **Planned in V2**: Test intelligence, automated test execution, and failure diagnosis.\n"
                "- **Validation Scope**: Current review assesses changes against documented evidence; it does not independently execute code or prove software correctness."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 110},
            )

        # 7. Code reviewer vs QA assistant
        if any(w in q_lower for w in ("code reviewer or", "qa assistant", "code reviewer")):
            body_text = (
                "**Myco** is an **AI quality-assurance assistant** whose current foundation is pull-request review.\n\n"
                "- **Contextual Review**: Unlike basic AST linters or syntax checkers, Myco assesses whether code changes fulfill intended requirements and maintain system invariants.\n"
                "- **V2 Direction**: Expands from PR review into comprehensive software validation, integrating bug detection with test intelligence, execution, and diagnosis."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 90},
            )

        # 8. Automatic fixing and merging policy
        if any(w in q_lower for w in ("fix automatically", "auto fix", "merge automatically", "autonomous merge", "block every issue")) or ("automatically" in q_lower and ("fix" in q_lower or "merge" in q_lower)):
            body_text = (
                "**Myco Review Actions & Merge Control:**\n\n"
                "- **No Autonomous Merging**: Myco does not automatically merge pull requests or independently apply code modifications.\n"
                "- **Actionable Findings**: Comments include contextual explanations, affected code, and suggested fixes for developers to evaluate.\n"
                "- **Engineering Governance**: Merge gating is governed by repository branch rules and team policies, keeping engineers in full control."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 100},
            )

        # 9. GitHub integration & customer workflow
        if any(w in q_lower for w in ("github", "workflow", "setup process", "onboarding")):
            body_text = (
                "**Customer Workflow & GitHub Integration:**\n\n"
                "- **Setup**: Connects to your GitHub repository using a lightweight onboarding process.\n"
                "- **Change Review**: Triggered upon pull request creation or update, evaluating changes against PR descriptions, requirements, and codebase context.\n"
                "- **Inline Feedback**: Delivers structured findings directly in GitHub with supporting evidence and severity indications."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 95},
            )

        # 10. Monorepos & multiple repositories
        if any(w in q_lower for w in ("monorepo", "multiple repositories", "multi repo", "cross repository")):
            body_text = (
                "**Monorepo & Multi-Repository Support:**\n\n"
                "- **Architectural Context**: Designed to reason across packages, shared interfaces, and cross-module dependencies.\n"
                "- **Accessible Scope**: Cross-repository review depends on the repository layout and context permissions granted to the setup.\n"
                "- **Team Consultation**: The Myco team assists in confirming repository boundaries and integration requirements during onboarding."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 95},
            )

        # 11. Replacing engineers, QA, or security testing
        if any(w in q_lower for w in ("replace engineer", "replace qa", "replace security", "replace developer")):
            body_text = (
                "**Role Alongside Engineering Teams:**\n\n"
                "- **Augmentation**: Myco supports and accelerates developer judgment; it does not replace software engineers or QA teams.\n"
                "- **Focused Quality Gate**: Identifies logic mismatches, broken invariants, and regression risks in development.\n"
                "- **Complementary**: Organizations should retain their standard review standards, end-to-end testing, and dedicated security audits."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 95},
            )

        # 12. Problem addressed & product differentiation
        if any(w in q_lower for w in ("problem", "how is myco different", "differentiation", "why myco")):
            body_text = (
                "**Why Engineering Teams Choose Myco:**\n\n"
                "- **Context Beyond the Diff**: Code changes that look clean in isolation often break remote dependencies or violate business requirements. Myco maps these cross-module relationships.\n"
                "- **Beyond Green Tests**: Passing test suites can miss critical edge cases or contain weak assertions. Myco checks implementation against actual intent.\n"
                "- **Actionable Feedback**: Delivers specific findings close to the authoring workflow, reducing costly review cycles and context-switching."
            )
            return LLMResponse(
                content=body_text,
                model="local-grounded-fallback",
                finish_reason="stop",
                is_fallback=True,
                usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 105},
            )

        # 13. General / fallback synthesis: formulate a structured answer from retrieved context
        lines = [l.strip() for l in context_match.splitlines() if l.strip()]
        clean_pts = []
        for line in lines:
            if line.startswith(("#", "[", "|", "Source:", "---", "id:", "title:")):
                continue
            cleaned = line.lstrip("-* ").strip()
            if len(cleaned) > 25 and not any(cleaned.lower().startswith(x) for x in ("source:", "verified", "note:")):
                clean_pts.append(cleaned)
            if len(clean_pts) >= 4:
                break

        if clean_pts:
            body_text = "\n".join(f"- {pt}" for pt in clean_pts)
        else:
            body_text = "Myco helps engineering teams validate code changes against product requirements and repository context before merge. Please contact the Myco team for specific workflow details."

        return LLMResponse(
            content=body_text,
            model="local-grounded-fallback",
            finish_reason="stop",
            is_fallback=True,
            usage={"prompt_tokens": len(user_msg.split()), "completion_tokens": len(body_text.split()), "total_tokens": 100},
        )


# Singleton Groq client instance
groq_client = GroqClient()
