# AND OS 2A / 2B 자동 회귀·보안 테스트 기준

작성일: 2026-10-07. 기준 문서: `docs/AND_OS_2_0_BASELINE.md`.

조사·구현 기준: `rfc-006-integration`, HEAD `522cbb884fa022773e9e6068285b842c8e043987`.
이번 결과는 로컬 코드와 합성 fixture의 재현 결과다. 운영 DB/RLS 또는 실제 고객 계정의 검증 결과가 아니다.

## 현재 상태 — 2B-3 (2026-10-12)

**2B-3 Verdict: PASS. 원가 RPC source 정합성: CLOSED. 다음 KF-004 runtime integration: YES.**
이는 원본 확보/비교/로컬 후보 검증의 종료 판정이다. 운영 hardening 배포 완료 또는 전체 OS 보안 CLOSED를 의미하지 않는다.
KF-004는 미수정이며 별도 다음 단계다.

### Production 원본 직접 캡처

- 사용자가 로그인한 Supabase Dashboard의 기존 SQL Editor 세션 사용.
- Production에는 pg_catalog metadata SELECT 1회만 실행. 애플리케이션 RPC/함수, 업무 테이블 row/count 조회 없음.
- 함수 12개와 원가 테이블 3개의 columns/constraints/indexes/triggers/RLS/ACL 확보.
- credentials/Auth users/고객/견적/계약/원가 실제 값을 읽거나 출력하거나 저장하지 않았다.
- Production DB/schema/RLS/GRANT 변경 없음. SQL Editor가 플랫폼 draft를 자동 생성했으나 명시적 Save는 하지 않았다.
- 초기 credential 부재 차단은 사용자 Dashboard 로그인으로 해소됐다. 새 credential 생성/복사 없음.
- 원본 파일: `docs/db-baseline/AND_OS_PROD_COST_SCHEMA_2026-10-12.json`, 동일 이름 `.md`.
- 비교/decision: `docs/db-baseline/AND_OS_PROD_COST_COMPARISON_2026-10-12.md`, 기계 diff `.json`.

### Source 결정과 기존 후보 정정

- publish/cancel/cancel-all 및 create/update pending/code validation/role helpers의 현재 원본 확보.
- publish 본문은 tracked hardening hotfix와 정확히 일치. 004b 또는 미추적 구버전 본문은 차이가 있다.
- save는 동일 운영값을 draft NULL로 정규화하며 draft 없으면 actor/time도 NULL. 기존 후보의 no-op draft/timestamp 처리 차이를 복구했다.
- save DEFAULT NULL, margin >=1 거부, explicit false, missing-item 반환/예외 정책은 Production과 정합시켰다.
- save candidate의 FOR UPDATE/finite 숫자 검증은 별도 hardening으로 유지했다.
- version은 운영의 Asia/Seoul 날짜/형식/호출 ACL을 기준으로 lock/숫자 regex/999 한도를 추가한 후보를 유지했다.
- mutation guard는 Production 원본 이름/SECURITY DEFINER/세 테이블 연결을 재현. 불필요 EXECUTE 권한 축소는 로컬 후보만 적용.
- 운영 current_and_os_role에는 active/must_change_password 검사가 없는 것이 정의로 확인됐다. local role candidate는 이를 보완하며 Production에는 미적용.
- reconstructed 지원 DDL 및 단순 test mutation trigger는 runner에서 제거. captured support DDL/constraints/indexes/RLS/ACL을 재현한다.
- `cost_items_v2_3.sql`은 이번 허용 범위에서 읽기 비교만 했고 canonical 원본으로 승격하지 않았다. 기존 미추적 SQL 두 파일 수정/실행/commit 없음.
- PG17 MAINTAIN table privilege는 PG15 local replay만 제외. raw Production ACL은 capture JSON에 완전 보존.
- migration 폴더 이동/Production 적용 없음. Generated capture replay 및 병합 canonical은 소유 로컬 Test DB에만 적용.

### 검증 기록

| 항목 | 이번 실행 |
|---|---|
| Captured original 함수 definition/args/type/proconfig/volatility/EXECUTE ACL | 12개 local replay 검증 PASS (후보 적용 전) |
| regression | 51 PASS / 기존 KF-004 1 / unexpected 0 / skip 0 |
| DB security | 99/99 PASS x2 |
| integrity RUN 1 | 56/56 PASS / KF 0 / unexpected 0 / skip 0 |
| integrity RUN 2 | 56/56 PASS / KF 0 / unexpected 0 / skip 0 |
| syntax / diff / lint | JS syntax PASS / diff PASS / lint error 0, 기존 warning 5, 신규 0 |

Canonical이 변경되어 세 suite를 다시 실행했다. 강화 assertion은 동일값/null 인자의 draft 제거와 timestamp/actor clear,
margin=1 거부를 포함한다. 운영 원가/견적 산식 변경 없이 saved snapshots는 보존됐다.
최종 fixture cleanup: 테스트 DB auth/profiles/estimates/계약/원가/history/log/audit 모두 0건.
기존 계약 guard 4개/manifest candidate/실제 원가 guard 3개 활성. substitute test_cost_mutation_gate 제거 확인.
Production은 metadata SELECT 외 DB 작업 없음. 신규 Known Failure 없음.
운영 helper의 계정 상태 검사 누락은 metadata로 확인된 기존 위험이며 별도 migration hardening 대상이다.
그 외 pre-existing Git 변경은 유지했다. 현재 신규 경로는 docs/db-baseline/ 및 tests/os/db 내 캡처/비교/replay 도구다.
기존 미추적 SQL 두 파일은 계속 미추적이며 수정/실행하지 않았다.
commit/push/deploy는 하지 않는다. 이전 기록은 아래에 그대로 보존한다.

## 이전 상태 — 2B-2-Fix (2026-10-12)

**Verdict: PARTIAL. 3단계 main.js 모듈 분리: NO.**
계약 KF 4개는 로컬 코드/후보 DB에서 정상 PASS로 전환했다. 원가 RPC 운영 원본의 동일성,
이전 KF-004 staff raw estimate 노출, 운영 계정 상태를 반영하지 않는 기존 role helper는 여전히 남는다.
Production/hosted Supabase 접근, 실제 고객 데이터, commit/push/deploy는 없다.

### 이번 수정 파일 (기존 미커밋 작업은 유지)

| 파일 | 변경 |
|---|---|
| `app/api/os/contract-packages/_lib/contracts.ts` | CONTRACT JSON에 전체 고정 조문 저장, 템플릿 버전 식별 |
| `app/api/os/contract-packages/_lib/contract-fixed-terms.json` | 현재 48조 전체 문구를 기계적으로 그대로 복제한 서버 템플릿 데이터 |
| `public/os-app/src/main.js` | 저장 CONTRACT JSON 우선 렌더, 지급 label/ratio/due_basis 복원, parties_info 호환 |
| `tests/os/db/patches/contract-manifest-lock.PROPOSED.sql` | manifest/금액/계약증빙 보호 후보, local ownership guard |
| `tests/os/db/patches/cost-rpc.PROPOSED_CANONICAL.sql` | 누락 save/version/guard의 명시적 canonical 제안 |
| `tests/os/db/cost-support.sql` | 단순 save/version test substitute 제거; 누락 지원 DDL은 TEST ONLY 유지 |
| `tests/os/db/patches/role-boundaries.PROPOSED.sql` | mutation guard 중복 정의 제거, canonical에서 단일 정의 |
| `tests/os/db/run.mjs` | 후보 SQL을 소유 로컬 DB에만 적용한 뒤 두 번 실행 |
| `tests/os/db/integrity/reset.sql` | fixture cleanup 트랜잭션에서 후보 guard도 일시 해제/재활성화 |
| `tests/os/db/integrity/contract.db.test.js` | KF-009 일반 PASS, 금액 metadata/CHANGE_PENDING 보호 |
| `tests/os/db/integrity/reprint.db.test.js` | KF-008A/B/010 일반 PASS, legacy 비변경 검증 |
| `tests/os/db/integrity/cost.db.test.js` | canonical 시그니처/버전 증가/입력 거부/이력 기반 원복 검증 |
| `tests/os/db/README.md`, 본 문서 | 최신 검증 경계 및 migration 준비 상태 |

### 계약 스냅샷과 재출력

- **KF-008A FIXED:** CONTRACT `content_json.generated_sections.fixed_term_lines`에 전체 48조 저장.
  canonical `hashJson(content_json)` → document `content_hash` → 기존 package manifest SHA256 순으로 보호된다.
  `source_hash`는 기존 package data hash이며 조문 증빙은 document/manifest hash에 포함된다.
  템플릿 버전은 `RFC-005-2026.10.12-snapshot`. 법률 문구/순서는 변경하지 않았다.
- **KF-008B FIXED:** `generated_sections.payment_schedule`의 label/ratio/amount/due_basis를 모두 출력한다.
  현재 package-level schedule이나 현재 기본 지급문구보다 저장 document 값이 우선한다.
- **KF-010 FIXED:** document `generated_sections.parties.contractor`가 source of truth.
  legacy는 package `parties` / `parties_info`를 사용한다. 상호/대표자/주소/연락처/사업자번호/서명 상호 연동.
- `renderContractPrintSheet()`는 실제 preview.documents를 renderer에 전달하므로 preview와 저장 package 모두 같은 경로다.
- **Legacy policy:** 고정 조문이 없는 과거 package만 현재 legacy 조문 fallback을 사용한다.
  과거 조문 원본이 없는 계약의 역사적 동일성은 소급 보장할 수 없다. 자동 재저장/DB repair 없음.
  지급조건/시공자 정보는 존재하는 저장값을 우선한다. 문서가 없을 때 package fallback도 객체를 mutate하지 않는다.
- **KF-009 FIXED IN LOCAL CANDIDATE:** Production 원본 SQL은 수정하지 않았다.
  후보 trigger는 CONTRACTED/CHANGE_PENDING/SUPERSEDED/CANCELLED에서 아래 필드 변경을 차단한다.
  `package_manifest_hash`, `source_hash`, `package_version`, 원계약금액/기승인누계/차액/변경후누계,
  parent_package_id/originating_change_order_id, estimate_id/revision/contract_no,
  contract_info/parties_info/site_manager/estimate/options/spec/clause/payment snapshot, template/rule version.
  confirmed_at 같은 비핵심 metadata는 이번 후보에서 추가로 잠그지 않았다.
  기존 FINAL document content/hash/version 잠금은 그대로 유지한다.
- 정상 confirm, 원본 CHANGE_PENDING → SUPERSEDED, 후속 READY → CONTRACTED, 승인 증적 잠금 모두 PASS.
  cleanup 외에는 guard를 끄지 않는다. 후보는 전용 local stack에만 남으며 운영에는 적용하지 않았다.

### 원가 RPC 원본과 canonical 상태

| 대상 | 확인 결과 |
|---|---|
| `save_cost_item_draft(uuid,numeric,numeric,boolean)` | **SOURCE DEFINITION MISSING**. storage.js 호출 계약에 맞춘 PROPOSED_CANONICAL. 운영 원본이라고 주장하지 않음 |
| `next_cost_publish_version() -> text` | **SOURCE DEFINITION MISSING**. 문서의 YYYY.MM.DD-NNN + tracked publisher lock/log에 맞춘 후보 |
| draft/history/publish_log 지원 DDL | 운영 원본 missing, 기존 `cost-support.sql`은 TEST ONLY |
| mutation guard | 운영 원본 missing, canonical guard의 이름/구현은 제안안임 |
| cancel/cancel-all/publish | tracked `rfc_cost_draft_rpc_hardening_hotfix.sql` 본문을 수정 없이 실행 |
| 별도 버전 원복 RPC | 현재 앱이 호출하는 독립 RPC 없음. `createRollbackDrafts()` → 이전 history 값 → `saveCostItemChanges()` → save RPC 반복. 다품목 전체 원복의 원자성은 보장하지 않음 |

기존 TEST-UUID allocator와 단순 save substitute는 제거했다. canonical은 row lock/입력 검증/actor/approved RPC flag를 사용한다.
버전 후보는 publisher와 같은 advisory transaction lock과 당일 publish_log 최대 suffix를 사용한다.
authenticated의 allocator 직접 EXECUTE는 차단되며 publisher definer 내부에서만 호출한다.
실패한 publish의 log/history/draft/operating 변경은 transaction rollback된다.
이 결과는 **운영 원본 동일성 검증이 아니라 candidate 동작 검증**이다.
미추적 `cost_items_v2_3.sql`, `rfc_003a_user_profiles.sql`은 읽거나 실행하거나 수정하지 않았다.

### 실행 결과

| 검증 | 결과 |
|---|---|
| `npm run test:run` | 52건: 51 PASS / 기존 KF-004 1 / unexpected 0 / skip 0 |
| `npm run test:db` | **99/99 PASS x2**, failed 0 / skip 0 |
| `npm run test:db:integrity` RUN 1 | **56/56 PASS**, KF 0 / unexpected 0 / skip 0 |
| `npm run test:db:integrity` RUN 2 | **56/56 PASS**, KF 0 / unexpected 0 / skip 0 |
| node syntax / git diff check | PASS (Git CRLF 안내는 whitespace error가 아님) |
| lint / build | lint error 0, 기존 warning 5개 / build PASS, 신규 warning 0 |

Integrity는 계약 39건 + 원가 12건 + 실제 renderer 재출력 5건.
고정 조문 상수 가상 변경 후에도 저장 문구 동일, 지급 4필드 및 시공자 document 우선, legacy fallback 검증.
임시저장/취소/전체취소/publish/실패 rollback/history/log/다음 버전/no-draft/pending-new 취소/원복 draft 모두 PASS.
신규 Known Failure 없음. 기존 KF-004와 account-state/source gap은 해소했다고 주장하지 않는다.

### SQL migration 준비 분류

| SQL | 분류 | 이유 |
|---|---|---|
| `tests/os/db/patches/contract-manifest-lock.PROPOSED.sql` | **VERIFIED CANDIDATE** | local 두 번 검증. ownership wrapper 등 테스트 경계 제거 검토 후 별도 승격 필요 |
| `tests/os/db/patches/cost-rpc.PROPOSED_CANONICAL.sql` | **NOT SAFE FOR MIGRATION** | 원본 missing. 로컬 동작 PASS만으로 운영 호환성을 보증하지 못함 |
| 누락 save/version/guard 운영 원본 | **SOURCE MISSING** | Production 미접속. 원본 DDL과 ACL 확보 후 비교 필요 |
| `tests/os/db/cost-support.sql` 및 bootstrap/reset/fixture SQL | **TEST ONLY** | 재구성 DDL 또는 합성 데이터 cleanup, migration 대상 아님 |
| `tests/os/db/patches/role-boundaries.PROPOSED.sql` | **TEST ONLY** | staff raw 차단 후보이며 현재 앱 CRUD 미연결 |
| `supabase/rfc_cost_draft_rpc_hardening_hotfix.sql` | **VERIFIED CANDIDATE** | 실제 tracked body/rollback 검증, missing dependencies 해결이 전제 |
| `supabase/rfc_006_contract_documents.sql` | **NOT SAFE FOR MIGRATION** | 원본에는 KF-009 보호 누락이 남음. 후보 반영 검토 없이 그대로 승격 불가 |

`supabase/migrations`로 이동한 파일 없음. Production 적용/롤백 SQL 실행 없음.
3단계 진입은 원가 원본/권한 정의 정합성 및 기존 staff 경계 결함 해결을 확인한 뒤 승인받는다.
최종 synthetic 데이터 조회: auth.users/profiles/estimates/packages/documents/changes/approvals/
cost_items/history/publish_log/audit 모두 0건. 기존 4개 잠금 trigger와 후보 manifest/cost guard 활성 상태 확인.
이전 실패 이력은 아래에 보존한다.

### 최종 git status --short

아래 기존 수정은 되돌리지 않았고 이번 작업 범위 밖의 파일에는 추가 수정하지 않았다.
Git stage/commit 없음. 미추적 SQL 2개 유지.

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
?? supabase/cost_items_v2_3.sql
?? supabase/rfc_003a_user_profiles.sql
?? tests/
?? vitest.config.mjs
?? vitest.db.config.mjs
?? vitest.integrity.config.mjs
```

## 이전 상태 — 2B-2 (2026-10-12)

**Verdict: PARTIAL.** 실제 local DB의 계약·원가 무결성을 검증했고, 재출력/manifest 결함 4개를 Known Failure로 고정했다.
운영 데이터나 운영 SQL을 읽거나 변경하지 않았다. 이번 결과는 전용 Test stack과 아래 명시한 test substitute에 한정한다.

### 실제 환경·안전 경계

- Docker daemon 29.8.2, Supabase CLI 2.120.0, Node 24.16.0.
- 이미 실행 중인 `and-os-security-test`만 사용했다. 다른 stack을 시작·중단·삭제하지 않았다.
- ownership marker `and-os-security-test`, 실제 Auth/REST origin `http://127.0.0.1:55321`, DB container `supabase_db_and-os-security-test` 확인.
- 실제 local Auth가 발급한 8개 합성 계정 JWT 사용. production token/credential, 실제 고객/사용자 데이터 사용 없음.
- fetch는 기존 loopback allowlist와 redirect 거부 유지. CLI 상태·키는 출력하지 않았다.
- gateway host binding은 0.0.0.0/::의 55321이었다. 테스트 요청은 loopback만 사용했지만, stack 자체가 loopback-only listener라고 주장하지 않는다. 향후 로컬 구성 보완 시 별도 검토할 사항이다.
- 최종 build에는 Supabase URL/key 환경값을 inert 테스트 값으로 명시적으로 덮어썼다. 운영 환경파일을 수정하거나 credential을 복사하지 않았다.

### 추가·수정 파일

| 파일 | 변경 목적 |
|---|---|
| `package.json` | `test:db:integrity` script |
| `vitest.db.config.mjs` | 기존 보안 suite와 integrity suite 분리 |
| `vitest.integrity.config.mjs` | 실제 DB + jsdom 재출력 테스트, 단일 worker 및 결과 집계 |
| `tests/os/db/run.mjs` | integrity 모드·audit DDL, 반복 reset, local Auth cleanup 보완 |
| `tests/os/db/runtime.mjs` | SQL 오류의 안전한 ERROR 진단, 쿼리/credential dump 없음 |
| `tests/os/db/integrity/helpers.mjs` | 실제 Next create/confirm 및 RPC, 유효한 변경견적 합성 snapshot |
| `tests/os/db/integrity/contract.db.test.js` | 생성·확정·재시도·잠금·hash·변경견적 |
| `tests/os/db/integrity/cost.db.test.js` | draft/cancel/publish/rollback/history/snapshot 보존 |
| `tests/os/db/integrity/reprint.db.test.js` | 확정 DB snapshot을 실제 frontend 렌더러로 출력 |
| `tests/os/db/integrity/reset.sql` | 예약 fixture만 삭제, 잠금 trigger는 cleanup 트랜잭션에서만 일시 해제 후 재활성화 |
| `tests/os/db/patches/contract-manifest-lock.PROPOSED.sql` | 확정 manifest 잠금 누락에 대한 최소 후보, 테스트 후 ROLLBACK |
| `public/os-app/src/main.js` | 기존 CONTRACT_FIXED_TERM_LINES/renderContractPrintDocument named export만 추가 |
| DB README / 이 문서 | 실제 실행 결과·Known Failure·제한 기록 |

app API, 운영 supabase SQL, 계산식, UI, 원가/마진 정책은 이번 단계에서 수정하지 않았다.
초기 2A/Fix/2B-1 미커밋 작업과 미추적 SQL 두 파일은 보존했다.

### 최종 실행 결과

| Suite | RUN 1 | RUN 2 | 예상 밖 FAIL / skip |
|---|---|---|---|
| 기존 regression | 51 PASS + KF-004 1개 | 검증 이후 재실행 동일 | 0 / 0 |
| 기존 DB security | 99 PASS | 99 PASS | 0 / 0 |
| 신규 DB integrity (52개) | 48 PASS + Known Failure 4개 | 48 PASS + Known Failure 4개 | 0 / 0 |

신규 구성: contract 39개 (38 PASS + KF-009), cost 9개 PASS, reprint 4개 (1 PASS + KF-008A/008B/010).
최종 runner는 두 번 실행 및 cleanup까지 exit 0. Known Failure는 실행되는 test.fails이며 skip하지 않았다.
최종 읽기 전용 확인: auth.users/profiles/estimates/packages/documents/change_orders/approvals/cost_items/history/publish_log/audit fixture는 모두 0건.
계약/문서/변경견적/승인 잠금 trigger 4개는 활성(O), 실패 주입·manifest 후보 trigger 잔존은 0개였다.

초기 실행 장애도 기록한다:

- sandbox 임시 캐시 rename 권한으로 회귀 suite 수집이 실패했다. 권한이 허용된 동일 명령으로 재실행해 통과했다.
- 초기에 기존 DB security 99개 × 2는 통과했지만 Auth cleanup 통신 실패로 runner가 실패했다. 이를 전체 성공으로 집계하지 않았다.
- Auth DELETE JSON body를 명시하고 connection close 및 정확한 fixture UUID의 일시적 socket 오류에만 1회 재시도를 추가했다. 생성/확정/원가 publish는 자동 재시도하지 않는다.
- 첫 integrity 두 번째 실행 준비에서 확정 계약 FK가 reset을 막았다. 계약/문서/승인 fixture 전용 트랜잭션 cleanup을 각 run 전에 수행하도록 보완했다.
- 이후 최종 두 suite의 반복 및 cleanup 성공을 확인했다. 기존 결함을 정상 expected 값으로 바꾸지 않았다.

### Contract Integrity Matrix

| ID | 검증 | 결과 |
|---|---|---|
| CON-01 | 실제 Next POST → create RPC → READY/version/no/source hash/3 documents/manifest | PASS |
| CON-02/03 | 문서 하나 누락 및 중간 문서 INSERT 실패 → package/documents 모두 rollback | PASS |
| CON-04 | confirm → CONTRACTED, confirmed_at, 3 FINAL/locked_at, hash/version 유지 | PASS |
| CON-05/06 | 중복 confirm 거부 및 동시 confirm 1건만 성공, 중복 version/documents 없음 | PASS |
| CON-07 | 실제 Next confirm 중간 실패 → READY 유지 → 같은 id/no 재시도 성공 | PASS |
| CON-08 | 기존 패키지 재생성 API 409, 번호/패키지/문서 불변 | PASS |
| CON-LOCK | contract_info/parties_info/site_manager/estimate/options/spec/clause/payment/source hash/template/rule/revision 보호 | PASS |
| CON-LOCK DOC | FINAL content_json/content_hash/generation_status/locked_at UPDATE 및 DELETE 거부 | PASS |
| CON-META | confirmed_at 같은 metadata는 owner SQL로 변경 가능, 전체 컬럼 잠금 아님 | 구분 확인 |
| CON-HASH | source/document canonical hash, key 순서 역전 안정성, 필드 변경 시 hash 변화, manifest 독립 SHA256 일치 | PASS |
| PRINT-01 | 일반 재조회 계약번호·금액·snapshot 데이터 유지 | PASS (아래 출력 결함 별도) |
| KF-008A/B | 확정 후 현재 조문/지급문구와 무관한 재출력 | KNOWN FAILURE |
| KF-009 | 확정 manifest hash의 불변성 | KNOWN FAILURE |
| KF-010 | 저장된 parties_info 시공자 정보 출력 | KNOWN FAILURE |
| MF 후보 | 최소 manifest guard가 변경 거부, 후보 DDL·데이터는 ROLLBACK | PASS (운영 미적용) |
| CHANGE-01 | 원본 CHANGE_PENDING, 후속 READY/version+1/3종 문서, delta/원금/누계 분리 | PASS |
| CHANGE-DENY | 성명·승인방식·승인일·증적·hash/version 누락/불일치 거부, 상태 무변경 | PASS |
| CHANGE-02 | 원본 SUPERSEDED, 후속 CONTRACTED/FINAL, approval 및 APPROVED row UPDATE/DELETE 거부 | PASS |

초기 계약 3,770,000원, 변경 +130,000원, 후속 3,900,000원. 합성 변경견적의 항목/공정/전체 고객가 합계도 3,900,000원으로 맞췄다.
단순히 total만 변경한 불일치 fixture를 정상 테스트로 사용하지 않는다.
package trigger는 보호 필드 목록을 검사한다. source_snapshot 등의 논리명은 실제 estimate_snapshot/parties_info/contract_info/clause_snapshot 등에 매핑하여 검증했다.
FINAL 문서는 모든 UPDATE/DELETE를 막지만, CONTRACTED package metadata 전체가 불변인 것은 아니다.

### 새 Known Failures — 실제 재현 이력

| ID / 우선순위 | 재현 조건·실제 동작 | 기대·영향 | 관련 코드 / 난이도 |
|---|---|---|---|
| KF-008A / P0, C2 | 실제 확정 package 재조회 후 test-local 현재 CONTRACT_FIXED_TERM_LINES 한 줄을 새 template 문구로 바꿈. 저장 FINAL content_json/hash는 같은데 출력 조문이 변경됨 | 재출력은 확정 당시 고정 조문 유지. 배포 코드 변경으로 계약 증빙 본문이 달라질 위험 | main.js renderContractFixedTerms/renderContractPrintDocument, contracts.ts renderDocumentJson. 문서 snapshot/renderer 경계 설계 필요 |
| KF-008B / P0, C2 | READY 합성 snapshot의 지급문구 및 연결된 content_json/source/document/manifest hash를 일관되게 갱신 후 confirm. 출력은 저장 지급문구 대신 현재 defaults 문구 사용 | 저장된 최종 지급일정 문구 출력. 저장 hash와 출력 내용의 연결이 끊김 | main.js normalizeContractPaymentSchedule. 계약 확정 문서 소비 구조 보완 필요 |
| KF-009 / High | CONTRACTED package_manifest_hash를 owner SQL로 다른 64자리 hash로 변경할 수 있음. FINAL documents/hash는 그대로 | 확정 manifest = FINAL document hash 목록 유지. 내부 잘못된 DB 쓰기에 대한 guard 누락 | enforce_contract_package_state_transition의 protected_changed에 manifest 없음. 작은 guard 후보 작성 |
| KF-010 / High, C2 | 실제 Next 생성으로 parties_info.contractor.company_name='SYNTHETIC CONTRACTOR' 저장·confirm·재조회. 실제 HTML에 이 값이 없음 | 확정 시공자 정보가 계약 당사자에 출력되어야 함. 저장값 대신 기본 상호/공란이 출력될 수 있음 | main.js renderContractPrintDocument는 parties.contractor/contractor만 보고 parties_info.contractor를 읽지 않음. 최소 매핑 수정 후보, 이번엔 미수정 |

KF-009는 owner SQL/내부 쓰기 경계의 재현이다. authenticated/staff가 해당 UPDATE 권한을 가진다는 뜻이 아니다.
현재 table GRANT는 일반 사용자의 직접 접근을 별도로 차단한다. 실제 역할 정책 결과는 DB security suite를 따른다.
큰 문서 저장 구조를 임의 변경하지 않았고, 조문/지급조건/시공자 renderer 본문도 고치지 않았다.

### Cost Integrity Matrix

| ID | 검증 | 결과 |
|---|---|---|
| COST-01 | 운영값 불변, draft 가격/마진/활성, draft_updated_at/by 실제 local actor | PASS (test substitute save 함수 범위) |
| COST-02 | existing draft 취소 → 운영값 유지, draft만 clear | PASS |
| COST-03 | pending-new 취소 → 해당 fixture만 삭제 | PASS |
| COST-04 | 전체 취소 → existing 2건 clear + pending 1건 삭제, 반환 count 3 | PASS |
| COST-05 | publish → 운영=draft, draft clear, history/log 1건, version/count/actor 일치 | PASS |
| COST-06 | history/운영 UPDATE 뒤 publish_log INSERT 실패 주입 → 운영/draft/history/log 전부 rollback | PASS |
| COST-07 | 최초 history INSERT에서 flag='on' 요구, 실제 최종 body와 tracked hotfix 원문 비교 | PASS |
| COST-08 | draft 없는 재publish 명시 오류, version/log/history 추가 없음 | PASS |
| COST-09 | publish 후 과거 estimate row/customerQuote/internalDetails/costSnapshot/costTotal 불변, 새 운영 원가 조회만 변경 | PASS |

최종 local publish prosrc SHA256:
`0053891d4afa95c7c64e29fcadd3c38567d07288062d647c537bb14109b2cff1`.
실제 body에서 set_config가 최초 history INSERT보다 먼저였고 tracked hardening hotfix body와 일치했다.
tracked RFC-004B가 이후 이를 덮어쓰는 배포 순서는 이번에 실행하지 않았다. 실제 최종 정의를 검사한 결과다.
synthetic 가격 100,000원 → draft/publish 120,000원, margin 0.3 → 0.4, active true → false.
이 값은 운영 가격이나 마진 정책 변경이 아니다.

### 중요한 fidelity / 미검증 범위

- save_cost_item_draft와 next_cost_publish_version은 기존 2B-1 test substitute다. 원래 운영 정의가 tracked SQL에 없어 동일성 검증은 **BLOCKED — ORIGINAL RPC SOURCE REQUIRED**.
- cancel/cancel-all/publish는 tracked hardening hotfix 원문 함수로 검증했다.
- TEST-UUID version의 전파·중복 없음은 검증했지만 운영 월별 version allocator/동시 배포 순번 정책은 미검증이다.
- 배포 버전 원복/draft rollback 계열의 tracked RPC source도 찾지 못했다. 별도 rollback-version 로직을 새로 만들지 않았다. 트랜잭션 실패 rollback과 버전 원복 기능은 구분한다.
- 과거 견적 불변 및 새 운영값 REST 조회는 검증했다. 새로운 frontend 전체 견적 계산을 새 단가로 수행하는 E2E는 이 DB suite 범위가 아니다.
- 재출력의 보존되는 기본 데이터와 실패하는 본문을 구분했다. 모든 조건부 옵션의 인쇄 조합/레이아웃/PDF는 완전 검증했다고 주장하지 않는다.
- 보호 필드 owner UPDATE 검증은 CONTRACTED 상태를 대상으로 했다. CHANGE_PENDING 원본의 모든 snapshot 필드까지 잠겼다고 확대 해석하지 않는다.
- 승인 hash/version/evidence 검증과 상태전이는 실제 RPC에서 확인했으나 SQL의 JSONB 텍스트 hash와 서버 canonical JSON hash를 같은 알고리즘이라고 묶지 않는다.

### 실패 주입·반복·cleanup

로컬 전용 trigger로 문서 INSERT/FINAL UPDATE 또는 publish_log INSERT 실패를 주입했다.
운영 함수 본문을 실패시키도록 수정하지 않았다. 매 fixture reset에서 실패 trigger/function을 제거한다.
확정된 fixture는 owner cleanup 트랜잭션에서 필요한 잠금 trigger를 일시 비활성화해 예약 estimate UUID에 연결된 문서·승인·변경견적·package만 삭제하고 즉시 재활성화한다.
이 cleanup은 API/RPC에 노출하지 않는다. 트랜잭션 오류 시 상태 변경 전체가 rollback된다.
상태 guard를 무효화하여 테스트를 통과시킨 것이 아니다. 잠금 거부 검증은 guard가 활성화된 상태에서 수행한다.

manifest 후보는 `tests/os/db/patches/contract-manifest-lock.PROPOSED.sql`에만 작성했다.
독립 트랜잭션에서 보호 동작을 검증 후 ROLLBACK했고 trigger가 남지 않았음을 확인했다.
운영 promotion 전 모든 상태전이와 기존 metadata 수정 경로를 추가 검토해야 한다. 현재 원본 KF-009는 그대로 남는다.
그 외 발견된 결함을 숨기기 위한 SQL/데이터 보정·자동 재저장은 없다.

### 검증·다음 단계

`npm run test:run`, `npm run test:db`, `npm run test:db:integrity`, lint/build/diff 및 필요한 Node 문법 검사를 수행했다.
lint는 기존 warning 5개, 신규 error/warning 0. build 통과. 기존 regression 51 PASS + KF-004 1 유지.
Production DB/Auth/REST/RPC/SQL 접근, 실제 고객 데이터, commit/push/deploy 없음. 운영 SQL 파일 변경 없음.

**3단계 main.js 본격 모듈 분리 진행: NO.**
C2 확정 문서 소비/고정 조문 snapshot 설계, 시공자 매핑, manifest 보호 적용 결정을 먼저 받아야 한다.
staff 안전 CRUD와 실제 원가 save/version/원복 RPC source 확보도 남은 보완 사항이다.
이번 단계는 재현·검증 기반 확보이지 계약 출력·원가 전 영역의 완료 판정이 아니다.

## 2B-1B 기록 (2026-10-07)

**Security verdict: PARTIAL. BLOCKED — DOCKER DAEMON NOT RUNNING.**

### 실제 환경 확인과 최소 변경

- Node.js v24.16.0.
- `supabase` **2.120.0**을 정확한 버전의 project devDependency로 설치했다. 전역 CLI에 의존하지 않는다.
- 실제 project-local CLI의 `--version`, `start --help`, `status --help` 성공을 확인했다. `--workdir`, `-o json` 지원은 help로 확인했지만 실제 stack/status JSON 형식은 미검증이다.
- 기본 CLI home 생성은 sandbox에서 거부되므로 test 전용 ignored `.supabase/` 디렉터리로 CLI 상태를 격리했다. 사용자 전역 Supabase credential을 가져오지 않는다.
- runner는 설치된 package의 bin을 Node로 실행하는 npm-local 방식을 사용한다. CLI child의 Supabase URL/credential/binary override 환경변수를 제거하고 test 디렉터리를 cwd로 사용한다.
- `docker version`은 명령을 찾을 수 없어 실패했다. Docker 버전·daemon 응답은 확인할 수 없었다. Docker 설치나 기존 stack 조작은 하지 않았다.
- 기존 dependency package entry의 version 변경은 없다. package.json/lockfile, DB runner와 문서만 이번 단계에서 변경했다. 앞선 2A/Fix/2B-1 미커밋 작업은 보존했다.

### 실행 결과

| 명령/단계 | 실제 결과 |
|---|---|
| npm run test:run (DB 시작 전) | 52개: PASS 51, KF-004 expected failure 1, 예상 밖 실패/skip 0 |
| npm run test:db:start | BLOCKED — DOCKER DAEMON NOT RUNNING. CLI 버전 확인 후 Docker 응답 실패로 종료 |
| npm run test:db | 동일 BLOCKED. stack/status/Auth/REST/RPC/SQL 단계에 진입하지 않음 |
| DB RUN 1 | 미실행: 99개 BLOCKED |
| DB RUN 2 | 미실행: 반복성 미검증 |
| DB EXPECTED DENY / UNEXPECTED ALLOW | 실제 요청 0건, 판정 불가 |
| npm run test:run (DB 시도 후) | PASS 51 / Known Failure 1 / 예상 밖 FAIL 0 유지 |
| lint | 통과, 기존 warning 5 / 신규 error·warning 0 |
| build | 통과 |
| Node DB runner 문법 / git diff --check | 통과 |

테스트 stack의 **예상 설정값**은 API `http://127.0.0.1:55321`, project_id `and-os-security-test`,
container `supabase_db_and-os-security-test` 그대로다. 실제 stack URL 또는 생성된 container로 보고하지 않는다.

### 현재 보안 판정

- KF-004: **ARCHITECTURAL FIX REQUIRED** 유지. 현재 앱 직접 REST 경로는 해결되지 않았으며 safe view 후보도 실제 실행 검증 전이다.
- KF-005: **RESOLVED — POLICY CLARIFIED** 유지. mock manager UPDATE 허용 PASS, 실제 DB UPDATE 미검증.
- KF-006: client guard PASS 유지. direct REST DELETE/RLS/persistence는 미검증이므로 **FIXED — DB ENFORCED로 전환하지 않는다**.
- inactive 및 must_change_password의 직접 REST/RPC: 미검증.
- current_and_os_role/is_and_os_admin의 original/candidate 전후 실행 결과: 없음. 실제 gap 재현을 주장하지 않는다.
- Next API와 직접 DB 경계 비교, staff 응답의 실제 내부정보 비노출, 두 번 반복/reset/cleanup: 미검증.
- 후보 정책을 Production migration 후보로 승격하지 않았다. 기존 PROPOSED 파일도 이번에 변경·실행하지 않았다.

runner의 기존 original 단계는 helper 관찰에 한정되어 있다. Docker 복구 후에는 요청된 Original → Candidate 동일 경계 비교를 수행할 범위를 명시적으로 검증해야 한다.
estimates 최초 RLS DDL이 저장소에 없으므로 reconstructed 정책을 운영 원문으로 간주하지 않는다.
또한 현재 staff CRUD가 안전한 서버 경계를 통과하도록 내부 스냅샷 보존·재계산·주입 차단 구조가 필요하다.

Production URL/credential 사용, Production REST/RPC/Auth/Storage/SQL 접근, 실제 사용자·고객 데이터 사용은 없다.
commit/push/deploy도 없다. Supabase CLI 설치는 npm registry에서 수행했고 실제 DB 연결은 하지 않았다.

**2B-2 진행: NO.** Docker 설치 및 daemon 시작 후 `test:db:start`와 99개 DB 테스트 RUN 1/2를 실제 검증해야 한다.
CLI 사용법과 현재 차단 원인은 `tests/os/db/README.md`에 반영했다.

## 2B-1 기록 (2026-10-07)

**Security verdict: PARTIAL.** 로컬 회귀는 실행했지만 실제 DB 보안 검증은 실행하지 못했다.
Supabase CLI/Docker/psql이 PATH에 없고 Docker 기본 설치 경로 및 기존 local config도 없다.
Production 또는 임의 별도 프로젝트로 대체하지 않았다. 실제 DB 결과는 전부 **BLOCKED — LOCAL SUPABASE REQUIRED**다.

### 공식 역할 정책과 KF 상태

| 역할 | 견적 생성/조회/수정/삭제 | 내부정보 | 시스템 |
|---|---|---|---|
| admin | 모두 허용 | 원가·마진 허용 | 원가관리·사용자관리·계약확정 허용 |
| manager | 생성·조회·수정 허용, 삭제 금지 | 원가·내부견적 허용 | 원가 운영 조회만, 변경·배포·사용자관리·계약확정 금지 |
| staff | 기존 상담·견적 생성/조회/수정 UI 유지, 삭제 금지 | 원가·마진 응답 금지 | 기존 허용 계약업무 외 관리자 기능 금지 |
| inactive / must_change_password | 일반 견적·원가 접근 금지 | 금지 | 일반 API 금지; 본인 비밀번호 변경 최소 경로는 별도 |

| KF | 최신 상태 | 근거 |
|---|---|---|
| KF-001/002/003/007 | FIXED 유지 | 기존 PASS 회귀 유지 |
| KF-004 | ARCHITECTURAL FIX REQUIRED | 브라우저 직접 REST + 내부 JSON roundtrip 구조가 그대로 남음. 기존 test.fails 유지 |
| KF-005 | RESOLVED — POLICY CLARIFIED | 당시 read-only 전제로 분류했으나 공식 정책은 manager UPDATE 허용. 일반 허용 테스트로 전환 |
| KF-006 | CLIENT GUARD PASS / DB ENFORCEMENT BLOCKED | storage.deleteEstimate가 서버 /me로 활성·변경완료 admin 확인 후에만 DELETE. 실제 DB 거부는 미검증 |

기존 재현 이력은 아래 2A-Fix/2A 기록에 보존했다. KF-006을 FIXED / DB ENFORCED로 선언하지 않는다.
manager 생성·수정 경로와 계산식은 변경하지 않았다. 기존 삭제 UI의 admin 제한도 유지했다.
client guard는 우회 가능하므로 직접 REST의 DB 정책이 최종 보안 경계다.

### Test DB 방식과 파일

우선 방식은 **별도 Docker Supabase CLI local stack**이다. 구축 완료가 아니라 실행 준비 상태다.
`tests/os/db/supabase/config.toml`: project_id `and-os-security-test`, API 55321, DB 55322.
루트 supabase 프로젝트와 분리하며 hosted link/remote pull/push 또는 `.env.local` 키를 사용하지 않는다.

| 파일 | 목적 |
|---|---|
| `tests/os/db/bootstrap.sql` | 소유 marker + profiles/estimates 최소 test-only DDL |
| `tests/os/db/cost-support.sql` | 누락 draft/history DDL 및 명시적인 테스트 대체 save/version 함수 |
| `tests/os/db/fixtures.mjs` | 8개 합성 계정, 2개 내부정보 포함 견적, 원가 1개, SQL seed 생성 |
| `tests/os/db/patches/role-boundaries.PROPOSED.sql` | 후보 역할·활성/강제변경 gate, estimates RLS, staff safe view, cost hardening |
| `tests/os/db/reset.sql` | 예약 fixture UUID/품목/배포 사유에 한정한 cleanup |
| `tests/os/db/guard.mjs` | 정확한 loopback origin·Auth/REST 경로만 허용, redirect 거부 |
| `tests/os/db/runtime.mjs`, `run.mjs`, `setup.mjs` | 도구·stack 확인, 실제 Auth/JWT, Docker psql, 2회 실행, cleanup |
| `tests/os/db/security.db.test.js` | 실제 REST/RPC 및 실제 Next helper/route 보안 테스트 99개 준비 |
| `vitest.db.config.mjs` | DB suite 전용 Node 설정; 일반 mock suite와 분리 |
| `tests/os/integration/db-safety.test.js` | 운영 hostname/다른 localhost 포트/credential URL/Storage/redirect 차단 7개 |
| `tests/os/package.json` | 테스트 디렉터리만 ESM으로 지정; 앱 package module 정책 비변경 |
| `tests/os/db/README.md` | 로컬/CI 실행과 fidelity·제한사항 |

테스트 bootstrap의 estimates/profiles DDL은 현재 컬럼/API 기준 재구성으로, 운영 migration 기준선이 아니다.
원가 DDL·기존 role helper는 tracked `cost_items.sql`에서 가격 seed 직전까지 읽는다.
cancel/publish는 tracked `rfc_cost_draft_rpc_hardening_hotfix.sql` 원문, 계약 EXECUTE 권한은 tracked RFC-006 SQL 원문을 사용하도록 구성했다.
미추적 SQL 2개는 읽기·실행·수정 대상에 포함하지 않았다.
save draft/version allocator/일부 draft DDL/직접 원가 변경 gate는 test-only 재구성이다. 이것들의 운영 동등성을 주장하지 않는다.

### DB 보안 Matrix — 현재 전부 BLOCKED

다음은 후보 정책의 **기대값**이며 실제 통과 결과가 아니다.

| ID 패턴 | 대상/경로 | ALLOW | DENY / 확인 조건 |
|---|---|---|---|
| DB-E-*-SELECT | estimates REST 원본 | 활성·변경완료 admin/manager | staff·inactive·변경필수·anon 내부 원본 응답 금지 |
| DB-E-*-INSERT | estimates REST 생성 | 활성·변경완료 admin/manager | 기타 역할 거부. staff 안전 생성은 서버 구조 작업 필요 |
| DB-E-*-UPDATE | estimates REST 수정 | 활성·변경완료 admin/manager 업무 필드 | staff 직접 JSON roundtrip 금지, inactive·변경필수 거부 |
| DB-E-*-DELETE | estimates REST 삭제 | 활성·변경완료 admin | manager/staff/계정제한 상태 거부, service 재조회로 행 존속 확인 |
| DB-C-* | cost REST | 활성 admin/manager SELECT | staff/제한계정 조회 및 모든 일반 사용자의 직접 INSERT/UPDATE/DELETE 금지 |
| DB-R-*-save/cancel/publish | cost RPC | 활성·변경완료 admin | manager/staff/inactive/변경필수 거부, 함수 역할 오류 및 데이터 불변 확인 |
| DB-S-* | staff safe view | 활성·변경완료 staff | 중첩 JSON까지 원가·마진·메모 미포함, 기타 계정 row 없음 |
| DB-S-TAMPER | staff 내부정보 주입 PATCH | 없음 | 내부 JSON 삭제/원가 변조 거부, 기존 상세·snapshot 그대로 유지 |
| DB-N-* | 실제 JWT + Next context | 활성·변경완료 계정의 context | inactive/변경필수 403, 실제 auth.uid/profile 역할과 대응 |
| DB-N-*-CONFIRM | 실제 JWT + Next confirm route | admin 성공은 2B-2 | manager/staff/제한계정 403 |
| DB-R-*-CONFIRM | 계약 confirm 직접 RPC | service_role EXECUTE만 | authenticated 역할 모두 EXECUTE 금지, admin 정상 경로는 Next API |
| DB-ANON | 비로그인 REST/RPC | 없음 | estimates 및 cost RPC 거부 |
| DB-META | GRANT/RLS/EXECUTE/definer | 필요한 권한만 | table GRANT와 RLS를 별도로 확인, anon/PUBLIC 상속 EXECUTE 금지, search_path 확인 |

8개 계정: admin-active, manager-active, staff-active, admin-inactive, staff-inactive,
admin-must-change-password, manager-must-change-password, staff-must-change-password.
실제 로컬 Auth가 발급한 JWT를 사용하도록 구현했지만 이번 실행에서는 계정·JWT·DB 행이 생성되지 않았다.

후보 DB 테스트는 DELETE/PATCH의 HTTP 200 + 빈 배열도 RLS 거부로 구분하며 service 재조회로 실제 무변경을 확인한다.
성공 HTTP만 보고 쓰기 허용으로 판정하지 않는다. RPC 권한 거부도 단순 500이 아니라 실제 admin permission 오류를 요구한다.

### staff 대안 비교와 현재 결정

| 대안 | 장점 | 현재 제약/결정 |
|---|---|---|
| A 서버 API whitelist | 원본 내부 JSON이 브라우저에 도달하기 전에 제한 | 직접 REST도 차단해야 함. 입력 수정·배관 후처리 저장이 내부 스냅샷을 roundtrip하므로 안전 저장/서버 계산까지 필요 |
| B safe DB view | 서버/DB 응답 자체를 whitelist 가능 | test-only 후보로 작성. 작은 입력 subset만 표현하며 앱에 연결하지 않음 |
| C 저장/계산 경계 분리 | staff 수정 시 기존 내부 상세·costSnapshot 보존 및 주입 방지 가능 | 현재 DOM 의존 계산·저장 구조에서 작은 projection만으로 완성 불가. ARCHITECTURAL FIX REQUIRED |

현재 앱의 staff 생성·수정 UI는 변경하지 않았다. 후보 SQL에서는 staff raw read/write를 차단한다.
따라서 후보 SQL만 운영에 적용하면 기존 staff 업무가 깨질 수 있다. **운영 적용 후보가 아닌 검증용 초안**으로 취급한다.
허용 입력 payload → 기존 내부값 보존/필요 재계산 → safe response 경로를 설계·테스트하기 전에는 적용하지 않는다.
safe view에서의 내부정보 비노출도 실제 DB 실행 전에는 FIXED로 판단하지 않는다.
프로젝트/사용자 연결 자료가 없으므로 두 견적의 역할 경계 검증을 고객별 소유권 IDOR 검증으로 확대 해석하지 않는다.

### 원가 helper와 PROPOSED SQL

원문 current_and_os_role은 role만 조회하며 활성·강제변경 상태를 검사하지 않는다.
운영 현재 정의는 조회하지 않았고, 이번 단계에서 실제 JWT RPC gap도 재현하지 않았다.
runner는 후보 적용 전에 inactive/변경필수 admin의 원문 helper를 probe하고 실제 관찰 결과만 기록하도록 했다.
후보 helper는 활성·변경완료 프로필만 role을 반환하고 나머지는 빈 문자열로 deny한다.
빈 문자열을 사용해 `if not is_and_os_admin()`의 SQL NULL 우회도 피한다.

후보 파일은 `tests/os/db/patches/role-boundaries.PROPOSED.sql` 하나다.
필요 이유: manager DELETE RLS, staff raw JSON 차단, 계정 상태 직접 DB gate, 원가 직접 쓰기와 RPC 경계 분리.
rollback은 **격리된 disposable stack 재생성**이며 운영 rollback SQL은 작성하지 않았다.
원가 RPC 트랜잭션/이력/버전 정확성, 계약 확정 성공·잠금/원자성은 2B-2 범위다.

### 실제 실행 결과와 재현성

| 종류 | 준비/실행 | PASS | KNOWN FAILURE | BLOCKED | 예상 밖 FAIL |
|---|---:|---:|---:|---:|---:|
| 로컬 mock/단위 회귀 | 52개 실행 | 51 | 1 (KF-004) | 0 | 0 |
| 실제 DB 후보 suite | 99개 준비, 0개 실행 | 0 | 미판정 | 99 | 미판정 |

기존 41 PASS 유지. KF-005는 정책 재분류 PASS, KF-006은 client guard PASS.
admin 삭제 유지 1개와 네트워크 차단 7개를 추가했다. 배관 청소 11개는 모두 PASS 유지.

명령 결과:

- `npm run test:run`: PASS 51 / expected fail 1 / unexpected fail 0 / skip 0.
- `npm run test:db`: 비정상 종료, `BLOCKED — LOCAL SUPABASE REQUIRED`. 네트워크/SQL/계정 생성 전에 중단.
- `npm run lint`: error 0, 기존 warning 5, 신규 warning 0.
- `npm run build`: 통과.
- storage.js 및 DB runner/test Node 문법 검사: 통과. SQL 실행/실제 DB SQL 구문 검증은 미실행.
- `git diff --check`: 통과.

runner는 setup → seed → 후보 DB tests 두 번 → finally reset을 수행하도록 작성했다.
실제 반복 실행·Auth·SQL·cleanup 성공 여부는 환경 부재로 미검증이다. CI 명령은 DB README에 기록했다.
모든 실제 outbound DB 요청은 정확한 loopback origin만 허용하고 redirect를 차단한다.
CLI의 키 포함 출력은 캡처만 하고 출력하지 않으며, env 파일·토큰 로그를 만들지 않는다.

Production REST/Auth/RPC/Storage/SQL 접근과 운영 데이터 쓰기, commit/push/deploy는 없다.
기존 2A/Fix 미커밋 작업과 미추적 SQL 2개를 그대로 보존했다.

**2B-2 진행: NO (실행 검증 기준).** 로컬 Supabase/Docker 준비 후 99개 보안 테스트 및 두 번 반복 실행을 먼저 검증해야 한다.
staff 안전 CRUD 경계도 설계 결정이 필요하며, 실제 DB PASS 없이 보안 검증 완료나 DB ENFORCED로 선언하지 않는다.

## 2A-Fix 기록 (2026-10-07)

아래 표는 2A-Fix 완료 당시 상태다. 이후 정책 재분류 및 상태는 위 2B-1 절을 따른다.
뒤의 **2A 최초 기록**은 수정 전 실제 재현 이력이며 삭제하지 않았다.

| ID | 최신 상태 | 변경 파일·원리 | 불변조건·결과 |
|---|---|---|---|
| KF-001 | FIXED | main.js: 자동 repair 함수·호출 및 fractional 입력의 저장 결과 교체 분기 제거 | 조회 PATCH 0회, row/customerQuote/costTotal/address 불변, 화면 3,770,000원 유지; 일반 test PASS |
| KF-002 | FIXED | main.js: 확정 연결 여부와 무관하게 동일한 읽기 전용 복원 경로 | CONTRACTED 연결 구버전도 row와 금액 불변; 일반 test PASS |
| KF-003 | FIXED | main.js: 수정 저장 시 loadedEstimateBaseline.estimate.address를 snapshot options로 승계. storage.js: 주소 미제공 PATCH에서 address 생략 | 실제 일반 입력 변경 후 저장에 주소 유지; 주소 필드 없는 직접 update도 기존 row 주소 유지; PASS |
| KF-004 | STILL KNOWN FAILURE | 이번 단계에서 수정하지 않음 | KNOWN SECURITY GAP — DB/API BOUNDARY FIX IN 2B. 읽기 가능한 mock row의 내부 JSON은 그대로 전달됨 |
| KF-005 | ROLE POLICY DECISION REQUIRED | 이번 단계에서 manager 정책을 임의 변경하지 않음 | manager 직접 PATCH 발행의 Known Failure 유지 |
| KF-006 | ROLE POLICY DECISION REQUIRED | 이번 단계에서 manager 정책을 임의 변경하지 않음 | manager 직접 DELETE 발행의 Known Failure 유지 |
| KF-007 | FIXED | server.ts: 일반 getUserContext에서 강제 변경 상태 403. /me와 change-password만 getPasswordChangeContext 사용 | 일반 관리자·계약·원가 API 차단, staff/manager 공통 context 차단, 본인 상태 조회·비밀번호 변경 성공; PASS |

### 읽기와 쓰기 분리

loadEstimateIntoUi는 저장된 결과가 있으면 fractional targetMargin 여부와 관계없이 그 결과를 표시한다.
restoreInputValues의 기존 입력 호환 정규화는 유지하지만 저장 원본을 교체·PATCH하지 않는다.
저장 결과가 없는 견적의 메모리 계산 fallback은 유지한다. repairCorruptedTargetMarginEstimate는 삭제했다.
main.js의 updateEstimate 호출은 명시적인 handleSaveEstimate 경로에만 남아 있다. 수동 Repair UI는 추가하지 않았다.

### 주소의 source of truth

현장주소는 storage.normalizeEstimate가 estimates.address를 우선하여 복원하는 estimate.address다.
견적 입력 UI에는 독립 현장주소 편집 필드가 없고, 계약 패널의 현장주소도 이 값을 읽는다.
일반 수정 저장은 불러온 baseline 주소를 명시적으로 새 snapshot에 전달한다.
storage.updateEstimate는 address가 undefined/null이면 컬럼을 PATCH하지 않으며, 명시적 빈 문자열은 기존과 같이 전달한다.
신규 saveEstimate의 기존 동작은 변경하지 않았다. 새 견적 저장에 이전 프로젝트 주소를 자동 승계하지 않는다.

### 강제 비밀번호 변경 경계

- getPasswordChangeContext: Bearer/Auth/profile 존재 및 is_active 검증을 기존대로 수행한다.
- getUserContext: 위 검증 후 must_change_password=true이면 403과 `{ error: "비밀번호 변경 후 이용해 주세요." }` 응답.
- requireAdmin 및 일반 계약·원가 route는 공통 getUserContext 경계를 계속 사용한다.
- 예외는 `/api/os/me` 본인 상태 조회와 `/api/os/auth/change-password` 본인 비밀번호 변경뿐이다. 두 route에서 전용 helper를 명시적으로 사용한다.
- 실제 비밀번호 변경 route의 기존 Auth PUT → profiles PATCH → 감사기록 POST는 모두 mock에서만 검증했다. 운영 Auth 접근은 없다.
- 직접 Supabase REST/RPC에서 이 제한을 강제하는 문제는 **BLOCKED — TEST DB REQUIRED**이며 이번 서버 패치로 해결했다고 주장하지 않는다.

### manager 역할 정책 확인 결과

최소 확인 근거:

- `docs/AND_OS_1_0_CLEAN_BASELINE.md`는 manager의 내부정보 조회와 원가/사용자/배포 변경 금지만 명시한다. 견적 생성·수정 금지를 명시하지 않는다.
- `docs/AND_OS_2_0_BASELINE.md`의 P0 목표는 manager 쓰기 금지를 요구하지만 실제 REST enforcement는 미확인이다.
- main.js의 applyAccessControl은 manager의 admin 전용 UI를 제거하고 계약·원가 편집을 금지한다.
- 그러나 공통 견적 저장·새 견적 저장 버튼과 handleSaveEstimate는 manager 역할에서 차단되지 않는다. 견적 생성·수정 경로가 실제로 열려 있다.
- 삭제 목록 버튼과 이벤트는 admin만 허용한다. 직접 storage.deleteEstimate에는 역할 guard가 없다.

따라서 견적 생성·수정·삭제 전체를 manager read-only로 확정할 저장소 정책이 일관되지 않다.
이번 지시의 충돌 시 유지 원칙에 따라 KF-005/006을 모두 실행되는 Known Failure로 유지했다.
2B 전에는 admin/manager/staff의 견적 생성·수정·삭제 정책을 명시적으로 확정해야 한다.
정책 결정 후 client guard를 넣더라도 보안 최종 경계는 RLS/GRANT이며 별도 테스트 DB 검증이 필요하다.

### staff 내부정보 경계의 잔여 문제

staff 목록과 단건 조회 모두 브라우저의 직접 estimates REST 경로를 사용한다.
작은 server projection을 추가해도 직접 REST 자체를 계속 호출할 수 있는 문제는 남는다.
일반 수정 저장과 배관 청소 파생 저장도 내부 snapshot을 사용하므로 customer-safe projection만 임의 도입하면 저장 데이터 보존까지 영향을 받는다.
읽기 API 경계, 허용 저장 payload, 직접 REST의 컬럼/RLS 권한을 함께 검증해야 하므로 이번 최소 패치에서는 추가 CRUD API나 클라이언트 필드 삭제를 도입하지 않았다.
KF-004는 그대로 유지하며 운영 정보유출 발생이나 RLS 우회를 단정하지 않는다.

### 최신 테스트 결과

| 파일 | 총수 | 일반 PASS | KNOWN FAILURE |
|---|---:|---:|---:|
| estimate-read.test.js | 5 | 5 | 0 |
| storage-boundaries.test.js | 5 | 2 | 3 |
| api-boundaries.test.js | 23 | 23 | 0 |
| pipe-cleaning.test.js | 10 | 10 | 0 |
| pipe-cleaning-workflow.test.js | 1 | 1 | 0 |
| 합계 | **44** | **41** | **3** |

```text
TOTAL=44 PASS=41 KNOWN_FAILURE=3 UNEXPECTED_FAIL=0
SKIPPED=0 FAILED_FILES=0 UNHANDLED_ERRORS=0
```

기존 30개 PASS를 유지하고 4개 Known Failure를 일반 test로 전환했다. 목표 assertion과 기존 fixture를 약화·변경하지 않았다.
주소 미제공 PATCH 보존 1개, 강제 비밀번호 변경 공통 경계·예외 route 검증 6개를 추가했다.
회귀테스트 문서의 BLOCKED는 실제 DB/API 경계 검증 과제이며 실행하지 않은 테스트를 통과 처리한 개수가 아니다.

검증: npm run test:run, main.js/storage.js node --check, git diff --check, npm run lint, npm run build 모두 통과.
lint는 기존 unused-vars warning 5개, 신규 error/warning 0개다. build의 TypeScript와 정적 페이지 생성도 통과했다.
배관 청소 11개 테스트는 원가·판매가 +300,000원, 이익 불변, 반복·저장·재조회·타 공정 보존을 계속 만족한다.

이번 runtime 변경은 조회 자동 쓰기 제거·주소 보존·서버 강제 비밀번호 변경 gate뿐이다.
계산식, 고객가·원가·배관 청소 정책, 계약금액 산식, UI 레이아웃, SQL/RPC/RLS는 변경하지 않았다.
Production DB/Auth 접근, 실제 고객 데이터 사용, commit/push/deploy는 수행하지 않았다.

**2B 진행: YES.** 테스트 DB 보안 검증과 manager 역할 결정 단계로 진행 가능하다.
운영 반영 또는 전체 보안 PASS를 의미하지 않으며, KF-004/005/006과 DB enforcement 검증은 남아 있다.

# 2A 최초 기록 (수정 전 이력)

## 1. 범위와 안전 경계

- P0-1 견적 조회 원본 불변, P0-2 역할·접근 경계, P0-3 배관 청소 회귀만 자동화했다.
- 실제 고객 이름·연락처·주소·견적·계정·인증정보를 복사하지 않았다.
- 모든 fetch는 테스트 mock으로 대체한다. 등록되지 않은 요청은 차단하고 독립적인 afterEach 검사로 실패 처리한다. 실제 통신 fallback은 없다.
- Auth 응답, profiles, REST 조회·PATCH·DELETE는 메모리 fixture다. 저장·삭제 테스트도 이 메모리 객체만 변경한다.
- 서버 환경에는 `https://supabase.invalid`와 실제 인증에 사용할 수 없는 테스트 문자열만 제공한다. 환경 파일이나 운영 service role key를 읽지 않는다.
- jsdom은 기존 HTML을 읽되 `runScripts: outside-only`로 HTML script 실행을 막고, 저장소의 실제 모듈을 명시적으로 import한다. 인쇄·alert·confirm은 mock이다.
- 기존 결함 수정, 운영 DB/Auth 접속, SQL 실행, 스키마/RLS/RPC 변경, commit/push/deploy는 수행하지 않았다.

## 2. 환경과 실행

| 항목 | 설정 |
|---|---|
| 실행 환경 | Windows, Node.js 24.16.0, npm 11.13.0 |
| runner | Vitest 4.1.0, devDependency |
| DOM 환경 | jsdom 30.1.2, devDependency |
| API 테스트 | Node 환경에서 실제 NextRequest·route handler·서버 helper 실행 |
| 병렬도 | maxWorkers: 1 |
| test | `npm run test` |
| 단일 실행 | `npm run test:run` |
| watch | `npm run test:watch` |

기존 Node 타입 의존성과 호환되는 Vitest 4.1.0을 선택했다. Cypress/Playwright/MSW/테스트 서버를 추가하지 않았다.
lockfile에 테스트 전이 의존성이 추가됐으며, 기존 package entry의 version 변경 및 삭제는 없다.

## 3. 파일 구조와 최소 test seam

| 파일 | 역할 |
|---|---|
| `vitest.config.mjs` | 테스트 범위·환경·mock 환경변수·reporter 설정 |
| `tests/os/setup.js` | 매 테스트 네트워크 차단, DOM 부수효과 mock, 예기치 않은 요청 검출 |
| `tests/os/fixtures/estimates.js` | 최신/구버전/배관 포함/내부정보 포함 합성 견적과 가짜 계정 |
| `tests/os/helpers/network.js` | fetch 차단 및 요청 기록, JSON 응답 mock |
| `tests/os/helpers/os-harness.js` | 실제 HTML·main·storage 로드, 메모리 REST 저장소 |
| `tests/os/helpers/known-failure.js` | 재현 준비와 목표 불변조건의 expected failure 분리 |
| `tests/os/helpers/regression-reporter.mjs` | PASS/Known Failure/예상 밖 FAIL 및 파일·unhandled error 집계 |
| `tests/os/unit/pipe-cleaning.test.js` | 실제 후처리 helper의 금액·멱등성·불변성 |
| `tests/os/integration/pipe-cleaning-workflow.test.js` | 실제 체크 이벤트 → 수정 저장 → 조회·복원 |
| `tests/os/integration/estimate-read.test.js` | 실제 조회·UI 로드·자동 repair·주소 보존 |
| `tests/os/integration/storage-boundaries.test.js` | 실제 브라우저 storage의 역할 경계 |
| `tests/os/integration/api-boundaries.test.js` | 실제 서버 인증·권한·계약 projection·ID 조합 검사 |

runtime 파일 변경은 `public/os-app/src/main.js` 끝의 named export 추가뿐이다:

```js
export {
  applyExistingPipeCleaningAdjustment,
  buildEstimateSnapshot,
  calculateForCurrentEstimate,
  enterAuthenticatedApp,
  handleSaveEstimate,
  loadEstimateIntoUi,
};
```

함수 본문, 조건, 계산식, UI 이벤트, 저장 payload, 계약 동작은 변경하지 않았다. 함수 이동·모듈 분리도 없다.

## 4. 합성 fixture와 독립 기준값

프로젝트는 `SYSTEM_SYNTHETIC_2A`, 주소는 `테스트시 테스트구 123`이다. UUID, 이메일, 세션 문자열은 테스트 전용이다.
기대 금액은 실행 결과에서 가져오지 않고 fixture에 독립적으로 정의했다.

| 상태 | 직접원가 | 고객가 | 이익 | 원가 대비 이익률 |
|---|---:|---:|---:|---:|
| 배관 청소 OFF | 2,900,000원 | 3,770,000원 | 870,000원 | 30.00% |
| 배관 청소 ON | 3,200,000원 | 4,070,000원 | 870,000원 | 27.19% |

현재 코드의 marginRate는 원가 대비 markup 기준으로 검증했다. 과거 매출 기준 마진율로 되돌리지 않았다.
기본 상세 원가는 철거 100,000원, 욕실 700,000원, 전기 200,000원, 목공 300,000원,
가구 400,000원, 도배 500,000원, 바닥 600,000원, 기타 폐기물 100,000원이다.
각 기본 고객가는 원가 × 1.3이다. 배관 청소는 원가·고객가 각각 300,000원이며 이익은 0원이다.

## 5. 테스트 Matrix

상태: PASS / KNOWN FAILURE / BLOCKED — TEST DB REQUIRED / NOT IN THIS PHASE.

| ID | 영역 | 불변조건·검증 범위 | 상태 |
|---|---|---|---|
| P0-1-A | 최신 견적 조회 | GET·UI 로드만으로 POST/PATCH 없음, customerQuote/costTotal/total/address 및 원본 row 유지 | PASS |
| P0-1-B | 최신 확정 연결 견적 조회 | CONTRACTED 패키지가 연결되어도 조회만으로 원본 불변 | PASS |
| KF-001 | C1 구버전 조회 | fractional targetMargin 조회는 자동 저장하면 안 됨 | KNOWN FAILURE |
| KF-002 | C1 확정 연결 구버전 | 확정 연결 견적도 조회만으로 금액 변경 금지 | KNOWN FAILURE |
| KF-003 | H5 일반 수정 저장 | 기존 현장주소 보존 | KNOWN FAILURE |
| P0-2-A | 서버 인증 | Bearer 없음·거부된 Auth는 401, 비활성 profile은 403 | PASS |
| P0-2-B | 서버 역할 | admin 허용, staff/manager 사용자관리 차단, manager 조회 context 허용 | PASS |
| P0-2-C | 계약 경계 | staff 제한 projection, 전체 목록 scope 필수, estimate/package ID 불일치·없는 package는 404 | PASS |
| P0-2-D | 계약 쓰기 | manager 옵션 저장·패키지 생성 및 staff/manager 확정 차단 | PASS |
| P0-2-E | storage 계약 조회 | staff 계약 옵션 조회는 보호된 Next API 사용 | PASS |
| KF-004 | H2 staff 견적 조회 | 읽기 허용된 견적 JSON에서 내부 필드 제거 | KNOWN FAILURE |
| KF-005 | H2 manager storage | 직접 updateEstimate 호출 시 PATCH 방지 | KNOWN FAILURE |
| KF-006 | H2 manager storage | 직접 deleteEstimate 호출 시 DELETE 방지 | KNOWN FAILURE |
| KF-007 | H10 강제 비밀번호 변경 | 서버에서 변경 필수 계정의 일반 관리자 API 접근 차단 | KNOWN FAILURE |
| P0-3-A | 배관 OFF → ON | 원가·고객가 각각 +300,000원, 이익 불변, 상세·고객 행 각 1개 | PASS |
| P0-3-B | 배관 멱등성 | ON → ON, 독립 ON fixture, 12회 반복 토글에서 누적 없음 | PASS |
| P0-3-C | 배관 해제·구버전 | ON → OFF, OFF → OFF, 저장 키 없음은 false, 추가 차감 없음 | PASS |
| P0-3-D | 배관 불변성 | 타 공정 행 직렬화 동일, 원본·costSnapshot 불변, 합계 일치 | PASS |
| P0-3-E | 저장·재조회 | JSON roundtrip 및 실제 이벤트·storage 수정 저장·조회·UI 복원에서 true/false·금액 유지 | PASS |
| DB-1 | 실제 estimates 보안 | staff 실제 내부정보 응답, manager 직접 REST 쓰기 GRANT/RLS | BLOCKED — TEST DB REQUIRED |
| DB-2 | 계정 상태와 직접 DB 경로 | inactive/must_change_password의 실제 REST/RPC 차단 | BLOCKED — TEST DB REQUIRED |
| 2B-1 | 계약·원가 확장 | DB 잠금·트랜잭션·해시·문서 출력·원가 배포 RPC | NOT IN THIS PHASE |

ID 조합 테스트는 package와 estimate의 관계 검증이다. 고객별 소유권/테넌트 RLS 검증을 대신하지 않는다.

## 6. 실제 재현된 Known Failures

### KF-001 — 조회 시 fractional margin 자동 PATCH

- Baseline: C1. 우선순위 P0.
- 재현: targetMargin `0.3`, 정상 customerQuote·원가 스냅샷이 있는 합성 견적을 getEstimate 후 loadEstimateIntoUi로 연다.
- 기대: 조회만으로 updateEstimate/PATCH 금지, 원본과 금액 불변.
- 실제: 자동 repair가 PATCH를 실행한다. 메모리 row의 total_price가 **3,770,000원 → 130,000원**으로 바뀌었다.
- 화면 상태: `오염된 견적 마진 스냅샷 수정 저장 완료`. 이는 합성 fixture의 결과이며 실제 고객 금액 변화가 아니다.
- 관련: `main.js`의 loadEstimateIntoUi → repairCorruptedTargetMarginEstimate → `storage.js`의 updateEstimate.
- 테스트: `tests/os/integration/estimate-read.test.js`.

### KF-002 — 확정 계약 연결도 자동 repair로부터 보호되지 않음

- Baseline: C1. 우선순위 P0.
- 재현: KF-001 견적에 동일 estimate_id의 CONTRACTED 패키지 목록 응답을 연결한다.
- 기대: 확정 연결 견적을 열어도 원본 금액과 row 불변.
- 실제: 여전히 자동 PATCH와 금액 변경이 발생한다. 계약 패키지 자체 변경은 테스트하지 않았다.
- 관련 함수·테스트: KF-001과 동일.

### KF-003 — 일반 수정 저장 시 현장주소 소실

- Baseline: H5. 우선순위 P0.
- 재현: 최신 fixture 조회 후 demolitionFurnitureM을 1500으로 변경하고 실제 handleSaveEstimate("update") 호출.
- 기대: PATCH와 저장 row의 주소 `테스트시 테스트구 123` 유지.
- 실제: 주소가 빈 문자열로 저장된다.
- 관련: `main.js`의 buildEstimateSnapshot/handleSaveEstimate, `storage.js`의 updateEstimate (`estimate.address || ""`).
- 테스트: `tests/os/integration/estimate-read.test.js`.

### KF-004 — staff storage 응답의 내부정보 projection 부재

- Baseline: H2. 우선순위 P0 보안 경계 검증.
- 재현: staff 가짜 세션에서 실제 storage.loadEstimates 호출, 읽기 가능한 내부정보 포함 메모리 REST 응답 제공.
- 기대: 브라우저 반환값에 internalDetails/internalSummary/costTotal/marginRate/costSnapshot 없음.
- 실제: `select=*` 조회 및 estimate_data 병합으로 해당 필드가 그대로 반환된다.
- 관련: `storage.js`의 loadEstimates/normalizeEstimate.
- 테스트: `tests/os/integration/storage-boundaries.test.js`.
- 의미: Repository 수준 projection gap 재현이다. 운영에서 그 row가 staff에게 실제 허용되는지는 **DB verification required**.

### KF-005 / KF-006 — manager storage 직접 쓰기 경계 부재

- Baseline: H2. 각각 우선순위 P0 보안 경계 검증.
- 재현: manager 가짜 세션에서 실제 storage.updateEstimate 또는 deleteEstimate 직접 호출.
- 기대: 읽기 전용 역할에서 PATCH/DELETE 발행 금지.
- 실제: 각각 PATCH/DELETE 요청이 mock으로 전달된다.
- 관련: `storage.js`의 updateEstimate/deleteEstimate.
- 테스트: `tests/os/integration/storage-boundaries.test.js`.
- 의미: 클라이언트 함수의 역할 검사 부재다. UI의 관리자 전용 삭제 제어를 테스트한 것이 아니며, 운영 DB 쓰기 성공이나 RLS 우회를 증명하지 않는다. 실제 쓰기 차단은 **DB verification required**.

### KF-007 — 서버의 must_change_password 검사 부재

- Baseline: H10. 우선순위 P0 접근 경계.
- 재현: Auth 성공 + 활성 admin + must_change_password=true인 가짜 응답으로 실제 사용자관리 GET 호출.
- 기대: 최초 비밀번호 변경 완료 전 일반 관리자 API는 403.
- 실제: GET /api/os/users가 200을 반환한다.
- 관련: `app/api/os/_lib/server.ts`의 getUserContext/requireAdmin, `app/api/os/users/route.ts` GET.
- 테스트: `tests/os/integration/api-boundaries.test.js`.
- 범위: 서버 경계의 재현이며 실제 계정이나 DB 직접 접근은 사용하지 않았다.

## 7. Known Failure 실행 방식

각 Known Failure는 재현을 beforeEach에서 실제 수행하고, 목표 불변조건만 `test.fails`로 검사한다.
재현 준비 오류는 expected failure로 삼키지 않는다. 등록되지 않은 네트워크 요청도 독립적인 afterEach 검사로 실패한다.
skip/todo로 실행을 생략하지 않았다. 잘못된 동작 자체를 정상 기대값으로 고정하지 않았다.

향후 불변조건이 충족되면 test.fails는 예상 밖 성공으로 suite를 실패시킨다. 해당 수정과 함께 Known Failure 표시를 제거하고 일반 PASS 회귀 테스트로 전환해야 한다.
공식 동작: [Vitest test.fails](https://vitest.dev/api/test.html#test-fails), [테스트 환경](https://vitest.dev/guide/environment.html).

## 8. 실행 결과

실제 실행: `npm run test:run`, 종료 코드 0.

| 파일 | 총수 | 일반 PASS | KNOWN FAILURE |
|---|---:|---:|---:|
| estimate-read.test.js | 5 | 2 | 3 |
| storage-boundaries.test.js | 4 | 1 | 3 |
| api-boundaries.test.js | 17 | 16 | 1 |
| pipe-cleaning.test.js | 10 | 10 | 0 |
| pipe-cleaning-workflow.test.js | 1 | 1 | 0 |
| 합계 | **37** | **30** | **7** |

```text
TOTAL=37 PASS=30 KNOWN_FAILURE=7 UNEXPECTED_FAIL=0
SKIPPED=0 FAILED_FILES=0 UNHANDLED_ERRORS=0
```

- `node --check public/os-app/src/main.js`: 통과.
- `git diff --check`: 통과. Git의 기존 LF/CRLF 안내는 코드 오류가 아니다.
- `npm run lint`: 종료 코드 0, error 0, 기존 warning 5, 신규 warning 0.
- 기존 경고: khanstoneBaseCost, lightingText, countertopQuoteText, carpentryCofferLabel, renderQuoteRows의 unused-vars.
- build/E2E/실제 브라우저·운영 DB 검증은 이번 최소 테스트 단계에서 실행하지 않았다.

Suite 성공은 현존 결함이 해결됐다는 뜻이 아니다. 7개 목표 불변조건은 현재 코드에서 여전히 위반된다.

## 9. Production 검증 필요사항과 2B 후속

운영 대신 격리된 테스트 DB에 정책·RPC를 준비한 뒤 다음을 이어서 검증해야 한다.

1. estimates의 실제 RLS, 테이블·컬럼 GRANT, staff 내부 JSON 응답 제한, manager PATCH/DELETE 거부. UI 숨김과 mock 차단을 DB 보안 PASS로 간주하지 않는다.
2. inactive 및 must_change_password 조합의 직접 REST/RPC·서버 API 접근, cost 역할 helper의 활성 상태 검사.
3. C1의 조회/쓰기 분리 및 확정 연결 보호, H5 주소 보존 수정 이후 Known Failure를 일반 회귀 테스트로 전환.
4. 계약 생성·확정 3종 원자성, 중복 confirm, 잠금 트리거, 승인 증적·변경견적, canonical 해시 및 문서 스냅샷 유지.
5. 원가 Draft/Publish/취소/원복 RPC의 권한·트랜잭션·이력 보존.
6. 고객 견적서·계약서·공사사양서 출력에서 내부 원가·해시·actor 비노출 및 저장 견적과 계약 금액 일치.

테스트 DB 준비나 후속 결함 수정은 이번 2A에서 하지 않았다. 실제 고객 견적 6건, 원가 및 사용자 데이터의 운영 현황도 새로 조회하지 않았다.

## 10. 작업물 보존

기존 미추적 `docs/AND_OS_2_0_BASELINE.md`, `supabase/cost_items_v2_3.sql`, `supabase/rfc_003a_user_profiles.sql`은 수정·추가·커밋하지 않았다.
이번 변경은 테스트 구성·fixture·테스트 문서와 최소 named export에 한정한다. 모든 작업물은 미커밋 상태다.

## 11. AND OS 2B-4 Staff Runtime Boundary (2026-10-12)

이 절이 현재 상태다. 위 2A 결과와 Known Failure 기록은 과거 재현 이력으로 보존한다.

### Runtime Architecture

직원은 `storage.js`에서 `/api/os/estimates`와 `/api/os/estimates/[id]`를 사용한다.
세션 확인 전도 안전한 API를 기본 경로로 사용한다. admin/manager는 기존 REST 업무 경로를 유지한다.
클라이언트의 역할 캐시는 경로 선택용일 뿐 보안 판단 근거가 아니다. API는 매 요청마다 Auth 사용자와
profiles.role/is_active/must_change_password를 서버에서 재검증한다. 로컬 RLS candidate는 직원의 직접
estimates SELECT/INSERT/UPDATE/DELETE를 차단한다. 서비스 권한 조회 결과는 서버에서 whitelist로 투영한다.

직원 화면의 계산 미리보기는 `POST /api/os/estimates/preview`를 사용하며 DB 쓰기가 없다.
직원에게 원가를 보내거나 브라우저의 계산값을 신뢰하지 않는다. 응답 세대 번호와 타이머로 늦게 도착한
이전 미리보기가 다른 프로젝트 또는 최신 입력 화면을 덮어쓰지 않게 한다.

### Safe Read Schema

최상위: id, projectName, clientName, phone, clientPhone, address, areaPyeong, total, totalText,
status, savedAt, updatedAt, inputs, customerQuote.

inputs: `public/os-app/src/estimate-inputs.js`의 151개 기존 입력 정의 중 내부 전용 7개를 제외한 144개.
내부 제외값: targetMargin, manualAdjustment, baseCorrection, islandCorrection, homebarCorrection,
countertopCorrection, optionCorrection. 검색 컨트롤과 원가 단가 입력은 스키마에 포함하지 않는다.

customerQuote: projectName, clientName, phone, areaPyeong, savedAt, total, totalText, status, groups.
group: label, total, totalText, items. item: name, amount, amountText.
중첩된 cost/internalMemo/supplier 같은 레거시 필드는 복제하지 않는다. 별도 실측 등의 고객용 amountText는 유지한다.
직원 계약 견적서 preview의 customer_quote 및 QUOTE 문서에도 같은 고객용 whitelist를 적용한다.
확정 문서 원본, 해시, DB 스냅샷은 수정하지 않는다.

### Safe Write Schema And Calculation

직원 요청은 `{ inputs, address? }`만 허용한다. preview만 견적 기준 ID인 estimateId를 추가로 받는다.
알 수 없는 최상위/입력 필드, 내부 입력, 원가 단가, 중첩 객체, 잘못된 선택값과 수치는 400으로 거절한다.
요청 크기는 64,000자, 문자열은 500자로 제한한다. 클라이언트 총액/customerQuote/internalDetails/
internalSummary/costSnapshot/cost_total/margin_rate/profit/author는 제출 대상이 아니다.
PostgREST 오류의 전체 실패 행은 직원 응답에 반사하지 않는다.

Authoritative source: `public/os-app/src/calculator/estimate-core.js`의 순수 계산 코어.
main.js의 calculate 본문, 관련 순수 helper, 고객 공정 그룹화 및 배관 청소 후처리를 필요한 범위만 추출했다.
UI readState는 유지하고 서버용 입력 어댑터는 동일 readState 식을 사용한다. 원가 inputId/itemCode 정의도 공유한다.
함수 원문 대조에서 DOM 어댑터 변경을 제외한 19개 기존 계산 함수에 의도하지 않은 차이가 없었다.
브라우저와 서버 입력 어댑터의 계산 동등성 3종 시나리오와 요청간 원가 컨텍스트 격리를 검증한다.
전체 main.js의 UI/계약/원가 관리 모듈 분리는 수행하지 않았다.

신규 견적은 서버가 운영 cost_price를 조회하고 기존 기본값/가산율/반올림 규칙으로 전체 내부 스냅샷을 만든다.
배포 전 draft 값은 계산에 사용하지 않는다. 기존 견적의 계산 입력 수정은 저장 당시 costSnapshot의 값을 우선한다.
저장 당시 스냅샷에 도배 잡자재가 필요한데 없는 경우 기존 정책대로 혼합 가격 저장을 409로 거절한다.
명시적 원가DB 연결 실패를 성공 저장으로 대체하지 않는다. 원가 로딩과 inactive 항목 처리는 기존 admin 경로와 같은 정책이다.

조회는 재계산/자동 PATCH하지 않는다. metadata/no-op 변경은 기존 내부 금액·스냅샷을 보존한다.
실제 계산 입력이 바뀌면 서버가 내부 상세와 전체 합계를 재생성한다. 기존 author/보호 메타데이터와 현장 주소는 보존한다.
서버 비교는 기존 UI 섹션 게이팅을 반영해 레거시 비활성 체크값이 배관 청소만 수정할 때 다른 공정을 재가격화하지 않게 한다.
PATCH는 updated_at 조건을 사용해 동시 수정 충돌을 409로 반환한다.

배관 청소만 변경하면 기존 전체 저장 스냅샷의 깊은 복사본에 동일 후처리를 사용한다.
직접원가와 고객가 각각 300,000원 증감, 이익 불변, 중복/누적 없음, 다른 공정/원가 스냅샷 불변이다.
직원 미리보기·수정 저장·재조회·고객 견적서·계약 단계가 같은 서버 결과를 사용한다.
미저장 견적 변경 시 계약 미리보기/확정 차단은 기존 동작을 유지한다.

### Verification And Scope

작업 전: regression 51 PASS + KF-004 1; DB Security 99/99 ×2; Integrity 56/56 ×2.
작업 후: regression 57/57 PASS (Known Failure 0), Security 99/99 PASS ×2,
Integrity RUN 1 56/56 PASS, RUN 2 56/56 PASS, staff-boundary 23/23 PASS ×2.
skip/예상 밖 최종 FAIL 0. 기존 warning 5개, 신규 warning 0; lint/build/diff/syntax 통과.

Staff suite: 실제 Next route + 실제 local Supabase Auth/JWT/RLS/REST를 사용한다.
생성, 조회 whitelist/blacklist 재귀 검사, 전체 내부 재계산, metadata 보존, 과거 조회 불변,
배관 청소/레거시 게이팅/수정 저장·재조회, 6종 내부정보 주입 거절, 원가 입력 주입 거절,
직접 REST 4종 우회 차단, 비로그인·비활성·비밀번호 변경 계정, admin/manager 전체 조회,
staff 계약 옵션 조회·저장/3종 preview/confirm 거절을 검증한다.
admin CRUD, manager CRU/delete 거절은 기존 DB Security 99건과 storage 회귀에서 유지한다.
신규 fixture의 정확한 ID와 전용 synthetic 옵션만 정리한다. 각 suite는 직렬 실행하고 DB suite는 두 번 반복한다.

KF-004: **FIXED — local runtime + candidate RLS 기준**.
2단계 로컬 완료: YES. 3단계 모듈 분리 진행 가능: YES (별도 승인 후).
Production 완료 또는 배포 안전 승인으로 확대 해석하지 않는다.

Production 후보 SQL은 기존 `tests/os/db/patches/role-boundaries.PROPOSED.sql`을 그대로 재사용한다.
이번 단계에 신규 DB schema/RLS migration은 추가하지 않았다. 후보 SQL은 운영에 실행하지 않았다.
이 단계에서 Production 네트워크·DB 접근, SQL 실행, 커밋, push, deploy 모두 없다.
공유 코어/새 API/테스트/문서는 미커밋이며 이전 작업물과 제외 SQL 2개는 보존한다.

이번 2B-4에서 변경/추가한 20개 파일:

```text
public/os-app/src/main.js
public/os-app/src/storage.js
public/os-app/src/calculator/estimate-core.js
public/os-app/src/estimate-inputs.js
public/os-app/src/customer-quote.js
app/api/os/estimates/_lib/estimates.js
app/api/os/estimates/route.ts
app/api/os/estimates/[id]/route.ts
app/api/os/estimates/preview/route.ts
app/api/os/contract-packages/_lib/contracts.ts
package.json
tests/os/helpers/os-harness.js
tests/os/integration/storage-boundaries.test.js
tests/os/integration/staff-workflow.test.js
tests/os/unit/shared-calculation.test.js
tests/os/db/staff/runtime.db.test.js
tests/os/db/run.mjs
vitest.db.config.mjs
vitest.staff.config.mjs
docs/AND_OS_2_0_REGRESSION_TESTS.md
```

직원 화면에서 로그아웃 시 표시/로드 견적 캐시와 미리보기 요청도 지워 다음 세션에 이전 견적 객체가 남지 않게 한다.
수동 브라우저/Production E2E 검증은 수행하지 않았다. UI 통합은 실제 main/storage를 로드하는 jsdom 테스트,
API/DB 통합은 실제 Next handler와 격리 Supabase를 호출하는 테스트 결과다.
최종 synthetic estimates/profiles/cost_items/options/packages/documents/changes/approvals/cost_history/publish_logs는 모두 0건,
비활성 public 사용자 트리거도 0개다. 표준사양 seed 같은 스키마 기준 데이터는 fixture 삭제 대상으로 삼지 않았다.

최종 HEAD: 522cbb8 (변경 없음). `git status --short`:

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
?? app/api/os/estimates/
?? docs/AND_OS_2_0_BASELINE.md
?? docs/AND_OS_2_0_REGRESSION_TESTS.md
?? docs/db-baseline/
?? public/os-app/src/calculator/estimate-core.js
?? public/os-app/src/customer-quote.js
?? public/os-app/src/estimate-inputs.js
?? supabase/cost_items_v2_3.sql
?? supabase/rfc_003a_user_profiles.sql
?? tests/
?? vitest.config.mjs
?? vitest.db.config.mjs
?? vitest.integrity.config.mjs
?? vitest.staff.config.mjs
```

server.ts/password/me/package-lock/기준선 문서/원가 캡처/기존 candidate SQL은 이전 단계 작업물이다.
이번 단계에서 되돌리거나 수정하지 않았다. 제외 SQL 2개도 그대로 미추적 상태다.
