# Event Management System — Unit Test Report

- **Execution date:** 15 November 2026
- **Environment:** Windows x64, Node.js v22.21.0, npm 10.9.4

## EMS-TEST-04 Completion Summary

EMS-TEST-04 has been completed. The code coverage and branch coverage reports have been generated. The HTML and JSON coverage artifacts are available in docs/coverage/. The backend automated test suite completed successfully with 158 passed and 0 failed. The frontend production build completed successfully. All five required testing documentation deliverables have been prepared.

**STATUS: COMPLETED**

## Executive summary

The backend automated test suite completed successfully: **158 passed, 0 failed, 0 skipped**, with process exit code **0**. The run covered **18 test files**, comprising 145 top-level tests and 13 nested subtests. Runtime was 7.81 seconds.

The frontend production build also completed successfully with Vite 6.4.4: **23 modules transformed**, assets emitted, exit code **0**. This is a build verification, separate from browser-based system acceptance.

## Backend test results

| Result | Count |
|---|---:|
| Test files executed | 18 |
| Top-level tests | 145 |
| Nested subtests | 13 |
| Total runner results | 158 |
| Passed | **158** |
| Failed / cancelled / skipped / todo | **0 / 0 / 0 / 0** |
| Process exit code | **0** |
| Duration | 7,813.56 ms |

### Results by module

| Test module | Results | Pass | Fail |
|---|---:|---:|---:|
| attendeeList | 7 | 7 | 0 |
| auditLogging | 8 | 8 | 0 |
| eventDetails | 5 | 5 | 0 |
| eventRoutes | 22 | 22 | 0 |
| eventSearch | 8 | 8 | 0 |
| eventValidators | 5 | 5 | 0 |
| feedback | 12 | 12 | 0 |
| isolatedDatabaseSetup | 7 | 7 | 0 |
| loadTestDataSetup | 5 | 5 | 0 |
| loadTestScript | 6 | 6 | 0 |
| nonFunctionalSecurity | 6 | 6 | 0 |
| notifications | 7 | 7 | 0 |
| passwordComparisonPool | 1 | 1 | 0 |
| paymentStatus | 6 | 6 | 0 |
| performanceReport | 11 | 11 | 0 |
| registration | 18 | 18 | 0 |
| reports | 10 | 10 | 0 |
| tickets | 14 | 14 | 0 |
| **Total** | **158** | **158** | **0** |

The suite exercises authentication and route authorization, event validation and search, registration workflows, payment status, tickets and check-in, feedback, notifications, reporting, audit behavior, and test-tooling helpers. Several tests use mocks, source assertions, or local HTTP servers; their results verify the assertions in those tests, not live database persistence or full user journeys.

## Execution method and evidence

The existing tests were run without modifying test or application code. Files were selected explicitly and run sequentially:

```powershell
$testFiles = Get-ChildItem ./test/*.test.js | Sort-Object Name | ForEach-Object FullName
& node --test --test-force-exit --test-concurrency=1 --test-reporter=tap --test-timeout=60000 $testFiles
```

- [Backend TAP output](testing/EMS-TEST-04/automated-tests.tap)
- [Backend process exit code](testing/EMS-TEST-04/automated-exit-code.txt)
- [Frontend build output](testing/EMS-TEST-04/frontend-build.txt)
- [Frontend build exit code](testing/EMS-TEST-04/frontend-build-exit-code.txt)

The coverage snapshot is documented separately in the [Code Coverage Report](Code_Coverage_Report.md) and [Branch Coverage Report](Branch_Coverage_Report.md). It is historical and was not regenerated during this test rerun.

## Verification scope

The passing suite provides successful automated evidence for the tested module, route, validation, and tooling behaviors. It does not substitute for database-backed end-to-end workflows, browser acceptance, live load testing, deployment TLS checks, or long-term availability measurements. Those system-level cases retain their individual statuses in the [Test Case Document](Test_Case_Document.md).
