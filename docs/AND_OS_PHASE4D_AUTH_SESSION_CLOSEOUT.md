# Phase 4D Auth Session Refresh Close-out

## Finding

The deployed client at bee0f90 loaded its stored access token and immediately
called /api/os/me. It did not use the refresh token, check expiry, or retry a
401. The missing refresh lifecycle is a confirmed code defect. The exact
expiration/revocation reason for the historical token was not inspected.

Fresh login and immediate reload succeeded for admin, manager, and staff.
Migration-only token invalidation must not be asserted as the sole cause.

## Production Evidence (2026-10-14 KST)

Vercel runtime log, deployment dpl_Cr15FNr1zKXpCr85NSnbhDqh23oQ:

| Time | Method | Path | Status |
| --- | --- | --- | --- |
| 16:39:18.72 | GET | /api/os/me | 401 |
| 16:42:36.01 | GET | /api/os/me | 200 |
| 16:43:27.45 | GET | /api/os/me | 200 |

Supabase logs separately recorded /auth/v1/user 403 and /auth/v1/logout 403
around the failed restore. These are authentication failures, not evidence
that canonical RLS or account permissions should be relaxed.

No token, refresh token, password, or cookie values were captured.

## Minimal Client Change

- Before authenticated API/REST/RPC transport, renew a session within 30
  seconds of expiry. Renewed expiry derives from expires_in when needed.
- Legacy stored sessions without expiry metadata recover through one 401
  refresh/retry. No refresh/retry is performed for permission 403, 5xx,
  network failures, or an already retried request.
- Concurrent refresh requests share one token rotation. Rotated tokens are
  persisted using the existing sessionStorage mechanism.
- Logout clears local session and verified identity before awaiting the
  logout request. A late refresh cannot overwrite logout or a newer login.
- Invalid refresh credentials fail closed. Temporary refresh failures use a
  generic message and do not expose response data or credential values.
- Refresh is request-driven, not a background keepalive timer. Existing
  restore order is unchanged, but /api/os/me transport awaits refresh first.
- No database, schema, SQL, server API, RLS, calculations, or snapshot changes.

Protocol reference: https://supabase.com/docs/guides/auth/sessions

## Synthetic Reproduction and Verification

- Before the fix: new auth suite 1/12 PASS, 11/12 FAIL; expired admin/manager/
  staff sessions sent the stale token to /me rather than refreshing first.
- After the fix: auth suite 16/16 PASS, including all three roles, legacy
  401 recovery, one-retry limit, 403 denial, invalid refresh, near expiry,
  parallel requests, logout/new-login races, login expiry, and admin REST.
- Regression: 723/723 PASS; Known Failure / Unexpected Fail / Skip = 0.
- Initial full run: 718/719 with one existing OLD/NEW document comparison
  crossing the minute boundary (16:58 versus 16:59). No document code was
  changed; the subsequent full run passed. This timing-sensitive test is a
  residual test reliability issue, not silently discarded evidence.
- Staff Boundary: isolated local DB 23/23 PASS x2; Production was not used.
- Syntax, git diff --check, lint, build PASS. Five existing lint warnings,
  zero new lint warnings. Git CRLF notices are not lint failures.

## Release Gate

Local verification is PASS. Cache key: and-os-55.
Production close-out requires confirming this fix-forward deployment and
normal authenticated /api/os/me/restore behavior. Synthetic expiry tests do
not claim that a real Production token was edited or force-expired.

Canonical Production DB and migration history must remain untouched.
