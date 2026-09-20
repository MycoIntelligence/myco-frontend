"""Local preview; no form submissions are forwarded or stored."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json
import os

class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/leads':
            data = json.dumps({'detail': 'This local preview is not connected to lead delivery. No request has been sent.'}).encode()
            self.send_response(503)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            self.send_error(404)

if __name__ == '__main__':
    os.chdir(Path(__file__).parent)
    ThreadingHTTPServer(('127.0.0.1', 8766), Handler).serve_forever()
