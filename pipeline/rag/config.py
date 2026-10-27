"""
Myco Assistant RAG Pipeline Configuration.

Reads settings from environment variables with production-ready defaults:
- Groq model and credentials
- Vector store paths and retrieval thresholds
- Grounding confidence thresholds
- Security policies and rate limits
"""

from dataclasses import dataclass, field
import os
from pathlib import Path
from typing import List, Optional


@dataclass
class RAGConfig:
    # Model Configuration
    groq_api_key: str = field(
        default_factory=lambda: os.environ.get("GROQ_API_KEY")
        or os.environ.get("MYCO_LLM_API_KEY", "")
    )
    groq_model: str = field(
        default_factory=lambda: os.environ.get(
            "GROQ_MODEL", "openai/gpt-oss-20b"
        )
    )
    groq_base_url: str = field(
        default_factory=lambda: os.environ.get(
            "GROQ_BASE_URL", "https://api.groq.com/openai/v1"
        )
    )
    groq_timeout_seconds: float = 20.0
    groq_max_retries: int = 2
    groq_temperature: float = 0.2
    groq_max_tokens: int = 1024

    # Retrieval & Grounding Thresholds
    # Minimum similarity score required to consider a passage relevant
    similarity_threshold: float = 0.28
    # Minimum aggregate relevance score required to generate a substantive answer
    answerability_threshold: float = 0.35
    top_k_chunks: int = 5
    max_context_tokens: int = 3000

    # Hybrid Search Weighting (0.0 to 1.0; 0.65 vector, 0.35 lexical BM25)
    hybrid_vector_weight: float = 0.65
    hybrid_lexical_weight: float = 0.35

    # Security Guardrails
    enforce_access_control: bool = True
    authorized_public_role: str = "public"
    refusal_confidential_message: str = (
        "I can help explain Myco’s publicly documented features and capabilities, "
        "but I can’t share confidential implementation details or internal system architecture."
    )
    refusal_unverified_message: str = (
        "I’m sorry, but I don’t have enough verified information to answer that question accurately. "
        "Please contact the Myco team for further assistance."
    )

    # Document Paths
    knowledge_dir: Path = field(
        default_factory=lambda: Path(__file__).parent / "documents"
    )
    index_cache_path: Path = field(
        default_factory=lambda: Path(__file__).parent / "index_cache.json"
    )

    # Remote GitHub Documentation Source (optional, defaults to local documents in testing)
    github_docs_repo: Optional[str] = field(
        default_factory=lambda: os.environ.get("GITHUB_DOCS_REPO")
    )
    github_docs_path: str = field(
        default_factory=lambda: os.environ.get("GITHUB_DOCS_PATH", "docs")
    )
    github_docs_ref: str = field(
        default_factory=lambda: os.environ.get("GITHUB_DOCS_REF", "main")
    )
    github_token: Optional[str] = field(
        default_factory=lambda: os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    )


# Singleton configuration instance
rag_config = RAGConfig()
