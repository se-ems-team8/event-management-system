# Event Management System — Unit Test Report

- **Execution date:** 15 November 2026
- **Environment:** Windows x64, Node.js v22.21.0, npm 10.9.4

## EMS-TEST-04 Completion Summary

EMS-TEST-04 has been completed. The backend automated test suite was executed successfully against the current project checkout. The latest execution completed with **231 passed and 0 failed tests**.

Updated HTML and JSON code coverage and branch coverage reports were also generated under `docs/coverage/`.

**STATUS: COMPLETED**

## Executive summary

The backend automated test suite completed successfully: **231 passed, 0 failed, 0 skipped**, with no reported test failures. The test suite covered backend controllers, middleware, routes, services, validators, database transaction handling, security-related behavior and supporting test utilities.

The execution duration was approximately **32.93 seconds**.

The latest c8 coverage measurements were:

- Statement coverage: **85.51%**
- Line coverage: **85.51%**
- Function coverage: **90.24%**
- Branch coverage: **82.64%**

## Backend test results

| Result | Count |
|---|---:|
| Total tests | 231 |
| Passed | **231** |
| Failed | **0** |
| Cancelled | **0** |
| Skipped | **0** |
| Todo | **0** |
| Execution duration | Approximately 32,930 ms |

### Results by module

| Test module / area | Results |
|---|---|
| Admin controller | 37 |
| Attendee list and audit logging | 8 |
| Authentication controller | 17 |
| Event details and event routes | 20 |
| Event search and validation | 13 |
| Feedback | 12 |
| Isolated database and load-test tooling | 18 |
| Non-functional security | 6 |
| Notifications | 19 |
| Password comparison pool | 1 |
| Payment status | 6 |
| Performance reporting | 11 |
| Registration | 18 |
| Reports | 10 |
| Tickets | 14 |
| **Total** | **231** |

*Note: The area-wise figures above are a grouping of test results by functional area, not a separately recorded Node.js test-file breakdown.*

The suite exercises authentication and authorization, event management, administration, registration, payment status, ticket generation and check-in, feedback, notifications, audit logging, reporting, validation, transaction handling and test-tooling functionality.

Several tests use mocks, source assertions or local HTTP servers. Their results verify the assertions in those tests and should not be interpreted as proof of every live database workflow or complete browser-based user journey.

## Execution method and evidence

The backend automated test suite was executed with Node.js test runner and c8 coverage instrumentation.

**Recorded coverage command:**

```powershell
npx c8 --include "backend/src/**/*.js" --reporter=text --reporter=html --reporter=json-summary --reports-dir=docs/coverage node --test --test-force-exit --test-concurrency=1
```

- HTML coverage report: `docs/coverage/index.html`
- JSON coverage summary: `docs/coverage/coverage-summary.json`

The terminal output recorded:

- 231 tests
- 231 passed
- 0 failed
- 0 skipped
- Exit code 0

## Verification scope

The passing automated suite provides evidence for the tested backend module, route, validation, security and tooling behaviors.

It does not replace database-backed end-to-end workflows, browser acceptance testing, live load testing, deployment TLS verification or long-term availability measurements. Those system-level cases should retain their individual execution statuses in the Test Case Document.

The latest code and branch coverage measurements are documented separately in the Code Coverage Report and Branch Coverage Report.