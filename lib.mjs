/* 검증 공통 — 정적 서버 · 데이터 읽기 · 브라우저
   실행 위치와 상관없이 저장소 루트(= note/의 부모)를 서빙한다. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const NOTE_DIR = path.join(ROOT, "note");
export const PROTO = path.join(ROOT, "supplier_v5_0.html");
export const DATA_FILES = ["meta", "proto-menu", "policy", "screen", "req", "scenario", "process", "history"];

export function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".md": "text/markdown; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png" };
export function serve(root = ROOT) {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
      let f = path.join(root, u);
      if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end("not found"); }
      res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" });
      fs.createReadStream(f).pipe(res);
    });
    s.listen(0, "127.0.0.1", () => ok({ url: `http://127.0.0.1:${s.address().port}`, close: () => new Promise((r) => s.close(r)) }));
  });
}

/* data/*.js 를 브라우저처럼 실행해 window.NOTE 를 얻음 */
export function loadNote() {
  const ctx = {};
  ctx.window = ctx; /* 브라우저처럼 window = 전역 */
  vm.createContext(ctx);
  for (const n of DATA_FILES) {
    const f = path.join(NOTE_DIR, "data", n + ".js");
    if (fs.existsSync(f)) vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });
  }
  return ctx.NOTE;
}

export function chromium() {
  try { return require("playwright").chromium; }
  catch (e) { console.error("playwright가 필요합니다: npm i -D playwright && npx playwright install chromium"); process.exit(2); }
}
