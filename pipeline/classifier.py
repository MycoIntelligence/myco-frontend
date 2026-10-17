"""
Request Classification and Code Detection Engine.

Analyzes input structure, syntax patterns, AST feasibility, and semantic requirements
to determine whether a request can be executed internally or requires routing to the
future Myco backend.
"""

import re
from typing import Any, Dict, List, Optional

from pipeline.config import config
from pipeline.types import ClassificationResult, CodeInputFile, ProcessingRoute


class RequestClassifier:
    """
    Central Request Classifier.
    Applies structural heuristics, syntax tokenization, and capability boundary checks.
    """

    SUPPORTED_INTERNAL_EXTENSIONS = {
        ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
        ".py", ".json", ".yaml", ".yml", ".env", ".md", ".diff", ".patch"
    }

    DIFF_HEADER_REGEX = re.compile(r"^diff --git|^@@\s+-\d+,\d+\s+\+\d+,\d+\s+@@|^---\s+[ab]/", re.MULTILINE)
    CODE_KEYWORDS_REGEX = re.compile(
        r"\b(import|export|function|const|let|var|class|interface|type|def|async|await|return|from|require|package)\b"
    )

    def classify(
        self,
        primary_file: Optional[CodeInputFile],
        context_files: List[CodeInputFile],
        raw_code: Optional[str] = None,
        raw_diff: Optional[str] = None,
        repo_url: Optional[str] = None,
        pr_number: Optional[int] = None,
        requested_features: Optional[List[str]] = None,
    ) -> ClassificationResult:
        """
        Classifies incoming request into INTERNAL, EXTERNAL_MYCO, or REJECTED.
        """
        requested_features = requested_features or []
        features: Dict[str, Any] = {}

        # 1. Check for whole-repository or external service requirements
        requires_cross_repo = (
            "cross_repo_graph" in requested_features
            or "multi_repo_index" in requested_features
            or (repo_url and not primary_file and not raw_code and not raw_diff)
        )
        requires_deep_symbolic = (
            "deep_symbolic_execution" in requested_features
            or "whole_project_taint" in requested_features
            or "dynamic_fuzzing" in requested_features
        )

        features["requires_cross_repo"] = requires_cross_repo
        features["requires_deep_symbolic"] = requires_deep_symbolic

        # 2. Extract content and determine file properties
        primary_content = ""
        primary_path = "code.ts"
        if primary_file:
            primary_content = primary_file.content or ""
            primary_path = primary_file.path or "code.ts"
        elif raw_code:
            primary_content = raw_code
            primary_path = "input.ts"
        elif raw_diff:
            primary_content = raw_diff
            primary_path = "pr.diff"

        total_chars = len(primary_content) + sum(len(f.content or "") for f in context_files)
        total_files = (1 if primary_content else 0) + len(context_files)
        features["total_files"] = total_files
        features["total_chars"] = total_chars

        # Check for binary characters (null bytes or binary sequences)
        if any("\x00" in (f.content or "") for f in context_files) or "\x00" in primary_content:
            return ClassificationResult(
                route=ProcessingRoute.REJECTED,
                confidence=1.0,
                detected_format="binary",
                is_code=False,
                is_diff=False,
                file_count=total_files,
                total_characters=total_chars,
                estimated_tokens=0,
                requires_cross_repo_graph=False,
                requires_deep_symbolic=False,
                reason="Binary or compiled assets are unsupported. Source text required.",
                structural_features=features,
            )

        # 3. Detect Diff vs Pure Code
        is_diff = bool(raw_diff or self.DIFF_HEADER_REGEX.search(primary_content))
        features["is_diff"] = is_diff

        # 4. Detect Format / Language
        detected_format = self._detect_format(primary_path, primary_content)
        features["detected_format"] = detected_format

        # 5. Check if input contains recognisable code structures
        is_code = (
            is_diff
            or detected_format in ("typescript", "javascript", "python", "json", "yaml")
            or bool(self.CODE_KEYWORDS_REGEX.search(primary_content))
        )
        features["is_code"] = is_code

        if not is_code and not primary_content.strip() and not repo_url:
            return ClassificationResult(
                route=ProcessingRoute.REJECTED,
                confidence=0.95,
                detected_format="empty",
                is_code=False,
                is_diff=False,
                file_count=total_files,
                total_characters=0,
                estimated_tokens=0,
                requires_cross_repo_graph=False,
                requires_deep_symbolic=False,
                reason="No code, diff, or repository target supplied in request.",
                structural_features=features,
            )

        # Estimate tokens
        from pipeline.quota import TokenEstimator
        est_tokens = TokenEstimator.estimate_tokens(primary_content) + sum(
            TokenEstimator.estimate_tokens(f.content or "") for f in context_files
        )

        # 6. ROUTING DECISION LOGIC:
        # If request explicitly requires whole-repo indexing, cross-repo dependency resolution,
        # or deep symbolic execution, route to EXTERNAL_MYCO
        if requires_cross_repo:
            return ClassificationResult(
                route=ProcessingRoute.EXTERNAL_MYCO,
                confidence=0.99,
                detected_format=detected_format,
                is_code=is_code,
                is_diff=is_diff,
                file_count=total_files,
                total_characters=total_chars,
                estimated_tokens=est_tokens,
                requires_cross_repo_graph=True,
                requires_deep_symbolic=requires_deep_symbolic,
                reason="Multi-repository / whole-repository indexing requires future Myco backend capability.",
                structural_features=features,
            )

        if requires_deep_symbolic:
            return ClassificationResult(
                route=ProcessingRoute.EXTERNAL_MYCO,
                confidence=0.95,
                detected_format=detected_format,
                is_code=is_code,
                is_diff=is_diff,
                file_count=total_files,
                total_characters=total_chars,
                estimated_tokens=est_tokens,
                requires_cross_repo_graph=False,
                requires_deep_symbolic=True,
                reason="Whole-project symbolic taint reasoning exceeds internal AST engine capabilities.",
                structural_features=features,
            )

        # If file count exceeds internal engine limit (e.g., > 10 files)
        if total_files > 10:
            return ClassificationResult(
                route=ProcessingRoute.EXTERNAL_MYCO,
                confidence=0.92,
                detected_format=detected_format,
                is_code=is_code,
                is_diff=is_diff,
                file_count=total_files,
                total_characters=total_chars,
                estimated_tokens=est_tokens,
                requires_cross_repo_graph=False,
                requires_deep_symbolic=False,
                reason=f"Multi-file project ({total_files} files) requires external full-tree indexing.",
                structural_features=features,
            )

        # 7. Otherwise, the request is supported internally by our intelligence engine!
        return ClassificationResult(
            route=ProcessingRoute.INTERNAL,
            confidence=0.98,
            detected_format=detected_format,
            is_code=is_code,
            is_diff=is_diff,
            file_count=total_files,
            total_characters=total_chars,
            estimated_tokens=est_tokens,
            requires_cross_repo_graph=False,
            requires_deep_symbolic=False,
            reason="Input matches internal AST static analysis and policy verification capabilities.",
            structural_features=features,
        )

    def _detect_format(self, path: str, content: str) -> str:
        fn = (path or "").strip().lower()
        if fn.endswith((".ts", ".tsx")):
            return "typescript"
        if fn.endswith((".js", ".jsx", ".mjs")):
            return "javascript"
        if fn.endswith(".py"):
            return "python"
        if fn.endswith(".json"):
            return "json"
        if fn.endswith((".yaml", ".yml")):
            return "yaml"
        if fn.endswith(".env") or ".env." in fn:
            return "env"
        if fn.endswith((".md", ".markdown")):
            return "markdown"
        if fn.endswith((".diff", ".patch")):
            return "diff"

        # Content sniffing fallback
        if self.DIFF_HEADER_REGEX.search(content):
            return "diff"
        if re.search(r"^\s*[{[]", content):
            return "json"
        if "def " in content or "import " in content and ":" in content:
            return "python"

        return "unknown"


classifier = RequestClassifier()
