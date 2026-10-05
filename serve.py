#!/usr/bin/env python3
"""Run the local MVP at http://127.0.0.1:4175."""
import json
import os
import re
import unicodedata
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse


import irr_model
import proposal_parse
from proposal_parse import parse_proposal


def default_cfg(parsed, overrides=None):
    """Map a parsed proposal onto the config the deck/IRR model expects."""
    p = dict(parsed.get("profile") or {})
    cfg = {
        "product": p.get("product"),
        "insured": p.get("insured"),
        "gender": p.get("gender"),
        "age": p.get("age"),
        "years": p.get("years"),
        "premium": p.get("premium"),
        "levy": p.get("levy") or 0.0,
        "fx": p.get("fx") or 6.8,
        "endAge": 100,
        "irrCap": p.get("irrCap") or irr_model.DEFAULT_IRR_CAP,
        "includeLevy": irr_model.DEFAULT_INCLUDE_LEVY,
        "showYears": [20, 30, 40, 50],
        "detail": parsed.get("detail") or {},
        "withdrawal": parsed.get("withdrawalPlan"),
        "promo": {},
        "insuredTitle": None,
        "target": None,
        "advantage": None,
    }
    cfg.update(overrides or {})
    return cfg


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

    def do_POST(self):
        request = urlparse(self.path)
        if request.path == "/api/ppt-from-template":
            self.send_template_ppt()
            return
        if request.path == "/api/parse-proposal":
            self.send_parsed_proposal()
            return
        if request.path == "/api/verify-irr":
            self.send_irr_verification()
            return
        self.send_error(404, "Not found")

    def _read_json(self, limit):
        length = int(self.headers.get("Content-Length", 0) or 0)
        if length <= 0 or length > limit:
            self.send_error(400, "Invalid request size")
            return None
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return None
        if not isinstance(payload, dict):
            self.send_error(400, "Expected a JSON object")
            return None
        return payload

    def _template_path(self):
        template_path = Path("assets/ppt-reference/gf-template.pptx")
        site_root = Path.cwd().resolve()
        template_path = (site_root / template_path).resolve()
        try:
            template_path.relative_to(site_root)
        except ValueError:
            return None
        return template_path if template_path.is_file() else None

    def send_template_ppt(self):
        """Fill the user's GF template (server-side, python-pptx) and return a
        7-page client overview. The browser cannot do this with pptxgenjs
        because that library can only build a deck from scratch, not open an
        existing template.

        Accepts either the raw parse result (`proposal`) from
        /api/parse-proposal or a hand-built `{profile, rows}` payload; the
        seven pages are only filled where the proposal actually carries the
        number, everything else keeps the template's placeholder.
        """
        payload = self._read_json(4_000_000)
        if payload is None:
            return
        proposal = payload.get("proposal") if isinstance(payload.get("proposal"), dict) else None
        profile = payload.get("profile") if isinstance(payload.get("profile"), dict) else {}
        rows = payload.get("rows") if isinstance(payload.get("rows"), list) else []

        if proposal is None:
            # Hand-entered data: rebuild a minimal `detail` from the rows the
            # browser already validated (year, guaranteed, non-guaranteed).
            detail = {}
            for row in rows:
                if len(row) < 3:
                    continue
                year, guaranteed, bonus = int(row[0]), float(row[1]), float(row[2])
                detail[str(year)] = {
                    "year": year, "age": int(profile.get("age") or 0) + year,
                    "guaranteed": guaranteed, "reversionary": bonus, "terminal": 0.0,
                    "total": guaranteed + bonus, "page": None,
                }
            proposal = {"known": bool(detail), "profile": profile, "detail": detail,
                        "withdrawalPlan": None, "stated": {}, "residual": {}, "warnings": []}

        cfg = default_cfg(proposal, payload.get("cfg") if isinstance(payload.get("cfg"), dict) else None)
        # Trust the browser's own inputs for anything the user typed over.
        for key in ("product", "age", "years", "premium", "levy", "fx"):
            if key in profile and profile[key] not in (None, ""):
                cfg[key] = profile[key]
        if not cfg.get("detail"):
            self.send_error(400, "Missing yearly surrender values (rows)")
            return

        template_path = self._template_path()
        if template_path is None:
            self.send_error(404, "GF template not found at assets/ppt-reference/gf-template.pptx")
            return
        try:
            import pptx  # noqa: F401
            import deck_builder
        except ImportError as exc:
            self.send_error(500, f"Missing dependency: {exc}. Run: pip install python-pptx")
            return
        try:
            plan = irr_model.build_plan(cfg)
            checks = irr_model.verify(cfg, proposal, plan)
            failed = [check for check in checks if check.get("status") == "fail"]
            if failed:
                detail = "；".join(f"{check.get('name')}：{check.get('detail', '')}" for check in failed)
                self.send_error(422, f"IRR verification failed; PPT was not generated. {detail}")
                return
            data = deck_builder.build_overview_deck(
                cfg, plan, template_path,
                keep_scenario_pages=bool(payload.get("keepScenarioPages")),
            )
        except Exception as exc:  # surface the real cause to the browser
            self.send_error(500, f"Template build failed: {exc}")
            return

        fname = (str(cfg.get("product") or "overview").replace("/", "_"))[:60]
        disp_name = f"{fname}_概览.pptx"
        # HTTP headers are latin-1; provide an ASCII fallback plus a UTF-8
        # filename* (RFC 5987) so browsers get the proper Chinese name.
        self.send_response(200)
        self.send_header("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation")
        self.send_header("Content-Disposition", f'attachment; filename="policy_overview.pptx"; filename*=UTF-8\'\'{quote(disp_name)}')
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def send_irr_verification(self):
        """Independently re-derive every headline number and report
        PASS / WARN / FAIL per check, with the proposal page each figure came
        from. This is the "is my IRR right?" button: it never reuses the
        number it is checking — it recomputes it a second, different way."""
        payload = self._read_json(4_000_000)
        if payload is None:
            return
        proposal = payload.get("proposal") if isinstance(payload.get("proposal"), dict) else None
        profile = payload.get("profile") if isinstance(payload.get("profile"), dict) else {}
        rows = payload.get("rows") if isinstance(payload.get("rows"), list) else []

        if proposal is None:
            detail = {}
            for row in rows:
                if len(row) < 3:
                    continue
                year, guaranteed, bonus = int(row[0]), float(row[1]), float(row[2])
                detail[str(year)] = {
                    "year": year, "age": int(profile.get("age") or 0) + year,
                    "guaranteed": guaranteed, "reversionary": bonus, "terminal": 0.0,
                    "total": guaranteed + bonus, "page": None,
                }
            proposal = {"known": bool(detail), "profile": profile, "detail": detail,
                        "withdrawalPlan": None, "stated": {}, "residual": {}, "warnings": []}

        cfg = default_cfg(proposal, payload.get("cfg") if isinstance(payload.get("cfg"), dict) else None)
        for key in ("product", "age", "years", "premium", "levy", "fx"):
            if key in profile and profile[key] not in (None, ""):
                cfg[key] = profile[key]
        if not cfg.get("detail"):
            self.send_error(400, "Missing yearly surrender values (rows)")
            return
        try:
            plan = irr_model.build_plan(cfg)
            checks = irr_model.verify(cfg, proposal, plan)
        except Exception as exc:
            self.send_error(500, f"IRR verification failed: {exc}")
            return

        body = json.dumps({
            "checks": checks,
            "summary": {
                "pass": sum(1 for c in checks if c["status"] == "pass"),
                "warn": sum(1 for c in checks if c["status"] == "warn"),
                "fail": sum(1 for c in checks if c["status"] == "fail"),
            },
            "table": [{
                "year": r["year"], "age": r["age"], "usd": r["usd"], "rmb": r["rmb"],
                "rate": r["rate"], "guaranteed": r["guaranteed"], "page": r.get("page"),
            } for r in plan["table"]],
            "withdrawal": ({
                "startAge": plan["withdrawal"]["startAge"], "endAge": plan["withdrawal"]["endAge"],
                "annual": plan["withdrawal"]["annual"], "count": plan["withdrawal"]["count"],
                "totalWithdrawn": plan["withdrawal"]["totalWithdrawn"],
                "residual": plan["withdrawal"]["residual"],
                "grandTotal": plan["withdrawal"]["grandTotal"],
                "multiple": plan["withdrawal"]["multiple"], "rate": plan["withdrawal"]["rate"],
            } if plan.get("withdrawal") else None),
            "promo": plan["promo"],
            "payments": plan["payments"],
            "sourcePages": proposal.get("sourcePages") or {},
            "warnings": proposal.get("warnings") or [],
        }, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)
    def send_parsed_proposal(self):
        """Auto-parse an AIA proposal PDF server-side (pdfplumber).

        Returns {known, profile, rows, detail, stated, withdrawalPlan,
        residual, sourcePages, rowCount, warnings}. The browser calls this on
        PDF upload; if known=true it auto-applies the result and triggers the
        template-PPT download, so the whole upload→PPT flow is one action.
        Falls back to in-browser manual mapping when known=false or pdfplumber
        is unavailable. `detail` carries every parsed year with its source page
        so the IRR verification panel can quote where a number came from.
        """
        length = int(self.headers.get("Content-Length", 0) or 0)
        if length <= 0 or length > 10_000_000:
            self.send_error(400, "Invalid request size")
            return
        raw = self.rfile.read(length)
        try:
            import pdfplumber  # noqa: F401
        except ImportError:
            self.send_error(500, "pdfplumber not installed. Run: pip install pdfplumber")
            return
        try:
            result = parse_proposal(raw)
        except Exception as exc:  # surface the real cause to the browser
            self.send_error(500, f"PDF parse failed: {exc}")
            return
        body = json.dumps(result, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

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


def auto_pull():
    """启动时从 GitHub 拉取最新代码，确保工作平台始终是最新版本。"""
    import subprocess
    try:
        result = subprocess.run(
            ["git", "pull", "--ff-only", "origin", "main"],
            capture_output=True, text=True, timeout=15, cwd=os.path.dirname(os.path.abspath(__file__))
        )
        if result.returncode == 0:
            print(f"[auto-pull] 已检查更新: {result.stdout.strip() or '已是最新'}")
        else:
            print(f"[auto-pull] 拉取跳过: {result.stderr.strip()[:80]}")
    except Exception as e:
        print(f"[auto-pull] 跳过（{e}）")


def start_periodic_pull(interval=60):
    """后台线程每 interval 秒拉取一次最新代码。"""
    import threading
    def loop():
        import time
        while True:
            time.sleep(interval)
            auto_pull()
    t = threading.Thread(target=loop, daemon=True)
    t.start()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "4175"))
    if os.environ.get("AUTO_PULL") == "1":
        auto_pull()
        start_periodic_pull(60)
    server = ThreadingHTTPServer(("127.0.0.1", port), AppHandler)
    print(f"AI 工作台 MVP 已启动：http://127.0.0.1:{port}")
    server.serve_forever()
