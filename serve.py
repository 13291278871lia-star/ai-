#!/usr/bin/env python3
"""Run the local MVP at http://127.0.0.1:4175."""

import io
import json
import os
import re
import subprocess
import threading
import time
import unicodedata
import zipfile
from functools import lru_cache
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, quote, unquote, urlparse

import irr_model
from proposal_parse import parse_proposal

# 所有路径都基于本文件所在目录，不再依赖"从哪个目录启动"。
SITE_ROOT = Path(__file__).resolve().parent

# 资料库白名单：前端传 key（tax/health）或目录名都可以，其余一律拒绝。
LIBRARY_DIRS = {"tax": "01_友扣稅", "health": "02_AIA健康系列"}

# proposal 里没有汇率时的兜底值。面向客户的 PPT 会用到它，请定期核对，
# 也可以用环境变量 DEFAULT_FX 覆盖。
DEFAULT_FX = float(os.environ.get("DEFAULT_FX", "6.8"))

# 不允许通过静态服务下载的文件类型 / 以 "." 开头的路径（.git、.env 等）
BLOCKED_SUFFIXES = {".py", ".pyc", ".bat", ".command"}

_TRAD_TO_SIMP = str.maketrans({
    "終": "终", "賠": "赔", "額": "额", "醫": "医", "療": "疗", "墊": "垫",
    "費": "费", "類": "类", "別": "别", "術": "术", "護": "护", "計": "计", "劃": "划",
})


def resolve_library(value):
    """Return the real library folder name, or None if not allowed."""
    if value in LIBRARY_DIRS:
        return LIBRARY_DIRS[value]
    if value in LIBRARY_DIRS.values():
        return value
    return None


def default_cfg(parsed, overrides=None):
    """Map a parsed proposal onto the config the deck/IRR model expects."""
    p = dict(parsed.get("profile") or {})
    fx = p.get("fx")
    if not fx:
        fx = DEFAULT_FX
        print(f"[warn] proposal 未提供汇率，使用默认值 {DEFAULT_FX}，请确认是否合适")
    cfg = {
        "product": p.get("product"),
        "insured": p.get("insured"),
        "gender": p.get("gender"),
        "age": p.get("age"),
        "years": p.get("years"),
        "premium": p.get("premium"),
        "levy": p.get("levy") or 0.0,
        "fx": fx,
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


def build_request_context(payload):
    """Shared by /api/ppt-* and /api/verify-irr.

    Returns (proposal, cfg). Raises ValueError with a user-readable message
    when the submitted data is unusable.
    """
    proposal = payload.get("proposal") if isinstance(payload.get("proposal"), dict) else None
    profile = payload.get("profile") if isinstance(payload.get("profile"), dict) else {}
    rows = payload.get("rows") if isinstance(payload.get("rows"), list) else []

    if proposal is None:
        # Hand-entered data: rebuild a minimal `detail` from the rows.
        detail = {}
        try:
            base_age = int(float(profile.get("age") or 0))
            for row in rows:
                if not isinstance(row, (list, tuple)) or len(row) < 3:
                    continue
                year = int(float(row[0]))
                guaranteed = float(row[1])
                bonus = float(row[2])
                detail[str(year)] = {
                    "year": year, "age": base_age + year,
                    "guaranteed": guaranteed, "reversionary": bonus, "terminal": 0.0,
                    "total": guaranteed + bonus, "page": None,
                }
        except (TypeError, ValueError) as exc:
            raise ValueError(f"年度数据或年龄格式不正确，请检查是否包含非数字内容：{exc}") from exc
        proposal = {"known": bool(detail), "profile": profile, "detail": detail,
                    "withdrawalPlan": None, "stated": {}, "residual": {}, "warnings": []}

    overrides = payload.get("cfg") if isinstance(payload.get("cfg"), dict) else None
    cfg = default_cfg(proposal, overrides)

    # Trust the browser's own inputs for anything the user typed over.
    for key in ("product", "age", "years", "premium", "levy", "fx"):
        if key in profile and profile[key] not in (None, ""):
            cfg[key] = profile[key]

    if not cfg.get("detail"):
        raise ValueError("Missing yearly surrender values (rows)")
    return proposal, cfg


@lru_cache(maxsize=512)
def _pdf_lines(path_str, mtime_ns):
    """Read one PDF once; cached until the file changes (mtime is part of the key)."""
    from pypdf import PdfReader
    reader = PdfReader(path_str)
    lines = []
    for page in reader.pages:
        text = page.extract_text() or ""
        lines.extend(line.strip() for line in text.splitlines() if line.strip())
    lines = tuple(lines)
    return lines, tuple(_normalize(line) for line in lines)


def _normalize(value):
    value = unicodedata.normalize("NFKC", value).translate(_TRAD_TO_SIMP)
    return re.sub(r"[\s\W_]+", "", value)


class AppHandler(SimpleHTTPRequestHandler):
    extensions_map = SimpleHTTPRequestHandler.extensions_map | {
        ".js": "application/javascript",
        ".mjs": "application/javascript",
    }

    def __init__(self, *args, **kwargs):
        # 静态文件始终从项目目录提供，而不是"当前工作目录"
        super().__init__(*args, directory=str(SITE_ROOT), **kwargs)

    # ------------------------------------------------------------------ #
    # 通用响应工具
    # ------------------------------------------------------------------ #
    def end_headers(self):
        # 页面/脚本频繁修改，避免同事看到旧版本；
        # 但 assets（大 PDF 等）允许"校验后复用"，不必每次重新下载。
        path = urlparse(self.path).path
        if path.startswith("/assets/"):
            self.send_header("Cache-Control", "no-cache")
        else:
            self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def send_text_error(self, status, message):
        """Replacement for send_error().

        send_error() puts `message` into the HTTP status line, which must be
        latin-1; Chinese text there raises UnicodeEncodeError and the browser
        only sees a dropped connection. Here the message goes in the body.
        """
        body = str(message).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self, limit):
        try:
            length = int(self.headers.get("Content-Length", 0) or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > limit:
            self.send_text_error(400, "Invalid request size")
            return None
        return self.rfile.read(length)

    def _read_json(self, limit):
        raw = self._read_body(limit)
        if raw is None:
            return None
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            self.send_text_error(400, "Invalid JSON")
            return None
        if not isinstance(payload, dict):
            self.send_text_error(400, "Expected a JSON object")
            return None
        return payload

    # ------------------------------------------------------------------ #
    # 静态文件保护 + 路由
    # ------------------------------------------------------------------ #
    def _is_blocked_path(self):
        parts = [p for p in unquote(urlparse(self.path).path).split("/") if p]
        if any(p.startswith(".") for p in parts):  # .git / .env / .github ...
            return True
        return bool(parts) and Path(parts[-1]).suffix.lower() in BLOCKED_SUFFIXES

    def do_HEAD(self):
        if self._is_blocked_path():
            self.send_text_error(404, "Not found")
            return
        super().do_HEAD()

    def do_GET(self):
        request = urlparse(self.path)
        if request.path == "/api/library-files":
            self.send_library_files(parse_qs(request.query))
            return
        if request.path == "/api/product-content":
            self.send_product_content(parse_qs(request.query))
            return
        if self._is_blocked_path():
            self.send_text_error(404, "Not found")
            return
        super().do_GET()

    def do_POST(self):
        request = urlparse(self.path)
        if request.path == "/api/ppt-from-template":
            self.send_template_ppt()
            return
        if request.path == "/api/ppt-bilingual":
            self.send_template_ppt(bilingual=True)
            return
        if request.path == "/api/parse-proposal":
            self.send_parsed_proposal()
            return
        if request.path == "/api/verify-irr":
            self.send_irr_verification()
            return
        self.send_text_error(404, "Not found")

    def _template_path(self):
        template_path = (SITE_ROOT / "assets/ppt-reference/gf-template.pptx").resolve()
        try:
            template_path.relative_to(SITE_ROOT)
        except ValueError:
            return None
        return template_path if template_path.is_file() else None

    # ------------------------------------------------------------------ #
    # API
    # ------------------------------------------------------------------ #
    def send_template_ppt(self, bilingual=False):
        """Fill the user's GF template (server-side, python-pptx) and return a
        7-page client overview.

        Accepts either the raw parse result (`proposal`) from
        /api/parse-proposal or a hand-built `{profile, rows}` payload; the
        seven pages are only filled where the proposal actually carries the
        number, everything else keeps the template's placeholder.
        """
        payload = self._read_json(4_000_000)
        if payload is None:
            return

        try:
            proposal, cfg = build_request_context(payload)
        except ValueError as exc:
            self.send_text_error(400, exc)
            return

        template_path = self._template_path()
        if template_path is None:
            self.send_text_error(404, "GF template not found at assets/ppt-reference/gf-template.pptx")
            return

        try:
            import pptx  # noqa: F401
            import deck_builder
        except ImportError as exc:
            self.send_text_error(500, f"Missing dependency: {exc}. Run: pip install python-pptx")
            return

        try:
            plan = irr_model.build_plan(cfg)
            checks = irr_model.verify(cfg, proposal, plan)
            failed = [check for check in checks if check.get("status") == "fail"]
            if failed:
                reason = "；".join(f"{check.get('name')}：{check.get('detail', '')}" for check in failed)
                self.send_text_error(422, f"IRR 校验未通过，未生成 PPT。{reason}")
                return
            data = deck_builder.build_overview_deck(
                cfg, plan, template_path,
                keep_scenario_pages=bool(payload.get("keepScenarioPages")),
            )
            safe_name = re.sub(r'[\\/:*?"<>|]', '_', str(cfg.get("product") or "overview"))[:60]
            if bilingual:
                simplified = deck_builder.convert_deck_script(data, "t2s")
                traditional = deck_builder.convert_deck_script(data, "s2t")
                archive = io.BytesIO()
                with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as bundle:
                    bundle.writestr(f"{safe_name}_概览_简体.pptx", simplified)
                    bundle.writestr(f"{safe_name}_概览_繁体.pptx", traditional)
                data = archive.getvalue()
        except Exception as exc:  # surface the real cause to the browser
            self.send_text_error(500, f"Template build failed: {exc}")
            return

        disp_name = f"{safe_name}_概览_简繁体双版本.zip" if bilingual else f"{safe_name}_概览.pptx"

        # HTTP headers are latin-1; provide an ASCII fallback plus a UTF-8
        # filename* (RFC 5987) so browsers get the proper Chinese name.
        content_type = ("application/zip" if bilingual else
                        "application/vnd.openxmlformats-officedocument.presentationml.presentation")
        fallback = "policy_overview_bilingual.zip" if bilingual else "policy_overview.pptx"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Disposition",
                         f'attachment; filename="{fallback}"; filename*=UTF-8\'\'{quote(disp_name)}')
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_irr_verification(self):
        """Independently re-derive every headline number and report
        PASS / WARN / FAIL per check, with the proposal page each figure came
        from. It never reuses the number it is checking."""
        payload = self._read_json(4_000_000)
        if payload is None:
            return

        try:
            proposal, cfg = build_request_context(payload)
        except ValueError as exc:
            self.send_text_error(400, exc)
            return

        try:
            plan = irr_model.build_plan(cfg)
            checks = irr_model.verify(cfg, proposal, plan)
        except Exception as exc:
            self.send_text_error(500, f"IRR verification failed: {exc}")
            return

        self.send_json({
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
        })

    def send_parsed_proposal(self):
        """Auto-parse an AIA proposal PDF server-side (pdfplumber).

        Returns {known, profile, rows, detail, stated, withdrawalPlan,
        residual, sourcePages, rowCount, warnings}.
        """
        raw = self._read_body(10_000_000)
        if raw is None:
            return
        try:
            import pdfplumber  # noqa: F401
        except ImportError:
            self.send_text_error(500, "pdfplumber not installed. Run: pip install pdfplumber")
            return
        try:
            result = parse_proposal(raw)
        except Exception as exc:  # surface the real cause to the browser
            self.send_text_error(500, f"PDF parse failed: {exc}")
            return
        self.send_json(result)

    def send_library_files(self, query):
        library = query.get("library", [""])[0]
        folder = query.get("folder", [""])[0]
        library_dir = LIBRARY_DIRS.get(library)
        if not library_dir or not folder:
            self.send_text_error(400, "Invalid library request")
            return

        base_path = (SITE_ROOT / "assets" / "library" / library_dir).resolve()
        target = (base_path / folder).resolve()
        try:
            target.relative_to(base_path)
        except ValueError:
            self.send_text_error(400, "Invalid folder")
            return
        if not target.is_dir():
            self.send_text_error(404, "Product folder not found")
            return

        files = [
            {"name": item.name, "path": item.relative_to(SITE_ROOT).as_posix()}
            for item in sorted(target.iterdir(), key=lambda item: item.name.casefold())
            if item.is_file() and item.suffix.lower() == ".pdf"
        ]
        self.send_json({"files": files})

    def send_product_content(self, query):
        library = query.get("library", [""])[0]
        folder = query.get("folder", [""])[0]
        try:
            fields = json.loads(query.get("fields", ["[]"])[0])
        except json.JSONDecodeError:
            self.send_text_error(400, "Invalid field request")
            return
        if not isinstance(fields, list) or len(fields) > 32:
            self.send_text_error(400, "Invalid field request")
            return

        # 修复路径穿越：library 必须在白名单内
        library_dir = resolve_library(library)
        if not library_dir or not folder:
            self.send_text_error(400, "Invalid product request")
            return
        library_root = (SITE_ROOT / "assets" / "library" / library_dir).resolve()
        target = (library_root / folder).resolve()
        try:
            target.relative_to(library_root)
        except ValueError:
            self.send_text_error(400, "Invalid product request")
            return
        if not library_root.is_dir() or not target.is_dir():
            self.send_text_error(404, "Product folder not found")
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
            clean_keywords = [w for w in aliases[:16] if isinstance(w, str) and 0 < len(w) <= 30]
            if clean_keywords:
                clean_fields.append({"key": key[:60], "label": label[:80], "keywords": clean_keywords})

        try:
            import pypdf  # noqa: F401
        except ImportError:
            self.send_text_error(500, "PDF reader unavailable. Run: pip install pypdf")
            return

        extracted = {field["key"]: [] for field in clean_fields}
        source_files = []
        for item in sorted(target.iterdir(), key=lambda entry: entry.name.casefold()):
            if not item.is_file() or item.suffix.lower() != ".pdf":
                continue
            try:
                lines, norm_lines = _pdf_lines(str(item), item.stat().st_mtime_ns)
            except Exception:
                continue
            source_files.append(item.name)

            for field in clean_fields:
                keywords = [_normalize(word) for word in field["keywords"]]
                for index, norm_line in enumerate(norm_lines):
                    if any(word in norm_line for word in keywords):
                        evidence = " ".join(lines[max(0, index - 1):min(len(lines), index + 2)])[:360]
                        value = " ".join(lines[index:min(len(lines), index + 3)])[:220]
                        extracted[field["key"]].append(
                            {"value": value, "evidence": evidence, "source": item.name, "found": True})
                        break

        self.send_json({
            "productName": folder,
            "textRead": bool(source_files),
            "sourceFiles": source_files,
            "fields": {
                field["key"]: {
                    "label": field["label"],
                    "results": extracted[field["key"]] or [
                        {"value": "資料暫未提供", "evidence": "", "source": "", "found": False}],
                }
                for field in clean_fields
            },
        })


def auto_pull():
    """启动时从 GitHub 拉取最新代码。仅在设置 AUTO_PULL=1 时启用。"""
    try:
        result = subprocess.run(
            ["git", "pull", "--ff-only", "origin", "main"],
            capture_output=True, text=True, timeout=15, cwd=str(SITE_ROOT),
        )
        if result.returncode == 0:
            print(f"[auto-pull] 已检查更新: {result.stdout.strip() or '已是最新'}")
        else:
            print(f"[auto-pull] 拉取跳过: {result.stderr.strip()[:80]}")
    except Exception as e:
        print(f"[auto-pull] 跳过（{e}）")


def start_periodic_pull(interval=60):
    """后台线程每 interval 秒拉取一次最新代码。"""
    def loop():
        while True:
            time.sleep(interval)
            auto_pull()

    threading.Thread(target=loop, daemon=True).start()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "4175"))
    # 注意：开启后，任何能推送到 main 的人都能改动本机运行的页面代码。
    # 仅在仓库为私有、且你信任所有协作者时使用。
    if os.environ.get("AUTO_PULL") == "1":
        auto_pull()
        start_periodic_pull(int(os.environ.get("AUTO_PULL_INTERVAL", "60")))
    server = ThreadingHTTPServer(("127.0.0.1", port), AppHandler)
    print(f"AI 工作台 MVP 已启动：http://127.0.0.1:{port}")
    server.serve_forever()
