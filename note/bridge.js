/* bridge.js — 프로토타입(iframe) ↔ 기획노트 연결
   - 프로토타입 파일은 고치지 않는다. 런타임에 APP.render · MO.open · MO.close를 감싸 화면 · 팝업 변화를 알린다.
   - 프로토타입 전역(APP · MI · MENU · CTL · MO)은 const라 window 속성이 아님 → contentWindow.eval("이름")으로 읽는다. 같은 출처 필요.
   - 이동은 APP.go(id, p)만 쓴다.
   - 하이라이트 · 칩은 iframe 문서 안 별도 레이어(position:absolute, pointer-events:none)에 그린다. 기존 요소의 클래스 · 스타일은 건드리지 않는다.
   anchor 해석 순서: ⓪ data-note="키" (훅만 — 프로토타입에 아직 없음) ① area 키 해석표 ② text 정확 일치(버튼 · th · label)
                     ③ popup:true면 #mo가 열렸을 때만 ④ 못 찾으면 하이라이트 없이 이유만 돌려줌 */
(function () {
  "use strict";

  /* ① area 키 해석표 — 화면마다 제목 · 조작 영역 마크업이 달라 후보를 차례로 본다 */
  const AREA = {
    title: (d) => vis(d.querySelector("#main .pghead")) || titleBox(d),
    search: (d) => first(d, "#main .sfbox"),
    tabs: (d) => first(d, "#main .tabs"),
    toolbar: (d) => {
      const g = first(d, "#main .st-action-group.ux-o-pri"); if (g) return vis(g.parentElement) || g;
      const b = first(d, "#main button.ux-o-pri"); if (b) return vis(b.parentElement) || b;
      return first(d, "#main .gbar, #main .o9-bar .r, #main .atb");
    },
    grid: (d) => { const t = first(d, "#main table.g, #main table"); return t ? t.closest(".v340-sc, .gwrap") || t : null; },
    popup: (d) => (popupOpen(d) ? vis(d.querySelector("#mo")) : null),
  };
  const AREA_LB = { title: "화면 제목", search: "조회 영역", tabs: "화면 탭", toolbar: "조작 영역", grid: "목록", popup: "팝업" };
  /* ② text 후보 — 버튼 · 표 머리 · 라벨 */
  const TEXT_SEL = "button, th, label, .sl, dt, legend, [role=tab]";

  const norm = (s) => String(s == null ? "" : s).replace(/[▲▼]/g, "").replace(/\s+/g, " ").replace(/\s*\*\s*$/, "").trim();
  /* display:contents(ux-flat 등) 요소는 자기 상자가 없어 자식 상자를 합친 크기로 본다 */
  function rectOf(el) {
    if (!el) return null;
    if (el.getClientRects().length) return el.getBoundingClientRect();
    let r = null;
    for (const c of el.children) {
      const b = rectOf(c); if (!b || (!b.width && !b.height)) continue;
      r = r ? { left: Math.min(r.left, b.left), top: Math.min(r.top, b.top), right: Math.max(r.right, b.right), bottom: Math.max(r.bottom, b.bottom) } : { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    }
    return r ? { left: r.left, top: r.top, width: r.right - r.left, height: r.bottom - r.top } : null;
  }
  function vis(el) { if (!el || getComputedStyleSafe(el).visibility === "hidden") return null; const r = rectOf(el); return r && (r.width || r.height) ? el : null; }
  const boxed = (el) => { if (!el || el.getClientRects().length) return el; for (const c of el.children) { const b = boxed(c); if (b && b.getClientRects().length) return b; } return el; };
  function getComputedStyleSafe(el) { try { return el.ownerDocument.defaultView.getComputedStyle(el); } catch (e) { return {}; } }
  function first(d, sel) { for (const el of d.querySelectorAll(sel)) if (vis(el)) return el; return null; }
  function titleBox(d) { const h = first(d, "#main h1"); if (!h) return null; const p = h.parentElement; return p && !p.classList.contains("page") && p.id !== "main" ? p : h; }
  function popupOpen(d) { const ov = d.querySelector("#ov"); return !!(ov && ov.classList.contains("on")); }

  const TONE = { "확정": "#109EBE", "협의": "#D97706", "보류": "#7C3AED", "TBD": "#DC2626", "삭제": "#8A8F98" };

  function attach(iframe, opt) {
    opt = opt || {};
    const st = { W: null, D: null, G: null, hl: [], chips: [], layer: null, raf: 0, sig: "", ready: false, obs: [] };
    const emit = (k, x) => { try { opt.onChange && opt.onChange(k, x); } catch (e) { console.error(e); } };

    function fail(msg) { st.ready = false; opt.onError && opt.onError(msg); }

    function hook() {
      let W, D;
      try { W = iframe.contentWindow; D = W.document; void D.body; }
      catch (e) { return fail("cross-origin"); }
      const G = (n) => { try { return W.eval(n); } catch (e) { return undefined; } };
      const APP = G("APP"), MO = G("MO");
      if (!APP || !MO || !G("MI")) return false;
      st.W = W; st.D = D; st.G = G;
      if (!APP.render.__note) {
        const r0 = APP.render; APP.render = function () { const o = r0.apply(this, arguments); tick("render"); return o; }; APP.render.__note = 1;
        const o0 = MO.open; MO.open = function () { const o = o0.apply(this, arguments); tick("popup"); return o; }; MO.open.__note = 1;
        const c0 = MO.close; MO.close = function () { const o = c0.apply(this, arguments); tick("popup"); return o; }; MO.close.__note = 1;
      }
      /* 감싼 함수를 거치지 않는 부분 갱신(innerHTML 직접 교체 등)도 따라가도록 */
      st.obs.forEach((o) => o.disconnect()); st.obs = [];
      const mo = new W.MutationObserver(() => tick("dom"));
      const main = D.querySelector("#main"), ov = D.querySelector("#ov");
      if (main) mo.observe(main, { childList: true, subtree: true });
      if (ov) mo.observe(ov, { attributes: true, attributeFilter: ["class"], childList: true, subtree: true });
      mo.observe(D.body, { attributes: true, attributeFilter: ["class"] });
      st.obs.push(mo);
      W.addEventListener("scroll", placeSoon, { passive: true, capture: true });
      W.addEventListener("resize", placeSoon);
      layer();
      st.ready = true;
      tick("ready");
      opt.onReady && opt.onReady(api);
      return true;
    }

    function start() {
      if (location.protocol === "file:") return fail("file");
      clearInterval(st.poll); st.ready = false;
      let n = 0;
      st.poll = setInterval(() => { const r = hook(); if (r !== false || ++n > 150) { clearInterval(st.poll); if (r === false) fail("not-ready"); } }, 60);
    }
    /* viewer는 attach 뒤에 iframe.src를 넣는다 */
    iframe.addEventListener("load", () => { let blank = false; try { blank = iframe.contentWindow.location.href === "about:blank"; } catch (e) {} if (!blank) start(); });

    /* 화면 · 팝업 · 권한 상태 */
    function ctx() {
      if (!st.ready) return null;
      const APP = st.G("APP"), MI = st.G("MI"), CTL = st.G("CTL");
      const cur = APP.cur, it = MI[cur];
      return {
        cur, lb: cur === "home" ? "홈" : it ? it.lb : cur,
        tab: cur === "home" ? "홈" : it && it.tab ? it.tab.lb : "",
        sec: it && it.sec ? it.sec.lb : "",
        popup: popupOpen(st.D), popupTitle: popupOpen(st.D) ? norm((st.D.querySelector("#mo .mo-h .t") || {}).textContent || "") : "",
        auth: st.D.body.classList.contains("auth-mode"),
        perm: Object.assign({}, CTL.perm), svc: Object.assign({}, CTL.svc),
      };
    }
    function tick(kind) {
      if (!st.ready) return;
      cancelAnimationFrame(st.raf);
      st.raf = requestAnimationFrame(() => {
        const c = ctx(); if (!c) return;
        const sig = [c.cur, c.popup, c.popupTitle, c.auth, JSON.stringify(c.perm), JSON.stringify(c.svc)].join("|");
        const changed = sig !== st.sig; st.sig = sig;
        place();
        emit(changed ? "screen" : "dom", c);
      });
    }

    /* anchor → 요소 */
    function resolve(a) {
      if (!st.ready) return { el: null, why: "연결 안 됨" };
      const D = st.D, cur = st.G("APP").cur;
      if (a.scr && a.scr !== cur) return { el: null, why: "다른 화면" };
      if (D.body.classList.contains("auth-mode")) return { el: null, why: "로그인 화면" };
      if (a.note) { const el = vis(D.querySelector(`[data-note="${String(a.note).replace(/"/g, '\\"')}"]`)); if (el) return { el, how: "data-note" }; }
      const pop = a.popup || a.area === "popup";
      if (pop && !popupOpen(D)) return { el: null, why: "팝업을 열면 표시" };
      if (!pop && popupOpen(D)) return { el: null, why: "팝업에 가려짐" };
      let scope = pop ? D.querySelector("#mo") : D.querySelector("#main");
      if (a.area && a.area !== "popup") {
        const f = AREA[a.area]; if (!f) return { el: null, why: "모르는 area: " + a.area };
        const box = f(D); if (!box) return { el: null, why: AREA_LB[a.area] + " 없음" };
        if (!a.text) return { el: box, how: "area" };
        scope = box;
      } else if (a.area === "popup" && !a.text) return { el: AREA.popup(D), how: "area" };
      if (!a.text) return { el: null, why: "area · text 없음" };
      const want = norm(a.text);
      for (const el of scope.querySelectorAll(TEXT_SEL)) if (norm(el.innerText) === want && vis(el)) return { el, how: "text" };
      return { el: null, why: "'" + a.text + "' 없음" };
    }

    /* 하이라이트 레이어 */
    function layer() {
      const D = st.D; let L = D.getElementById("__note_layer");
      if (!L) {
        L = D.createElement("div"); L.id = "__note_layer"; L.setAttribute("aria-hidden", "true");
        L.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;z-index:2147483646;pointer-events:none;";
        D.body.appendChild(L);
      }
      st.layer = L; return L;
    }
    function box(r, x, y, tone, outline, n) {
      const D = st.D, b = D.createElement("div");
      b.style.cssText = `position:absolute;left:${r.left + x - 3}px;top:${r.top + y - 3}px;width:${r.width + 6}px;height:${r.height + 6}px;box-sizing:border-box;pointer-events:none;border-radius:5px;` +
        (outline ? `border:2px solid ${tone};box-shadow:0 0 0 2px rgba(255,255,255,.85);` : "");
      if (n != null) {
        const c = D.createElement("span"); c.textContent = n;
        c.style.cssText = `position:absolute;left:-9px;top:-9px;min-width:18px;height:18px;padding:0 5px;box-sizing:border-box;border-radius:9px;background:${tone};color:#fff;` +
          "font:700 11px/18px -apple-system,'Pretendard','Malgun Gothic',sans-serif;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.25);";
        b.appendChild(c);
      }
      return b;
    }
    function placeSoon() { if (st.pr) return; st.pr = requestAnimationFrame(() => { st.pr = 0; place(); }); }
    function place() {
      if (!st.ready || !st.layer) return;
      const L = st.layer.isConnected ? st.layer : layer(), W = st.W;
      L.textContent = "";
      const x = W.scrollX, y = W.scrollY;
      const draw = (list, outline) => list.forEach((h) => {
        const r0 = resolve(h.anchor); if (!r0.el) return;
        const r = rectOf(r0.el); if (!r || (!r.width && !r.height)) return;
        L.appendChild(box(r, x, y, h.tone || TONE.확정, outline, h.n));
      });
      draw(st.chips, false);
      draw(st.hl, true);
    }

    const api = {
      AREA_LB, TONE, norm,
      ready: () => st.ready,
      ctx, resolve,
      go(id, p) { if (st.ready) st.G("APP").go(id, p || {}); },
      /* 권한 · 서비스 조건이 맞는지 (perm: 하나라도 · svc: 모두) */
      okFor(it) {
        const c = ctx(); if (!c) return true;
        const P = it.perm || [], S = [].concat(it.svc || []);
        return (!P.length || P.some((k) => c.perm[k])) && S.every((k) => c.svc[k]);
      },
      /* 위치 보기 — [{anchor, n, tone}] 외곽선 + 번호 칩, 첫 요소로 스크롤 */
      show(list, o) {
        st.hl = list || []; place();
        if (o && o.scroll) {
          const f = st.hl.map((h) => resolve(h.anchor).el).find(Boolean);
          if (f) { const t = boxed(f); try { t.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" }); } catch (e) { t.scrollIntoView(); } setTimeout(place, 420); }
        }
        return st.hl.filter((h) => resolve(h.anchor).el).length;
      },
      chips(list) { st.chips = list || []; place(); },
      clear() { st.hl = []; st.chips = []; place(); },
      count() { return st.layer ? st.layer.childElementCount : 0; },
      refresh: () => tick("manual"),
    };
    return api;
  }

  window.NoteBridge = { attach };
})();
