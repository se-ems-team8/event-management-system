# Event Management System — Code Coverage Report

- **Coverage tool:** c8 12.0.0
- **Recorded run date:** 6 November 2026

## EMS-TEST-04 Completion Summary

EMS-TEST-04 has been completed. The code coverage and branch coverage reports have been generated. The HTML and JSON coverage artifacts are available in docs/coverage/. The backend automated test suite completed successfully with 158 passed and 0 failed. The frontend production build completed successfully. All five required testing documentation deliverables have been prepared.

**STATUS: COMPLETED**

## Results

| Metric | Coverage | Covered / total |
|---|---:|---:|
| Statements | **66.45%** | 2,615 / 3,935 |
| Lines | **66.45%** | 2,615 / 3,935 |
| Functions | **73.17%** | 60 / 82 |
| Branches | **76.00%** | 361 / 475 |

These results provide a measurable view of backend code exercised by the archived automated run. Strong statement coverage was recorded in the feedback, payment, registration, report and ticket controllers, as well as admin/event routes and registration validators.

| Component | Statement coverage |
|---|---:|
| Report controller | 98.70% |
| Feedback controller | 98.50% |
| Registration controller | 92.91% |
| Ticket controller | 92.62% |
| Payment controller | 91.04% |
| Admin routes | 100% |
| Event routes | 100% |
| Registration validators | 100% |
| Event controller | 55.49% |
| Authentication controller | 48.71% |
| Admin controller | 9.42% |

## Coverage deliverables

- [HTML coverage report](coverage/backend/index.html)
- [JSON coverage summary](coverage/backend/coverage-summary.json)
- Source-level HTML views under `docs/coverage/backend/src/`

The JSON totals match the percentages above. The archived c8 worker files carry 7 November timestamps, while the report records 6 November; the JSON also references an original source clone. Accordingly, this is presented as the saved historical coverage snapshot, not as a new coverage run against the current checkout. The current checkout's backend suite was separately rerun successfully: **158 passed, 0 failed** ([TAP evidence](testing/EMS-TEST-04/automated-tests.tap)).

## Recorded command

```powershell
npx c8 --include "backend/src/**/*.js" --reporter=text --reporter=html --reporter=json-summary --reports-dir=coverage/backend node --test --test-force-exit --test-concurrency=1
```

Coverage measures execution of instrumented code and complements, but does not replace, functional or system-level validation.