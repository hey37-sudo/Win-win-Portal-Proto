# 공급사Portal 기획노트 (v0.1)

프로토타입 `../supplier_v5_0.html`과 연결되는 개발자용 기획노트. 프로토타입 파일은 고치지 않는다.

| 파일 | 역할 |
|---|---|
| `index.html` | 기획노트 — GNB 9 · SNB · 카드 · 검색(`/`) · 필터 · 딥링크 `#ID` |
| `viewer.html` | 프로토타입 iframe + 오른쪽 기획 패널 — `?scr=dv.asn&hl=REQ-052` |
| `bridge.js` | iframe 연결 · 화면/팝업/권한 감지 · anchor 해석 · 하이라이트 레이어 |
| `core.js` · `note.css` | 두 페이지 공통 (색인 · 짧은 마크다운 · 라벨 · 스타일) |
| `data/*.js` | 유일한 원본 — `meta` `policy` `screen` `req` `scenario` `process` `history`, `proto-menu`(자동 생성) |
| `tests/*.mjs` | `verify.mjs` 검증 · `sync-menu.mjs` MENU 동기화 · `lib.mjs` 공통 |

## 열기
같은 출처가 필요하다 (file:// 불가).
```
python3 -m http.server 8000      # 저장소 루트에서
# http://localhost:8000/note/index.html
# http://localhost:8000/note/viewer.html?scr=dv.asn&hl=REQ-052
```

## 검증
```
node note/tests/sync-menu.mjs     # 프로토타입 MENU가 바뀌면
node note/tests/verify.mjs        # 결과 → note/tests/report.md (Playwright 필요)
```
