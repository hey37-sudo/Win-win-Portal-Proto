# 기획노트 검증 결과

- 실행: 2026-11-10T01:54:34.515Z
- 통과 38 / 38

| 구분 | 검사 | 결과 | 비고 |
|---|---|---|---|
| 데이터 | 스키마 · ID (22개 항목) | 통과 |  |
| 데이터 | refs 대상 존재 | 통과 |  |
| 데이터 | refs 양방향 | 통과 |  |
| 데이터 | 고아 요구사항 (화면 · 정책 · 시나리오 · 프로세스에서 참조 없음) | 통과 | 없음 |
| 데이터 | 모든 scr가 MENU id에 있음 (MENU 58개) | 통과 |  |
| 데이터 | data/proto-menu.js = 프로토타입 MENU | 통과 | 다르면 sync-menu.mjs 실행 |
| 프로토타입 | anchor 해석 55/55 | 통과 |  |
| index | GNB 9개 | 통과 | 9개 |
| index | 단축키 '/' → 검색 칸 | 통과 |  |
| index | 검색 '유통기한' — 결과 · 강조 · 위치 | 통과 | 3건 · mark 8 · 요구사항 · 협의 › 요구사항 리스트 |
| index | 검색 ID 'REQ-052' | 통과 | 2건 |
| index | 검색 0건 안내 | 통과 |  |
| index | 필터 상태 = TBD | 통과 | 2 / 10건 |
| index | 필터 사이트 (PA → 공급사 화면 0 · ALL 정책 보임, 공급사 → 보임) | 통과 | 화면 PA 0 · 공급사 1 · ALL정책 PA 1 |
| index | 필터 담당 = 공통 제공 | 통과 | 1건 |
| index | 딥링크 index.html#REQ-052 → 카드 펼침 · 화면 안 | 통과 | SNB '요구사항 리스트10' |
| index | 딥링크 index.html#SCR-dv.asn → 템플릿 8칸 | 통과 | 8칸 |
| index | [프로토타입에서 보기] 링크 | 통과 | viewer.html?scr=dv.asn&hl=SCR-dv.asn |
| index | 히스토리 항목 링크 (#/intro/hist) | 통과 | 22 |
| index | 화면 목록 행 (#/scr/list) | 통과 | 58 |
| index | 현황 요약 표 (#/req/summary) | 통과 | 3 |
| index | 협의 트래커 (#/req/tracker) | 통과 | 15 |
| index | 미결 · 결정 로그 (#/req/dec) | 통과 | 44 |
| index | 이용 가이드 (#/intro/guide) | 통과 | 6 |
| index | 화면 목록 = MENU 수 | 통과 | 58 / 58 |
| index | 히스토리 ID 클릭 → 항목 | 통과 |  |
| viewer | 딥링크 viewer.html?scr=dv.asn&hl=REQ-052 → 화면 · 탭 · 외곽선 | 통과 | cur dv.asn · act REQ-052 · tab req · 외곽선 3 |
| viewer | 하이라이트 레이어 = 별도 · pointer-events:none | 통과 |  |
| viewer | 프로토타입에서 화면 이동 → 패널 갱신 | 통과 | 미납 소명 sht.day · 매출 · 2건 |
| viewer | 팝업 열림 감지 → 팝업 anchor 활성 · 화면 anchor는 '팝업에 가려짐' | 통과 | 전: '위치 미연결 — 팝업을 열면 표시' · 뒤: 버튼 true · 표시 true · 가림 true |
| viewer | [칩 표시] → 번호 칩 | 통과 | 칩 6개 |
| viewer | 권한 변경 감지 → svc 불일치 흐림 + 문구 (EDI 해제) | 통과 |  |
| viewer | 닫기 → 플로팅 '기획 노트 n' · 열면 iframe 폭 줄어듦 | 통과 | iframe 1680 → 1280 |
| viewer | 패널 폭 360 ~ 520 | 통과 | 360 ~ 520 |
| viewer | 못 찾는 anchor → 오류 없이 이유 | 통과 | '없는 버튼' 없음 |
| viewer | file://로 열면 안내 문구 | 통과 | file://로 열었습니다.프로토타입과 같은 출처가 필요해 연결할 수 없 |
| 공통 | 콘솔 오류 0 (index · viewer · 프로토타입 프레임) | 통과 |  |
| 공통 | 프로토타입 원본 해시 전후 동일 | 통과 | 20130bd058fcd53c… (기준 20130bd058fcd53c…) |
