#!/usr/bin/env python3
"""
Little My Pull Request Reviewer CLI & Orchestration Engine.

Entry point for the primary code review stage in GitHub Actions.
Inspects pull request files, runs Little My AST rules and policy checks,
tracks completion status, and exports orchestration outputs to $GITHUB_OUTPUT
to determine whether Myco secondary fallback review is needed.
"""

import argparse
import json
import os
import subprocess
import sys
from typing import Any, Dict, List, Optional

from pipeline.internal_engine import internal_engine
from pipeline.security import SecurityManager
from pipeline.types import CodeInputFile, EscalationReason, ReviewResult, ReviewStatus


class PullRequestReviewer:
    """
    Orchestrates pull request code analysis using Little My.
    Produces deterministic escalation signals and formatted markdown reports.
    """

    CACHE_FILE = ".pr_review_cache.json"

    def __init__(self, workspace_root: Optional[str] = None):
        self.workspace_root = workspace_root or os.getcwd()

    def get_commit_sha(self) -> str:
        """Retrieves current commit SHA from GitHub Actions or git."""
        sha = os.environ.get("GITHUB_SHA")
        if sha:
            return sha.strip()
        try:
            res = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                capture_output=True,
                text=True,
                cwd=self.workspace_root,
                check=False,
            )
            if res.returncode == 0:
                return res.stdout.strip()
        except Exception:
            pass
        return "unknown_sha"

    def get_changed_files_from_git(self) -> List[str]:
        """Detects changed files using git diff against target branch or previous commit."""
        try:
            base_ref = os.environ.get("GITHUB_BASE_REF", "main")
            # Try diff against origin/base_ref
            res = subprocess.run(
                ["git", "diff", "--name-only", f"origin/{base_ref}...HEAD"],
                capture_output=True,
                text=True,
                cwd=self.workspace_root,
                check=False,
            )
            if res.returncode == 0 and res.stdout.strip():
                return [f.strip() for f in res.stdout.strip().splitlines() if f.strip()]

            # Fallback to diff against HEAD~1
            res2 = subprocess.run(
                ["git", "diff", "--name-only", "HEAD~1", "HEAD"],
                capture_output=True,
                text=True,
                cwd=self.workspace_root,
                check=False,
            )
            if res2.returncode == 0 and res2.stdout.strip():
                return [f.strip() for f in res2.stdout.strip().splitlines() if f.strip()]

            # Fallback to status
            res3 = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True,
                text=True,
                cwd=self.workspace_root,
                check=False,
            )
            if res3.returncode == 0 and res3.stdout.strip():
                files = []
                for line in res3.stdout.strip().splitlines():
                    parts = line.strip().split(maxsplit=1)
                    if len(parts) == 2:
                        files.append(parts[1].strip())
                return files
        except Exception:
            pass
        return []

    def load_code_input_files(self, file_paths: List[str]) -> List[CodeInputFile]:
        """Loads file contents from disk with path validation and untrusted code sanitization."""
        code_files: List[CodeInputFile] = []
        for path in file_paths:
            # Skip git-deleted or non-existent files
            full_path = os.path.join(self.workspace_root, path)
            if not os.path.exists(full_path) or os.path.isdir(full_path):
                continue

            try:
                with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                    raw_content = f.read()
                sanitized_content = SecurityManager.sanitize_untrusted_code(raw_content)
                code_files.append(CodeInputFile(path=path, content=sanitized_content))
            except Exception as e:
                # Unreadable file tracked as unanalyzable
                code_files.append(CodeInputFile(path=path, content=""))
        return code_files

    def check_idempotency_cache(self, commit_sha: str) -> Optional[Dict[str, Any]]:
        """Checks if a review was already recorded for this commit SHA to avoid duplicate reviews."""
        cache_path = os.path.join(self.workspace_root, self.CACHE_FILE)
        if not os.path.exists(cache_path):
            return None
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get(commit_sha)
        except Exception:
            return None

    def record_idempotency_cache(self, commit_sha: str, result_dict: Dict[str, Any]):
        """Persists review result for the commit SHA."""
        cache_path = os.path.join(self.workspace_root, self.CACHE_FILE)
        cache_data = {}
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    cache_data = json.load(f)
            except Exception:
                cache_data = {}
        cache_data[commit_sha] = result_dict
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(cache_data, f, indent=2)
        except Exception:
            pass

    def run_review(
        self,
        files: Optional[List[CodeInputFile]] = None,
        force: bool = False,
        timeout_sec: float = 30.0,
    ) -> ReviewResult:
        """Executes Little My review and handles deduplication / idempotency."""
        commit_sha = self.get_commit_sha()

        if not force and commit_sha != "unknown_sha":
            cached = self.check_idempotency_cache(commit_sha)
            if cached:
                # Return cached result directly
                status = ReviewStatus(cached.get("status", "complete"))
                escalation_reason = (
                    EscalationReason(cached["escalation_reason"])
                    if cached.get("escalation_reason")
                    else EscalationReason.NONE
                )
                return ReviewResult(
                    status=status,
                    findings=cached.get("findings", []),
                    unsupported_files=cached.get("unsupported_files", []),
                    unresolved_cases=cached.get("unresolved_cases", []),
                    escalation_required=cached.get("escalation_required", False),
                    escalation_reason=escalation_reason,
                    confidence=cached.get("confidence", 1.0),
                    execution_time_ms=cached.get("execution_time_ms", 0.0),
                    is_clean=cached.get("is_clean", True),
                    is_merge_blocking=cached.get("is_merge_blocking", False),
                    metadata={**cached.get("metadata", {}), "cached": True},
                )

        if files is None:
            changed_paths = self.get_changed_files_from_git()
            files = self.load_code_input_files(changed_paths)

        result = internal_engine.review_pr(files=files, timeout_sec=timeout_sec)

        # Record cache for commit SHA
        if commit_sha != "unknown_sha":
            self.record_idempotency_cache(commit_sha, result.to_dict())

        return result

    def export_github_outputs(self, result: ReviewResult):
        """Writes step outputs to $GITHUB_OUTPUT for downstream job orchestration."""
        github_output_path = os.environ.get("GITHUB_OUTPUT")
        outputs = {
            "escalation_required": str(result.escalation_required).lower(),
            "escalation_reason": (
                result.escalation_reason.value if result.escalation_reason else "NONE"
            ),
            "little_my_status": result.status.value,
            "findings_count": str(len(result.findings)),
            "unsupported_count": str(len(result.unsupported_files)),
            "unresolved_count": str(len(result.unresolved_cases)),
            "is_clean": str(result.is_clean).lower(),
            "is_merge_blocking": str(result.is_merge_blocking).lower(),
        }

        if github_output_path:
            try:
                with open(github_output_path, "a", encoding="utf-8") as f:
                    for k, v in outputs.items():
                        f.write(f"{k}={v}\n")
            except Exception as e:
                print(f"Warning: Failed to write to GITHUB_OUTPUT: {e}", file=sys.stderr)

        return outputs

    def generate_markdown_report(self, result: ReviewResult) -> str:
        """Formats an actionable GitHub pull request review summary."""
        lines = []
        lines.append("## Little My Code Review Report")
        lines.append("")

        # Status badge line
        if result.status == ReviewStatus.COMPLETE:
            if result.is_clean:
                lines.append("**Status**: Complete | Clean Scan (All rules verified clean, no defects detected)")
            else:
                lines.append(f"**Status**: Complete | Handled {len(result.findings)} issue(s) confidently")
        elif result.status == ReviewStatus.PARTIAL:
            lines.append(f"**Status**: Partial | Handled {len(result.findings)} issue(s); unresolved items escalated to Myco")
        elif result.status == ReviewStatus.INCOMPLETE:
            lines.append("**Status**: Incomplete | Changed files exceed Little My capabilities; escalating to Myco")
        else:
            lines.append("**Status**: Failed | Little My encountered an error or timeout; escalating to Myco")

        lines.append("")
        lines.append(f"- **Execution Time**: {result.execution_time_ms:.1f}ms")
        lines.append(f"- **Merge Blocking**: {'Yes' if result.is_merge_blocking else 'No'}")
        lines.append(f"- **Escalation Required**: {'Yes' if result.escalation_required else 'No'}")
        if result.escalation_required and result.escalation_reason:
            lines.append(f"- **Escalation Reason**: `{result.escalation_reason.value}`")

        # Unsupported Files
        if result.unsupported_files:
            lines.append("")
            lines.append("### Unsupported Files (Escalated to Myco)")
            for uf in result.unsupported_files:
                lines.append(f"- `{uf}` (language or extension not supported by Little My)")

        # Unresolved Cases
        if result.unresolved_cases:
            lines.append("")
            lines.append("### Unresolved Cases")
            for uc in result.unresolved_cases:
                lines.append(f"- {uc}")

        # Detected Findings
        if result.findings:
            lines.append("")
            lines.append("### Detected Findings (Preserved from Little My)")
            for idx, f in enumerate(result.findings, start=1):
                f_dict = f if isinstance(f, dict) else f.to_dict()
                severity = f_dict.get("severity", "UNKNOWN")
                title = f_dict.get("title", "Issue")
                f_path = f_dict.get("filePath") or f_dict.get("file_path", "")
                explanation = f_dict.get("explanation", "")
                lines.append(f"#### {idx}. [{severity}] {title}")
                if f_path:
                    lines.append(f"- **File**: `{f_path}`")
                lines.append(f"- **Explanation**: {explanation}")
                if f_dict.get("suggestedAction") or f_dict.get("suggested_action"):
                    action = f_dict.get("suggestedAction") or f_dict.get("suggested_action")
                    lines.append(f"- **Suggested Action**: {action}")
                lines.append("")
        elif result.is_clean and result.status == ReviewStatus.COMPLETE:
            lines.append("")
            lines.append("### Review Summary")
            lines.append("No defects detected. All static analysis rules, delimiter integrity, SQL bounds, and security policies passed successfully.")

        return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Little My Pull Request Reviewer")
    parser.add_argument("--files", nargs="*", help="Explicit file paths to review")
    parser.add_argument("--force", action="store_true", help="Bypass idempotency cache")
    parser.add_argument("--timeout", type=float, default=30.0, help="Stage timeout in seconds")
    parser.add_argument("--json", action="store_true", help="Output result as JSON")
    args = parser.parse_args()

    reviewer = PullRequestReviewer()

    code_files = None
    if args.files:
        code_files = reviewer.load_code_input_files(args.files)

    result = reviewer.run_review(files=code_files, force=args.force, timeout_sec=args.timeout)
    outputs = reviewer.export_github_outputs(result)

    if args.json:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print(reviewer.generate_markdown_report(result))

    # Always exit 0 to allow GitHub Actions step outputs to be read by dependent job
    sys.exit(0)


if __name__ == "__main__":
    main()
