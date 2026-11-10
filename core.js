/* core.js — index.html · viewer.html 공통: 항목 색인 · 라벨 · 짧은 마크다운 · 검색 */
window.NOTE = window.NOTE || {};
(function (N) {
  "use strict";
  const LISTS = ["screen", "policy", "req", "scenario", "process", "dec"];
  N.all = () => LISTS.flatMap((k) => N[k] || []);
  N.byId = {};
  N.all().forEach((x) => (N.byId[x.id] = x));

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  N.esc = esc;

  /* 라벨 */
  const meta = N.meta;
  N.siteLb = (k) => (meta.sites.find((s) => s.k === k) || { lb: k }).lb;
  N.typeLb = (k) => (meta.types.find((t) => t.k === k) || { lb: k }).lb;
  N.gnb = (k) => meta.menu.find((g) => g.k === k);
  N.snb = (g, s) => { const G = N.gnb(g); return G && G.snb.find((x) => x.k === s); };
  N.loc = (it) => { const G = N.gnb(it.gnb), S = N.snb(it.gnb, it.snb); return (G ? G.lb : it.gnb) + " › " + (S ? S.lb : it.snb); };
  const ST_CLS = { "확정": "ok", "협의": "hy", "보류": "bo", "삭제": "del", "TBD": "tbd" };
  N.stCls = (s) => ST_CLS[s] || "del";
  N.badge = (s) => `<span class="st st-${N.stCls(s)}">${esc(s)}</span>`;
  N.idChip = (id, link) => link === false || !N.byId[id] ? `<span class="idc${N.byId[id] ? "" : " x"}">${esc(id)}</span>` : `<a class="idc" href="index.html#${encodeURIComponent(id)}">${esc(id)}</a>`;
  N.sites = (it) => (it.site || []).map((s) => `<span class="site s-${esc(s)}">${esc(N.siteLb(s))}</span>`).join("");
  N.ownerTag = (o) => `<span class="own">${esc(o)}</span>`;

  /* 프로토타입 화면 이름 */
  N.scrIndex = {};
  (N.protoMenu || []).forEach((t) => (t.secs || []).forEach((s) => s.items.forEach((it) => (N.scrIndex[it.id] = { id: it.id, lb: it.lb, tab: t.lb, tk: t.k, sec: s.lb, perm: it.perm, svc: it.svc }))));
  N.scrLb = (id) => (id === "home" ? "홈" : N.scrIndex[id] ? N.scrIndex[id].lb : id);

  /* 짧은 마크다운: 표 · 불릿 · 문단 + 인라인(굵게 · 코드 · 항목 ID 링크 · 〔표기〕) */
  const ID_RE = /\b((?:POL|SCR|REQ|ISS|SCN|PRC|DEC)-(?:[a-z]+\.[a-z0-9]+|\d{3}))\b/g;
  const MK = (t) => (/^(TBD|확인)/.test(t) ? "tbd" : /^협의/.test(t) ? "hy" : /^보류/.test(t) ? "bo" : "etc");
  N.inline = function (s, o) {
    let h = esc(s);
    h = h.replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    h = h.replace(/〔([^〕]+)〕/g, (m, t) => `<span class="mk mk-${MK(t)}">${t}</span>`);
    if (!o || o.links !== false) h = h.replace(ID_RE, (m) => (N.byId[m] ? `<a class="idl" href="index.html#${encodeURIComponent(m)}">${m}</a>` : `<span class="idl x">${m}</span>`));
    return h;
  };
  N.md = function (src, o) {
    const L = String(src || "").split("\n"), out = [];
    let i = 0;
    while (i < L.length) {
      const l = L[i];
      if (/^\s*\|/.test(l)) {
        const rows = [];
        while (i < L.length && /^\s*\|/.test(L[i])) rows.push(L[i++]);
        const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        const hd = cells(rows[0]), body = rows.slice(/^\s*\|[\s:|-]+\|\s*$/.test(rows[1] || "") ? 2 : 1);
        out.push(`<div class="tw"><table class="md"><thead><tr>${hd.map((c) => `<th>${N.inline(c, o)}</th>`).join("")}</tr></thead><tbody>` +
          body.map((r) => `<tr>${cells(r).map((c) => `<td>${N.inline(c, o)}</td>`).join("")}</tr>`).join("") + "</tbody></table></div>");
        continue;
      }
      if (/^\s*-\s+/.test(l)) {
        const li = [];
        while (i < L.length && /^\s*-\s+/.test(L[i])) li.push(L[i++].replace(/^\s*-\s+/, ""));
        out.push(`<ul class="md">${li.map((x) => `<li>${N.inline(x, o)}</li>`).join("")}</ul>`);
        continue;
      }
      if (l.trim()) out.push(`<p class="md">${N.inline(l, o)}</p>`);
      i++;
    }
    return out.join("");
  };

  /* SCR 템플릿 8칸 */
  N.TPL = [
    ["purpose", "1 목적"], ["entry", "2 진입 · 권한"], ["cond", "3 조회 조건", ["항목", "기본값", "필수", "제한"]], ["data", "4 데이터 규칙"],
    ["btn", "5 상태 · 버튼", ["버튼", "활성 조건", "확인 메시지", "처리 결과"]], ["err", "6 유효성 · 예외"],
    ["link", "7 연동", ["시스템", "방향", "시점"]], ["open", "8 미결", ["내용", "담당 · 근거"]],
  ];
  N.tplHtml = function (t) {
    if (!t) return "";
    return N.TPL.map(([k, lb, hd]) => {
      const v = t[k];
      let h;
      if (v == null || (Array.isArray(v) && !v.length)) h = `<p class="md mut">—</p>`;
      else if (typeof v === "string") h = `<p class="md">${N.inline(v)}</p>`;
      else if (hd) h = `<div class="tw"><table class="md"><thead><tr>${hd.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>` +
        v.map((r) => `<tr>${r.map((c) => `<td>${N.inline(c)}</td>`).join("")}</tr>`).join("") + "</tbody></table></div>";
      else h = `<ul class="md">${v.map((x) => `<li>${N.inline(x)}</li>`).join("")}</ul>`;
      return `<section class="tpl tpl-${k}"><h4>${lb}</h4>${h}</section>`;
    }).join("");
  };

  /* 검색용 평문 */
  N.text = function (it) {
    const t = it.tpl ? Object.values(it.tpl).flat(2).join(" ") : "";
    return [it.id, it.title, it.summary, it.body || "", t].join(" \n ");
  };

  /* 필터 — 사이트 PA를 고르면 ALL 항목도 포함 */
  N.pass = function (it, f) {
    if (f.site && f.site !== "*") { const S = it.site || []; if (!(S.includes(f.site) || (f.site !== "ALL" && S.includes("ALL")))) return false; }
    if (f.st && f.st !== "*" && it.status !== f.st) return false;
    if (f.own && f.own !== "*" && it.owner !== f.own) return false;
    return true;
  };

  /* 화면별 묶음 — viewer 탭 */
  N.VTABS = [
    { k: "scr", lb: "이 화면", types: ["SCR", "PRC"] },
    { k: "req", lb: "요구사항", types: ["REQ", "ISS"] },
    { k: "pol", lb: "정책", types: ["POL", "DEC"] },
    { k: "scn", lb: "시나리오", types: ["SCN"] },
  ];
  N.forScreen = (id) => N.all().filter((x) => (x.scr || []).includes(id));
  N.vtabOf = (it) => (N.VTABS.find((t) => t.types.includes(it.type)) || N.VTABS[0]).k;

  N.store = {
    get(k, d) { try { const v = localStorage.getItem("note-" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("note-" + k, JSON.stringify(v)); } catch (e) {} },
  };
})(window.NOTE);
