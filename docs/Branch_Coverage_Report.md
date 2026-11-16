# Event Management System — Branch Coverage Report

- **Coverage tool:** c8 12.0.0
- **Recorded run date:** 6 November 2026

## EMS-TEST-04 Completion Summary

EMS-TEST-04 has been completed. The code coverage and branch coverage reports have been generated. The HTML and JSON coverage artifacts are available in docs/coverage/. The backend automated test suite completed successfully with 158 passed and 0 failed. The frontend production build completed successfully. All five required testing documentation deliverables have been prepared.

**STATUS: COMPLETED**

## Results

| Metric | Coverage |
|---|---:|
| Branches | **76.00%** |
| Statements | **66.45%** |
| Lines | **66.45%** |
| Functions | **73.17%** |

The archived JSON summary confirms **361 of 475 branches covered**. Strong branch results were recorded in the report, ticket, feedback and registration controllers.

| Component | Branch coverage |
|---|---:|
| Report controller | 94.28% |
| Ticket controller | 85.96% |
| Feedback controller | 84.21% |
| Registration controller | 82.97% |
| Event controller | 77.77% |
| Authentication middleware | 74.19% |
| Payment controller | 72.72% |
| Upload middleware | 50.00% |
| Authentication controller | 48.00% |

## Coverage deliverables

- [HTML coverage report](coverage/backend/index.html)
- [JSON coverage summary](coverage/backend/coverage-summary.json)

The archived c8 worker files carry 7 November timestamps, while this report records 6 November; the JSON also references an original source clone. The figures are therefore identified as the saved historical snapshot, not as a fresh measurement of the current checkout. The backend test suite was separately rerun from the current checkout with **158 passed, 0 failed**; its log is available at [automated-tests.tap](testing/EMS-TEST-04/automated-tests.tap).

Branch coverage describes execution of conditional paths and is one measure of test thoroughness; it is considered alongside statement, line and function coverage and the broader test-case register.