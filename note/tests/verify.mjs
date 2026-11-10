/* 기획노트 검증 — node note/tests/verify.mjs
   1 데이터 스키마 · ID  2 scr ⊂ MENU  3 refs 존재 · 양방향 · 고아 요구사항  4 anchor 해석(Playwright, 각 화면 APP.go 뒤)
   5 검색 · 필터 · 딥링크  6 콘솔 오류 0  7 프로토타입 원본 해시 전후 동일
   결과: 콘솔 + note/tests/report.md */
import fs from "node:fs";
import path from "node:path";
import { serve, chromium, loadNote, sha256, PROTO, NOTE_DIR } from "./lib.mjs";
import { readMenu } from "./sync-menu.mjs";

const EXPECT = fs.readFileSync(path.join(NOTE_DIR, "tests", "proto.sha256"), "utf8").split(/\s+/)[0];
const H0 = sha256(PROTO);
const R = []; /* [구분, 검사, 결과, 비고] */
const ok = (g, t, pass, note = "") => R.push([g, t, pass ? "통과" : "실패", note]);
const fails = () => R.filter((r) => r[2] === "실패").length;

/* 팝업 anchor를 열 때 쓰는 단계 (검증 전용 — 데이터 스키마에는 넣지 않음) */
const OPEN = {
  "dv.asn": `[...document.querySelectorAll('#main table tbody button')].find(b => b.innerText.trim() === '상세').click()`,
  "stl.tax": `document.querySelector('#main tr.clk').click()`,
};

const N = loadNote();
const ALL = ["policy", "screen", "req", "scenario", "process", "dec"].flatMap((k) => N[k] || []);
const by = Object.fromEntries(ALL.map((x) => [x.id, x]));
const M = N.meta;

/* ── 1 스키마 ── */
{
  const E = [];
  const TY = M.types.map((t) => t.k), ST = M.status.map((s) => s.k), OW = M.owner.map((o) => o.k), SI = M.sites.map((s) => s.k), AR = M.areas.map((a) => a.k);
  const need = ["id", "type", "title", "gnb", "snb", "site", "owner", "status", "summary", "body", "scr", "anchor", "perm", "svc", "refs", "src", "updated", "ver"];
  const ids = new Set();
  for (const x of ALL) {
    need.forEach((k) => { if (!(k in x)) E.push(`${x.id}: ${k} 없음`); });
    if (ids.has(x.id)) E.push(`${x.id}: ID 중복`); ids.add(x.id);
    if (!TY.includes(x.type)) E.push(`${x.id}: type ${x.type}`);
    if (!x.id.startsWith(x.type + "-")) E.push(`${x.id}: 접두어 ≠ type ${x.type}`);
    if (!/^(POL|REQ|ISS|SCN|PRC|DEC)-\d{3}$|^SCR-[a-z]+\.[a-z0-9]+$/.test(x.id)) E.push(`${x.id}: ID 형식`);
    if (!ST.includes(x.status)) E.push(`${x.id}: status ${x.status}`);
    if (!OW.includes(x.owner)) E.push(`${x.id}: owner ${x.owner}`);
    if (!Array.isArray(x.site) || !x.site.length || x.site.some((s) => !SI.includes(s))) E.push(`${x.id}: site ${x.site}`);
    const G = M.menu.find((g) => g.k === x.gnb);
    if (!G || !G.snb.some((s) => s.k === x.snb && !s.page)) E.push(`${x.id}: 위치 ${x.gnb}/${x.snb}`);
    if (/\n/.test(x.summary) || x.summary.length > 140) E.push(`${x.id}: summary 2줄 넘음 (${x.summary.length}자)`);
    if (x.body && x.body.split("\n").length > 15) E.push(`${x.id}: body ${x.body.split("\n").length}줄`);
    if (x.updated !== "2026-11-10" || x.ver !== "0.1") E.push(`${x.id}: updated/ver`);
    (x.anchor || []).forEach((a, i) => {
      if (!x.scr.includes(a.scr)) E.push(`${x.id} anchor${i + 1}: scr ${a.scr} ∉ scr`);
      if (a.area && !AR.includes(a.area)) E.push(`${x.id} anchor${i + 1}: area ${a.area}`);
      if (!a.area && !a.text) E.push(`${x.id} anchor${i + 1}: area · text 없음`);
    });
    if (x.type === "SCR") {
      if (x.scr.length !== 1 || x.id !== "SCR-" + x.scr[0]) E.push(`${x.id}: SCR id ≠ SCR-+scr`);
      const K = ["purpose", "entry", "cond", "data", "btn", "err", "link", "open"];
      if (!x.tpl) E.push(`${x.id}: tpl 없음`); else K.forEach((k) => { if (!(k in x.tpl)) E.push(`${x.id}: tpl.${k} 없음`); });
      if (x.tpl) [["cond", 4], ["btn", 4], ["link", 3], ["open", 2]].forEach(([k, n]) => (x.tpl[k] || []).forEach((r, i) => { if (r.length !== n) E.push(`${x.id}: tpl.${k}[${i}] 칸 ${r.length}≠${n}`); }));
    }
  }
  (N.history || []).forEach((h) => (h.items || []).forEach((id) => { if (!by[id]) E.push(`history v${h.ver}: ${id} 없음`); }));
  ok("데이터", `스키마 · ID (${ALL.length}개 항목)`, !E.length, E.slice(0, 8).join(" / "));
}

/* ── 3 refs ── */
const ORPH = [];
{
  const miss = [], asym = [];
  for (const x of ALL) for (const r of x.refs) { if (!by[r]) miss.push(`${x.id}→${r}`); else if (!by[r].refs.includes(x.id)) asym.push(`${x.id}→${r}`); }
  ok("데이터", "refs 대상 존재", !miss.length, miss.join(", "));
  ok("데이터", "refs 양방향", !asym.length, asym.join(", "));
  for (const x of ALL.filter((x) => x.type === "REQ")) {
    const inn = ALL.filter((y) => y.type !== "REQ" && y.refs.includes(x.id));
    if (!inn.length) ORPH.push(x.id);
  }
  ok("데이터", "고아 요구사항 (화면 · 정책 · 시나리오 · 프로세스에서 참조 없음)", true, ORPH.length ? ORPH.join(", ") : "없음");
}

const srv = await serve();
const U = (p) => srv.url + p;
const browser = await chromium().launch();
const errs = [];
const watch = (p, lb) => {
  p.on("console", (m) => { if (m.type() === "error") errs.push(`${lb}: ${m.text()}`); });
  p.on("pageerror", (e) => errs.push(`${lb}: ${e.message}`));
};

/* ── 2 scr ⊂ MENU · proto-menu 동기화 ── */
let MENU_IDS = [];
{
  const p = await browser.newPage(); watch(p, "prototype");
  await p.goto(U("/supplier_v5_0.html"));
  await p.waitForFunction(() => { try { return !!window.eval("MENU"); } catch (e) { return false; } });
  const menu = await readMenu(p);
  MENU_IDS = menu.flatMap((t) => t.secs.flatMap((s) => s.items.map((i) => i.id)));
  const bad = [];
  ALL.forEach((x) => x.scr.forEach((s) => { if (!MENU_IDS.includes(s)) bad.push(`${x.id}: ${s}`); }));
  ok("데이터", `모든 scr가 MENU id에 있음 (MENU ${MENU_IDS.length}개)`, !bad.length, bad.join(", "));
  ok("데이터", "data/proto-menu.js = 프로토타입 MENU", JSON.stringify(menu) === JSON.stringify(N.protoMenu), "다르면 sync-menu.mjs 실행");
  await p.close();
}

/* ── 4 anchor 해석 — viewer.html 안 bridge로 (같은 출처) ── */
const AFAIL = [];
let aN = 0, aOk = 0;
{
  const p = await browser.newPage({ viewport: { width: 1680, height: 1000 } }); watch(p, "viewer(anchor)");
  await p.goto(U("/note/viewer.html"));
  await p.waitForFunction(() => window.__viewer && window.__viewer.br.ready());
  const fr = () => p.frame({ url: /supplier_v5_0\.html/ });
  for (const x of ALL) {
    for (const [i, a] of (x.anchor || []).entries()) {
      aN++;
      await p.evaluate((s) => window.__viewer.br.go(s), a.scr);
      await p.waitForTimeout(150);
      if (a.popup || a.area === "popup") {
        const js = OPEN[a.scr];
        if (js) { try { await fr().evaluate(js); } catch (e) {} await p.waitForTimeout(250); }
      }
      const r = await p.evaluate((a) => { const r = window.__viewer.br.resolve(a); return { ok: !!r.el, why: r.why || "", how: r.how || "", tag: r.el ? r.el.tagName.toLowerCase() : "" }; }, a);
      if (r.ok) aOk++; else AFAIL.push([x.id, i + 1, a, r.why]);
      if (a.popup || a.area === "popup") await fr().evaluate(() => window.eval("MO").close());
    }
  }
  ok("프로토타입", `anchor 해석 ${aOk}/${aN}`, !AFAIL.length, AFAIL.map((f) => `${f[0]}#${f[1]} ${f[3]}`).join(" / "));
  await p.close();
}

/* ── 5 검색 · 필터 · 딥링크 (index.html) ── */
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } }); watch(p, "index");
  await p.goto(U("/note/index.html"));
  await p.waitForSelector("#gnb button");
  const gn = await p.$$eval("#gnb button", (b) => b.length);
  ok("index", "GNB 9개", gn === 9, `${gn}개`);
  /* 단축키 / → 검색 */
  await p.keyboard.press("/");
  const foc = await p.evaluate(() => document.activeElement && document.activeElement.id);
  ok("index", "단축키 '/' → 검색 칸", foc === "q");
  await p.keyboard.type("유통기한");
  await p.waitForTimeout(300);
  const s1 = await p.evaluate(() => ({ n: document.querySelectorAll(".sr").length, mk: document.querySelectorAll(".sr mark").length, loc: document.querySelector(".sr .lc") && document.querySelector(".sr .lc").textContent }));
  ok("index", "검색 '유통기한' — 결과 · 강조 · 위치", s1.n > 0 && s1.mk > 0 && /›/.test(s1.loc || ""), `${s1.n}건 · mark ${s1.mk} · ${s1.loc}`);
  await p.fill("#q", "REQ-052"); await p.waitForTimeout(300);
  const s2 = await p.$$eval(".sr", (L) => L.map((a) => a.getAttribute("data-go")));
  ok("index", "검색 ID 'REQ-052'", s2.includes("REQ-052"), `${s2.length}건`);
  await p.fill("#q", "없는말일치없음"); await p.waitForTimeout(300);
  ok("index", "검색 0건 안내", (await p.$$(".sr")).length === 0 && !!(await p.$(".empty")));
  await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  /* 필터 — 요구사항 리스트에서 */
  await p.goto(U("/note/index.html#/req/list")); await p.waitForSelector(".card");
  const nAll = (await p.$$(".card")).length;
  await p.click('[data-f="st"][data-v="TBD"]'); await p.waitForTimeout(100);
  const tbd = await p.$$eval(".card .r1 .st", (L) => L.map((e) => e.textContent));
  ok("index", "필터 상태 = TBD", tbd.length > 0 && tbd.every((t) => t === "TBD"), `${tbd.length} / ${nAll}건`);
  await p.click("[data-reset]"); await p.waitForTimeout(100);
  await p.goto(U("/note/index.html#/scr/ord")); await p.waitForSelector(".card");
  await p.click('[data-f="site"][data-v="PA"]'); await p.waitForTimeout(100);
  const paN = (await p.$$(".card")).length;
  await p.click('[data-f="site"][data-v="SUP"]'); await p.waitForTimeout(100);
  const supN = (await p.$$(".card")).length;
  await p.goto(U("/note/index.html#/ui/layout")); await p.waitForTimeout(100);
  await p.click('[data-f="site"][data-v="PA"]'); await p.waitForTimeout(100);
  const paAll = (await p.$$(".card")).length;
  ok("index", "필터 사이트 (PA → 공급사 화면 0 · ALL 정책 보임, 공급사 → 보임)", paN === 0 && supN > 0 && paAll > 0, `화면 PA ${paN} · 공급사 ${supN} · ALL정책 PA ${paAll}`);
  await p.click('[data-f="site"][data-v="*"]'); await p.click('[data-f="own"][data-v="공통 제공"]'); await p.waitForTimeout(100);
  await p.goto(U("/note/index.html#/svc/auth")); await p.waitForTimeout(100);
  const ow = await p.$$eval(".card .own", (L) => L.map((e) => e.textContent));
  ok("index", "필터 담당 = 공통 제공", ow.length > 0 && ow.every((t) => t === "공통 제공"), `${ow.length}건`);
  await p.evaluate(() => { localStorage.removeItem("note-flt"); });
  /* 딥링크 */
  await p.goto(U("/note/index.html#REQ-052")); await p.waitForTimeout(250);
  const d1 = await p.evaluate(() => { const c = document.getElementById("c-REQ-052"); if (!c) return null; const r = c.getBoundingClientRect(); return { open: c.classList.contains("open"), vis: r.top >= 0 && r.top < innerHeight, cur: document.querySelector('#snb button[aria-current="true"]').textContent }; });
  ok("index", "딥링크 index.html#REQ-052 → 카드 펼침 · 화면 안", !!d1 && d1.open && d1.vis, d1 ? `SNB '${d1.cur}'` : "카드 없음");
  await p.goto(U("/note/index.html#SCR-dv.asn")); await p.waitForTimeout(250);
  const d2 = await p.evaluate(() => { const c = document.getElementById("c-SCR-dv.asn"); return !!c && c.classList.contains("open") && c.querySelectorAll(".tpl").length; });
  ok("index", "딥링크 index.html#SCR-dv.asn → 템플릿 8칸", d2 === 8, `${d2}칸`);
  const vl = await p.$eval("#c-SCR-dv\\.asn .acts a", (a) => a.getAttribute("href"));
  ok("index", "[프로토타입에서 보기] 링크", vl === "viewer.html?scr=dv.asn&hl=SCR-dv.asn", vl);
  /* 계산 화면 · 히스토리 링크 */
  for (const [h, sel, lb] of [["#/intro/hist", ".hist .ids a", "히스토리 항목 링크"], ["#/scr/list", ".tbl tbody tr", "화면 목록 행"], ["#/req/summary", ".tbl", "현황 요약 표"], ["#/req/tracker", ".tbl tbody tr", "협의 트래커"], ["#/req/dec", ".tbl tbody tr", "미결 · 결정 로그"], ["#/intro/guide", ".tbl", "이용 가이드"]]) {
    await p.goto(U("/note/index.html" + h)); await p.waitForTimeout(120);
    const n = (await p.$$(sel)).length;
    ok("index", `${lb} (${h})`, n > 0, `${n}`);
  }
  await p.goto(U("/note/index.html#/scr/list")); await p.waitForTimeout(120);
  const rows = (await p.$$(".tbl tbody tr")).length;
  ok("index", "화면 목록 = MENU 수", rows === MENU_IDS.length, `${rows} / ${MENU_IDS.length}`);
  await p.goto(U("/note/index.html#/intro/hist")); await p.waitForTimeout(120);
  await p.click('.hist .ids a[href="index.html#REQ-030"]'); await p.waitForTimeout(250);
  ok("index", "히스토리 ID 클릭 → 항목", await p.evaluate(() => { const c = document.getElementById("c-REQ-030"); return !!c && c.classList.contains("open"); }));
  await p.close();
}

/* ── 5' 뷰어 딥링크 · 자동 갱신 · 권한 흐림 · 패널 ── */
{
  const p = await browser.newPage({ viewport: { width: 1680, height: 1000 } }); watch(p, "viewer");
  await p.goto(U("/note/viewer.html?scr=dv.asn&hl=REQ-052"));
  await p.waitForFunction(() => window.__viewer && window.__viewer.br.ready() && window.__viewer.V.act === "REQ-052", null, { timeout: 15000 }).catch(() => {});
  const fr = () => p.frame({ url: /supplier_v5_0\.html/ });
  await p.waitForTimeout(500);
  const v1 = await p.evaluate(() => { const V = window.__viewer.V; return { cur: V.ctx && V.ctx.cur, act: V.act, tab: V.tab, open: document.body.classList.contains("open") }; });
  const boxes = await fr().evaluate(() => { const L = document.getElementById("__note_layer"); return L ? [...L.children].filter((b) => b.style.border).length : -1; });
  ok("viewer", "딥링크 viewer.html?scr=dv.asn&hl=REQ-052 → 화면 · 탭 · 외곽선", v1.cur === "dv.asn" && v1.act === "REQ-052" && v1.tab === "req" && v1.open && boxes >= 1, `cur ${v1.cur} · act ${v1.act} · tab ${v1.tab} · 외곽선 ${boxes}`);
  const keep = await fr().evaluate(() => { const L = document.getElementById("__note_layer"), s = getComputedStyle(L); return s.pointerEvents === "none" && s.position === "absolute" && L.parentElement === document.body; });
  ok("viewer", "하이라이트 레이어 = 별도 · pointer-events:none", keep);
  /* 화면 전환 자동 갱신 */
  await fr().evaluate(() => window.eval("APP").go("sht.day"));
  await p.waitForTimeout(400);
  const v2 = await p.evaluate(() => ({ cur: window.__viewer.V.ctx.cur, n: document.querySelectorAll("#list .it").length, hd: document.querySelector("#cur").textContent }));
  ok("viewer", "프로토타입에서 화면 이동 → 패널 갱신", v2.cur === "sht.day" && /미납 소명/.test(v2.hd), `${v2.hd.trim()} · ${v2.n}건`);
  /* 팝업 감지 */
  await fr().evaluate(() => window.eval("APP").go("dv.asn"));
  await p.waitForTimeout(300);
  await p.click('[data-tab="req"]');
  const before = await p.evaluate(() => (document.querySelector("#v-REQ-053 .nc") || {}).textContent || "");
  await fr().evaluate(OPEN["dv.asn"]); await p.waitForTimeout(450);
  const after = await p.evaluate(() => ({ btn: !!document.querySelector('#v-REQ-053 [data-loc]'), pop: !!document.querySelector("#cur .pop"), hid: /팝업에 가려짐/.test((document.querySelector("#v-REQ-052 .nc") || {}).textContent || "") }));
  ok("viewer", "팝업 열림 감지 → 팝업 anchor 활성 · 화면 anchor는 '팝업에 가려짐'", /팝업/.test(before) && after.btn && after.pop && after.hid, `전: '${before.trim()}' · 뒤: 버튼 ${after.btn} · 표시 ${after.pop} · 가림 ${after.hid}`);
  await fr().evaluate(() => window.eval("MO").close()); await p.waitForTimeout(200);
  /* 칩 표시 */
  await p.click('[data-tab="scr"]'); await p.click("#chip"); await p.waitForTimeout(200);
  const chips = await fr().evaluate(() => [...document.getElementById("__note_layer").children].filter((b) => !b.style.border && b.firstChild).length);
  ok("viewer", "[칩 표시] → 번호 칩", chips > 0, `칩 ${chips}개`);
  await p.click("#chip");
  /* 권한 · 서비스 불일치 흐림 */
  await fr().evaluate(() => window.eval("APP").go("o.qry")); await p.waitForTimeout(300);
  await p.click('[data-tab="pol"]');
  const on1 = await p.evaluate(() => { const e = document.getElementById("v-POL-005"); return e && !e.classList.contains("off"); });
  await fr().evaluate(() => window.setSvc("edi", false)); await p.waitForTimeout(400);
  const off = await p.evaluate(() => { const e = document.getElementById("v-POL-005"); return e && e.classList.contains("off") && /현재 권한에서 안 보이는 기능/.test(e.querySelector(".why").textContent) && /위치 미연결/.test(e.textContent); });
  await fr().evaluate(() => window.setSvc("edi", true)); await p.waitForTimeout(200);
  ok("viewer", "권한 변경 감지 → svc 불일치 흐림 + 문구 (EDI 해제)", on1 && off);
  /* 패널 닫기 → 플로팅 · 폭 */
  await p.click("#close");
  const fab = await p.evaluate(() => { const b = document.getElementById("fab"); return getComputedStyle(b).display !== "none" && /기획 노트\s*\d+/.test(b.textContent); });
  const pvW = await p.evaluate(() => document.getElementById("pv").getBoundingClientRect().width);
  await p.click("#fab"); await p.waitForTimeout(100);
  const pvW2 = await p.evaluate(() => document.getElementById("pv").getBoundingClientRect().width);
  ok("viewer", "닫기 → 플로팅 '기획 노트 n' · 열면 iframe 폭 줄어듦", fab && pvW2 < pvW, `iframe ${pvW} → ${pvW2}`);
  await p.focus("#grip"); for (let i = 0; i < 12; i++) await p.keyboard.press("ArrowLeft");
  const wMax = await p.evaluate(() => document.getElementById("dock").getBoundingClientRect().width);
  for (let i = 0; i < 12; i++) await p.keyboard.press("ArrowRight");
  const wMin = await p.evaluate(() => document.getElementById("dock").getBoundingClientRect().width);
  ok("viewer", "패널 폭 360 ~ 520", Math.round(wMax) === 520 && Math.round(wMin) === 360, `${wMin} ~ ${wMax}`);
  await p.evaluate(() => { localStorage.removeItem("note-vw"); localStorage.removeItem("note-vopen"); });
  /* 위치 미연결 — 오류 없이 */
  const unl = await p.evaluate(() => window.__viewer.br.resolve({ scr: "o.qry", text: "없는 버튼" }));
  ok("viewer", "못 찾는 anchor → 오류 없이 이유", unl && unl.el === null && !!unl.why, unl && unl.why);
  await p.close();
}

/* ── file:// 안내 ── */
{
  const p = await browser.newPage(); watch(p, "viewer(file)");
  await p.goto("file://" + path.join(NOTE_DIR, "viewer.html"));
  await p.waitForTimeout(800);
  const t = await p.evaluate(() => (document.querySelector("#list .err") || {}).textContent || "");
  ok("viewer", "file://로 열면 안내 문구", /file:\/\//.test(t), t.slice(0, 40));
  await p.close();
}

await browser.close(); await srv.close();

/* ── 6 콘솔 오류 · 7 해시 ── */
const uniqErr = [...new Set(errs)].filter((e) => !/viewer\(file\)/.test(e) || !/(Blocked a frame|cross-origin|SecurityError)/i.test(e));
ok("공통", "콘솔 오류 0 (index · viewer · 프로토타입 프레임)", !uniqErr.length, uniqErr.slice(0, 5).join(" / "));
const H1 = sha256(PROTO);
ok("공통", "프로토타입 원본 해시 전후 동일", H0 === H1 && H1 === EXPECT, `${H1.slice(0, 16)}… (기준 ${EXPECT.slice(0, 16)}…)`);

/* ── 출력 ── */
const md = ["| 구분 | 검사 | 결과 | 비고 |", "|---|---|---|---|", ...R.map((r) => `| ${r.map((c) => String(c).replace(/\|/g, "\\|")).join(" | ")} |`)].join("\n");
const fl = AFAIL.length ? "\n\n### 해석 실패 anchor\n\n| 항목 | # | anchor | 이유 |\n|---|---|---|---|\n" + AFAIL.map((f) => `| ${f[0]} | ${f[1]} | ${JSON.stringify(f[2]).replace(/\|/g, "\\|")} | ${f[3]} |`).join("\n") : "";
const out = `# 기획노트 검증 결과\n\n- 실행: ${new Date().toISOString()}\n- 통과 ${R.length - fails()} / ${R.length}\n\n${md}${fl}\n`;
fs.writeFileSync(path.join(NOTE_DIR, "tests", "report.md"), out);
console.log(out);
process.exit(fails() ? 1 : 0);
