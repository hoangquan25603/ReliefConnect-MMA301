# Core API integration test results

Status: **PASS — 169 assertions across 7 groups**. Run on a fresh, isolated SQLite database at `127.0.0.1:5094`, not against the original hosted API or demo/user data. The test starts its own server and stops it on completion. No access tokens, passwords or password reset codes are stored in the result report.

Executable test: `core-smoke.mjs`. Sanitized result: `core-test-results.json`.

| Area | Verified |
| --- | --- |
| Authentication and authorization | All five seeded roles, anonymous 401, forbidden role 403, invalid login, current DB identity |
| Session lifecycle | Requester-only registration despite elevated role in input, duplicate/weak-password rejection, refresh rotation, old access/refresh rejection, logout revocation |
| Warehouses and inventory | Create/update/read, invalid coordinates, duplicate catalog item, negative/zero/fractional quantity rejection, permissions, transaction history, threshold/search filters |
| Stock integrity | Overdraw leaves stock/history unchanged, simultaneous exports allow only one debit, transfer ledger on both ends, simultaneous transfers conserve total stock and create one target row, failed transfers create no target, inactive warehouse blocks stock operations, unit change blocked after transactions |
| User administration | Profile updates, role change revokes tokens, disabled users cannot authenticate, activation, self-demotion/self-lockout prevention |
| Password recovery | Development email pickup generated, wrong code rejected, verified code exchanges for one-time reset session, successful password reset, reset replay rejection, password change revokes session |
| AI | 72 authored training examples, 12/12 separate authored smoke texts classified as expected, normalized score distribution, human review flag, unknown input returns no-evidence response, empty/oversize inputs rejected |

The AI result is **not a representative accuracy benchmark**. Both training and smoke examples are small authored datasets; real deployment needs independent evaluation and human review. See `DisasterReliefSystem.API/AI/README.md` for method and limitations.

Reproduce from this repository's `backend` folder:

```powershell
dotnet build .\DisasterReliefSystem.API\DisasterReliefSystem.API.csproj
node .\tests\core-smoke.mjs
```

Node 22+ and .NET 10 SDK are needed to build/run the tests. The optional `CORE_TEST_PORT` and `CORE_API_DLL` environment variables select an isolated port or already-built DLL. Local network access must be permitted. Generated test database, mail and logs remain under the ignored `.local` folder and are excluded from the distributable package.

Cross-module allocation regression is covered separately in `workflow-smoke.mjs`: allocated inventory cannot be renamed, recategorized or have its unit changed before a cancellation restores stock; changing only the minimum stock threshold remains allowed.
