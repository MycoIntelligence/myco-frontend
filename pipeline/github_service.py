"""
GitHub Data Fetching and Integration Service.

Enables the API to fetch live data from GitHub (Pull Requests, diffs, repository files,
and documentation) while allowing .env configuration and local fixtures for testing.

Features:
- Parse GitHub PR, blob, and repository URLs.
- Fetch Pull Request metadata and unified git diffs via GitHub REST API.
- Fetch single file contents (with base64 decoding) or raw contents.
- Fetch directory trees (e.g. for documentation ingestion into RAG).
- Token management: supports GITHUB_TOKEN / GH_TOKEN from .env or request headers.
- SSRF and security validation using SecurityManager.
- Graceful error handling for rate limits (403), missing repos (404), and offline states.
- Mock/test mode support via .env for hermetic unit testing.
"""

import base64
import json
import logging
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from pipeline.security import SecurityManager

logger = logging.getLogger("github_service")


@dataclass
class GitHubResource:
    """Represents a fetched GitHub resource."""
    resource_type: str  # "pull_request" | "file" | "directory" | "raw"
    owner: str
    repo: str
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    diff: Optional[str] = None
    files: List[Dict[str, Any]] = field(default_factory=list)
    source_url: str = ""
    is_test_mock: bool = False


class GitHubService:
    """
    Central service for fetching repository data, PRs, and documentation from GitHub.
    """

    GITHUB_API_BASE = "https://api.github.com"
    RAW_BASE = "https://raw.githubusercontent.com"

    def __init__(
        self,
        default_token: Optional[str] = None,
        timeout_seconds: float = 15.0,
        user_agent: str = "Myco-Intelligence-Platform/1.0",
    ):
        self.default_token = default_token or os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN") or ""
        self.timeout_seconds = timeout_seconds
        self.user_agent = user_agent

    def get_token(self, request_token: Optional[str] = None) -> str:
        """Returns the active GitHub token, prioritizing request headers over .env."""
        token = request_token or os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN") or self.default_token or ""
        return token.strip()

    def parse_github_url(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Parses GitHub URLs into structured components.

        Supported formats:
        - https://github.com/owner/repo/pull/123
        - https://github.com/owner/repo/pull/123.diff
        - https://github.com/owner/repo/blob/main/path/to/file.ts
        - https://github.com/owner/repo/raw/main/path/to/file.ts
        - https://github.com/owner/repo/tree/main/docs
        - https://github.com/owner/repo
        - https://raw.githubusercontent.com/owner/repo/main/path/to/file.ts
        """
        if not url or not isinstance(url, str):
            return None

        clean_url = url.strip()

        # Raw user content
        raw_match = re.match(
            r"^https?://raw\.githubusercontent\.com/([^/]+)/([^/]+)/([^/]+)/(.+)$",
            clean_url,
            re.IGNORECASE,
        )
        if raw_match:
            return {
                "type": "raw_file",
                "owner": raw_match.group(1),
                "repo": raw_match.group(2),
                "ref": raw_match.group(3),
                "path": raw_match.group(4),
                "url": clean_url,
            }

        # Standard github.com URL
        gh_match = re.match(r"^https?://github\.com/([^/]+)/([^/]+)(?:/(.*))?$", clean_url, re.IGNORECASE)
        if not gh_match:
            return None

        owner = gh_match.group(1)
        repo = gh_match.group(2)
        if repo.endswith(".git"):
            repo = repo[:-4]

        rest = gh_match.group(3) or ""

        # Pull Request URL: pull/123
        pr_match = re.match(r"^pull/(\d+)(?:\.(?:diff|patch)|/files)?$", rest, re.IGNORECASE)
        if pr_match:
            return {
                "type": "pull_request",
                "owner": owner,
                "repo": repo,
                "pull_number": int(pr_match.group(1)),
                "url": clean_url,
            }

        # Blob / File URL: blob/ref/path
        blob_match = re.match(r"^(?:blob|raw)/([^/]+)/(.+)$", rest, re.IGNORECASE)
        if blob_match:
            return {
                "type": "file",
                "owner": owner,
                "repo": repo,
                "ref": blob_match.group(1),
                "path": blob_match.group(2),
                "url": clean_url,
            }

        # Tree / Directory URL: tree/ref/path
        tree_match = re.match(r"^tree/([^/]+)(?:/(.+))?$", rest, re.IGNORECASE)
        if tree_match:
            return {
                "type": "directory",
                "owner": owner,
                "repo": repo,
                "ref": tree_match.group(1),
                "path": tree_match.group(2) or "",
                "url": clean_url,
            }

        # Entire repository
        return {
            "type": "repository",
            "owner": owner,
            "repo": repo,
            "url": clean_url,
        }

    def _make_request(
        self,
        endpoint_or_url: str,
        token: Optional[str] = None,
        accept: str = "application/vnd.github.v3+json",
    ) -> Tuple[bool, int, Any, Dict[str, str]]:
        """
        Executes HTTP request to GitHub API with SSRF check and error normalization.
        """
        if endpoint_or_url.startswith("http://") or endpoint_or_url.startswith("https://"):
            url = endpoint_or_url
        else:
            url = f"{self.GITHUB_API_BASE}/{endpoint_or_url.lstrip('/')}"

        # SSRF validation
        is_safe, ssrf_err = SecurityManager.validate_repository_url(url)
        if not is_safe:
            return False, 400, {"error": f"Security violation: {ssrf_err}"}, {}

        active_token = self.get_token(token)
        headers = {
            "User-Agent": self.user_agent,
            "Accept": accept,
        }
        if active_token:
            headers["Authorization"] = f"Bearer {active_token}"

        req = urllib.request.Request(url, headers=headers, method="GET")

        try:
            with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
                resp_status = resp.status
                resp_headers = dict(resp.headers)
                raw_bytes = resp.read()

                if "application/json" in accept or "application/vnd.github" in accept and "diff" not in accept:
                    try:
                        parsed = json.loads(raw_bytes.decode("utf-8"))
                        return True, resp_status, parsed, resp_headers
                    except Exception:
                        return True, resp_status, raw_bytes.decode("utf-8", errors="replace"), resp_headers
                else:
                    return True, resp_status, raw_bytes.decode("utf-8", errors="replace"), resp_headers

        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            try:
                err_json = json.loads(err_body)
            except Exception:
                err_json = {"message": err_body}
            logger.warning("GitHub API HTTPError %d: %s", e.code, err_json.get("message", e.reason))
            return False, e.code, err_json, dict(e.headers)

        except urllib.error.URLError as e:
            logger.error("GitHub API connection error: %s", e.reason)
            return False, 503, {"error": f"Network error connecting to GitHub: {e.reason}"}, {}
        except Exception as e:
            logger.error("GitHub API unexpected error: %s", str(e))
            return False, 500, {"error": str(e)}, {}

    def fetch_pull_request(
        self,
        owner: str,
        repo: str,
        pull_number: int,
        token: Optional[str] = None,
    ) -> Tuple[bool, Optional[GitHubResource], str]:
        """
        Fetches PR metadata, diff, and changed files list from GitHub.
        """
        # Check if local test mock data is requested via .env
        test_diff_env = os.getenv("TEST_GITHUB_PR_DIFF")
        if test_diff_env:
            return True, GitHubResource(
                resource_type="pull_request",
                owner=owner,
                repo=repo,
                content=test_diff_env,
                diff=test_diff_env,
                metadata={"title": f"Test PR #{pull_number}", "number": pull_number},
                source_url=f"https://github.com/{owner}/{repo}/pull/{pull_number}",
                is_test_mock=True,
            ), "Loaded from test environment"

        # 1. Fetch PR metadata
        ok_meta, status_meta, meta, _ = self._make_request(
            f"repos/{owner}/{repo}/pulls/{pull_number}",
            token=token,
        )
        if not ok_meta:
            err_msg = meta.get("message", "Failed to fetch PR metadata")
            if status_meta == 404:
                return False, None, f"GitHub Pull Request {owner}/{repo}#{pull_number} not found or repository is private."
            if status_meta == 403:
                return False, None, "GitHub API rate limit exceeded or access forbidden. Configure GITHUB_TOKEN."
            return False, None, f"GitHub error ({status_meta}): {err_msg}"

        # 2. Fetch unified diff
        ok_diff, status_diff, diff_text, _ = self._make_request(
            f"repos/{owner}/{repo}/pulls/{pull_number}",
            token=token,
            accept="application/vnd.github.v3.diff",
        )
        diff_str = diff_text if ok_diff and isinstance(diff_text, str) else ""

        # 3. Fetch list of changed files
        ok_files, _, files_list, _ = self._make_request(
            f"repos/{owner}/{repo}/pulls/{pull_number}/files",
            token=token,
        )
        files = files_list if ok_files and isinstance(files_list, list) else []

        resource = GitHubResource(
            resource_type="pull_request",
            owner=owner,
            repo=repo,
            content=diff_str or (meta.get("body") or ""),
            diff=diff_str,
            metadata={
                "title": meta.get("title", ""),
                "body": meta.get("body", ""),
                "state": meta.get("state", ""),
                "author": (meta.get("user") or {}).get("login", ""),
                "base_ref": (meta.get("base") or {}).get("ref", "main"),
                "head_ref": (meta.get("head") or {}).get("ref", ""),
                "head_sha": (meta.get("head") or {}).get("sha", ""),
                "changed_files_count": len(files),
            },
            files=files,
            source_url=meta.get("html_url", f"https://github.com/{owner}/{repo}/pull/{pull_number}"),
        )
        return True, resource, "Successfully fetched Pull Request from GitHub."

    def fetch_file(
        self,
        owner: str,
        repo: str,
        path: str,
        ref: str = "main",
        token: Optional[str] = None,
    ) -> Tuple[bool, Optional[GitHubResource], str]:
        """
        Fetches file content from a repository at a specific git ref.
        """
        # Check local test mock override
        test_file_env = os.getenv("TEST_GITHUB_FILE_CONTENT")
        if test_file_env:
            return True, GitHubResource(
                resource_type="file",
                owner=owner,
                repo=repo,
                content=test_file_env,
                metadata={"path": path, "ref": ref},
                source_url=f"https://github.com/{owner}/{repo}/blob/{ref}/{path}",
                is_test_mock=True,
            ), "Loaded from test environment"

        ok, status, data, _ = self._make_request(
            f"repos/{owner}/{repo}/contents/{path}?ref={ref}",
            token=token,
        )
        if not ok:
            err_msg = data.get("message", "File fetch failed")
            return False, None, f"GitHub file error ({status}): {err_msg}"

        if isinstance(data, dict) and data.get("type") == "file":
            encoding = data.get("encoding", "base64")
            raw_content = data.get("content", "")
            if encoding == "base64":
                try:
                    decoded = base64.b64decode(raw_content).decode("utf-8", errors="replace")
                except Exception as e:
                    return False, None, f"Base64 decoding failed: {e}"
            else:
                decoded = raw_content

            resource = GitHubResource(
                resource_type="file",
                owner=owner,
                repo=repo,
                content=decoded,
                metadata={
                    "path": data.get("path", path),
                    "size": data.get("size", 0),
                    "sha": data.get("sha", ""),
                    "ref": ref,
                },
                source_url=data.get("html_url", f"https://github.com/{owner}/{repo}/blob/{ref}/{path}"),
            )
            return True, resource, "Successfully fetched file from GitHub."

        return False, None, f"Expected file at '{path}', found {data.get('type') if isinstance(data, dict) else 'unknown'}"

    def fetch_directory_files(
        self,
        owner: str,
        repo: str,
        path: str = "docs",
        ref: str = "main",
        token: Optional[str] = None,
        extension_filter: Optional[Tuple[str, ...]] = (".md", ".txt", ".markdown"),
    ) -> Tuple[bool, List[GitHubResource], str]:
        """
        Recursively fetches files in a repository directory (ideal for documentation ingestion).
        """
        ok, status, items, _ = self._make_request(
            f"repos/{owner}/{repo}/contents/{path}?ref={ref}",
            token=token,
        )
        if not ok:
            return False, [], f"GitHub directory error ({status}): {items.get('message', 'Failed to list directory')}"

        if not isinstance(items, list):
            return False, [], f"Path '{path}' is not a directory."

        resources: List[GitHubResource] = []

        for item in items:
            item_type = item.get("type")
            item_path = item.get("path", "")
            name = item.get("name", "")

            if item_type == "file":
                if extension_filter and not name.lower().endswith(extension_filter):
                    continue
                file_ok, file_res, _ = self.fetch_file(owner, repo, item_path, ref=ref, token=token)
                if file_ok and file_res:
                    resources.append(file_res)
            elif item_type == "dir":
                # Recurse one level down
                dir_ok, sub_res, _ = self.fetch_directory_files(
                    owner, repo, path=item_path, ref=ref, token=token, extension_filter=extension_filter
                )
                if dir_ok:
                    resources.extend(sub_res)

        return True, resources, f"Fetched {len(resources)} documents from GitHub ({owner}/{repo}/{path})."

    def fetch_from_url(
        self,
        url: str,
        token: Optional[str] = None,
    ) -> Tuple[bool, Optional[GitHubResource], str]:
        """
        Universal entry point: parses URL and retrieves corresponding GitHub data.
        """
        parsed = self.parse_github_url(url)
        if not parsed:
            return False, None, f"Invalid GitHub URL: '{url}' is not a valid github.com repository, pull request, or file URL."

        url_type = parsed.get("type")
        owner = parsed["owner"]
        repo = parsed["repo"]

        if url_type == "pull_request":
            return self.fetch_pull_request(owner, repo, parsed["pull_number"], token=token)
        elif url_type in ("file", "raw_file"):
            return self.fetch_file(owner, repo, parsed["path"], ref=parsed.get("ref", "main"), token=token)
        elif url_type == "directory":
            dir_ok, docs, msg = self.fetch_directory_files(
                owner, repo, path=parsed.get("path", ""), ref=parsed.get("ref", "main"), token=token
            )
            if not dir_ok:
                return False, None, msg
            content_summary = "\n\n".join(f"# {d.metadata.get('path')}\n{d.content}" for d in docs)
            return True, GitHubResource(
                resource_type="directory",
                owner=owner,
                repo=repo,
                content=content_summary,
                files=[{"path": d.metadata.get("path"), "content": d.content} for d in docs],
                source_url=url,
            ), msg
        elif url_type == "repository":
            # Default to README or docs
            return self.fetch_file(owner, repo, "README.md", ref="main", token=token)

        return False, None, f"Unsupported GitHub URL resource type: '{url_type}'"


# Singleton instance
github_service = GitHubService()
