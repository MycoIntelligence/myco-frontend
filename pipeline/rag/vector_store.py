"""
Hybrid Vector Store and Retrieval Engine.

Features:
- Dense semantic feature embedding representation (subword n-gram hashing + TF-IDF cosine similarity).
- BM25 lexical keyword ranking.
- Hybrid fusion score = w_vec * vector_score + w_lex * lexical_score.
- Strict access-control filtering (excluding restricted chunks at query time).
- In-memory search with persistent JSON serialization.
"""

from dataclasses import dataclass
import hashlib
import json
import math
from pathlib import Path
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from pipeline.rag.ingestion import DocumentChunk


@dataclass
class SearchResult:
    chunk: DocumentChunk
    score: float
    vector_score: float
    lexical_score: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk.chunk_id,
            "doc_title": self.chunk.doc_title,
            "section_title": self.chunk.section_title,
            "content": self.chunk.content,
            "access": self.chunk.access,
            "source_file": self.chunk.source_file,
            "score": round(self.score, 4),
            "vector_score": round(self.vector_score, 4),
            "lexical_score": round(self.lexical_score, 4),
        }


class HybridVectorStore:
    VECTOR_DIM = 256  # Compact, high-performance semantic hash vector

    def __init__(self, vector_weight: float = 0.65, lexical_weight: float = 0.35):
        self.vector_weight = vector_weight
        self.lexical_weight = lexical_weight
        self.chunks: List[DocumentChunk] = []
        self.vectors: List[List[float]] = []  # Normalized embeddings
        self.doc_term_freqs: List[Dict[str, int]] = []
        self.doc_lengths: List[int] = []
        self.avg_doc_length: float = 0.0
        self.idf_map: Dict[str, float] = {}

    STOP_WORDS = {
        "a", "an", "the", "and", "or", "is", "are", "was", "were", "to", "for",
        "in", "on", "at", "by", "from", "with", "about", "it", "this", "that",
        "what", "which", "how", "does", "do", "did", "can", "could", "would",
        "should", "of", "as", "be", "been", "being", "have", "has", "had", "my",
        "your", "yours", "you", "i", "we", "us", "our", "ours", "tell", "me",
        "all", "give", "show", "know", "explain", "describe", "detail", "details",
        "info", "information", "something", "anything", "everything", "please",
        "like", "want", "need", "help", "let", "see", "think", "hi", "hello", "hey",
        "much", "many", "get", "started", "start", "work", "works"
    }

    SYNONYM_EXPANSIONS = {
        "errors": ["bugs", "flaws", "issues"],
        "error": ["bug", "flaw", "issue"],
        "detect": ["find", "identify", "catch"],
        "detects": ["find", "identify", "catch"],
        "detecting": ["find", "identify", "catch"],
        "detection": ["find", "inspection", "review"],
        "backend": ["architecture", "pipeline", "engine", "core"],
    }

    @classmethod
    def _tokenize(cls, text: str, filter_stops: bool = True) -> List[str]:
        cleaned = re.sub(r"[^\w\s-]", " ", text.lower())
        tokens = [t for t in cleaned.split() if len(t) > 1]
        if filter_stops:
            tokens = [t for t in tokens if t not in cls.STOP_WORDS]
        return tokens

    @classmethod
    def _deterministic_hash(cls, s: str) -> int:
        """Process-independent, deterministic hash using MD5."""
        return int(hashlib.md5(s.encode("utf-8")).hexdigest()[:8], 16)

    @classmethod
    def _embed_text(cls, text: str) -> List[float]:
        """
        Generates a dense semantic unit vector via n-gram feature hashing
        and subword projection. Fully deterministic across process restarts.
        """
        vec = [0.0] * cls.VECTOR_DIM
        tokens = cls._tokenize(text)
        if not tokens:
            return vec

        # Weight unigrams and bigrams
        for i, token in enumerate(tokens):
            h1 = cls._deterministic_hash(token) % cls.VECTOR_DIM
            vec[h1] += 1.0

            # Subword 3-4 chars for morphological similarity
            if len(token) > 4:
                for j in range(len(token) - 3):
                    sub = token[j : j + 4]
                    h_sub = cls._deterministic_hash(sub) % cls.VECTOR_DIM
                    vec[h_sub] += 0.35

            if i < len(tokens) - 1:
                bigram = f"{token}_{tokens[i+1]}"
                h2 = cls._deterministic_hash(bigram) % cls.VECTOR_DIM
                vec[h2] += 0.75

        # L2 normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 1e-9:
            vec = [x / norm for x in vec]
        return vec

    @staticmethod
    def _cosine_similarity(v1: List[float], v2: List[float]) -> float:
        dot = sum(a * b for a, b in zip(v1, v2))
        return max(0.0, min(1.0, dot))

    def index_chunks(self, chunks: List[DocumentChunk]):
        """Indexes document chunks, building vectors and BM25 tables."""
        self.chunks = list(chunks)
        self.vectors = []
        self.doc_term_freqs = []
        self.doc_lengths = []
        df_map: Dict[str, int] = {}

        total_length = 0
        for chunk in self.chunks:
            # Full text for indexing: title + section + content
            index_text = f"{chunk.doc_title}\n{chunk.section_title}\n{chunk.content}"
            vec = self._embed_text(index_text)
            self.vectors.append(vec)

            tokens = self._tokenize(index_text)
            self.doc_lengths.append(len(tokens))
            total_length += len(tokens)

            tf: Dict[str, int] = {}
            seen_in_chunk = set()
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1
                if t not in seen_in_chunk:
                    df_map[t] = df_map.get(t, 0) + 1
                    seen_in_chunk.add(t)
            self.doc_term_freqs.append(tf)

        N = len(self.chunks)
        self.avg_doc_length = (total_length / N) if N > 0 else 1.0

        # BM25 IDF
        self.idf_map = {}
        for term, df in df_map.items():
            idf = math.log((N - df + 0.5) / (df + 0.5) + 1.0)
            self.idf_map[term] = max(0.1, idf)

    def _bm25_score(self, query_tokens: List[str], doc_idx: int, k1: float = 1.5, b: float = 0.75) -> float:
        tf_dict = self.doc_term_freqs[doc_idx]
        doc_len = self.doc_lengths[doc_idx]
        score = 0.0

        for t in query_tokens:
            if t not in tf_dict:
                continue
            tf = tf_dict[t]
            idf = self.idf_map.get(t, 0.1)
            num = tf * (k1 + 1.0)
            denom = tf + k1 * (1.0 - b + b * (doc_len / (self.avg_doc_length or 1.0)))
            score += idf * (num / denom)

        # Scale into 0.0 - 1.0 range
        return min(1.0, score / 2.0)

    def search(
        self,
        query: str,
        top_k: int = 5,
        access_filter: Optional[str] = "public",
        min_threshold: float = 0.15,
    ) -> List[SearchResult]:
        """
        Executes hybrid retrieval over indexed chunks with access control.

        :param query: The natural language search query.
        :param top_k: Maximum chunks to retrieve.
        :param access_filter: "public" to strictly enforce public docs, None for unrestricted.
        :param min_threshold: Minimum combined score.
        """
        if not query.strip() or not self.chunks:
            return []

        query_vec = self._embed_text(query)
        base_tokens = self._tokenize(query)
        query_tokens = list(base_tokens)
        for t in base_tokens:
            if t in self.SYNONYM_EXPANSIONS:
                for syn in self.SYNONYM_EXPANSIONS[t]:
                    if syn not in query_tokens:
                        query_tokens.append(syn)
        q_lower = query.lower()

        # Identify broad Myco overview/identity queries
        is_general_myco = any(
            phrase in q_lower
            for phrase in (
                "what is myco",
                "tell me all about myco",
                "tell me about myco",
                "about myco",
                "what does myco do",
                "overview of myco",
                "explain myco",
                "who are you",
                "what can you do",
            )
        ) or (len(query_tokens) == 1 and query_tokens[0] == "myco")

        results: List[SearchResult] = []

        for idx, chunk in enumerate(self.chunks):
            # Enforce access control filter
            if access_filter and chunk.access != access_filter:
                continue

            v_sim = self._cosine_similarity(query_vec, self.vectors[idx])
            l_sim = self._bm25_score(query_tokens, idx)

            combined = (self.vector_weight * v_sim) + (self.lexical_weight * l_sim)

            # Boost if chunk section or title directly matches query terms
            title_and_sec = f"{chunk.doc_title.lower()} {chunk.section_title.lower()}"
            matched_title_terms = [qt for qt in query_tokens if len(qt) >= 3 and qt in title_and_sec]
            if matched_title_terms:
                combined = min(1.0, combined + 0.15 + (0.05 * len(matched_title_terms)))

            # If general Myco overview query, prioritize the core definition chunk
            if is_general_myco and "1. What is Myco?" in chunk.section_title:
                combined = min(1.0, combined + 0.35)

            if combined >= min_threshold:
                results.append(
                    SearchResult(
                        chunk=chunk,
                        score=combined,
                        vector_score=v_sim,
                        lexical_score=l_sim,
                    )
                )

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:top_k]

    def save(self, filepath: Path):
        """Serializes chunks and index metadata to JSON cache."""
        payload = {
            "chunks": [c.to_dict() for c in self.chunks],
            "vectors": self.vectors,
            "avg_doc_length": self.avg_doc_length,
            "idf_map": self.idf_map,
        }
        filepath.parent.mkdir(parents=True, exist_ok=True)
        filepath.write_text(json.dumps(payload), encoding="utf-8")

    def load(self, filepath: Path) -> bool:
        """Loads chunks and vectors from JSON cache."""
        if not filepath.exists():
            return False
        try:
            data = json.loads(filepath.read_text(encoding="utf-8"))
            chunks = [DocumentChunk.from_dict(d) for d in data.get("chunks", [])]
            self.index_chunks(chunks)
            if "vectors" in data and len(data["vectors"]) == len(self.chunks):
                self.vectors = data["vectors"]
            return True
        except Exception:
            return False
