# AND OS Document Output Standard

Phase 3G local presentation baseline, 2026-10-13. Source baseline: `21fd8eb`.
Scope: customer QUOTE / CONTRACT / SPEC and existing standalone customer quote print.
No calculation, price/cost/margin, snapshot/hash, stored payload, API, DB or role policy changes.

## Current Source Map

| Document | Sections / fields | Source / legacy behavior |
|---|---|---|
| Standalone quote | project, area, saved date, trade totals, customer items, final amount, existing VAT/explanatory notes and company footer | customerQuote only; existing printGroupLabels retained; no internalDetails |
| Package QUOTE | contract identity, project/site/area/customer/contact, amount, trade/items/subtotals and notes | contractPrintInfo reads contract_info + estimate_snapshot.customer_quote; existing totalAmount fallback retained |
| CONTRACT | identity, parties, basic information, amount/VAT, saved payment table, 48 clauses, signature/date | CONTRACT generated_sections takes priority over current snapshot; parties / parties_info legacy fallback retained |
| SPEC | identity, work category, item, quantity, unit, grade, specification, changed specification | spec_snapshot only; item_name / standard_item_name and existing empty-state fallbacks retained |

- Contract fixed clauses remain exactly the existing 313-line array with 48 articles.
- Saved fixed_term_lines override current terms when present, including legacy saved versions.
- Payment label/ratio/amount/due_basis keep existing nullish fallback and explicit zero/empty semantics.
- Contractor uses saved CONTRACT generated_sections.parties when present; current company values never replace it.
- Existing conditions/clauses are not newly evaluated or rewritten by the print layer.
- Customer documents enumerate approved printable fields, never arbitrary snapshot JSON or internal records.

## Shared Design Layer

- `public/os-app/document-print.css` loads after styles.css and scopes document rules to print media and the print sheet.
- `document-print.js` supplies only customer group/item/subtotal markup for both quote paths.
- Existing internal estimate/purchase print renderers and screen design are unchanged.
- The standard can be reused by a future change quote renderer without creating that feature in Phase 3G.

## A4 And Typography

- Named page `and-customer`: A4 portrait, 210 x 297 mm. Margins: top/left/right 14 mm, bottom 17 mm.
  Only customer document articles select it; legacy internal/purchase outputs retain their existing page rules.
- Korean font stack: Malgun Gothic, Apple SD Gothic Neo, Arial, sans-serif.
- Title: 22 pt / 1.3. Section: 12 pt / 1.4. Body: 10 pt / 1.55.
- Tables: 9 pt / 1.5. SPEC: 8.5 pt. Legal body: 9.5 pt / 1.65.
- Brand/identity/help/footer: 7-9 pt. Article headings: bold 10 pt; chapters: 11 pt; terms title: 14 pt.
- Letter spacing is zero. No viewport-scaled text, decorative color panels or background-graphics requirement.
- White background, dark text, gray rules. Tables/section order remain distinguishable with background printing disabled.
- Standalone quote retains existing company footer text but replaces its dark marketing-style print background with monochrome document styling.

## Hierarchy / Spacing / Tables

- Document identity -> existing metadata -> section -> trade subtotal -> item -> final total.
- Header uses block/table layout rather than fragile nested flex/grid combinations in paged print.
- Sections: 5 mm gap. Header: 4 mm bottom padding / 6 mm following gap.
- Table cells: 2 mm vertical / 1.8 mm horizontal padding; half-point gray borders.
- Fixed-width tables use `overflow-wrap: anywhere` for long Korean text, addresses and unbroken identifiers.
- Numbers are right-aligned with tabular numerals; ordinary descriptions and definition values are left-aligned.
- QUOTE columns: trade 17%, item 63%, amount 20%.
- Payment columns: label 18%, due basis 44%, ratio 12%, amount 26%.
- SPEC columns: trade 10%, item 16%, quantity 7%, unit 6%, grade 13%, standard 24%, changed 24%.
- Monetary strings already stored in customerQuote keep their display priority; existing money functions provide fallback.
- No quantity/spec/note/discount/VAT field is fabricated when the source does not provide it.
- The standalone quote now prints existing customer items in addition to its unchanged trade totals.

## Header / Footer / Signature

- ANTNEST DESIGN document identity is common to the package documents; standalone quote also shows AND identity.
- Existing contract number/project/date are retained. Existing standalone project/area/saved date remain unchanged.
- Header is not unnecessarily repeated on every page.
- Flow footer shows the existing document/contract identity and available public contractor company/contact/address values.
- CONTRACT footer uses the same saved contractor source as the party table, not current operational company settings.
- CSS paged-media margin boxes repeat a small AND identity and actual `page / pages` on physical pages.
- Old `contract-page` article counter is suppressed; it counted documents, not printed pages.
- Signature intro/date stay with the two signature boxes where possible. Signature boxes are unsplit table cells with real signing space.
- No electronic signature implementation or stored signature data added.

## Page Breaks

- Each of the three documents starts on a separate page in CONTRACT -> QUOTE -> SPEC order.
- The last article does not force an extra page.
- `thead` repeats on table continuations. Bounded rows avoid splitting; trade subtotal stays with its first item.
- Long table bodies/sections are allowed to span pages; do not apply avoid to the entire table/48-clause body.
- Section/chapter/article headings use break-after avoid; legal paragraphs use widows/orphans 3 and natural continuation.
- A pathological single row taller than an A4 content area cannot be guaranteed unsplit by CSS; do not hide or truncate it.
- Native browser margin-box support is required for CSS page numbering. The verified engine is Chromium/Edge 155.
- Non-Chromium browsers may render page numbering differently; validate their actual print output before adopting them.

## Test And Artifact Policy

- `npm run test:documents`: actual headless Chromium/Edge PDF suite, synthetic fixtures only, no app server/auth/DB.
- Tooling uses available Playwright, pdf-lib, PDF.js/canvas and Python pdfplumber from the bundled workspace runtime.
  No browser/runtime dependency is added to production.
- Default channel: msedge. Override with AND_OS_PRINT_CHANNEL. PDF Python override: AND_OS_PDF_PYTHON.
  A missing tool fails the suite instead of skipping visual QA.
- All fixture HTML/PDF/PNG/bounding boxes/report live under ignored `tests/os/document-output/artifacts/`.
- Binary artifacts and real customer/business records are not committed.
- Every physical PDF page is rasterized and checked for ink; representative first/last/continuation/signature pages are visually inspected.
- Poppler rasterization omitted some header transforms in a generated Chromium PDF. Text/source were intact;
  the final review images use PDF.js, independently crosschecked against browser print-media screenshots.
- Bounding-box checks cover page boundaries and reserved footer area. Row start/end markers detect page splits and missing rows.
- Legal text checks require every saved fixed_term_line to exist in extracted PDF text.
- Existing OLD HTML golden artifacts are retained. Only changed customer print markup is compared through semantic extraction;
  non-print DOM, internal prints, controls and stored object identity remain exact tests.

## Phase 3G QA Results

| Synthetic case | Pages | Result |
|---|---:|---|
| Package quote small / 3 items | 1 | PASS |
| Package quote normal / 55 items | 3 | PASS |
| Package quote large / 200 long items | 21 | PASS |
| Full saved 48-article contract | 13 | PASS |
| Contract long fields/payment/synthetic clause | 15 | PASS |
| SPEC small / 3 items | 1 | PASS |
| SPEC large / 120 long items | 25 | PASS |
| Combined 3 documents / 55 items | 20 | PASS |
| Standalone quote small | 1 | PASS |

The long cases intentionally repeat extreme synthetic text; page counts are stress evidence, not typical business document lengths.
Automated checks: overflow/clipping, orphan heading, split test row, blank page, footer collision and UI control leakage: 0.
Visual QA includes all document types, final signature area and combined-document boundaries.
Regression: 702/702 PASS (existing 687 + 15 new document tests).
Staff Boundary: 23/23 PASS x2. Known Failure / Unexpected Fail / Skip: 0.
Lint/build/syntax/diff PASS; existing lint warnings 5, new 0.
The Node MODULE_TYPELESS_PACKAGE_JSON notice also occurs in prior module scripts; no package type conversion is made.
DB suites not separately repeated: no SQL/DB/API/storage/snapshot-generation semantic changes.

## PHASE 4 MIGRATION REQUIREMENT

No DB/schema change is required to deliver these layouts.
Optional future decisions, not implemented or migrated here:

- An independent customer-facing quotation number: no such printable field is invented from private estimate/package IDs.
  Determine whether an existing approved public field suffices before creating a new persisted field.
- Enriching standalone customerQuote with party/site/contact identity, if every standalone PDF must contain that information.
  Prefer an existing allowed snapshot projection; only propose schema changes if current fields cannot supply it.
- Persisted print-style revision/reproducibility: existing template/rule versions remain untouched.
  A separate presentation revision would need an approved retention/versioning policy, not a silent hash-target change.
- No new company/project/spec field is needed; missing optional fields remain absent or keep existing fallback values.

Phase 3G is a local presentation checkpoint. Push, deploy, Production migration and operational data writes are not performed.
