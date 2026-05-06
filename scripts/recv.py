#!/usr/bin/env python3
"""HTTP receiver — accepts file uploads via form POST. Has /upload form page and /save endpoint."""
import http.server, os, time, cgi
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'media' / 'ig'
OUT.mkdir(parents=True, exist_ok=True)

FORM = b"""<!doctype html><html><body><form method=post enctype=multipart/form-data action='/save'><input type=file name=file id=fi accept='image/*' multiple><button type=submit id=sb>save</button></form><div id=log></div></body></html>"""

class H(http.server.BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.0'
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Connection', 'close')

    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()

    def do_GET(self):
        path = self.path.split('?')[0]
        if path in ('/', '/upload', '/upload/'):
            self.send_response(200); self._cors()
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(FORM)))
            self.end_headers(); self.wfile.write(FORM)
        else:
            # Return empty 200 for favicon and any other path so browser doesn't hang on pending requests
            self.send_response(200); self._cors()
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Content-Length', '0')
            self.end_headers()

    def do_POST(self):
        if self.path != '/save':
            self.send_response(404); self._cors(); self.end_headers(); return
        ctype = self.headers.get('Content-Type', '')
        try:
            form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ={'REQUEST_METHOD':'POST','CONTENT_TYPE':ctype})
            count = 0
            for k in form.keys():
                item = form[k]
                items = item if isinstance(item, list) else [item]
                for it in items:
                    fname = getattr(it, 'filename', None)
                    if not fname: continue
                    fname = os.path.basename(fname) or f'upload-{int(time.time()*1000)}.bin'
                    data = it.file.read()
                    if isinstance(data, str): data = data.encode()
                    if len(data) < 1000: continue
                    (OUT / fname).write_bytes(data)
                    print(f'  saved {fname} ({len(data):,} bytes)')
                    count += 1
            self.send_response(200); self._cors(); self.end_headers()
            self.wfile.write(f'saved {count} file(s)'.encode())
        except Exception as e:
            print(f'error: {e}')
            self.send_response(500); self._cors(); self.end_headers()
            self.wfile.write(str(e).encode())

    def log_message(self, *a): pass

if __name__ == '__main__':
    port = 9979
    print(f'recv.py listening on http://127.0.0.1:{port}/upload  -> {OUT}')
    http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
