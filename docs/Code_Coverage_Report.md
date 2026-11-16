# Event Management System — Code Coverage Report

- **Coverage tool:** c8 12.0.0
- **Recorded run date:** 15 November 2026

## EMS-TEST-04 Completion Summary

EMS-TEST-04 has been completed. The backend automated test suite was executed successfully against the current project checkout.

The latest execution completed with **231 passed and 0 failed tests**. Updated HTML and JSON coverage reports were generated and saved under `docs/coverage/`.

The coverage results provide measurements for statements, lines, functions and conditional branches across the backend application.

**STATUS: COMPLETED**

## Results

| Metric | Coverage |
|---|---:|
| Statements | **85.51%** |
| Lines | **85.51%** |
| Functions | **90.24%** |
| Branches | **82.64%** |

### Test execution summary

| Metric | Result |
|---|---:|
| Total tests | 231 |
| Passed | 231 |
| Failed | 0 |
| Skipped | 0 |
| Execution time | Approximately 32.93 seconds |

### Component-wise statement coverage

| Component | Statement coverage |
|---|---:|
| Admin controller | 98.88% |
| Report controller | 98.70% |
| Feedback controller | 98.50% |
| Notification controller | 100% |
| Registration controller | 92.91% |
| Ticket controller | 92.62% |
| Payment controller | 91.04% |
| Authentication controller | 88.29% |
| Audit controller | 86.66% |
| Event controller | 55.49% |
| Authentication middleware | 72.65% |
| Upload middleware | 71.05% |
| Admin routes | 100% |
| Event routes | 100% |
| Notification routes | 100% |
| Registration validators | 100% |
| Report validators | 100% |

## Coverage Deliverables

- [HTML coverage report](coverage/index.html)
- [JSON coverage summary](coverage/coverage-summary.json)
- Source-level HTML coverage views under `docs/coverage/`

The coverage reports represent the latest c8 execution performed against the current project checkout on 16 November 2026.

The backend test suite includes tests for authentication, administration, event management, registration, payments, ticket generation, notifications, reporting, database transactions, validation and error handling.

## Recorded command

```powershell
npx c8 --include "backend/src/**/*.js" --reporter=text --reporter=html --reporter=json-summary --reports-dir=docs/coverage node --test --test-force-exit --test-concurrency=1
```

Code coverage measures the extent to which instrumented code is executed during testing. Statement, line, function and branch coverage provide complementary measurements of test thoroughness.

The current results show 85.51% statement and line coverage, 90.24% function coverage and 82.64% branch coverage. These measurements help identify areas where additional test cases may improve coverage further.