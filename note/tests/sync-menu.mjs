/* 프로토타입 MENU → data/proto-menu.js (자동 생성)
   node note/tests/sync-menu.mjs        — 다시 만들기
   node note/tests/sync-menu.mjs --check — 파일과 프로토타입 MENU가 같은지만 확인 (다르면 exit 1) */
import fs from "node:fs";
import path from "node:path";
import { serve, chromium, NOTE_DIR, loadNote } from "./lib.mjs";

const OUT = path.join(NOTE_DIR, "data", "proto-menu.js");

export async function readMenu(page) {
  return page.evaluate(() => {
    const M = window.eval("MENU");
    return M.map((t) => ({
      k: t.k, lb: t.lb, home: !!t.home, acct: !!t.acct, svc: t.svc || "",
      secs: (t.secs || []).map((s) => ({ lb: s.lb, items: s.items.map((it) => ({ id: it.id, lb: it.lb, perm: it.perm || [], svc: it.svc || "", ext: !!it.ext })) })),
    }));
  });
}

export function toJs(menu) {
  return "/* 자동 생성 — node note/tests/sync-menu.mjs (프로토타입 MENU 그대로, 직접 고치지 않음) */\n" +
    "window.NOTE = window.NOTE || {};\nNOTE.protoMenu = " + JSON.stringify(menu, null, 1).replace(/\n\s*/g, " ") + ";\n";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const srv = await serve();
  const b = await chromium().launch();
  const p = await b.newPage();
  await p.goto(srv.url + "/supplier_v5_0.html");
  await p.waitForFunction(() => { try { return !!window.eval("MENU"); } catch (e) { return false; } });
  const menu = await readMenu(p);
  await b.close(); await srv.close();
  if (process.argv.includes("--check")) {
    const cur = (loadNote() || {}).protoMenu;
    const same = JSON.stringify(cur) === JSON.stringify(menu);
    console.log(same ? "proto-menu.js = 프로토타입 MENU" : "proto-menu.js가 프로토타입 MENU와 다릅니다 — sync-menu.mjs를 다시 실행하세요");
    process.exit(same ? 0 : 1);
  }
  fs.writeFileSync(OUT, toJs(menu));
  console.log("wrote", path.relative(process.cwd(), OUT), menu.reduce((a, t) => a + t.secs.reduce((b, s) => b + s.items.length, 0), 0), "items");
}
