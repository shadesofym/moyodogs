"""Local-only static preview using the same security headers as Cloudflare Pages."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote
from fnmatch import fnmatchcase
ROOT = Path(__file__).resolve().parent.parent / 'dist'
def header_rules():
    rules = []
    pattern = None
    for line in (ROOT / '_headers').read_text().splitlines():
        if not line or line.startswith('#'):
            continue
        if not line.startswith(' '):
            pattern = line.strip()
        elif ':' in line:
            name, value = line.strip().split(':', 1)
            rules.append((pattern, name, value.strip()))
    return rules

def redirects():
    result = {}
    for line in (ROOT / '_redirects').read_text().splitlines():
        if line and not line.startswith('#'):
            old, target, code = line.split()
            result[old] = (target, int(code))
    return result

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def route_redirect(self):
        parsed = urlsplit(self.path)
        rule = redirects().get(unquote(parsed.path))
        if not rule:
            return False
        target, code = rule
        if parsed.query:
            target += ('&' if '?' in target else '?') + parsed.query
        self.send_response(code)
        self.send_header('Location', target)
        self.send_header('Content-Length', '0')
        self.end_headers()
        return True
    def do_GET(self):
        if not self.route_redirect():
            super().do_GET()
    def do_HEAD(self):
        if not self.route_redirect():
            super().do_HEAD()
    def end_headers(self):
        path = urlsplit(self.path).path
        for pattern, name, value in header_rules():
            if pattern and not pattern.startswith('https://') and fnmatchcase(path, pattern):
                self.send_header(name, value)
        super().end_headers()
if __name__ == '__main__':
    print('Lokale Vorschau: http://127.0.0.1:4322/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 4322), Handler).serve_forever()
