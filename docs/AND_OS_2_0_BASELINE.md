# AND OS 2.0 Baseline

조사일: 2026-10-07 (Asia/Seoul)
대상 저장소: `C:/Users/user/and-website`
기준 커밋: `522cbb884fa022773e9e6068285b842c8e043987`
문서 성격: 현재 상태를 기록하는 조사 기준선. 2.0 기능 완료 선언이나 운영 안전성 인증이 아니다.

## 1. 2.0 Baseline 상태표

| 영역 | 상태 | 성숙도 | 핵심 문제 |
|---|---|---|---|
| 인증/권한 | 로그인·최초 비밀번호 변경·3개 역할·관리자 사용자 관리 구현 | Production Beta | 견적 직접 REST의 역할별 컬럼 노출 미검증, 토큰 갱신 없음, 일부 강제 변경 제한은 UI 중심 |
| 견적 | 생성·수정·조회·삭제·공정 계산·저장 스냅샷·인쇄 구현 | Production Beta | 구버전 자동 수정 저장 경로, 원가 가산율/매출 마진율 혼재, 저장 합계 호환 문제 |
| 원가 | 운영/예정값·추가/복제·취소·배포·이력·그룹 UI 구현 | Production Beta | SQL 재현성 부족, DB 품목 마진율이 실제 판매가의 주 입력으로 쓰이지 않음 |
| 프로젝트 | 견적 기준 목록·검색·계약 상태 병합 구현 | Partial | 운영 DB projects는 존재하지만 0건, 앱은 estimates.id를 프로젝트 키로 사용 |
| 계약 | 옵션·번호·JSON 패키지·확정·3종 인쇄 구현 | Production Beta | 출력 조문이 확정 content_json에 고정되지 않음, 사양 연결이 문자열 기반 |
| 변경견적 | 테이블·생성/승인 API·후속 패키지 RPC 존재 | Foundation Only | 프런트 생성/승인 UI와 저장 함수 없음, 운영 기록 0건 |
| 공사관리 | 견적 상태·계약 날짜·발주내역서 출력만 존재 | Partial | 공정 일정, 실행 발주, 현장기록, 사진, 하자·인도 업무 관리 없음 |
| 고객 포털 | 고객 Auth 역할·프로젝트 소유권·전용 UI/API 없음 | Not Implemented | customers 테이블은 있지만 고객 계정/접근권 연결 없음 |
| 수금 | 계약 지급일정 JSON만 존재 | Foundation Only | 실제 입금·기성·미수금 원장 없음 |
| 프로젝트 손익 | 견적 예상원가·고객가·이익·원가 가산율 표시 | Partial | 실제 지출/원가·확정 손익 없음, GP%와 원가 가산율 의미 구분 필요 |

### 1.1 증거 구분 및 조사 한계

- **Repository 확인**: 현재 파일 원문, Git 추적 여부, 호출 경로, SQL 정의를 읽었다.
- **Production REST 확인**: 2026-10-07 14:22 KST부터 Supabase GET/HEAD 및 PostgREST OpenAPI를 조회했다. 인증정보와 고객 이름·연락처·주소는 문서에 기록하지 않았다.
- **운영 HTTP 확인**: 운영 /os와 로그인 없는 GET 응답을 조회했다. 역할별 로그인/쓰기 테스트는 수행하지 않았다.
- **확인 불가 / 추가 검증 필요**: 실제 DB의 RLS 정책 목록, GRANT, CHECK, 트리거/함수 본문, 비공개 스키마, Vercel 계정 설정·배포 SHA·환경변수, Supabase 요금제.
- SQL 실행 금지에 따라 pg_catalog 또는 SQL Editor 조회도 하지 않았다. OpenAPI가 보여 주는 컬럼·PK/FK·RPC 시그니처와 SQL 파일의 정의를 동일한 증거로 취급하지 않는다.
- '완전 구현'은 해당 기능에 UI/호출/저장 코드가 있다는 의미이며 자동 테스트 통과나 결함 부재를 뜻하지 않는다.
- 코드·DB·SQL·migration 변경, 테스트 실행, commit/push/deploy는 수행하지 않았다. 신규 기준선 문서만 작성했다.

### 1.2 실제 운영 데이터 기준값

| 객체/지표 | 이번 REST 조회 결과 |
|---|---|
| profiles | 3건: admin/manager/staff 각 1건, 전부 활성, must_change_password=false |
| estimates | 6건 |
| customers / projects / estimate_items | 각각 0건 |
| cost_items | 91건, 활성 91건, 변경 예정 및 pending 신규 0건 |
| 원가 품목 default_margin_rate | 0.30인 품목 91개 |
| cost_item_history / cost_publish_log | 89건 / 10건 |
| 최근 원가 배포 | 2026.09.28-001, 변경 3개 |
| estimate_document_options | 2건 |
| standard_spec_catalog | 23건 |
| contract_package_snapshots | 1건, CONTRACTED, package_version=1 |
| contract_document_versions | 3건: CONTRACT/QUOTE/SPEC 각 FINAL, locked_at 존재, 파일 필드 전부 null |
| change_orders / change_order_approvals | 각각 0건 |
| os_audit_logs | 29건 |
| Supabase Storage bucket 목록 | GET 성공, 빈 배열 |

최근 배포 published_at 원문은 `2026-09-28T09:57:36.38832+00:00`이다. 이를 임의로 KST 작업 시각으로 재해석하지 않았다. 일부 원가 SQL은 timestamptz 컬럼에 timezone('Asia/Seoul', now())를 사용하므로 날짜 표현 일관성은 추가 검증이 필요하다.

운영 도배 롤 원가: 베스띠 39,000원, 디아망 59,000원, 포티스 63,000원. 코드 fallback/seed의 45,000/60,000/90,000원과 구분한다. 배관 청소 운영 원가 300,000원, DB default_margin_rate=0.30; 별도 후처리의 고객가는 원가와 같은 금액이다.

과거 1.0 문서의 견적 4건·원가 65개·매출 마진 30%를 현재 운영값으로 재사용하지 않는다.

## 2. Repository 구조

### 2.1 주요 파일과 크기

라인 수는 UTF-8 텍스트의 빈 줄을 포함한다. 빈 줄을 제외한 Measure-Object -Line 결과와 다르다.

| 경로 | 라인 수 | 역할 / 의존관계 |
|---|---:|---|
| app/os/page.tsx | 20 | /os 진입점; /os-app/index.html?v=and-os-22 iframe |
| public/os-app/index.html | 1,341 | 로그인·상담·견적·관리·인쇄 시트, 정적 입력 DOM; main.js가 동적 영역 추가/제거 |
| public/os-app/styles.css | 1,980 | 화면·모바일·아코디언·A4 인쇄; main/index의 클래스 의존 |
| public/os-app/src/main.js | **8,191** | 상태·이벤트·견적 계산·원가·계약·사용자·출력 모두 연결 |
| public/os-app/src/storage.js | 577 | Auth/세션, 직접 Supabase REST/RPC, Next API 호출, 견적 정규화/저장 |
| public/os-app/src/state.js | 1 | ESTIMATE_ENGINE_VERSION 상수만 있음; 상태관리 모듈 아님 |
| public/os-app/src/utils.js | 1 | identity 함수만 있음; 실제 유틸 대부분 main.js |
| app/api/os/_lib/server.ts | 326 | Bearer 검증, Auth 재조회, profiles 검증, service_role 접근, 감사 기록 |
| app/api/os/contract-packages/_lib/contracts.ts | 885 | 계약 옵션 검증·번호 예약·스냅샷·사양 매칭·문서 JSON·hash·staff projection |
| app/api/os/cost-items/_lib.ts | 131 | 원가 입력/코드/계산기준 검증, RPC payload·감사 데이터 |
| docs/AND_OS_1_0_CLEAN_BASELINE.md | 78 | 2026-07-20 과거 기준선; 참고만 했으며 수정하지 않음 |
| package.json / package-lock.json | 설정/lock | Next 16.2.9, React 19.2.4; dev/build/start/lint, 정식 test script 없음 |
| next.config.ts | 설정 | /os와 /os-app noindex 헤더; DB/API 권한과 별개 |
| vercel.json | 설정 | /api/os/keepalive 매일 00:00 UTC cron 정의 |
| .env.local | 로컬 비추적 설정 | SUPABASE_SERVICE_ROLE_KEY 존재 확인만; 값 미기록 |
| .gitignore / eslint.config.mjs / tsconfig.json | 설정 | env/.vercel/build 제외, Next ESLint/TS 설정 |
| .github/workflows/indexnow-production.yml | 35 | Vercel Production 성공 후 웹사이트 검색 색인 알림; OS 테스트/배포 파이프라인 아님 |
| scripts/indexnow.mjs / optimize-home-images.mjs | 522 / 64 | 웹사이트 색인·이미지 작업; OS 정식 테스트 아님 |

다른 app/projects와 app/data/projects.ts는 홈페이지 포트폴리오 콘텐츠이다. AND OS의 운영 DB projects와 혼동하지 않는다.

### 2.2 계산·렌더 보조 파일 전수 목록

| public/os-app/src 이하 경로 | 라인 수 | 구현 상태 |
|---|---:|---|
| calculator/bathroom.js | 43 | 욕실 기본/옵션·등급·위치조정 직접원가 상세 |
| calculator/finish.js | 86 | 공용/각방 도배 롤·천장 배분·잡자재·필름 물량 |
| calculator/kitchen.js | 27 | 주방 표준설비·직접입력 고정 고객가 |
| calculator/door.js | 15 | 중문·일반도어·슬라이딩도어 |
| calculator/misc.js | 14 | 폐기물·세대 보양·입주청소 |
| calculator/carpentry.js, demolition.js, electrical.js, furniture.js, lighting.js, tile.js | 각 1 | 각 함수는 빈 배열 반환; 실제 계산은 main.js |
| rates/bathroom.js, door.js, finish.js, kitchen.js, misc.js | 13 / 5 / 12 / 6 / 5 | 코드 fallback 단가·치수·로스 계수; 운영 DB 단가와 별개 |
| render/admin.js, customer.js, estimate.js, summary.js | 각 1 | 빈 렌더 함수; 실제 출력/렌더는 main.js |

### 2.3 main.js 집중 기능과 공유 상태

| 영역 | 주요 함수/상태 | 주요 의존 |
|---|---|---|
| 인증/권한 | completeLogin, enterAuthenticatedApp, applyAccessControl, currentProfile | storage.loadCurrentOsUser, DOM 제거/재생성 |
| 프로젝트 | renderSavedEstimateRows, renderProjectSearchResults, loadEstimateIntoUi, cachedEstimates, currentEditingEstimateId | estimates REST, 계약 목록 |
| 견적 | readState, calculate, makeDetail, buildEstimateSnapshot, render, refresh | el DOM 참조, rates, 계산 보조 파일 |
| 저장 결과/부분 조정 | loadedEstimateBaseline, activeQuoteEstimate, lastRenderedEstimateSnapshot, applyExistingPipeCleaningAdjustment | 고객/내부 상세·합계·수정 저장·출력 공통 |
| 내부견적 | buildAdminMarginGroups, storedEstimateSummary, buildEstimateDiagnostics, renderAdminEstimateDetailPanel | 저장 internalDetails, customerQuote, costTotal |
| 원가 | originalCostItems, editedCostItems, dirtyItemCodes, loadRateSettings, renderSystemManagement | cost_items·history·publish log·RPC |
| 계약 | contractOptionsState, contractPreviewState, contractPackagesState, ensureContractPackagePanel, createContractPackageFromForm | Next API, 저장 견적 |
| 문서 | CONTRACT_FIXED_TERM_LINES, renderContractPrintSheet, renderPrintQuote, renderPurchaseOrderPrint | 현재 main.js 본문, 공통 #printQuoteSheet |
| 사용자/감사 | osUsers, osAuditLogs, refreshUserManagement, refreshAuditLogs | 관리자 Next API |

화면 전환은 URL 라우팅 대신 data-tab + .tab-panel이다. 정적 client/quote/internal/admin 외 system 및 계약/사용자/감사 영역을 main.js가 추가한다. 관리 하단 레거시 상세와 관리기준 블록은 시작 시 제거한다. 다만 el에는 제거 전 DOM 참조가 남아 계산값으로 사용된다.

현재 캐시 키: iframe and-os-22 / CSS and-os-11 / main.js and-os-53. ES module 보조 import에는 버전 쿼리가 없다.

### 2.4 Next API 파일 크기

| app/api/os 이하 경로 | 라인 수 |
|---|---:|
| me/route.ts | 11 |
| keepalive/route.ts | 12 |
| users/route.ts | 99 |
| users/[id]/route.ts | 104 |
| users/[id]/reset-password/route.ts | 54 |
| auth/change-password/route.ts | 43 |
| audit-logs/route.ts | 53 |
| cost-items/route.ts | 40 |
| cost-items/clone/route.ts | 65 |
| cost-items/[id]/route.ts | 74 |
| contract-options/route.ts | 101 |
| contract-packages/route.ts | 139 |
| contract-packages/preview/route.ts | 29 |
| contract-packages/[id]/route.ts | 34 |
| contract-packages/[id]/confirm/route.ts | 44 |
| change-orders/route.ts | 79 |
| change-orders/[id]/approve/route.ts | 64 |

## 3. 기능 Inventory

### 3.1 인증・권한

| 기능 | 구현 분류 | 실제 동작과 한계 |
|---|---|---|
| 이메일/비밀번호 로그인·로그아웃 | 완전 구현 | Auth /token?grant_type=password 및 /logout 직접 호출 |
| 세션 복원 | 부분 구현 | sessionStorage의 and-os.auth-session; refresh token 갱신 코드 없음 |
| 사용자·역할 | 완전 구현 | Auth 사용자 + profiles; admin/manager/staff만 서버 타입/검증 허용 |
| 최초 비밀번호 변경 | 부분 구현 | UI 강제 화면 및 Auth/profile/audit 순차 처리; 일반 getUserContext는 must_change_password를 차단하지 않음 |
| 사용자 생성·수정·초기 재설정 | 완전 구현 | requireAdmin, 마지막 활성 관리자/자기 비활성화 방지 |
| 프런트 역할 제한 | 완전 구현 | staff는 내부/system DOM 제거; manager는 조회용 system, 사용자/감사 수정 UI 없음 |
| Next API 역할 제한 | 완전 구현 | 서버 Auth 검증+profiles.is_active+각 API의 역할 검사 |
| 견적 직접 REST 컬럼 보안 | 부분 구현 | select=*에 estimate_data 내부정보 포함; staff RLS/컬럼 차단은 이번 조회에서 확인 불가 |
| 감사 로그 | 부분 구현 | 29건 확인; 관리자 API/UI, secret 키 필터; 핵심 쓰기와 별도 요청인 경로 존재 |
| 고객 역할·tenant/조직 분리 | 미구현 | customer 역할 또는 프로젝트 회원 권한 구조 없음 |

실제 프런트 제한: admin은 전체, manager는 내부 정보 조회 및 계약 전체 목록 조회, staff는 고객 UI와 허용 계약 옵션/미리보기. **manager 견적 REST 쓰기 차단과 staff 내부정보 비노출은 UI 코드만으로 확정하지 않는다.**

계약 API staff projection은 source/content hash, notes, 생성자/확정자 등 필드를 제외하는 whitelist 방식이다. document.content_json와 customer_quote 자체는 재귀 whitelist가 아니라 기존 생성 구조를 신뢰한다.

### 3.2 견적

| 기능 | 구현 분류 | 근거 |
|---|---|---|
| 상담 입력·견적 생성 | 완전 구현 | index.html의 프로젝트/평형/고객/연락처·9개 공정 섹션, main.readState/calculate |
| 공정 선택·수량·등급·보정 입력 | 완전 구현 | 길이/평수/개수/체크박스·선택값; inputs에 저장 |
| 일반 입력 수정·재계산 | 완전 구현 | input/change → handleEstimateInputChanged → refresh |
| 저장·수정·조회·삭제 | 부분 구현 | 직접 REST 구현; 신규 저장 ID 미반환·fallback·주소 손실 위험은 11절 |
| 프로젝트 연결 | 부분 구현 | estimates.id 기반; 운영 project_id 전부 비연결 |
| 저장 스냅샷 복원 | 부분 구현 | 저장 customerQuote/internalDetails 우선, 일부 구버전은 자동 재계산/자동 PATCH |
| 고객가·원가·이익 | 완전 구현 | 일반 판매가 = cost × (1+targetMargin) × (1+correction), 천원 절사 |
| 고정 배관 청소 | 완전 구현 | 독립 change handler, 후처리로 내부/고객 동일 금액 1회 반영 |
| 주방 직접 가격 | 완전 구현 | 고정 customerRevenue, cost=0, 설치비는 별도 |
| 고객견적/내부견적/발주내역 출력 | 완전 구현 | HTML + window.print; 서버 PDF 없음 |
| 저장 합계 진단 | 부분 구현 | 원가 누락/고객가 조정/추정 불일치 안내; 계약 총액 직접 대조는 없음 |
| 계산 엔진 버전 저장 | 미구현 | state 상수는 있으나 실제 estimate_data에 버전/가격정책 식별값 저장 없음 |

### 3.3 공정별 산식·자동 물량

| 공정 | 현재 코드 산출 |
|---|---|
| 철거/인허가 | 바닥·천장은 areaPyeong, 가구는 길이/300mm 자 환산, 욕실 개소, E/V·허가·동의서 1식 체크 |
| 전기/조명 | 건축 연한별 기공 품수, 배선/스위치 1식, 등 종류별 개수, T3 길이 |
| 욕실/타일 | 욕실 칸수, 타일 기공 칸당 3품·조공 1품, 위치조정 체크, 실속 0.75배·고급 기본원가+700,000원/칸 |
| 도배 | 전체 천장=평형×3.3058㎡; 공용/각방 벽길이 비율로 천장 배분; (벽면적+배분 천장)×1.15÷15㎡/롤 올림 |
| 도배 인건비/잡자재 | p20/p30/p40/p50 품수: 초배 없음 5/6/9/11, 포함 6/7/11/15; 잡자재=평형×평당 원가 |
| 도배 등급 | 공용/각방 각각 베스띠·디아망·포티스; 벽길이 합계 0이면 롤 본자재 행 없음 |
| 필름 | (길이mm×2400mm÷1,000,000)×1.15÷27.5㎡/롤 올림; 평형 구간 인건비 별도 |
| 바닥 | 선택 시공평수×선택 장판/마루 단가; 별도 바닥 인건비 행 없음 |
| 바닥 등급 | 장판 1.8/2/2.2/3.2/4.5/5T; 마루 LX 에디톤/일반마루 |
| 목공 | 작업별 소수 품수 합→Math.ceil; 기계품 동일 올림품수; 가벽 MDF 양면×2, 가벽 각재 구조×2, 자재 15% 할증 후 올림 |
| 가구/상판 | 길이 자 환산, EP/서랍/조명; 하부장 길이 상판, 홈바 키큰장 기준 초과 부분, 석재 판/가공/시공 조합 |
| 도어/창호 | 중문/일반/슬라이딩 수량; 창호는 별도 실측 안내 수준 |
| 마감/기타 | 실리콘/보양/폐기물/입주청소/탄성 1식·추가 개소; 배관 청소 별도 후처리 |
| 일반 판매가 | 개별 상세에서 원가 가산율 및 보정률 적용 후 고객표시 천원 절사 |
| 고정 판매가 예외 | 배관 청소는 원가=판매가, 주방 직접입력은 원가=0·입력 판매가 |

걸레받이·몰딩은 목공 품수 옵션이다. 발코니는 별도 관리 공정이 아니라 탄성 개소 등 입력 범위다. 독립 방/욕실 실측 기반 전체 자동산출 엔진은 없다.

### 3.4 금액 정책과 저장 데이터 호환

- 현재 sellPrice와 markupRate(main.js:513)은 **원가 가산율**이다. 원가 100에 30% 추가한 고객가는 130이고, GP%는 약 23.08%이다.
- 이름 marginRate는 기존 그대로다. 신규 후처리·대분류 마진은 profit/cost를 사용한다. 과거 저장 견적의 같은 필드는 profit/revenue인 사례가 존재한다.
- DB default_margin_rate는 기록/관리/스냅샷 비교에 사용되지만 calculate의 margin은 state.targetMargin이다. 품목별 default_margin_rate를 판매가 산식에 직접 넣는 경로는 확인되지 않았다.
- 배관 청소의 명목 300,000원은 PIPE_CLEANING_AMOUNT 기본값이며 updateRatesFromAdmin에서 DB 품목 단가로 바뀔 수 있다. 현재 운영 DB값은 300,000원이다.
- 고객용 group/total은 절사된 행 합으로 작성한다. 일반 calculate의 raw revenue 및 internalSummary와 고객표시 합계가 항상 같은 방식으로 만들어지는 것은 아니다.
- 고객 개인정보를 뺀 운영 저장값 조사: 6건의 row.total_price와 JSON total 및 customerQuote.total은 일치. 1건의 customerQuote 그룹/행 합계는 총액보다 약 923.08원 큼. 상세 고객가 합계가 전체보다 13,000원/25,000원 작은 구버전 사례가 각각 1건. 직접원가 상세 합계는 6건 모두 cost_total과 일치.
- 1건의 internalSummary.customerRevenue는 고객 견적 총액보다 25,000원 큼. 실제 입력/과거 정책 설명은 추가 검증 필요하며 자동 보정하지 않았다.
- 저장 marginRate가 30/35인 과거 기록은 GP%에 가깝고 최근 3건은 원가 가산율에 가깝다. 의미를 한 가지로 단정하거나 일괄 변환하지 않는다.

### 3.5 원가

완전 구현 코드: 품목 조회, 운영값/예정값 분리, 신규 pending 생성·복제·수정, 활성화/비활성화 예정, 단일/전체 취소, 배포, 이력, 전체/공정 마진 예정값, 공정별 취소, 배포 기록 원복 예정값.

부분 구현: 여러 품목 작업은 프런트 반복 RPC라 중간 실패 시 일부 임시저장만 완료될 수 있다. 원복은 새 draft 생성이며 이력을 되돌리거나 삭제하지 않는다. calculation_basis/multiplier/min_quantity/rounding_method는 관리하지만 임의 신규 코드가 일반 계산 엔진에 자동 연결되는 구조는 없다.

운영 category별 수량: 철거7, 전기11, 목공9, 가구22, 욕실3, 타일·욕실11, 도배5, 필름1, 바닥8, 마감4, 상판8, 인허가2 = 91.

현재 UI 매핑 기준으로: 철거7 / 전기·조명11 / 목공9 / 가구22 / 타일·욕실14 / 도배·필름6 / 바닥8 / 마감·기타14 = 91. 도어·창호 그룹은 해당 category 품목이 없어 생성되지 않는다.

systemCategoryLabel → groupedSystemCostRows로 표시키를 먼저 통합한다. 검색/세부분류/활성/예정상태/정렬 필터가 있고, 한 공정 펼침 상태를 expandedSystemCostCategory로 관리한다. bulk/category 취소는 표시 대분류가 아니라 원본 category 기준이다.

### 3.6 프로젝트・계약・변경견적

| 기능 | 구현 분류 | 현재 범위 |
|---|---|---|
| 프로젝트 목록/검색/열기 | 완전 구현 | loadEstimates 1회, admin/manager 계약 전체 목록 1회 병합; staff 전체 계약 호출 없음 |
| 최신 계약 표시 | 완전 구현 | estimate_id별 package_version 우선, 동일 버전은 updated_at/created_at 비교 |
| 프로젝트 상세 | 부분 구현 | 별도 프로젝트 화면/테이블 저장이 아니라 견적·계약 작업영역 |
| 계약 옵션 | 완전 구현 | 견적 원본 읽고 별도 estimate_document_options 저장 |
| 옵션 승계 | 완전 구현 | 저장 options.id 있으면 저장값 우선; 없으면 견적 동의서/인허가/보양 기본값 |
| 계약 최종 체크 UI | 완전 구현 | 관리사무소 신고·입주민 동의 / 인허가 / 마감재 보양 3개 |
| 계약번호 | 완전 구현 | AND-YYYY-MM-NNN, 서버가 options에 예약, 월별 검색·재시도 |
| 계약 패키지 생성/확정 | 완전 구현 | admin UI 두 단계 POST; READY 생성 후 confirm으로 CONTRACTED |
| staff 계약 작업 | 부분 구현 | 옵션·미리보기 가능, 패키지 저장/확정은 API 및 UI admin 전용 |
| 확정 후 원본 잠금 | 부분 구현 | SQL 트리거·권한 정의 존재; 실제 production 트리거 현재 정의는 확인 불가 |
| 3종 문서 미리보기/인쇄 | 완전 구현 | JSON 미리보기·HTML 개별/일괄 인쇄 |
| 공사사양 자동연결 | 부분 구현 | 이름/category 문자열 aliases, 카탈로그 기본 grade; 수량/단위/선택급 완전 매핑 없음 |
| 변경견적 생성/승인 | DB/API만 구현 | admin API + pending 후속 패키지/고객 증적 RPC |
| 변경견적 검색/작성/승인 UI | 미구현 | main/storage에 change_orders 호출·화면 없음 |
| 고객 전자 승인 | 미구현 | admin이 외부 증적을 기록하는 API만 있음 |

계약 옵션의 통합 UI는 한 체크값을 저장 시 admin_office_filing_included와 resident_consent_included 양쪽에 쓴다. 레거시 저장값 표시에는 OR를 사용한다. API의 기존 JSON 구조는 여전히 두 키를 보유한다.

배관 청소 계약 체크박스는 없다. 서버 normalizeProtectionOptions/evaluateClauses에는 existing_pipe_cleaning_included 레거시 키가 남아 있고, collectContractOptionsPayload는 이를 전달하지 않는다. 서버는 견적의 existingPipeCleaningEnabled를 조건부 조항에 자동 연결하지 않는다. 따라서 견적에 유상 청소가 있어도 exclusion이 만들어질 수 있는 구조다.

### 3.7 공사관리・포털・회계의 존재 여부

| 영역 | 구현 분류 | 코드/DB 근거 |
|---|---|---|
| 공사 일정 | 부분 구현 | 계약 start_date/planned_completion_date만 있음; 캘린더/공정 일정 없음 |
| 공정 상태 | 미구현 | 견적의 status 목록은 프로젝트 수준 표시; 상세 공정 진행 상태 없음 |
| 발주 | UI만 구현 | purchaseOrderItems/renderPurchaseOrder/Print: 내부 상세의 자재명 키워드 필터와 예상 원가 출력 |
| 발주 실행/협력업체 주문 | 미구현 | 발주 저장 테이블·상태·API·실제 주문금액 연결 없음 |
| 현장기록/사진 | 미구현 | 계약 조문에 표현은 있지만 업무 저장/업로드 기능 없음 |
| 기성/실제 수금/미수금 | 미구현 | payment_schedule는 계약 예정 지급액이며 실제 거래가 아님 |
| 하자/인수인계 | 미구현 | 계약 고정 조문만 있고 접수·처리·인수확인 데이터 흐름 없음 |
| 고객 포털 | 미구현 | customer 역할, 고객 Auth 연결, 고객별 RLS·로그인 UI/API 없음 |
| 예상 매출/원가/이익 | 완전 구현 | estimate.total/costTotal/internalSummary |
| 실제 원가/지출/확정 프로젝트 손익 | 미구현 | 실제 지출/수금 원장 없음 |
| GP와 GP% | 부분 구현 | profit 계산은 존재; 현재 marginRate는 원가 가산율, GP% 전용 현재 지표 없음 |

## 4. DB Inventory

### 4.1 Tables / 운영 REST 관계

OpenAPI에 노출된 public 관계는 아래 15개다. auth.users는 Supabase Auth와 FK 참조로 확인하며 public REST 테이블 목록에 포함하지 않는다. 금액은 확인 가능한 스키마에서 numeric, 일시는 timestamptz이며 effective_from/to와 customer_signed_at은 date다.

| 객체 | PK / 주요 FK | 핵심 컬럼 및 용도 | Repository 근거 |
|---|---|---|---|
| profiles | id uuid; auth 사용자 연결(실제 FK는 추가 검증 필요) | name/email/role/is_active/must_change_password/created_at/updated_at | server.ts 및 미추적 rfc_003a |
| customers | id uuid | name/phone/memo/created_at/updated_at; 0건 | 운영 OpenAPI만; DDL 없음 |
| projects | id uuid, customer_id→customers.id | project_name/address/area_pyeong/status/memo/일시; 0건 | 운영 OpenAPI만; 앱 호출 없음 |
| estimates | id uuid, project_id→projects.id | project_name/client_name/phone/address/area_pyeong/total_price/cost_total/margin_rate/status/estimate_data/일시 | storage/contracts; 생성 DDL 없음 |
| estimate_items | id uuid, estimate_id→estimates.id | group_name/item_name/quantity(text)/unit_price/cost/customer_price/memo/sort_order/created_at; 0건 | 운영 OpenAPI만; 앱 호출 없음 |
| cost_items | id uuid, source_cost_item_id→자기 테이블, updated_by/draft_updated_by→auth.users(SQL) | category/subcategory/item_code/unit/cost_price/default_margin_rate, 표시/자재/인건비/서비스 flags, 공급자·memo·활성·정렬, draft 값·일시·작성자, 계산 metadata·pending | cost_items.sql, 004b, hotfix; 일부 컬럼 DDL은 미추적 v2_3 |
| cost_item_history | id uuid, cost_item_id→cost_items.id, changed_by→auth.users(SQL) | old/new cost·margin·active, changed_at/reason/cost_version | cost_items.sql + v2_3 |
| cost_publish_log | id uuid, published_by→auth.users(SQL) | version/reason/changed_item_count/price/margin/active count/duration_ms/memo/일시 | 생성 DDL은 미추적 v2_3, 호출은 tracked hotfix |
| os_audit_logs | id uuid; actor/target는 참조값, SQL FK 없음 | actor 정보/action/target 정보/before_data/after_data/result/reason/created_at | rfc_003f |
| estimate_document_options | id uuid, estimate_id→estimates RESTRICT, created/updated_by→auth.users | 계약번호·기본/고객/시공자/담당자 JSON, admin/protection/item 옵션, notes/일시 | rfc_006 |
| standard_spec_catalog | id uuid | spec_code/version/effective_from/to/work_category/item_name/default_grade/spec_text/applies_to/active/sort/일시 | rfc_006, 23 seed |
| contract_package_snapshots | id uuid, estimate_id→estimates RESTRICT, parent→자기 RESTRICT, originating_change_order_id→change_orders RESTRICT | 개정·버전·번호·상태·고정 JSON·source/manifest hash·원계약/누적/차액/개정금액·생성/확정 정보 | rfc_006 |
| contract_document_versions | id uuid, package_id→패키지 RESTRICT | document_type/package_version/generation_status/content_json/content_hash/file_path/file_url/mime_type/locked_at/created_by/created_at | rfc_006 |
| change_orders | id uuid, package_id/pending_package_id→패키지 RESTRICT, estimate_id→estimates RESTRICT | change_version/status/title/before/after_snapshot/amount_delta/schedule_impact/approval_snapshot/manifest/source hash/승인 정보 | rfc_006 |
| change_order_approvals | id uuid, change_order_id→change_orders RESTRICT | 고객명/승인방식/증적 참조/승인 hash·버전·date/원계약금액/누적/차액/개정금액/approval JSON/hash/기록자 | rfc_006 |

estimates와 project_id가 연결되지 않은 기존 6건을 확인했다. 독립 프로젝트 기반으로 구현됐다고 기록하지 않는다. 앱 입력/상세는 estimate_data이며 estimate_items를 쓰지 않는다.

### 4.2 제약조건・인덱스

- 원가: item_code UNIQUE, 활성/정렬/category·subcategory/품목이력 인덱스; pending 신규·draft 일시 부분 인덱스.
- 원가 calculation_basis 14개 허용값, rounding_method 4개 허용값, multiplier/min_quantity nonnegative CHECK.
- options: estimate_id UNIQUE, contract_no non-null 부분 UNIQUE, estimate_id FK RESTRICT.
- spec: (spec_code,version) UNIQUE, 활성 spec_code 부분 UNIQUE, 적용기간 순서 CHECK.
- package: (estimate_id,package_version) UNIQUE, 허용 status CHECK, source_hash nonempty, active 상태의 source/template/rule 부분 UNIQUE; 금액 관계 CHECK.
- document: (package_id,package_version,document_type) UNIQUE, 3종 타입 CHECK, content_json object/nonempty, hash nonempty.
- change: (package_id,change_version) UNIQUE, 원본별 pending 1건·pending_package_id 부분 UNIQUE.
- approval: change_order_id UNIQUE, 증적 파일/URL 최소 하나 CHECK, 개정금액=원계약+누적변경+당회차액 CHECK.
- 계약 관련 FK는 RESTRICT이며 estimates 삭제에 따른 CASCADE 문서 삭제 정의는 없다.
- cost_item_history FK는 cost_items 삭제 CASCADE다. 신규 pending 취소 삭제는 이력 없는 품목을 전제로 한다.
- 실제 운영 인덱스/CHECK/ON DELETE 전체 목록은 SQL 실행 금지로 **추가 검증 필요**. OpenAPI에서 FK 관계가 보였다는 사실만 확인했다.

### 4.3 Views・Storage

- Repository에서 CREATE VIEW 정의 없음.
- 운영 public OpenAPI 객체만으로 모든 view 존재 여부나 비노출 view를 확인할 수 없다: **확인 불가**.
- 코드에 Supabase Storage 업로드/다운로드 경로 없음. 이번 bucket 목록은 0개.
- 계약 문서 file_path/file_url/mime_type는 확장용 nullable 컬럼이며 운영 3종 문서 모두 null.
- evidence_file_id/evidence_url은 외부 승인 증적 참조일 뿐, 업로드 구현이나 실제 파일 접근 보장이 아니다.

### 4.4 Functions / RPC Inventory

아래 15개 이름과 요청 인자명·타입은 운영 service-role OpenAPI에서 존재 확인. 실행하지 않았으며 실제 함수 본문/GRANT는 별도 증거다.

| 함수 | 입력 → 출력(SQL 기준) | 목적 / 호출 | 권한 정의 |
|---|---|---|---|
| current_and_os_role | 없음 → text | profiles.id=auth.uid 역할, RLS/helper | SECURITY DEFINER/public search_path; 현재 GRANT 미확인 |
| is_and_os_admin | 없음 → boolean | cost RPC/RLS의 admin 조건 | SECURITY DEFINER/public search_path |
| validate_and_os_cost_item_code | p_item_code text → text | 코드 대문자/패턴 검증, cost RPC 내부 | authenticated EXECUTE SQL |
| create_cost_item_pending | 23 인자: 코드/분류/명칭/단위/계산기준 text, 원가·마진 numeric, 활성 boolean, 정렬 integer + 표시/계산/원본 옵션 | cost row 반환; Next cost create/clone→사용자 Bearer RPC | 내부 admin 검사, authenticated EXECUTE |
| update_cost_item_pending | p_cost_item_id uuid + 위 입력(원본복제 id 제외), 23 인자 → cost row | 신규 pending만 수정; Next PATCH→사용자 RPC | admin 검사, authenticated EXECUTE |
| save_cost_item_draft | p_cost_item_id uuid, p_draft_cost_price numeric, p_draft_margin_rate numeric, p_draft_is_active boolean → cost row | storage.saveCostItemDraft 직접 RPC | admin 검사; 정의는 미추적 v2_3, 실제 hardening 본문 미확인 |
| cancel_cost_item_draft | p_cost_item_id uuid → cost row | 단일 취소/신규 pending 삭제 | admin 검사; tracked hotfix flag·authenticated EXECUTE |
| cancel_all_cost_drafts | 없음 → integer | 전체 임시값 제거 | 위와 동일 |
| next_cost_publish_version | 없음 → text | YYYY.MM.DD-NNN 배포버전; publish 내부 | 미추적 v2_3는 authenticated도 EXECUTE revoke; OpenAPI 노출과 차이 확인 필요 |
| publish_cost_drafts | p_reason text, p_memo text → version/count 5컬럼 table | history+운영값+publish_log 원자 처리 | admin 검사; 최신 hotfix는 최초 history 이전 flag |
| and_os_now | 없음 → timestamptz | RFC-006 생성/변경/잠금시각 | 일반 SQL 함수/public search_path |
| create_contract_package_snapshot | p_actor_user_id uuid, p_payload jsonb → jsonb | 패키지+3종 GENERATED 문서, DRAFT→PREVIEWED→READY | service_role만 EXECUTE SQL; DB role 검사 admin/staff, API는 admin만 |
| confirm_contract_package_snapshot | p_package_id uuid, p_actor_user_id uuid → jsonb | READY 잠금, 문서 FINAL, CONTRACTED | service_role만 EXECUTE, admin 검사 |
| create_contract_change_order | p_actor_user_id uuid, p_payload jsonb → jsonb | 확정 원본→CHANGE_PENDING, 후속 READY 패키지·문서 | service_role만 EXECUTE, admin 검사 |
| approve_contract_change_order | p_actor_user_id uuid, p_change_order_id uuid, p_payload jsonb → jsonb | 증적·hash/버전 검사, 승인 기록, 원본 SUPERSEDED·후속 CONTRACTED | service_role만 EXECUTE, admin 검사 |

create/update cost 인자의 상세 필드 대응은 app/api/os/cost-items/_lib.ts:costItemRpcPayload 및 rfc_004b의 함수 시그니처에 보존돼 있다. p_source_cost_item_id는 create 전용이다.

추가 helper/trigger 함수(SQL 파일 확인):

- set_updated_at() → trigger: cost_items.updated_at.
- set_profiles_updated_at() → trigger: profiles.updated_at. 미추적 파일 정의.
- set_rfc006_updated_at() → trigger: 옵션/표준사양/패키지/change updated_at.
- prevent_contract_no_cross_estimate() → trigger: 다른 estimate에 같은 번호 금지.
- enforce_contract_package_state_transition() → trigger: 상태 전이·확정 payload 보호.
- prevent_locked_contract_document_change() → trigger: FINAL/locked_at 수정·삭제 금지.
- prevent_approved_change_order_mutation() → trigger: APPROVED 수정·삭제 금지.
- prevent_change_order_approval_mutation() → trigger: 승인 기록 UPDATE/DELETE 금지.
- rfc004s_register_wallpaper_material_cost_item() / register_recent_and_os_cost_items(): 일회 등록, SQL 내부 호출 후 DROP. 운영 OpenAPI에 없음.
- and_os_require_cost_rpc_mutation(): 과거 적용 이력/관련 hotfix가 의존하는 guard 이름. 현재 저장소에 생성 정의가 없어 본문·부착 범위의 현행 상태는 확인 불가.

### 4.5 RLS・직접 접근 권한

RLS policy만으로 접근 여부가 결정되지 않는다. 테이블 GRANT/REVOKE, service_role 및 함수 내부 검사를 함께 기록한다. 아래는 **파일 정의**, 이번 운영 DB 정책 실조회가 아니다.

| 테이블 | 역할 | SELECT | INSERT | UPDATE | DELETE | 근거/한계 |
|---|---|---|---|---|---|---|
| profiles | authenticated 본인 | id=auth.uid policy | revoke | revoke | revoke | 미추적 rfc_003a; 운영 정책 동일성 미확인 |
| estimates | 각 역할 | 확인 불가 | 확인 불가 | 확인 불가 | 확인 불가 | 생성/RLS DDL 없음; 앱이 직접 REST 호출 |
| customers/projects/estimate_items | 각 역할 | 확인 불가 | 확인 불가 | 확인 불가 | 확인 불가 | 운영 OpenAPI만 존재 |
| cost_items | authenticated admin | admin policy | base SQL admin policy | base SQL admin policy | base SQL admin policy | baseline의 직접 mutation 차단 hardening 정의는 저장소 누락 |
| cost_item_history | authenticated admin | admin policy | admin policy | policy 정의 없음 | policy 정의 없음 | base SQL; hardening 현행 미확인 |
| cost_publish_log | authenticated admin | admin policy | admin policy | admin policy | admin policy | 미추적 v2_3; 후속 hardening 현행 미확인 |
| os_audit_logs | anon/authenticated | revoke | revoke | revoke | revoke | RLS enable, 일반 역할 policy 없음 |
| os_audit_logs | service_role | grant | grant | 명시 grant 없음 | 명시 grant 없음 | rfc_003f; 실제 추가 GRANT 미확인 |
| estimate_document_options | anon/authenticated | revoke | revoke | revoke | revoke | role SELECT policy가 있어도 GRANT가 막음 |
| estimate_document_options | service_role | grant | grant | grant | 명시 grant 없음 | Next 옵션 경로 |
| standard_spec_catalog | authenticated admin/manager/staff | role policy+grant | revoke | revoke | revoke | 고객 role 없음 |
| contract_package_snapshots / contract_document_versions | anon/authenticated | revoke | revoke | revoke | revoke | SELECT policy 존재와 실제 GRANT 구분 |
| contract_package_snapshots / contract_document_versions | service_role | 명시 grant | RPC 경로 | RPC 경로 | 명시 grant 없음 | RPC SECURITY DEFINER owner 쓰기 |
| change_orders / change_order_approvals | anon/authenticated | revoke | revoke | revoke | revoke | role SELECT policy admin/manager지만 직접 GRANT 없음 |
| change_orders / change_order_approvals | service_role | 명시 grant | RPC 경로 | RPC/잠금 경로 | 명시 grant 없음 | API staff 차단 |

cost role helper의 tracked 정의는 is_active/must_change_password를 확인하지 않는다. 서버 requireAdmin의 활성 확인이 직접 브라우저 RPC에 자동 적용되는 것은 아니다. 실제 운영 helper가 보완됐는지는 추가 검증 필요하다.

### 4.6 Triggers・상태・잠금

| 트리거(SQL 정의) | 대상 | 목적 |
|---|---|---|
| set_cost_items_updated_at | cost_items | 수정일 갱신 |
| profiles_set_updated_at | profiles | 수정일 갱신, 미추적 파일 |
| estimate_document_options_updated_at | options | 수정일 갱신 |
| standard_spec_catalog_updated_at | catalog | 수정일 갱신 |
| contract_package_snapshots_updated_at | package | 수정일 갱신 |
| change_orders_updated_at | change | 수정일 갱신 |
| estimate_document_options_contract_no_guard / contract_package_contract_no_guard | options/package | estimate 간 번호 중복 방지 |
| contract_package_state_guard | package UPDATE/DELETE | 확정 payload/종료 상태·전이 보호 |
| contract_document_lock_guard | document UPDATE/DELETE | FINAL 또는 locked 문서 불변 |
| change_order_lock_guard | change UPDATE/DELETE | APPROVED 불변 |
| change_order_approval_immutable_guard | approval UPDATE/DELETE | 모든 승인 기록 불변 |

허용 전이(SQL): DRAFT→PREVIEWED; PREVIEWED→DRAFT/READY; READY→DRAFT/CONTRACTED; CONTRACTED→CHANGE_PENDING/CANCELLED; CHANGE_PENDING→CONTRACTED/SUPERSEDED/CANCELLED.

CONTRACTED는 보호 JSON·원본 키 변경 금지/DELETE 금지이고 정상 상태 전이는 허용한다. SUPERSEDED/CANCELLED는 UPDATE/DELETE 모두 금지한다. CONTRACTED의 모든 컬럼을 동일하게 잠그는 구현은 아니다. package_manifest_hash 및 금액 metadata는 protected_changed 목록에 없고 CHANGE_PENDING payload 변경 차단도 별도 명시돼 있지 않다. service_role 직접 쓰기 권한 제한과 RPC 경로가 이를 보완하는 구조이며 단독 트리거만으로 완전 잠금을 선언하지 않는다.

운영 FINAL/locked_at 값은 확인했으나 이번 조사에서 UPDATE/DELETE 차단 실험이나 트리거 본문 조회는 하지 않았다.

## 5. DB 변경 관리 상태

| SQL 파일 | 줄 수 | 추적/역할 |
|---|---:|---|
| supabase/cost_items.sql | 200 | tracked, 원가 기본 테이블/RLS/64 seed |
| supabase/rfc_003f_audit_log.sql | 44 | tracked, audit table/권한 |
| supabase/rfc_004b_cost_item_management.sql | 549 | tracked, pending 품목·RPC |
| supabase/rfc_004s_wallpaper_material_cost_item.sql | 97 | tracked, 일회 도배 평당 품목 등록 |
| supabase/rfc_006_contract_documents.sql | 1,426 | tracked, 계약 6개 테이블·RPC·잠금·23 specs |
| supabase/rfc_006_digest_hotfix.sql | 196 | tracked, extensions.digest pgcrypto 정규화 |
| supabase/rfc_cost_draft_rpc_hardening_hotfix.sql | 242 | tracked, 취소/배포 flag; 최신 적용 위치 |
| supabase/rfc_recent_cost_items.sql | 119 | tracked, 26개 최근 원가 품목 일회 등록 |
| supabase/cost_items_v2_3.sql | 416 | **untracked**, 초안 필드·publish log·옛 RPC; 실행 안 함 |
| supabase/rfc_003a_user_profiles.sql | 69 | **untracked**, profile 활성·role·RLS; 실행 안 함 |

- supabase/migrations 디렉터리 없음, migration 파일 0개. SQL은 supabase 루트에 10개(추적8/미추적2).
- v2_3 첫 주석에 Supabase SQL Editor 검토 후 실행 지침. 004s/recent는 일회 함수 생성→호출→DROP. 파일별 BEGIN/COMMIT 유무도 다르다.
- estimates/customers/projects/estimate_items/profile 최초 생성 DDL 및 RFC-001A mutation guard 전체 정의가 저장소에 없다.
- 운영 DB의 default cost margin 기본값은 0.35지만 현행 91개 값은 0.30. seed는 현행 운영 상태의 덤프가 아니다.
- 004b의 publish 함수는 history INSERT 후 flag를 켜지만 최신 hardening hotfix는 flag를 history 이전으로 이동했다. 파일 순서가 바뀌면 오래된 정의로 회귀할 수 있는 **구체적 근거**가 있다.
- 미추적 v2_3의 save/cancel/publish에는 flag가 없다. 이것을 현행 DB 복원에 그대로 사용하면 된다고 판단하지 않는다.
- 이번에 확인한 것은 객체명/컬럼/시그니처·카운트다. 운영 함수 본문·RLS·트리거와 저장소 정의의 완전 동일성은 확인 불가.

## 6. API Inventory

### 6.1 브라우저 → Next API → Supabase

17 route 파일, 22 method-handler. 인증은 특별 표시가 없는 한 Bearer→Auth /user→profiles 활성 상태 재검증이다. roles는 서버 코드 기준이다.

| Method | Route | 기능 | 인증/권한 | DB 접근 | 프런트 호출 |
|---|---|---|---|---|---|
| GET | /api/os/me | 본인 profile | admin/manager/staff | service-role profile 조회 | completeLogin/loadCurrentOsUser |
| GET | /api/os/users | 사용자 목록 | admin | profiles GET | refreshUserManagement |
| POST | /api/os/users | Auth+profile 생성 | admin | Auth admin POST, profiles POST, audit | submitCreateUser |
| PATCH | /api/os/users/[id] | 이름/role/활성 | admin | profile GET/PATCH, audit | submitEditUser |
| POST | /api/os/users/[id]/reset-password | 초기 비밀번호 재설정 | admin | Auth admin PUT, profile PATCH, audit | submitResetPassword |
| POST | /api/os/auth/change-password | 본인 비밀번호 변경 | 활성 로그인 사용자 | Auth admin PUT, profile PATCH, audit | submitOwnPasswordChange |
| GET | /api/os/audit-logs | audit 목록/필터 | admin | audit GET 제한 field/limit | refreshAuditLogs |
| POST | /api/os/audit-logs | 시스템 작업 감사 기록 | admin | audit INSERT | writeSystemAudit |
| POST | /api/os/cost-items | pending 품목 생성 | admin | 사용자 Bearer create_cost_item_pending, audit | submitCostItemForm |
| POST | /api/os/cost-items/clone | 기존 품목 복제 | admin | service GET + 사용자 Bearer create RPC | submitCostItemForm |
| PATCH | /api/os/cost-items/[id] | pending 신규 수정 | admin | service GET + 사용자 Bearer update RPC | submitCostItemForm |
| GET | /api/os/contract-options | 저장 옵션/빈 기본값 | 활성 로그인 사용자 | estimates/options GET | refreshContractPackagePanel |
| PUT | /api/os/contract-options | 옵션 저장 | admin/staff; 확정본 연결 시 금지 | options POST/PATCH, audit | saveContractOptionsFromForm |
| GET | /api/os/contract-packages | 패키지 목록/q 검색 | admin/manager 전체; staff estimateId 필수 | service package+document GET | 목록 병합/계약목록/패널 |
| POST | /api/os/contract-packages | 번호 예약+READY 생성 | admin | options 예약, specs/estimate 읽기, create RPC, audit | createContractPackageFromForm |
| POST | /api/os/contract-packages/preview | 저장 없는 JSON 미리보기 | admin/staff | options/estimate/specs GET | previewContractPackageFromForm |
| GET | /api/os/contract-packages/[id] | 패키지+문서 | 로그인; staff estimateId 필수·패키지 관계 검사 | service GET + projection | loadContractPackageToPreview |
| POST | /api/os/contract-packages/[id]/confirm | 계약확정 | admin | confirm RPC, audit | createContractPackageFromForm |
| GET | /api/os/change-orders | 변경견적+승인 목록 | admin/manager | service GET | 프런트 호출 없음 |
| POST | /api/os/change-orders | 변경견적+pending 패키지 | admin | create_contract_change_order + audit | 프런트 호출 없음 |
| POST | /api/os/change-orders/[id]/approve | 고객 증적 기반 승인 기록 | admin | approve RPC + audit | 프런트 호출 없음 |
| GET | /api/os/keepalive | DB 소량 읽기/ok | **인증 없음** | service cost_items id 1개 GET | Vercel cron; 값 응답은 ok만 |

keepalive에 CRON_SECRET 검사 없음. 고객/원가 데이터를 반환하지는 않지만 공개 URL에서 service-role DB 읽기를 유발한다.

계약 scope 검사는 package.estimate_id와 전달 estimateId 일치 검사이다. staff 소유 프로젝트 회원 검사는 없다. 이는 고객별 IDOR 차단과 같은 기능이 아니다. 직원이 기존 범위 내 다른 직원 견적을 공유하는 정책과 SaaS tenant 정책을 구분해야 한다.

실제 이번 비로그인 GET 결과: /me, /users, /audit-logs, /contract-options, /contract-packages, /contract-packages/[없는 id], /change-orders 모두 401. POST/PATCH/PUT 권한 실검증은 하지 않았다.

### 6.2 브라우저 → Supabase 직접 호출

| Method / 경로 | 용도 | 인증/권한 근거 |
|---|---|---|
| POST /auth/v1/token?grant_type=password | 로그인 | 브라우저 publishable key, 사용자가 입력하는 로그인 정보 |
| POST /auth/v1/logout | 로그아웃 | 사용자 Bearer |
| GET /rest/v1/profiles | loadProfile의 호환 조회(email/id/user_id/auth_user_id) | 사용자 Bearer/RLS; 현재 주 로그인은 /me |
| GET /rest/v1/estimates?select=* | 전체 저장 견적/단건 | 사용자 Bearer/RLS; 고객/원가 JSON 전체 요청 |
| HEAD /rest/v1/estimates?select=id | count | 사용자 Bearer/RLS |
| POST /rest/v1/estimates | 신규 저장 | 사용자 Bearer; return=minimal, fallback payload |
| PATCH /rest/v1/estimates?id=eq... | 수정 저장 | 사용자 Bearer; return=representation |
| DELETE /rest/v1/estimates?id=eq... | 견적 삭제 | UI admin 검사; 실제 DB 역할 제한 미확인 |
| GET /rest/v1/cost_items | 계산단가/운영목록 | UI admin/manager; 사용자 Bearer/RLS |
| GET /rest/v1/cost_item_history | 품목별 이력·최대200 | 사용자 Bearer/RLS |
| GET /rest/v1/cost_publish_log | 배포별 이력·최대100 | 사용자 Bearer/RLS |
| POST /rest/v1/rpc/save_cost_item_draft | 임시저장 | 사용자 Bearer+RPC admin 검사 |
| POST /rest/v1/rpc/cancel_cost_item_draft | 단일 취소 | 위와 동일 |
| POST /rest/v1/rpc/cancel_all_cost_drafts | 전체 취소 | 위와 동일 |
| POST /rest/v1/rpc/publish_cost_drafts | 운영 원가 배포 | 위와 동일 |

혼재는 확인된 현행 구조다. 서버 service-role key는 server.ts의 환경변수에서 사용하고 브라우저 storage.js는 publishable key를 사용한다. 값은 문서에 기록하지 않는다.

## 7. 실제 데이터 흐름

### 7.1 견적

```text
index.html 입력 DOM
  → readState / updateRatesFromAdmin
  → calculate (기본 공정 상세 및 합계)
  → buildEstimateSnapshot (inputs, customerQuote, internalDetails, costSnapshot)
  → applyExistingPipeCleaningAdjustment (공통 최종 후처리)
  → render / 고객견적 / 내부요약 / 출력
  → handleSaveEstimate
  → storage.saveEstimate(POST) 또는 updateEstimate(PATCH)
  → estimates의 컬럼 + estimate_data JSON
  → loadEstimates/getEstimate → normalizeEstimate → loadEstimateIntoUi
```

입력 체크/길이값은 inputs. costSnapshot은 품목 코드·단가·마진·최신 수정시각 저장이고 canViewSystem 사용자에게만 생성된다. customerQuote는 고객표시 행/group/total. internalDetails는 group/item/input/quantity/unitPrice/cost/correction/revenue/customerRevenue/profit. internalSummary는 directCost/customerRevenue/profit/marginRate/discountRoom.

row 컬럼과 JSON 같은 의미 값이 함께 저장된다. normalizeEstimate는 id/프로젝트/금액/원가/마진/status에서 row 컬럼을 우선한다. savedAt은 row.created_at 우선이며 최근 updated_at을 쓰지 않는다.

신규 saveEstimate는 return=minimal 뒤 DB UUID를 받지 않아서 즉시 반환 estimate.id는 빈 값이다. 목록 재조회는 UUID를 받지만 현재 편집 id를 자동 연결하지 않는다. 생성 직후 수정/계약 진입은 추가 검증 필요하다.

일반 수정은 저장 costSnapshot 단가를 DOM에 임시 적용해 계산하고 복원한다. 누락품목 차단은 도배 평당 항목 한 종류만 명시한다. 새 옵션/새 원가 코드까지 완전한 과거 원가 재현을 보장하지 않는다.

배관 청소 토글은 공통 input/change 루프에서 제외한 전용 change handler다. activeQuoteEstimate→loaded baseline→lastRenderedEstimateSnapshot 순서로 기준값을 골라 깊은 복사 후 해당 행만 바꾸고 수정 저장 payload와 화면에 동일 결과를 쓴다. 구버전에서 costTotal에 이미 누락된 상태까지 자동 복구하는 것은 멱등 helper만으로 보장되지 않는다.

**주의:** hadFractionalTargetMargin이 true이면 loadEstimateIntoUi가 calculate 후 repairCorruptedTargetMarginEstimate→updateEstimate를 자동 실행한다. 일반 읽기 재현 과정에서 이 UI 함수를 실행하지 않았다.

### 7.2 원가

```text
관리자 품목/단가/마진/활성 변경
  → existing: save_cost_item_draft / new: Next API→create_cost_item_pending
  → cost_items.draft_* / is_pending_new
  → 배포 사유 및 확인
  → publish_cost_drafts
      승인 flag → history INSERT → 운영값 UPDATE → draft clear → publish_log INSERT
  → loadRateSettings / refreshSystemManagement
  → 운영 단가 DOM 및 rates 갱신
```

배포 RPC 내부 작업은 DB 함수 트랜잭션이다. RPC 뒤 감사 로그와 프런트 재조회는 별도 단계여서 후속 실패가 원가 배포 실패처럼 표시될 수 있다. 스냅샷이 없는 신규/일부 staff 계산은 코드 기본단가 경로이며 admin/manager published 가격과 동일함을 확인하지 않았다.

### 7.3 계약

```text
저장 견적 estimates.id
  → refreshContractPackagePanel (GET options + scoped packages)
  → resolveContractOptionsForEstimate (저장 옵션 우선)
  → 계약 옵션 PUT → estimate_document_options
  → preview POST: buildContractPackageSnapshot + 3종 JSON (저장 없음)
  → 계약 확정 및 저장:
      POST packages → 번호 options 예약 → create_contract_package_snapshot
      → 패키지/3종 문서 GENERATED → READY
      → POST confirm → 문서 FINAL/locked_at + CONTRACTED/confirmed_at
  → 목록에서 package GET → contractPreviewState
  → 현재 HTML 렌더러 → #printQuoteSheet → window.print
```

견적 테이블은 API의 스냅샷 생성에서 읽기 전용이다. 옵션 저장과 번호 예약은 별도 options 쓰기다. 생성과 confirm 전체는 단일 DB 트랜잭션이 아니며, confirm 실패 후 READY가 남을 수 있다. 동일 READY 패키지를 불러오면 프런트가 재사용하지만 project 패널 재조회는 preview 상태를 지우므로 무조건 재시도 멱등이라는 판정은 하지 않는다.

### 7.4 변경견적

```text
확정 package (CONTRACTED)
  → admin POST change-orders:
      after_snapshot/amount_delta/schedule_impact 입력 검증
      → create_contract_change_order RPC
      → 원본 CHANGE_PENDING
      → change_order + 후속 READY package + 3종 GENERATED document
  → admin POST approve:
      고객명/승인방식/date/증적/승인 version·manifest hash 필수
      → approve_contract_change_order
      → approval immutable 기록
      → 원본 SUPERSEDED / 후속 CONTRACTED / 후속 document FINAL
```

원계약금액과 이전 APPROVED 차액 누적, 당회 amount_delta를 분리한다. 개정금액 = 원계약금액 + 이전 승인 누적 + 당회 차액. '승인일 현재 판매가 차액' 정책은 조문에 있지만 API가 실제 품목 가격표로 차액을 자동 산출하지 않는다. 클라이언트가 전달한 차액과 후속 총액의 정합성을 확인한다. 고객 직접 승인 서비스가 아니라 관리자 증적 입력 방식이다.

## 8. 문서・PDF・hash 관리

| 항목 | 현재 상태 |
|---|---|
| 고객용 견적서 | customerQuote 기반 HTML, 공정·항목·합계, 내부정보 미출력 설계 |
| 내부견적/발주내역서 | internalDetails 기반 별도 인쇄; 실제 발주 저장 없음 |
| 계약서/견적서/공사사양서 | 3종 JSON + HTML 개별/일괄 인쇄, CONTRACT→QUOTE→SPEC 순서 |
| 브라우저 Print/PDF | window.print, 브라우저 PDF 저장 선택 |
| 서버 PDF/DOCX | 미구현, 관련 라이브러리 없음 |
| 확정 파일 Storage/재다운로드 | 미구현; 저장 패키지 재렌더/재인쇄만 가능 |
| 문서 버전 | package_version, document_type, generation_status, created_at, locked_at |
| hash | 서버 재귀 키 정렬 SHA-256, source_hash/content_hash; DB manifest·approval hash |
| 실제 HTML/PDF hash 검증 | 미구현 |

중요한 구분:

- 서버 renderDocumentJson(CONTRACT)의 content_json은 기본정보/당사자/담당자/조건부 조항/지급일정이다. 48개 고정 조문 본문을 포함하지 않는다.
- 인쇄 renderContractPrintDocument는 현재 main.js의 CONTRACT_FIXED_TERM_LINES를 사용한다. 과거 확정 package를 불러와도 현재 고정 조문으로 출력한다. 저장 content_hash가 인쇄되는 전체 본문을 증명하지 않는다.
- normalizeContractPaymentSchedule은 저장 schedule의 amount만 취하고 label/ratio/due_basis는 현재 코드의 10/40/40/10 기본값을 사용한다.
- 서버의 paymentSchedule은 '준공확인 및 목적물 인도 시', 프런트 인쇄 기본값은 '준공확인 후 목적물 인도 전' 등 표현 차이가 있다.
- evaluateClauses 결과는 JSON 미리보기에 존재하나 계약 인쇄 본문은 별도 고정 조문 경로다.
- specMatchesItem은 applies_to JSON을 직접 읽지 않고 이름/aliases로 연결한다. grade는 catalog.default_grade를 복제해 선택 등급과 다를 수 있다.
- spec_snapshot builder는 quantity/unit/changed_specification을 만들지 않지만 HTML 표에는 그 칸이 있어 '-'로 출력될 수 있다.
- CSS Page counter는 물리 A4 페이지가 아니라 .contract-print-page article마다 증가한다. 긴 계약서의 모든 물리 페이지 번호 보장은 없다. 전체 고정 조문 section에 break-inside:avoid가 있어 브라우저 실제 페이지 분할 추가 검증 필요.

## 9. 자동 테스트 상태

| 종류 | Repository 결과 |
|---|---|
| Unit | 없음 |
| Integration | 없음 |
| API 자동 테스트 | 없음 |
| E2E | 없음 |
| Snapshot test | 없음 |
| 테스트 runner / test script | 없음 |
| OS 테스트 CI | 없음 |

tracked 파일 및 작업트리 파일명/설정에서 test/spec 디렉터리·.test/.spec 파일·runner를 확인하지 못했다. package scripts는 dev/build/start/lint/indexnow:dry-run뿐이다. 과거 대화의 수동 검산/브라우저 검수와 docs 기록은 자동 테스트가 아니다. 이번 작업에서 node check/lint/build를 다시 실행하거나 테스트 코드를 작성하지 않았다.

## 10. 배포 구조

- 로컬: npm run dev, Next 서버. public 앱은 상대 /api/os 요청이 있어 같은 origin의 Next API가 필요하다.
- 운영: https://www.antnestdesign.com/os GET 200, 응답 server=Vercel. 인증 없는 주요 읽기 API는 401.
- DB 대상: 코드 fallback 및 브라우저 URL `lzsxboaqliuwjzwsnnwf.supabase.co`. 현행 local env에는 service-role 키만 있어 서버 URL은 fallback을 사용한다.
- 서버 URL 우선순위: SUPABASE_URL → NEXT_PUBLIC_SUPABASE_URL → 코드 fallback.
- 서버 key 우선순위: SUPABASE_SERVICE_ROLE_KEY → SUPABASE_SERVICE_KEY. 브라우저 key는 storage.js의 publishable key.
- Preview 전용 DB/tenant 분리 코드 없음. 실제 Vercel Preview env가 같은 DB인지 다른 DB인지 **확인 불가**.
- vercel.json에 매일 keepalive cron 정의가 있다. 실제 활성 스케줄·실행 이력·요금제는 확인 불가.
- Git의 origin/main은 조사 시작 시 현재 HEAD와 같은 커밋을 가리킨다. 이번 작업에서 fetch/push 또는 배포 SHA 조회는 하지 않았다.
- GitHub workflow는 Vercel Production 성공 이벤트를 처리하지만 main 연동·자동 배포 설정 자체는 Vercel 계정에서 별도 확인해야 한다.
- 무료 Supabase Project 사용 여부·paused 정책·프로젝트 계정 상태는 Repository/REST만으로 **확인 불가**. 이번 GET/HEAD가 성공했다는 현재 통신 가능 사실만 기록한다.
- rollback 배포, DB backup 복구 절차, Secrets 관리 문서, staging 적용 절차가 OS 문서에 정식으로 정리돼 있지 않다.

## 11. 기술 부채・위험

등급은 영향도다. '확인'은 코드/조회 결과, '추가 검증'은 운영 재현/권한 검사까지 못 한 부분을 뜻한다. 이번 작업에서 수정하지 않았다.

### Critical

| ID | 문제・근거 | 영향 | 개선 필요성 |
|---|---|---|---|
| C1 | loadEstimateIntoUi:7634 → repairCorruptedTargetMarginEstimate:4767 → updateEstimate. fractional targetMargin 구버전은 열기만 해도 자동 PATCH, 확정 계약 연결/역할 검사 없음 | 조회 의도만으로 견적 원본 금액 변경 가능. 현행 6건 자동변경 실험은 하지 않음 | 구버전 복원과 쓰기 분리, 계약 연결 보호를 테스트로 먼저 고정 |
| C2 | main:renderContractFixedTerms/PrintDocument, contracts:renderDocumentJson. 고정 조문·인쇄 지급문구가 확정 content_json/hash 밖에서 현재 코드로 생성 | 확정 원본 내용과 재출력 내용이 달라질 수 있고 출력 증빙 hash 범위가 부족 | 확정 버전의 본문/지급조건/출력 일치 불변조건 검증 |
| C3 | main:collectContractOptionsPayload가 배관 레거시 키를 보내지 않음; contracts:normalizeProtectionOptions/evaluateClauses는 이 키만 보고 청소 제외 조항 생성 | 유상 배관 청소 견적과 계약 조건 JSON의 포함/제외가 모순될 수 있음 | 견적 포함 여부→계약 조건/문서 일치 테스트 우선 |

### High

| ID | 문제・근거 | 영향 | 개선 필요성 |
|---|---|---|---|
| H1 | main 8,191줄, placeholder 계산/렌더 모듈, 자동 테스트 없음 | 작은 이벤트 변경이 계산·저장·계약에 동시에 회귀 | 추출/기능확장 이전 P0/P1 테스트 필요 |
| H2 | storage.load/getEstimates select=*로 내부 JSON 조회, staff projection은 계약 API에만 있음. estimates RLS DDL 없음 | 직원 내부정보 노출 여부/manager 직접 쓰기 차단 미확인; SaaS 전환 전 보안 검증 필수 | 역할별 실제 REST 응답과 컬럼·쓰기 제한 테스트 |
| H3 | 운영 DDL 일부 없음, 두 기초 SQL 미추적, 004b와 hotfix 같은 함수 중복 정의 | 새 환경 재구축 실패 또는 RPC/hardening 과거 정의로 회귀 | 적용 순서·운영 객체 동일성 테스트 |
| H4 | saveEstimate return=minimal, 빈 id 반환, fallback은 원가/주요 컬럼 생략 | 생성 직후 수정/계약 불가 또는 컬럼/JSON 불일치; 불확실 네트워크 응답 후 중복 저장 가능 | 신규 저장→UUID→재조회→계약 관계 테스트 |
| H5 | buildEstimateSnapshot에 address 없음, updateEstimate는 address || '' | 일반 재계산 수정 저장이 기존 현장주소를 비울 수 있음 | 수정 전후 현장주소 보존 테스트 |
| H6 | API DB 쓰기 후 writeAuditLog 별도 await, Auth/password/profile/audit도 순차 | 핵심 쓰기가 성공해도 500/실패 안내; 재시도로 중복/잘못된 판단 가능 | 단계별 실패·성공 결과 테스트 |
| H7 | loadRateSettings staff는 운영 DB 로드 안 함, rates 코드 기본값 사용. actual calc margin=targetMargin이며 DB 품목 margin과 분리 | 사용자 역할별 새 견적 가격 차이 가능, 일괄 마진 변경이 실제 고객가에 적용되지 않을 수 있음 | 동일 입력/동일 published 원가·마진 정책 테스트 |
| H8 | raw 합계/행 천원 절사/internalSummary 경로 및 과거 기록 혼재; 운영 구버전 합계 차이 확인 | 손익·고객가·계약금액 판독 오류 | 금액 출처·반올림·정책 버전별 테스트 |
| H9 | contracts:specMatchesItem/buildSpecSnapshot, catalog 기본급 복제 | 선택 욕실/바닥/주방 등급·사양·수량이 계약 사양서와 다를 수 있음 | 선택옵션→spec coverage/grade/quantity 테스트 |
| H10 | getUserContext는 must_change_password 검사 없음; cost SQL role helper는 active 검사 없음 | 강제 변경/비활성 사용자가 직접 호출할 수 있는 범위 미확인 | 서버·직접 RPC 역할/계정 상태 조합 테스트 |
| H11 | 계약 create의 번호 options 예약+패키지 RPC+audit, confirm 별도 요청 | READY/예약번호만 남은 실패 후 재시도 흐름 미완성 가능 | 실패 지점별 동일 번호/패키지 재사용 테스트 |
| H12 | loadRateSettings는 전체 cost_items를 읽고 is_active/is_pending_new를 검사하지 않고 연결된 단가를 rates에 적용 | 비활성화한 기존 품목이 계산에서 계속 쓰일 가능성; 신규 임의 코드는 자동 연결되지 않는 반대 문제도 존재 | 활성/비활성/신규 pending별 계산 포함 정책 테스트 |

H2/H7/H10은 실제 직원 로그인 또는 쓰기 재현을 수행하지 않았으므로 정보유출·권한 우회가 운영에서 발생했다고 단정하지 않는다.

### Medium

| ID | 문제・근거 | 영향 / 개선 필요성 |
|---|---|---|
| M1 | 입력 restore는 저장 키만 덮음, 없는 새 키 일부만 기본값 설정 | 프로젝트 이동 때 이전 입력 잔존 가능; 구버전/연속로드 테스트 |
| M2 | marginRate 이름으로 GP와 원가 가산율 혼재, 정책/engine version 저장 없음 | 과거 수익 비교 혼동; 의미와 버전 명세 필요 |
| M3 | 과거 snapshot 64/65품목, 현재 운영91; 누락 코드 검사 제한적 | 과거 견적 수정 시 최신 단가 혼입 가능; 누락 항목 정책 테스트 |
| M4 | 여러 품목 draft/취소/원복은 순차 RPC, publish 뒤 후속 요청 | 일부 성공을 전체 실패로 해석 가능; 부분 실패 표시 검증 |
| M5 | 저장일 created_at 우선, 계약 revision data.savedAt 우선 | 최근 수정/개정 식별 혼란; 개정 비교 테스트 |
| M6 | staff loadContractPackageToPreview는 estimateId 없이 호출, API는 staff estimateId 필수 | 직원 단건 불러오기 코드 경로 불일치; 실제 버튼 생성 여부/동작 추가 검증 |
| M7 | contracts:dateMinusDays는 KST 자정을 ISO 날짜로 변환 | 서버 timezone에 따라 착공 3일 전 날짜 하루 편차 가능; 날짜 함수 테스트 |
| M8 | mutable 계약 옵션 fields/보호 제외 metadata, 변경승인 프런트 없음 | 원본/후속 버전 관리 불완전; 잠금 허용범위 명세와 테스트 |
| M9 | hash 정렬은 존재하지만 출력 HTML 검증 없음, 증적 URL의 실재성 검증 없음 | 무결성 증명의 범위 제한; 증적 검증 테스트 |
| M10 | renderInternalRows/구매발주 등 일부 innerHTML은 저장값을 직접 보간 | 악성 문자열 처리 추가 검증 필요; 출력 escaping 테스트 |
| M11 | sessionStorage 복원만 있고 token refresh 없음 | 장시간 사용 시 인증 만료; 만료 처리 테스트 |
| M12 | 공개 keepalive, cron 실제 동작 미확인 | 요청 부하/가용성 관리 한계; 운영 설정 검증 |
| M13 | rateValue의 Number(value) || fallback | 단가 0 저장 시 이전값/fallback 사용 가능; 0과 null 구분 테스트 |

### Low

- 캐시 키가 iframe/CSS/main/import 사이에 분산돼 있다. 변경된 보조 모듈 갱신 여부 확인 필요.
- 물리 페이지 번호/출력 브라우저별 조문·서명란 구성은 현재 CSS만으로 보장되지 않는다.
- loadProfile 호환 루프와 정적 한글 보정 코드에 깨진 로그 문자열이 일부 남아 유지보수 비용이 있다.
- docs의 1.0 기준선은 과거 수치/가격정책이며 현행 계약·수금·공사관리 상태를 담지 않는다. 본 문서가 현재 조사 기준점이다.

## 12. 보존할 불변조건과 현재 보장 범위

'현재 구현'과 '앞으로 테스트로 보장해야 할 목표'를 구분한다.

| 불변조건 | 현재 근거 / 제한 |
|---|---|
| published 원가와 draft 값 분리 | cost_items field/RPC 구현. 예정값 저장만으로 운영 단가 갱신 안 함 |
| 원가 배포는 history+운영값+publish log 함께 처리 | publish RPC transaction; audit/재조회는 별도 |
| 관리자 외 원가 변경·계약확정/변경승인 제한 | 프런트/Next API/SQL 내부 role 검사; production 직접 RPC 권한은 미검증 |
| 계약 3종 없으면 READY/확정 불가 | create/confirm/approve RPC 문서 3개 검사·예외 |
| 확정 문서 FINAL/locked_at 불변 | SQL trigger; 실제 운영 거부 실험 안 함 |
| 후속 변경은 원본 보존하고 새 패키지 버전 | parent/pending 관계·SUPERSEDED/CONTRACTED 승인 RPC |
| 계약번호는 기존 확정본 재사용 | 로드된 CONTRACTED UI no-op; 번호 예약 실패/재시도는 완전 보장 아님 |
| 저장 계약 옵션 true/false는 견적 기본값보다 우선 | resolveContractOptionsForEstimate options.id 기준 |
| 배관 청소는 독립 이벤트·원가=고객가·이익0 | 전용 handler/helper; 현재 DB단가300,000, 구버전 합계 누락은 진단 대상 |
| 고객용 3종 문서에 내부 원가/마진/진단 표시 금지 | 고객 HTML은 제한 quote/spec 필드; 입력 주입·staff REST 실노출은 미검증 |
| 정상 내부 합계에는 진단 없음·보정 행 없음 | storedEstimateSummary/buildEstimateDiagnostics; 금액 수정 안 함 |
| 프로젝트 계약 API 실패가 견적 목록 실패로 전파 안 됨 | renderSavedEstimateRows nested catch |
| manager/staff 전체 계약 목록 호출 구분 | admin/manager 전체 병합, staff scoped 조회 |
| 원가 변경 후 과거 견적 금액 자동변경 금지 | 저장 결과 우선 경로 존재하지만 fractional margin 자동 PATCH 예외가 있어 **현재 완전 보장 아님** |
| 확정 계약 재출력 본문 불변 | JSON 잠금만 존재; 현재 조문/지급문구로 인쇄하므로 **현재 완전 보장 아님** |
| 직원 내부정보 비노출 | DOM/projection 구현은 있으나 estimates 직접 REST까지는 **추가 검증 필요** |
| 상담/수정 저장의 project id·현장주소·합계 보존 | 신규 UUID 미반환·address 누락·구버전 합계 혼재가 있어 **현재 완전 보장 아님** |

## 13. 다음 단계: 자동 회귀 테스트 우선순위

이번 단계에서 코드는 작성하지 않았다. 실패 중인 현행 동작은 먼저 재현 테스트로 기록하며 잘못된 금액을 정상 expected 값으로 고정하지 않는다. 데이터 쓰기 테스트는 격리된 테스트 DB/fixture가 필요하고 운영 고객 견적을 사용하지 않는다.

### P0

| 순위 | 테스트 대상 | 검증할 불변조건 | 관련 파일 | 종류 |
|---:|---|---|---|---|
| 1 | 견적 읽기/구버전/확정 연결 | 불러오기만으로 UPDATE·금액/주소 변경 없음; 일반/구버전/확정 견적별 정책 | main.loadEstimateIntoUi/repair..., storage.get/updateEstimate | Integration + E2E |
| 2 | 역할·계정 상태·직접 REST/API/RPC | staff 내부 JSON 차단, manager 쓰기 금지, inactive/변경필요 차단, 비로그인 차단 | storage, server, contracts projection, 원가/계약 SQL | API + Integration |
| 3 | 배관 청소 후처리/저장 | 원가·고객가 각 300,000원, 이익0, 반복 토글 멱등, 다른 행 불변, 저장/재조회 동일 | main.applyExistingPipeCleaningAdjustment/handler/buildSnapshot | Unit + Integration |
| 4 | 계약 스냅샷/확정/재출력/예외 | 3종 원자성, 확정 불변, 출력 조문/지급조건/hash 동일, 실패 재시도 동일번호 | contracts, package APIs, rfc_006, main print/create | API + Integration + E2E |
| 5 | 원가 임시저장/배포/hardening | 최초 history 이전 flag, 실패 rollback, 이력/배포/운영값 일치, 기존 견적 불변 | storage RPC, 004b, hardening hotfix | Integration |
| 6 | 저장 합계·반올림·가격정책 | 행=공정=총계, 상세원가=costTotal, markup와 GP 구분, 수동조정 예외 일관 | calculate/makeDetail/buildSnapshot/storedSummary | Unit + Snapshot |
| 7 | 견적 포함범위→계약/공사사양 | 배관 청소 포함/제외, 고객 선택 grade/수량/단위 정확, 외부정보 미노출 | collectContractOptionsPayload, evaluateClauses/buildSpecSnapshot | Unit + API |
| 8 | 변경견적 승인 DB 무결성 | 증적/hash/version 없는 승인 실패, 금액관계, 원본 SUPERSEDED·후속 CONTRACTED, 승인불변 | change APIs, create/approve RPC | API + Integration |

가장 먼저 고정할 5개는 위 1~5다. 저장 합계와 계약 범위도 운영 사고 영향이 있어 같은 P0 묶음으로 추가한다.

### P1

| 테스트 대상 | 불변조건 | 관련 파일 | 종류 |
|---|---|---|---|
| 도배 공용/각방 | 천장 합계 보존, 길이비율, 각 grade 롤 올림, 잡자재/인건비 별도, 길이0 | calculator/finish.js, main wallpaper | Unit + Snapshot |
| 바닥·욕실·주방 | 등급별 단가·위치조정 체크·고정입력 무가산·설치비중복없음 | main, calculator/bathroom/kitchen | Unit + E2E |
| 목공·가구·상판 | 품수 올림, 가벽2배, 자 환산, 하부장/홈바 상판 중복없음 | main.calculate 및 carpentry helpers | Unit + Snapshot |
| 신규 저장/재조회 | UUID 확보, 중복방지, 기본컬럼/JSON/주소/수량/false 보존 | storage.save/update/normalize, main.handleSave | Integration |
| 프로젝트 연속 로드 | 이전 프로젝트 입력/캐시 잔존 없음, 계약 최신 버전 병합, 실패 독립 | main.restore/load/map/list | E2E |
| 원가 UI | 91품목 누락/중복없음, 표시 대분류 통합, 원본 category payload 유지 | main system accordion/filter | Unit + E2E |
| 일괄임시저장/원복 | 중간 실패 결과 표시, conflict 정확, 원복은 새 draft만 생성 | main bulk/cancel/rollback | Integration |
| 세션 만료/비밀번호 변경 | 인증 실패 처리, Auth/profile/audit 부분 성공 구분 | storage, auth API, main login | API + E2E |
| 계약 재불러오기 | scoped staff 호출·confirmed 잠금·저장 option false 복원 | main contract load/form, APIs | API + E2E |
| 날짜/시간/번호 | 착공 3일 전 date, KST 월 경계 번호, 동시 예약 collision | contracts.ts, 원가 시간 SQL | Unit + Integration |

### P2

| 테스트 대상 | 불변조건 | 관련 파일 | 종류 |
|---|---|---|---|
| 인쇄/모바일/접근성 | A4 실제 페이지·서명·표 분리, 버튼/열림 상태, 모바일 입력 | main print, index, styles | E2E + Visual Snapshot |
| 금액/입력 edge cases | 0/null/빈문자/false, 음수조정/천원절사, 큰 수량, 키순서 hash | main/storage/contracts/cost validation | Unit + Property cases |
| 출력 escaping/projection | 저장 문자열/문서 JSON 주입 시 내부정보/XSS 방지 | renderInternalRows/print, contracts projection | Unit + API |
| 규모/조회량 | 큰 목록의 계약 병합과 pagination, 계산 응답시간 | main lists, package GET, storage | Integration + E2E |
| 환경/복원 | Local/Preview/Prod DB 분리, SQL 순서·schema drift, backup 복원 검증 | 설정, SQL, 향후 migration 관리 | Integration |
| tenant/고객 포털 기반 | 구현 전 별도 요구 정의, tenant 경계·권한 테스트 우선 준비 | 현행 role/scope 구조 + 향후 설계 | API + Integration |

## Baseline 생성 정보

- 조사 시점: **2026-10-07, Asia/Seoul**. 운영 REST 최초 조회 14:22 KST. 본 문서는 그 조회와 같은 작업의 Repository 조사 결과다.
- 현재 Git branch: `rfc-006-integration`.
- 현재 commit SHA: `522cbb884fa022773e9e6068285b842c8e043987`.
- 조사 시작 Working Tree: tracked 변경 없음. 미추적 파일 2개:
  - `supabase/cost_items_v2_3.sql`
  - `supabase/rfc_003a_user_profiles.sql`
- 문서 생성 후 확인한 Working Tree: 위 2개 그대로 + 신규 `docs/AND_OS_2_0_BASELINE.md`. git status에 이 3개 미추적 파일만 표시되고 tracked git diff는 비어 있다. HEAD는 기준 SHA와 동일하다.
- 조사한 주요 경로: app/os, public/os-app 전체, app/api/os 전체, supabase SQL 10개, docs, package/config/env **키명만**, scripts, .github/workflows.
- 운영 읽기 경로: Supabase /rest/v1 GET·HEAD 및 OpenAPI, /storage/v1/bucket GET; 운영 /os 및 비로그인 Next API GET.
- 조사하지 못한 영역: 로그인 역할별 실제 응답, 모든 쓰기 RPC 실행, production SQL catalog/RLS/트리거/함수 본문/GRANT/뷰 전체, 비공개 스키마, Auth 내부 테이블·백업 실물, Vercel 계정/Preview env/배포 SHA/cron 로그, Supabase 요금제.
- Production 확인 사항: 이번 REST의 테이블수·컬럼·PK/FK 관계·RPC 입력 시그니처·상태·파일 nullable·원가값·저장 JSON 구조/합계. 실데이터의 고객 개인정보는 기록하지 않았다.
- Repository만 확인한 사항: SQL 정책/잠금 함수 본문/트리거/GRANT, UI 권한/이벤트/계산/문서 생성 로직. 이를 현행 Production 정책과 완전 동일하다고 인증하지 않는다.
- 이 문서 외 코드/기존 문서 수정 없음. SQL 실행/DB 변경/migration 적용/운영 데이터 변경/test code 작성/commit/push/deploy 없음.
