# Event Management System – Updated Test Case Document

**Date:** 6 November 2026

## Registration workflow update

The EMS retains the external Google Form URL. Attendees must confirm that they submitted the external form before completing EMS registration. The backend validates `externalFormSubmitted: true` and stores the confirmation in `external_form_submitted`.

**Limitation:** EMS records the attendee's declaration. It cannot independently verify the external Google Form submission because the project does not have access to its responses or a configured response API.

## Updated test cases

| ID | Test scenario | Expected result |
|---|---|---|
| TC-REG-001 | Valid registration with external-form confirmation | Registration succeeds and ticket is generated |
| TC-REG-002 | Invalid event ID or request payload | Request rejected before database access |
| TC-REG-003 | Missing or invalid external-form confirmation | Validation rejects request |
| TC-REG-004 | Invalid authenticated attendee ID | Request rejected |
| TC-REG-005 | Event does not exist | Not-found response |
| TC-REG-006 | Cancelled, postponed, unpublished, closed or started event | Registration rejected |
| TC-REG-007 | Duplicate attendee/event registration | Duplicate rejected |
| TC-REG-008 | Event capacity exhausted | Registration rejected |
| TC-REG-009 | Concurrent requests for final place | Capacity is not exceeded |
| TC-REG-010 | Database failure during registration | Transaction rolled back |
| TC-REG-011 | Notification storage failure | Successful registration is retained |
| TC-REG-012 | Registration migrations | Required constraints and columns verified |

Other automated test areas include authentication, event management, feedback, payments, notifications, audit logging, reports, tickets, QR validation and check-in.

**Execution:** 158 tests passed, 0 failed. Registration-specific tests: 18 passed, 0 failed.

Manual acceptance, usability, penetration and live performance tests are not claimed as completed by this automated test evidence.