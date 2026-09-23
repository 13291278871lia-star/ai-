#!/usr/bin/env python3
"""Run the local MVP at http://127.0.0.1:4175."""
import json
import os
import re
import unicodedata
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse


class AppHandler(SimpleHTTPRequestHandler):
    extensions_map = SimpleHTTPRequestHandler.extensions_map | {
        ".js": "application/javascript",
        ".mjs": "application/javascript",
    }

    def end_headers(self):
        # The MVP is edited frequently. Avoid showing colleagues an older cached UI.
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def do_GET(self):
        request = urlparse(self.path)
        if request.path == "/api/library-files":
            self.send_library_files(parse_qs(request.query))
            return
        if request.path == "/api/product-content":
            self.send_product_content(parse_qs(request.query))
            return
        super().do_GET()

    def send_library_files(self, query):
        library = query.get("library", [""])[0]
        folder = query.get("folder", [""])[0]
        roots = {
            "tax": Path("assets/library/01_友扣稅"),
            "health": Path("assets/library/02_AIA健康系列"),
        }
        base = roots.get(library)
        if not base or not folder:
            self.send_error(400, "Invalid library request")
            return

        site_root = Path.cwd().resolve()
        base_path = (site_root / base).resolve()
        target = (base_path / folder).resolve()
        try:
            target.relative_to(base_path)
        except ValueError:
            self.send_error(400, "Invalid folder")
            return
        if not target.is_dir():
            self.send_error(404, "Product folder not found")
            return

        files = [
            {"name": item.name, "path": item.relative_to(site_root).as_posix()}
            for item in sorted(target.iterdir(), key=lambda item: item.name.casefold())
            if item.is_file() and item.suffix.lower() == ".pdf"
        ]
        body = json.dumps({"files": files}, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def send_product_content(self, query):
        library = query.get("library", [""])[0]
        folder = query.get("folder", [""])[0]
        try:
            fields = json.loads(query.get("fields", ["[]"])[0])
        except json.JSONDecodeError:
            self.send_error(400, "Invalid field request")
            return
        if not isinstance(fields, list) or len(fields) > 32:
            self.send_error(400, "Invalid field request")
            return

        site_root = Path.cwd().resolve()
        library_root = (site_root / "assets" / "library" / library).resolve()
        target = (library_root / folder).resolve()
        try:
            target.relative_to(library_root)
        except ValueError:
            self.send_error(400, "Invalid product request")
            return
        if not library_root.is_dir() or not target.is_dir():
            self.send_error(404, "Product folder not found")
            return

        clean_fields = []
        for field in fields:
            if not isinstance(field, dict):
                continue
            key, label, aliases = field.get("key"), field.get("label"), field.get("aliases", [])
            if not isinstance(key, str) or not isinstance(label, str):
                continue
            if not isinstance(aliases, list):
                aliases = []
            clean_keywords = [word for word in aliases[:16] if isinstance(word, str) and 0 < len(word) <= 30]
            if clean_keywords:
                clean_fields.append({"key": key[:60], "label": label[:80], "keywords": clean_keywords})

        try:
            from pypdf import PdfReader
        except ImportError:
            self.send_error(500, "PDF reader unavailable")
            return

        def normalized(value):
            value = unicodedata.normalize("NFKC", value).translate(str.maketrans({
                "終": "终", "賠": "赔", "額": "额", "醫": "医", "療": "疗", "墊": "垫",
                "費": "费", "類": "类", "別": "别", "術": "术", "護": "护", "計": "计", "劃": "划",
            }))
            return re.sub(r"[\s\W_]+", "", value)

        extracted = {field["key"]: [] for field in clean_fields}
        source_files = []
        for item in sorted(target.iterdir(), key=lambda entry: entry.name.casefold()):
            if not item.is_file() or item.suffix.lower() != ".pdf":
                continue
            try:
                reader = PdfReader(str(item))
                lines = []
                for page in reader.pages:
                    text = page.extract_text() or ""
                    lines.extend(line.strip() for line in text.splitlines() if line.strip())
                source_files.append(item.name)
            except Exception:
                continue
            for field in clean_fields:
                normalized_keywords = [normalized(word) for word in field["keywords"]]
                for index, line in enumerate(lines):
                    if any(word in normalized(line) for word in normalized_keywords):
                        evidence = " ".join(lines[max(0, index - 1):min(len(lines), index + 2)])[:360]
                        value = " ".join(lines[index:min(len(lines), index + 3)])[:220]
                        extracted[field["key"]].append({"value": value, "evidence": evidence, "source": item.name, "found": True})
                        break

        result = {
            "productName": folder,
            "textRead": bool(source_files),
            "sourceFiles": source_files,
            "fields": {
                field["key"]: {"label": field["label"], "results": extracted[field["key"]] or [{"value": "資料暫未提供", "evidence": "", "source": "", "found": False}]}
                for field in clean_fields
            },
        }
        body = json.dumps(result, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "4175"))
    server = ThreadingHTTPServer(("127.0.0.1", port), AppHandler)
    print(f"AI 工作台 MVP 已启动：http://127.0.0.1:{port}")
    server.serve_forever()
