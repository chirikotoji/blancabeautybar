#!/usr/bin/env python3
"""Tiny HTTP receiver — accepts POST with binary/multipart bodies and saves to media/ig/."""
import http.server, os, time, cgi
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'media' / 'ig'
OUT.mkdir(parents=True, exist_ok=True)

class H(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
        self.send_header('Access-Control-Allow-Headers', '*')

    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()

    def do_GET(self):
        self.send_response(200); self._cors()
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'OK')

    def do_POST(self):
        ctype = self.headers.get('Content-Type', '')
        length = int(self.headers.get('Content-Length', 0) or 0)
        try:
            if ctype.startswith('multipart/form-data'):
                form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ={'REQUEST_METHOD':'POST','CONTENT_TYPE':ctype})
                count = 0
                for k in form.keys():
                    item = form[k]
                    fname = getattr(item, 'filename', None) or f'{k}.bin'
                    fname = os.path.basename(fname)
                    data = item.file.read() if hasattr(item, 'file') else item.value
                    if isinstance(data, str): data = data.encode()
                    (OUT / fname).write_bytes(data)
                    print(f'saved {fname} ({len(data):,} bytes)')
                    count += 1
                self.send_response(200); self._cors(); self.end_headers()
                self.wfile.write(f'saved {count}'.encode())
            else:
                # Raw body — name from path
                name = self.path.lstrip('/') or f'upload-{int(time.time()*1000)}.bin'
                name = os.path.basename(name)
                data = self.rfile.read(length)
                (OUT / name).write_bytes(data)
                print(f'saved {name} ({len(data):,} bytes)')
                self.send_response(200); self._cors(); self.end_headers()
                self.wfile.write(b'ok')
        except Exception as e:
            print(f'error: {e}')
            self.send_response(500); self._cors(); self.end_headers()
            self.wfile.write(str(e).encode())

    def log_message(self, *a): pass

if __name__ == '__main__':
    port = 9979
    print(f'recv.py listening on http://127.0.0.1:{port}  -> {OUT}')
    http.server.HTTPServer(('127.0.0.1', port), H).serve_forever()
