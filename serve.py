"""Local preview; serves static assets and provides API Request Pipeline endpoints."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json
import os
import sys
import socket

# Ensure pipeline package is discoverable
sys.path.insert(0, str(Path(__file__).parent))

# Load .env variables if present
env_file = Path(__file__).parent / ".env"
if env_file.exists():
    with open(env_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip()

import urllib.parse

from pipeline.router import pipeline_router
from pipeline.config import config
from pipeline.observability import metrics
from pipeline.quota import quota_service
from pipeline.gateway import gateway
from pipeline.chat_escalation import chat_escalation_service
from pipeline.rag.pipeline import rag_pipeline
from pipeline.github_service import github_service


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path == '/pricing':
            self.send_response(301)
            self.send_header('Location', '/pricing/')
            self.end_headers()
            return

        if self.path == '/api/v1/health':
            health_data = {
                "status": "healthy",
                "service": config.service_name,
                "version": config.version,
                "mycoBackend": {
                    "enabled": config.myco_backend_enabled,
                    "targetUrl": config.myco_backend_url,
                    "unavailablePolicy": config.myco_unavailable_policy,
                },
                "circuitBreaker": metrics._circuit_state,
            }
            body = json.dumps(health_data).encode("utf-8")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path == '/api/v1/metrics':
            summary = metrics.get_summary()
            body = json.dumps(summary).encode("utf-8")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path in ('/api/v1/quota', '/api/v1/demo/allowance'):
            headers = dict(self.headers)
            client_ip = self.client_address[0] if self.client_address else "127.0.0.1"
            user = gateway.authenticate_request(headers, client_ip)
            session_key = quota_service.get_session_key(user.user_id) or quota_service.get_session_fingerprint(user.user_id, client_ip, getattr(user, "user_agent", ""))
            ip_key = quota_service.get_ip_key(client_ip, getattr(user, "user_agent", ""))
            allowance_info = quota_service.get_allowance_info(session_key, ip_key)
            body = json.dumps(allowance_info).encode("utf-8")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path in ('/api/v1/demo/reset', '/api/v1/quota/reset'):
            headers = dict(self.headers)
            client_ip = self.client_address[0] if self.client_address else "127.0.0.1"
            user = gateway.authenticate_request(headers, client_ip)
            session_key = quota_service.get_session_key(user.user_id) or quota_service.get_session_fingerprint(user.user_id, client_ip, getattr(user, "user_agent", ""))
            ip_key = quota_service.get_ip_key(client_ip, getattr(user, "user_agent", ""))
            quota_service.reset_allowance(session_key, ip_key)
            allowance_info = quota_service.get_allowance_info(session_key, ip_key)
            body = json.dumps({"success": True, "message": "Demo allowance reset successfully.", "quota": allowance_info}).encode("utf-8")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path.startswith('/api/v1/github/fetch'):
            parsed_url = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            target_url = query_params.get("url", [""])[0]
            if not target_url:
                err_body = json.dumps({"success": False, "error": "Missing 'url' query parameter"}).encode("utf-8")
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_body)))
                self.end_headers()
                self.wfile.write(err_body)
                return

            gh_token = self.headers.get("x-github-token") or self.headers.get("authorization", "").replace("Bearer ", "")
            ok, resource, msg = github_service.fetch_from_url(target_url, token=gh_token)
            if not ok or not resource:
                status_code = 404 if "not found" in msg.lower() else (403 if "rate limit" in msg.lower() else 400)
                err_body = json.dumps({"success": False, "error": msg}).encode("utf-8")
                self.send_response(status_code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_body)))
                self.end_headers()
                self.wfile.write(err_body)
                return

            resp_data = {
                "success": True,
                "resourceType": resource.resource_type,
                "owner": resource.owner,
                "repo": resource.repo,
                "sourceUrl": resource.source_url,
                "content": resource.content,
                "diff": resource.diff,
                "metadata": resource.metadata,
                "files": resource.files,
                "isTestMock": resource.is_test_mock,
                "message": msg,
            }
            body = json.dumps(resp_data).encode("utf-8")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        # Serve static files as usual
        super().do_GET()

    def do_POST(self):
        if self.path in ('/api/v1/demo/reset', '/api/v1/quota/reset'):
            headers = dict(self.headers)
            client_ip = self.client_address[0] if self.client_address else "127.0.0.1"
            user = gateway.authenticate_request(headers, client_ip)
            session_key = quota_service.get_session_key(user.user_id) or quota_service.get_session_fingerprint(user.user_id, client_ip, getattr(user, "user_agent", ""))
            ip_key = quota_service.get_ip_key(client_ip, getattr(user, "user_agent", ""))
            quota_service.reset_allowance(session_key, ip_key)
            allowance_info = quota_service.get_allowance_info(session_key, ip_key)
            body = json.dumps({"success": True, "message": "Demo allowance reset successfully.", "quota": allowance_info}).encode("utf-8")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path == '/api/chat/ask':
            content_length = int(self.headers.get('Content-Length', 0))
            raw_body = self.rfile.read(content_length) if content_length > 0 else b""
            try:
                payload = json.loads(raw_body.decode('utf-8')) if raw_body else {}
            except Exception:
                payload = {}

            question = payload.get("question") or payload.get("message") or ""
            conversation_context = payload.get("conversationContext") or payload.get("history") or []

            rag_resp = rag_pipeline.answer_question(
                question=question,
                conversation_context=conversation_context,
            )

            resp_bytes = json.dumps(rag_resp.to_dict()).encode("utf-8")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(resp_bytes)))
            self.end_headers()
            self.wfile.write(resp_bytes)
            return

        if self.path == '/api/chat/escalations':
            content_length = int(self.headers.get('Content-Length', 0))
            raw_body = self.rfile.read(content_length) if content_length > 0 else b""
            client_ip = self.client_address[0] if self.client_address else "127.0.0.1"
            status_code, resp_data = chat_escalation_service.process_request(raw_body, client_ip=client_ip)
            resp_bytes = json.dumps(resp_data).encode("utf-8")
            self.send_response(status_code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(resp_bytes)))
            self.end_headers()
            self.wfile.write(resp_bytes)
            return

        if self.path == '/api/leads':
            data = json.dumps({'detail': 'This local preview is not connected to lead delivery. No request has been sent.'}).encode()
            self.send_response(503)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        if self.path in ('/api/v1/analyze', '/api/v1/demo/analyze'):
            content_length = int(self.headers.get('Content-Length', 0))
            raw_body = self.rfile.read(content_length) if content_length > 0 else b""
            headers = dict(self.headers)
            client_ip = self.client_address[0] if self.client_address else "127.0.0.1"

            normalized = pipeline_router.execute(
                raw_body=raw_body,
                headers=headers,
                client_ip=client_ip,
            )

            response_bytes = json.dumps(normalized.to_dict()).encode("utf-8")
            self.send_response(normalized.status_code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_bytes)))
            self.end_headers()
            self.wfile.write(response_bytes)
            return
        if self.path == '/api/v1/github/fetch':
            content_length = int(self.headers.get('Content-Length', 0))
            raw_body = self.rfile.read(content_length) if content_length > 0 else b""
            try:
                payload = json.loads(raw_body.decode('utf-8')) if raw_body else {}
            except Exception:
                payload = {}

            target_url = payload.get("url") or payload.get("repoUrl") or ""
            req_type = payload.get("type", "")
            owner = payload.get("owner", "")
            repo = payload.get("repo", "")
            gh_token = payload.get("token") or self.headers.get("x-github-token") or self.headers.get("authorization", "").replace("Bearer ", "")

            if target_url:
                ok, resource, msg = github_service.fetch_from_url(target_url, token=gh_token)
            elif req_type == "pull_request" or payload.get("pull_number") or payload.get("pull"):
                pull_num = int(payload.get("pull_number") or payload.get("pull") or 0)
                ok, resource, msg = github_service.fetch_pull_request(owner, repo, pull_num, token=gh_token)
            elif req_type == "file" or payload.get("path"):
                path = payload.get("path", "")
                ref = payload.get("ref", "main")
                ok, resource, msg = github_service.fetch_file(owner, repo, path, ref=ref, token=gh_token)
            else:
                ok = False
                resource = None
                msg = "Missing required parameters: provide 'url' or 'owner'/'repo'/'pull_number'."

            if not ok or not resource:
                status_code = 404 if "not found" in msg.lower() else (403 if "rate limit" in msg.lower() else 400)
                resp_bytes = json.dumps({"success": False, "error": msg}).encode("utf-8")
                self.send_response(status_code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(resp_bytes)))
                self.end_headers()
                self.wfile.write(resp_bytes)
                return

            resp_data = {
                "success": True,
                "resourceType": resource.resource_type,
                "owner": resource.owner,
                "repo": resource.repo,
                "sourceUrl": resource.source_url,
                "content": resource.content,
                "diff": resource.diff,
                "metadata": resource.metadata,
                "files": resource.files,
                "isTestMock": resource.is_test_mock,
                "message": msg,
            }
            resp_bytes = json.dumps(resp_data).encode("utf-8")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(resp_bytes)))
            self.end_headers()
            self.wfile.write(resp_bytes)
            return

        if self.path == '/api/chat/ingest/github':
            content_length = int(self.headers.get('Content-Length', 0))
            raw_body = self.rfile.read(content_length) if content_length > 0 else b""
            try:
                payload = json.loads(raw_body.decode('utf-8')) if raw_body else {}
            except Exception:
                payload = {}

            repo_full = payload.get("repo", "")
            owner = payload.get("owner", "")
            if "/" in repo_full and not owner:
                owner, repo_name = repo_full.split("/", 1)
            else:
                repo_name = repo_full or payload.get("repo_name", "")

            path = payload.get("path", "docs")
            ref = payload.get("ref", "main")
            gh_token = payload.get("token") or self.headers.get("x-github-token") or self.headers.get("authorization", "").replace("Bearer ", "")

            if not owner or not repo_name:
                resp_bytes = json.dumps({"success": False, "error": "Missing repository owner or repo name"}).encode("utf-8")
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(resp_bytes)))
                self.end_headers()
                self.wfile.write(resp_bytes)
                return

            chunks_ingested, failures = rag_pipeline.ingest_from_github(
                owner=owner, repo=repo_name, path=path, ref=ref, token=gh_token
            )
            resp_bytes = json.dumps({
                "success": chunks_ingested > 0 or len(failures) == 0,
                "chunksIngested": chunks_ingested,
                "failures": failures,
                "message": f"Ingested {chunks_ingested} chunks from GitHub {owner}/{repo_name}/{path}"
            }).encode("utf-8")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(resp_bytes)))
            self.end_headers()
            self.wfile.write(resp_bytes)
            return

        self.send_error(404)


class DualStackServer(ThreadingHTTPServer):
    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except (AttributeError, OSError):
            pass
        super().server_bind()


if __name__ == '__main__':
    os.chdir(Path(__file__).parent)
    DualStackServer.allow_reuse_address = True
    port = int(os.environ.get("PORT", 8766))
    try:
        class IPv6Server(DualStackServer):
            address_family = socket.AF_INET6
        httpd = IPv6Server(("", port), Handler)
    except Exception:
        httpd = DualStackServer(("0.0.0.0", port), Handler)

    print(f"Starting server at http://127.0.0.1:{port} and http://localhost:{port} ...")
    httpd.serve_forever()


