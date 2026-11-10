/* 기획노트 메타 — 사이트 · 상태 · 담당 · ID 접두어 · 기획노트 메뉴(GNB 9 > SNB)
   항목 데이터의 gnb / snb 값은 여기 menu의 k를 쓴다. */
window.NOTE = window.NOTE || {};
NOTE.meta = {
  ver: "0.1",
  updated: "2026-11-10",
  title: "공급사Portal 기획노트",
  proto: "../supplier_v5_0.html",
  protoName: "supplier_v5_0_261110.html",

  sites: [
    { k: "ALL", lb: "전체", d: "PortalAdmin · 유통사Portal · 공급사Portal 공통" },
    { k: "PA", lb: "PortalAdmin", d: "운영사 포털 (시스템 관리 · 업무 관리)" },
    { k: "DIST", lb: "유통사Portal", d: "GS리테일 내부 사용자" },
    { k: "SUP", lb: "공급사Portal", d: "공급사 · 협력사 사용자" },
  ],
  status: [
    { k: "확정", d: "근거 자료에서 정해진 것 — 그대로 구현" },
    { k: "협의", d: "기준안은 있으나 공통파트 · 업무파트 · 현업 합의 전" },
    { k: "보류", d: "다른 결정(인터페이스 방식 등)을 기다리는 것" },
    { k: "삭제", d: "범위에서 뺀 것 — 이력으로만 둠" },
    { k: "TBD", d: "자료에 없거나 값이 가정 — 출처와 담당을 함께 적음" },
  ],
  owner: [
    { k: "공통 제공", d: "공통파트가 컴포넌트 · 가이드 · 샘플로 제공" },
    { k: "업무 개발", d: "업무파트가 화면 · 데이터 · 연동을 개발" },
    { k: "기획 정의", d: "서비스기획이 규칙 · 값 · 문구를 정의" },
  ],
  types: [
    { k: "POL", lb: "정책", d: "여러 화면에 공통으로 걸리는 규칙" },
    { k: "SCR", lb: "화면", d: "화면 디스크립션 — 프로토타입 MENU id 1개당 1개" },
    { k: "REQ", lb: "요구사항", d: "요구사항 협의 관리대장 REQ-###" },
    { k: "ISS", lb: "이슈", d: "쟁점 · 미해결 과제 ISS-###" },
    { k: "SCN", lb: "시나리오", d: "업무 시나리오 (분기 포함)" },
    { k: "PRC", lb: "프로세스", d: "상태 정의 · 전이표 · 업무 흐름" },
    { k: "DEC", lb: "결정", d: "결정 · 미결 로그" },
  ],
  /* 프로토타입 안 위치 키 — bridge.js 해석표와 같음 */
  areas: [
    { k: "title", lb: "화면 제목" },
    { k: "search", lb: "조회 영역" },
    { k: "tabs", lb: "화면 탭" },
    { k: "toolbar", lb: "조작 영역 (표 위 버튼 묶음)" },
    { k: "grid", lb: "목록 (표)" },
    { k: "popup", lb: "팝업" },
  ],

  /* 기획노트 메뉴 — page가 있으면 데이터에서 계산해 보여 주는 화면 */
  menu: [
    { k: "intro", lb: "개요", snb: [
      { k: "hist", lb: "문서 히스토리", page: "history" },
      { k: "guide", lb: "이용 가이드", page: "guide" },
      { k: "site", lb: "사이트 구성" },
      { k: "env", lb: "사용자 환경 정의" },
      { k: "term", lb: "용어 사전" },
    ] },
    { k: "svc", lb: "서비스 구조", snb: [
      { k: "ia", lb: "IA (사이트별)" },
      { k: "map", lb: "서비스 맵" },
      { k: "menu", lb: "메뉴 관리 정책" },
      { k: "auth", lb: "권한 체계" },
      { k: "nav", lb: "GNB/SNB 노출 정책" },
    ] },
    { k: "proc", lb: "업무 프로세스", snb: [
      { k: "journey", lb: "저니맵" },
      { k: "sched", lb: "업무 일정 흐름도" },
      { k: "ord", lb: "주문" },
      { k: "dlv", lb: "납품" },
      { k: "short", lb: "미납" },
      { k: "rtn", lb: "반품" },
      { k: "notice", lb: "공지 · 휴무일" },
      { k: "stl", lb: "정산" },
      { k: "state", lb: "상태 정의 · 전이표" },
    ] },
    { k: "scn", lb: "업무 시나리오", snb: [
      { k: "ord", lb: "주문" },
      { k: "dlv", lb: "입고 준비" },
      { k: "sale", lb: "매출 · 미납" },
      { k: "stl", lb: "정산" },
      { k: "pd", lb: "상품" },
      { k: "co", lb: "소통" },
      { k: "acct", lb: "회사 관리 · 계정" },
    ] },
    { k: "scr", lb: "화면 설계", snb: [
      { k: "list", lb: "화면 목록", page: "screens" },
      { k: "ord", lb: "주문" },
      { k: "sale", lb: "매출" },
      { k: "stl", lb: "정산" },
      { k: "pd", lb: "상품" },
      { k: "inv", lb: "재고" },
      { k: "clm", lb: "클레임" },
      { k: "co", lb: "소통" },
      { k: "pt", lb: "회사 관리" },
      { k: "my", lb: "마이페이지" },
      { k: "auth", lb: "로그인 · 회원가입" },
    ] },
    { k: "ui", lb: "UI 공통 가이드", snb: [
      { k: "writing", lb: "UX Writing" },
      { k: "layout", lb: "화면 구성 원칙" },
      { k: "pattern", lb: "공통 화면 패턴" },
      { k: "comp", lb: "Components" },
      { k: "error", lb: "Error Page" },
    ] },
    { k: "fn", lb: "공통 기능 정책", snb: [
      { k: "user", lb: "로그인 사용자 정보" },
      { k: "personal", lb: "개인화" },
      { k: "dash", lb: "대시보드" },
      { k: "excel", lb: "엑셀 · EDI" },
      { k: "file", lb: "첨부파일" },
      { k: "print", lb: "인쇄 · 출력" },
      { k: "content", lb: "운영 콘텐츠" },
    ] },
    { k: "sys", lb: "시스템 · 연동 정책", snb: [
      { k: "session", lb: "세션" },
      { k: "log", lb: "접속 이력 제약" },
      { k: "msg", lb: "메시지 발송" },
      { k: "ext", lb: "외부 연계" },
      { k: "legacy", lb: "레거시 이관" },
      { k: "calc", lb: "업무 계산 로직" },
    ] },
    { k: "req", lb: "요구사항 · 협의", snb: [
      { k: "list", lb: "요구사항 리스트" },
      { k: "summary", lb: "현황 요약", page: "summary" },
      { k: "tracker", lb: "공통개발 협의 트래커", page: "tracker" },
      { k: "dec", lb: "미결 · 결정 로그", page: "decisions" },
    ] },
  ],

  /* 프로토타입 대메뉴(MENU k) → 화면 설계 SNB */
  scrSnb: { ord: "ord", sale: "sale", stl: "stl", pd: "pd", inv: "inv", clm: "clm", co: "co", pt: "pt", my: "my" },
};
