"""
Document Ingestion Pipeline for Myco Assistant RAG.

Parses Markdown, text, and structured documents into semantically meaningful chunks.
Extracts frontmatter metadata (access control, document title, version),
preserves document section boundaries, generates chunk hashes for deduplication,
and filters out corrupted or invalid documents.
"""

from dataclasses import dataclass, field
import hashlib
from pathlib import Path
import re
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class DocumentChunk:
    chunk_id: str
    doc_id: str
    doc_title: str
    section_title: str
    content: str
    access: str  # "public" | "restricted"
    source_file: str
    token_count_est: int
    content_hash: str
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "doc_id": self.doc_id,
            "doc_title": self.doc_title,
            "section_title": self.section_title,
            "content": self.content,
            "access": self.access,
            "source_file": self.source_file,
            "token_count_est": self.token_count_est,
            "content_hash": self.content_hash,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DocumentChunk":
        return cls(
            chunk_id=data["chunk_id"],
            doc_id=data["doc_id"],
            doc_title=data["doc_title"],
            section_title=data["section_title"],
            content=data["content"],
            access=data.get("access", "public"),
            source_file=data.get("source_file", ""),
            token_count_est=data.get("token_count_est", 0),
            content_hash=data.get("content_hash", ""),
            metadata=data.get("metadata", {}),
        )


class DocumentIngestionEngine:
    def __init__(self, target_chunk_words: int = 250, min_chunk_words: int = 30):
        self.target_chunk_words = target_chunk_words
        self.min_chunk_words = min_chunk_words

    @staticmethod
    def parse_frontmatter(raw_text: str) -> Tuple[Dict[str, str], str]:
        """Extracts YAML frontmatter if present (between --- markers)."""
        frontmatter = {}
        body = raw_text

        if raw_text.startswith("---"):
            parts = raw_text.split("---", 2)
            if len(parts) >= 3:
                fm_text = parts[1]
                body = parts[2].strip()
                for line in fm_text.splitlines():
                    line = line.strip()
                    if line and ":" in line and not line.startswith("#"):
                        k, v = line.split(":", 1)
                        frontmatter[k.strip().lower()] = v.strip().strip("'\"")

        return frontmatter, body

    @staticmethod
    def compute_hash(text: str) -> str:
        return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()[:16]

    def split_by_headings(self, body: str) -> List[Tuple[str, str]]:
        """
        Splits markdown text by H1, H2, or H3 headings while preserving
        the heading title and associated content paragraphs/tables.
        """
        lines = body.splitlines()
        sections: List[Tuple[str, List[str]]] = []
        current_heading = "General Overview"
        current_lines: List[str] = []

        heading_regex = re.compile(r"^(#{1,3})\s+(.+)$")

        for line in lines:
            m = heading_regex.match(line.strip())
            if m:
                if current_lines:
                    sections.append((current_heading, current_lines))
                    current_lines = []
                current_heading = m.group(2).strip()
            else:
                current_lines.append(line)

        if current_lines:
            sections.append((current_heading, current_lines))

        result = []
        for heading, s_lines in sections:
            content = "\n".join(s_lines).strip()
            if content:
                result.append((heading, content))
        return result

    def chunk_section(
        self,
        doc_id: str,
        doc_title: str,
        section_title: str,
        content: str,
        access: str,
        source_file: str,
    ) -> List[DocumentChunk]:
        """
        Splits section content into semantic chunks respecting paragraphs and tables.
        """
        chunks: List[DocumentChunk] = []
        paragraphs = re.split(r"\n\s*\n", content)

        current_para_group: List[str] = []
        current_word_count = 0
        chunk_idx = 1

        for para in paragraphs:
            para_clean = para.strip()
            if not para_clean:
                continue

            words = para_clean.split()
            para_word_count = len(words)

            if current_word_count + para_word_count > self.target_chunk_words and current_word_count >= self.min_chunk_words:
                chunk_text = "\n\n".join(current_para_group).strip()
                c_hash = self.compute_hash(chunk_text)
                chunk_id = f"{doc_id}_{re.sub(r'[^a-zA-Z0-9]', '_', section_title).lower()}_{chunk_idx}"

                chunks.append(
                    DocumentChunk(
                        chunk_id=chunk_id,
                        doc_id=doc_id,
                        doc_title=doc_title,
                        section_title=section_title,
                        content=chunk_text,
                        access=access,
                        source_file=source_file,
                        token_count_est=int(len(chunk_text.split()) * 1.3),
                        content_hash=c_hash,
                    )
                )
                chunk_idx += 1
                current_para_group = [para_clean]
                current_word_count = para_word_count
            else:
                current_para_group.append(para_clean)
                current_word_count += para_word_count

        if current_para_group:
            chunk_text = "\n\n".join(current_para_group).strip()
            c_hash = self.compute_hash(chunk_text)
            chunk_id = f"{doc_id}_{re.sub(r'[^a-zA-Z0-9]', '_', section_title).lower()}_{chunk_idx}"
            chunks.append(
                DocumentChunk(
                    chunk_id=chunk_id,
                    doc_id=doc_id,
                    doc_title=doc_title,
                    section_title=section_title,
                    content=chunk_text,
                    access=access,
                    source_file=source_file,
                    token_count_est=int(len(chunk_text.split()) * 1.3),
                    content_hash=c_hash,
                )
            )

        return chunks

    def process_raw_text(
        self,
        raw_text: str,
        doc_id: str,
        doc_title: str,
        source_file: str,
        default_access: str = "public",
    ) -> List[DocumentChunk]:
        """Processes raw markdown text into semantic chunks."""
        frontmatter, body = self.parse_frontmatter(raw_text)

        doc_id = frontmatter.get("id") or doc_id
        doc_title = frontmatter.get("title") or doc_title
        access = frontmatter.get("access", default_access).lower()

        sections = self.split_by_headings(body)
        chunks: List[DocumentChunk] = []

        for sec_heading, sec_content in sections:
            sec_chunks = self.chunk_section(
                doc_id=doc_id,
                doc_title=doc_title,
                section_title=sec_heading,
                content=sec_content,
                access=access,
                source_file=source_file,
            )
            chunks.extend(sec_chunks)

        return chunks

    def process_file(self, file_path: Path) -> List[DocumentChunk]:
        """Processes a single file and extracts DocumentChunks."""
        if not file_path.exists():
            return []

        try:
            raw_text = file_path.read_text(encoding="utf-8")
        except Exception:
            return []

        doc_id = file_path.stem.lower()
        doc_title = file_path.stem.replace("_", " ").title()

        return self.process_raw_text(
            raw_text=raw_text,
            doc_id=doc_id,
            doc_title=doc_title,
            source_file=file_path.name,
        )

    def ingest_directory(self, dir_path: Path) -> Tuple[List[DocumentChunk], List[str]]:
        """
        Recursively scans directory for markdown/text files, ingests,
        and deduplicates chunks by content hash.
        """
        all_chunks: List[DocumentChunk] = []
        seen_hashes = set()
        failed_files: List[str] = []

        if not dir_path.exists():
            return [], [str(dir_path)]

        for p in sorted(dir_path.glob("**/*")):
            if p.is_file() and p.suffix.lower() in (".md", ".txt"):
                try:
                    file_chunks = self.process_file(p)
                    for c in file_chunks:
                        if c.content_hash not in seen_hashes:
                            seen_hashes.add(c.content_hash)
                            all_chunks.append(c)
                except Exception as e:
                    failed_files.append(f"{p.name}: {str(e)}")

        return all_chunks, failed_files

    def ingest_from_github(
        self,
        owner: str,
        repo: str,
        path: str = "docs",
        ref: str = "main",
        token: Optional[str] = None,
    ) -> Tuple[List[DocumentChunk], List[str]]:
        """
        Fetches markdown documentation files directly from GitHub repository and parses into chunks.
        """
        from pipeline.github_service import github_service

        ok, resources, msg = github_service.fetch_directory_files(
            owner=owner, repo=repo, path=path, ref=ref, token=token
        )
        if not ok:
            return [], [msg]

        all_chunks: List[DocumentChunk] = []
        seen_hashes = set()
        failed_files: List[str] = []

        for res in resources:
            try:
                file_path_str = res.metadata.get("path", "doc.md")
                doc_stem = Path(file_path_str).stem.lower()
                doc_title = doc_stem.replace("_", " ").title()

                chunks = self.process_raw_text(
                    raw_text=res.content,
                    doc_id=f"gh_{owner}_{repo}_{doc_stem}",
                    doc_title=doc_title,
                    source_file=f"github:{owner}/{repo}/{file_path_str}",
                    default_access="public",
                )
                for c in chunks:
                    if c.content_hash not in seen_hashes:
                        seen_hashes.add(c.content_hash)
                        all_chunks.append(c)
            except Exception as e:
                failed_files.append(f"{res.metadata.get('path', 'unknown')}: {str(e)}")

        return all_chunks, failed_files
