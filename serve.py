"""Local preview; serves static assets and provides API Request Pipeline endpoints."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json
import os
import sys

# Ensure pipeline package is discoverable
sys.path.insert(0, str(Path(__file__).parent))

from pipeline.router import pipeline_router
from pipeline.config import config
from pipeline.observability import metrics
from pipeline.quota import quota_service
from pipeline.gateway import gateway


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
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

        self.send_error(404)


if __name__ == '__main__':
    os.chdir(Path(__file__).parent)
    ThreadingHTTPServer(('127.0.0.1', 8766), Handler).serve_forever()

