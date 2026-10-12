# AND OS 2B-3 Production 원가 Source 비교

## 증거와 범위

- 대상: antnest-estimate / main / lzsxboaqliuwjzwsnnwf.
- 캡처 시각: 2026-10-12 01:28:28 UTC (10:28:28 KST), PostgreSQL 17.6.
- 사용자 로그인 Dashboard SQL Editor에서 catalog-only SELECT 한 번 실행.
- 조회: pg_class/namespace/proc/language/attribute/attrdef/constraint/index/trigger/policies.
- 호출: pg_get_functiondef/pg_get_* 등 catalog inspection 함수만. 업무 RPC 실행 없음.
- 업무 테이블 row/count, 실제 고객/견적/계약/원가/사용자/키 조회 없음.
- Production schema/data/RLS/ACL 변경 없음. Editor의 플랫폼 query draft 자동 생성은 별도 UI 동작이며 명시적 Save는 하지 않았다.
- 쿼리 UI 참조: https://supabase.com/dashboard/project/lzsxboaqliuwjzwsnnwf/sql/ef865399-9f2f-407c-ad19-aa6c9d5e6792
- 원본: `AND_OS_PROD_COST_SCHEMA_2026-10-12.json` 및 동일 이름 Markdown. 함수 12개, 테이블 3개.
- 기계 비교: `AND_OS_PROD_COST_COMPARISON_2026-10-12.json`. 변경 전 canonical 비교도 보존.
- JSON의 함수 definition/OID/args/type/language/volatility/owner/ACL/proconfig는 캡처 그대로다.
- SQL 본문 문자열 비교는 CRLF 정규화만 사용. indentation-only 지표는 자동 semantic 증명이 아니다.
- ACL/trigger/policy/constraint는 실제 capture를 기준으로 판단한다. 함수 본문 MATCH를 ACL 전체 MATCH로 확대 해석하지 않는다.

## 객체별 결정

| Object | Production vs Repository | Production vs Local Canonical | Canonical decision |
|---|---|---|---|
| current_and_os_role | EXACT MATCH: cost_items.sql 본문 | REPOSITORY NEWER: role candidate에 active/password 검사 | 캡처를 현재 원본으로 보존; 향후 account-state-aware helper 병합 |
| is_and_os_admin | EXACT MATCH: cost_items.sql 본문 | SEMANTIC MATCH: 같은 helper 호출, helper 자체는 강화 | 원본 본문 유지, helper 및 ACL hardening 별도 |
| validate_and_os_cost_item_code | EXACT MATCH: 004b 본문/입력 계약 | 원본 재사용 | 캡처 + tracked 004b |
| create_cost_item_pending | EXACT MATCH: 004b 본문/입력 계약 | 원본 재사용 | 캡처 + tracked 004b |
| update_cost_item_pending | EXACT MATCH: 004b 본문/입력 계약 | 원본 재사용 | 캡처 + tracked 004b |
| save_cost_item_draft | PRODUCTION NEWER: tracked 누락, untracked는 guard flag 누락 | DIVERGED(기존 후보) → REPOSITORY NEWER(병합 후) | Production no-op/default/false/timestamp 정책 + row lock/finite 검증 |
| cancel_cost_item_draft | EXACT MATCH: tracked hotfix 본문 | 원본 재사용 | 캡처 + tracked hotfix |
| cancel_all_cost_drafts | EXACT MATCH: tracked hotfix 본문 | 원본 재사용 | 캡처 + tracked hotfix |
| next_cost_publish_version | PRODUCTION NEWER: tracked 누락; untracked 본문은 exact지만 원본 자격 없음 | REPOSITORY NEWER: lock/regex/999 보호 | Production 날짜/출력/호출 계약 + local hardening |
| publish_cost_drafts | EXACT MATCH: tracked hotfix 본문; 004b/미추적과는 DIFFERENT | 원본 재사용 | tracked hotfix가 현재 설치 본문과 일치 |
| and_os_require_cost_rpc_mutation | PRODUCTION NEWER: tracked 누락, 세 테이블 guard 확보 | SEMANTIC MATCH(flag 동작), REPOSITORY NEWER(ACL 축소) | Production trigger/body/SECURITY DEFINER 유지, 불필요 EXECUTE 축소 후보 |
| set_updated_at | EXACT MATCH: cost_items.sql 본문 | 원본 재사용 | capture 그대로, definer 아님 |
| cost_items | PRODUCTION NEWER: draft 지원/제약/정책 완전 정의 확보 | 이전 지원 DDL보다 완전 | capture columns/constraints/indexes/triggers/RLS/ACL가 기준 |
| cost_item_history | PRODUCTION NEWER: version/active fields/index/guard | 이전 DDL엔 guard 누락 | capture 그대로 |
| cost_publish_log | PRODUCTION NEWER: NOT NULL/default/count CHECK/FK/index/RLS/guard | 이전 DDL의 nullable/default/constraint가 DIVERGED | capture 그대로 |

EXACT MATCH 표기는 비교한 함수 본문/입력 계약 범위다. 캡처 JSON이 owner/EXECUTE ACL까지 포함한 완전한 관측 source of truth다.

## save_cost_item_draft 상세

- args: uuid + nullable numeric/numeric/boolean, 마지막 3개 DEFAULT NULL. 반환 public.cost_items.
- SECURITY DEFINER, search_path=public, owner=postgres.
- EXECUTE: authenticated/service_role 허용, PUBLIC/anon 금지.
- admin 검사: is_and_os_admin 호출. 운영 helper에는 is_active/must_change_password 검사가 없다.
- approved mutation flag를 설정한다. cost_items BEFORE INSERT/UPDATE/DELETE guard가 검사한다.
- 운영값과 같은 단가/마진/활성 입력은 draft에 NULL로 저장한다. 명시적 false도 비교 대상으로 정상 처리한다.
- 실제 draft가 없으면 draft_updated_at/by 모두 NULL. draft가 있으면 now()/auth.uid().
- 없어진 item은 cost item not found. 원가 <0, 마진 <0 또는 >=1 거부.
- pending-new 전용 분기 없음. is_pending_new 값은 보존하며 publish/cancel에서 처리한다.
- 기존 후보는 운영값과 같은 값을 draft로 남기고 타임스탬프도 남겼으며 마진 1을 허용했다. 이를 운영 정책으로 교정했다.
- 병합 후보는 SELECT FOR UPDATE, 숫자 NaN/Infinity 거부를 추가한다. 실제 운영에는 적용하지 않았다.
- account-state 검사는 기존 local role candidate에 의존한다. 향후 migration에는 이 의존성을 명시적으로 포함해야 한다.

## next_cost_publish_version 상세

- timezone('Asia/Seoul',now()), YYYY.MM.DD-NNN 출력.
- 운영은 LIKE prefix-'___'의 suffix 3자리를 integer로 변환해 MAX+1 계산.
- 함수 자체 advisory lock 없음. 정상 publish 경로가 먼저 and_os_cost_publish transaction lock을 잡는다.
- 운영 EXECUTE: postgres/service_role만; authenticated/anon/PUBLIC 금지. SECURITY DEFINER, search_path=public.
- standalone helper의 malformed suffix/하루 999 초과 처리는 별도 보호가 없다. 실데이터를 읽지 않았으므로 그런 버전이 존재한다고 주장하지 않는다.
- 병합 후보는 동일 날짜/번호 정책에 같은 advisory lock, 숫자 regex, 999 한도 거부를 추가하고 service_role EXECUTE는 유지한다.

## publish/guard 상세

- 설치된 publish 본문은 tracked hardening hotfix와 CRLF 정규화 후 정확히 같다.
- transaction lock → approved flag → draft 존재 확인 → next version → history INSERT → 운영값 UPDATE/draft clear → publish_log INSERT.
- reason/memo 검증, auth.uid actor, pending-new 처리, changed/price/margin/active count 모두 캡처에 포함.
- RPC 한 transaction 내에서 처리되므로 실패 시 rollback 가능. 실제 Production publish는 실행하지 않았다.
- guard는 cost_items/cost_item_history/cost_publish_log 세 테이블의 INSERT/UPDATE/DELETE를 검사한다.
- current_setting('request.and_os_cost_rpc',true)가 on이 아니면 거부한다.
- 원본 guard는 SECURITY DEFINER이며 PUBLIC/anon/authenticated/service_role EXECUTE가 있다.
- returns trigger라 일반 RPC 호출 가능 함수와 같다고 단정하지 않는다. 불필요 EXECUTE 축소는 방어적 후보이며 세 테이블 trigger 동작은 유지한다.
- Production은 세 테이블 RLS enabled=true / forced=false / authenticated admin-manager SELECT 정책만 있다.
- table ACL의 폭넓은 CRUD 허용과 RLS/guard의 차단은 별개다. service_role direct mutation도 flag 없는 경우 guard 대상이다. Production REST mutation 테스트는 금지대로 수행하지 않았다.

## 로컬 재현 및 migration 경계

- 원본 캡처 → generated `tests/os/db/production/cost-schema.CAPTURED.sql` → local DB 적용 → 함수 12개 definition/args/type/config/volatility/ACL 검증 → hardening 후보 적용 순서.
- fixtures는 합성 값만 사용하며 captured SQL에는 품목 seed나 실제 업무 row가 없다.
- reconstructed cost-support.sql은 runner에서 제거하고 역사 자료(TEST ONLY)로 남겼다.
- 원본 guard 세 개를 설치하고 이전 test_cost_mutation_gate substitute trigger는 제거했다.
- 원본 RLS/GRANT/제약을 로컬에 재현한 뒤 기존 role/staff boundary candidate를 적용한다. 따라서 보안 suite는 Production 현재 정책의 live 테스트가 아니라 강화 후보 테스트다.
- Production PG17의 MAINTAIN privilege는 로컬 PG15에서 지원되지 않는다. raw ACL은 JSON에 보존하고 local replay만 m을 제외한다. 이는 명시적 runtime compatibility 차이이며 숨기지 않는다.
- 별도 버전 원복 RPC를 만들지 않았다. 기존 history → draft → publish 경로를 유지한다.
- 미추적 cost_items_v2_3.sql은 읽기 비교만 수행했다. 수정/실행/commit/source 승격 없음. rfc_003a_user_profiles.sql 미접촉.
- migration source: 현재 원본은 capture JSON; 기능 정의는 일치한 tracked SQL 또는 capture; save/version/guard는 Production + local hardening 후보를 리뷰해 승격한다.
- 실제 Production mutation/DDL/migration, app 수정, commit/push/deploy 없음.
- 기존 KF-004는 이번 단계에서 수정하지 않는다. 원본 정합성 종료와 운영 보안 보완 배포 완료는 서로 다른 판정이다.

## 최종 검증과 판정

| Suite | 결과 |
|---|---|
| regression | 51 PASS / 기존 KF-004 1 / unexpected 0 / skip 0 |
| DB Security RUN 1 / RUN 2 | 99/99 PASS / 99/99 PASS |
| Integrity RUN 1 / RUN 2 | 56/56 PASS / 56/56 PASS |
| Captured source replay | 12개 definition/args/type/config/volatility/function ACL PASS |
| syntax / diff / lint | PASS / PASS / errors 0, 기존 warnings 5, 신규 0 |

Production read-only 범위를 지켰으며 캡처 외 업무 데이터/credentials 사용 없음.
원가 RPC source 정합성 CLOSED, 2B-3 PASS. 다음 KF-004 runtime integration은 로컬에서 진행 가능(YES).
운영 계정 상태 helper 및 방어적 후보 적용은 별도 승인/단계가 필요하다. Production 보안 전부 해결됐다고 판정하지 않는다.
commit/push/deploy/migration 적용 없음.

## 최종 git status --short

아래 기존 앱/API/package 변경은 이번 2B-3에서 추가 수정한 것이 아니다. 그대로 보존했다.

```text
 M app/api/os/_lib/server.ts
 M app/api/os/auth/change-password/route.ts
 M app/api/os/contract-packages/_lib/contracts.ts
 M app/api/os/me/route.ts
 M package-lock.json
 M package.json
 M public/os-app/src/main.js
 M public/os-app/src/storage.js
?? app/api/os/contract-packages/_lib/contract-fixed-terms.json
?? docs/AND_OS_2_0_BASELINE.md
?? docs/AND_OS_2_0_REGRESSION_TESTS.md
?? docs/db-baseline/
?? supabase/cost_items_v2_3.sql
?? supabase/rfc_003a_user_profiles.sql
?? tests/
?? vitest.config.mjs
?? vitest.db.config.mjs
?? vitest.integrity.config.mjs
```
