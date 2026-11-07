# Event Management System – Branch Coverage Report

**Date:** 6 November 2026  
**Tool:** c8 12.0.0

## Objective
Measure the proportion of backend conditional branches exercised during automated testing.

## Results

| Metric | Result |
|---|---:|
| Branch coverage | 76.00% |
| Statement coverage | 66.45% |
| Function coverage | 73.17% |
| Line coverage | 66.45% |
| Tests passed | 158 / 158 |

## Selected component branch coverage

| Component | Branch coverage |
|---|---:|
| Report controller | 94.28% |
| Ticket controller | 85.96% |
| Feedback controller | 84.21% |
| Registration controller | 82.97% |
| Event controller | 77.77% |
| Authentication middleware | 74.19% |
| Payment controller | 72.72% |
| Authentication controller | 48.00% |
| Upload middleware | 50.00% |

## Analysis
Report, ticket, feedback and registration controllers demonstrate relatively strong branch coverage. Authentication and upload-related components provide opportunities for additional tests covering alternate inputs, error handling and authorization paths.

Branch coverage measures execution of conditional paths; it does not represent the percentage of project requirements completed.

## Conclusion
The backend branch coverage achieved is 76.00%. The detailed HTML report is available at `coverage/backend/index.html` and provides supporting source-level evidence.