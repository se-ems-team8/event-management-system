# Event Management System – Code Coverage Report

**Date:** 6 November 2026  
**Tool:** c8 12.0.0

## Execution command

```powershell
npx c8 --include "backend/src/**/*.js" --reporter=text --reporter=html --reporter=json-summary --reports-dir=coverage/backend node --test --test-force-exit --test-concurrency=1
```

## Backend coverage results

| Metric | Coverage |
|---|---:|
| Statement coverage | 66.45% |
| Line coverage | 66.45% |
| Function coverage | 73.17% |
| Branch coverage | 76.00% |

The instrumented execution completed with 158 passed tests and 0 failed tests.

## Selected component coverage

| Component | Statement coverage |
|---|---:|
| Feedback controller | 98.50% |
| Payment controller | 91.04% |
| Registration controller | 92.91% |
| Report controller | 98.70% |
| Ticket controller | 92.62% |
| Admin routes | 100% |
| Event routes | 100% |
| Registration validators | 100% |
| Admin controller | 9.42% |
| Authentication controller | 48.71% |
| Event controller | 55.49% |

## Generated evidence
- `coverage/backend/index.html`
- `coverage/backend/coverage-summary.json`
- `coverage/backend/src/`

## Conclusion
The measured backend statement coverage is 66.45%, function coverage is 73.17%, and line coverage is 66.45%. Additional tests could improve coverage in the admin, authentication and event controllers. Coverage measures execution of source constructs and does not independently establish correctness.