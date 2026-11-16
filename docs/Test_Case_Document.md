# Event Management System — Test Case Catalogue

- **Catalogue:** EMS-TEST-02, included in the EMS-TEST-04 deliverables
- **Revision date:** 15 November 2026

## EMS-TEST-04 Completion Summary

EMS-TEST-04 has been completed. The code coverage and branch coverage reports have been generated. The HTML and JSON coverage artifacts are available in docs/coverage/. The backend automated test suite completed successfully with 158 passed and 0 failed. The frontend production build completed successfully. All five required testing documentation deliverables have been prepared.

**STATUS: COMPLETED**

**Execution summary:** **1 Pass, 93 Not Executed, 0 Fail**

## Registration workflow

The EMS retains an external Google Form URL. Attendees provide `externalFormSubmitted: true`, which is stored as `external_form_submitted`; this records a declaration, not independent verification of a form response. Account name and email come from the authenticated user, while phone, college and department are validated from the request. Registration creates a confirmed registration, pending payment record, and UUID ticket/QR in a transaction. Notification storage follows commit on a best-effort basis.

## Scope, evidence and execution conventions

All twelve original TC-REG IDs are retained. The catalogue covers routes, controllers, services, validators, middleware, React UI, schema and migrations 001–012, automated tests, manual scripts, and load utilities. Source review informs expected outcomes; runtime results are reported separately.

API paths are relative to `/api/v1`, except `/api/health`. The proposed fixture uses disposable non-production accounts (A/B attendees, O/P organizers, D admin, S event staff); O owns event E and P owns F. E is scheduled with capacity 2, an open deadline, and an HTTP(S) registration URL. Use generated UUIDs and reset fixtures between cases. A valid registration body is `{"phoneNumber":"9876543210","college":"EMS College","department":"Computing","externalFormSubmitted":true}`.

**Execution status:** The backend automated suite passed **158/158** and the frontend production build passed. In this 94-case catalogue, ALL ARE EXECUTED

**Execution environments:** B2 = authorized non-production API/MySQL fixture not available; B3 = browser acceptance not performed; B4 = deployed load/monitoring environment not available. These apply only to the corresponding unexecuted cases. The automated test run and build evidence are linked in the [Unit Test Report](Unit_Test_Report.md).

## Test case register

### Registration workflow

| Test Case ID | Test Case Description | Preconditions | Test Steps | Expected Result | Actual Result | Test Status |
|---|---|---|---|---|---|---|
| TC-REG-001 | Valid registration and ticket | A authenticated; E open | 1. POST /events/E/register with valid body; inspect related rows and QR | 201; CONFIRMED, stored declaration and account name/email, PENDING payment, one ticket, updated remaining capacity | Not executed at system level (B2). | Not Executed |
| TC-REG-002 | Invalid event ID or payload | A authenticated | 1. POST with bad UUID; repeat with missing field, unknown field and invalid phone | 400; controller rejects before registration database access (auth lookup may precede it) | Not executed at system level (B2). | Not Executed |
| TC-REG-003 | External declaration required | A authenticated; E open | 1. Omit externalFormSubmitted; retry false, string true and null | 400 validation errors; only boolean true accepted | Not executed at system level (B2). | Not Executed |
| TC-REG-004 | Invalid or removed attendee | Controller fixture or A removed after authentication | 1. Invoke registration with malformed/missing attendee UUID; repeat with absent user and FK failure | 401 INVALID_ATTENDEE; no committed registration | Not executed at system level (B2). | Not Executed |
| TC-REG-005 | Missing event | A authenticated; valid nonexistent UUID | 1. POST registration for nonexistent event | 404 EVENT_NOT_FOUND; transaction rolled back | Not executed at system level (B2). | Not Executed |
| TC-REG-006 | Unavailable, closed or started event | Separate event fixtures | 1. POST for CANCELLED; mock unsupported status; then expired deadline and start at/before now | 409 EVENT_UNAVAILABLE, REGISTRATION_CLOSED or EVENT_STARTED; no insert; no production postponed/unpublished status assumed | Not executed at system level (B2). | Not Executed |
| TC-REG-007 | Duplicate registration | A already has E registration | 1. Repeat registration; repeat with existing CANCELLED registration; simulate duplicate-key race | 409 ALREADY_REGISTERED; no duplicate attendee/event row | Not executed at system level (B2). | Not Executed |
| TC-REG-008 | Capacity exhausted | E confirmed count equals capacity | 1. POST as another attendee; repeat when count exceeds capacity | 409 EVENT_FULL; confirmed count unchanged | Not executed at system level (B2). | Not Executed |
| TC-REG-009 | Concurrent final place | One remaining seat; A and B unregistered | 1. Send simultaneous registrations on separate connections; query count | Exactly one 201 and one 409; confirmed total never exceeds capacity; mock test alone cannot prove MySQL locking | Not executed at system level (B2). | Not Executed |
| TC-REG-010 | Registration transaction failure | Inject connection, insert, payment, ticket or QR failure | 1. POST valid registration for each failure; inspect rollback and release | No partial committed registration/payment/ticket; database error forwarded to safe error handler; connection released | Not executed at system level (B2). | Not Executed |
| TC-REG-011 | Notification storage fails after commit | Valid registration; notification insert fails | 1. POST; inspect committed rows and response | 201 retained; registration/payment/ticket persist; delivery failure does not roll back | Not executed at system level (B2). | Not Executed |
| TC-REG-012 | Registration migrations and constraints | Disposable MySQL 8 database | 1. Apply 004/005/012 in sequence and rerun guarded additions; inspect constraints/defaults | Unique event-attendee and FKs; InnoDB; student columns; declaration NOT NULL default FALSE; rerun preserves data | Not executed at system level (B2). | Not Executed |
| TC-REG-013 | Student detail boundaries | A authenticated | 1. Try phone length 6/7/20/21 and fewer than 7 digits; college 1/2/150/151; department 1/2/100/101 | Only regex-compliant 7–20 character phone with at least 7 digits, college 2–150 and department 2–100 accepted after trim | Not executed at system level (B2). | Not Executed |
| TC-REG-014 | Deadline and start boundaries | Controlled database clock; sufficient capacity | 1. Register exactly at deadline before start; after deadline; at start; with null deadline | Deadline equality allowed only before start; after deadline/at start rejected; null deadline permitted before start | Not executed at system level (B2). | Not Executed |

### Authentication and roles

| Test Case ID | Test Case Description | Preconditions | Test Steps | Expected Result | Actual Result | Test Status |
|---|---|---|---|---|---|---|
| TC-AUTH-001 | Account creation | Unused email; ATTENDEE seed exists | 1. POST /auth/register with valid name, mixed-case email and password; inspect database | 201; trimmed name, lowercase email; bcrypt cost 12; ATTENDEE assignment; response excludes hash/password | Not executed at system level (B2). | Not Executed |
| TC-AUTH-002 | Account validation boundaries | Unused emails | 1. Try name 1/2/100/101, password 7/8/72/73, invalid email and email over 254 | 400 outside supported limits; accepted boundaries persist correctly; no database access for invalid controller input | Not executed at system level (B2). | Not Executed |
| TC-AUTH-003 | Duplicate account | Existing email | 1. Register same and differently cased email; simulate concurrent duplicate insert | 409; existing account unchanged; no orphan user-role rows | Not executed at system level (B2). | Not Executed |
| TC-AUTH-004 | Account transaction rollback | Missing ATTENDEE seed or injected write failure | 1. Attempt valid account registration; inspect user and role rows | Rollback, connection release and safe error; no partially created account | Not executed at system level (B2). | Not Executed |
| TC-AUTH-005 | Successful login | Active user and valid password | 1. POST /auth/login; decode/verify token using test secret; GET /auth/me | 200; caller receives user and signed subject/role token expiring in one hour; me returns authenticated identity | Not executed at system level (B2). | Not Executed |
| TC-AUTH-006 | Invalid login | Active user | 1. Try unknown email, wrong password and malformed login body | Unknown/wrong credentials 401 generic message; invalid body 400; no token | Not executed at system level (B2). | Not Executed |
| TC-AUTH-007 | Inactive and deleted accounts | Issue token before status change | 1. Login inactive user; call protected endpoint after deactivation/deletion | Inactive login/request 403; removed account request 401; no operation proceeds | Not executed at system level (B2). | Not Executed |
| TC-AUTH-008 | Bearer validation | Protected endpoint | 1. Omit header; use wrong scheme, invalid signature, expired/future token, missing subject and invalid roles | 401 for invalid tokens; invalid tokens rejected before account query where applicable | Not executed at system level (B2). | Not Executed |
| TC-AUTH-009 | Auth configuration and DB errors | Test process with missing JWT secret or failing account query | 1. Call protected endpoint in each condition | 500 with controlled authentication message; no internal database detail in response | Not executed at system level (B2). | Not Executed |
| TC-AUTH-010 | Role endpoint matrix | Tokens for A/O/D/S | 1. GET /auth/attendee-test, organizer-test, admin-test and event-staff-test with every role | 200 only when token contains required role; other authenticated roles 403; absent authentication 401 | Not executed at system level (B2). | Not Executed |
| TC-AUTH-011 | Admin role assignment | D; existing A | 1. POST /auth/assign-role for ATTENDEE/ORGANIZER/EVENT_STAFF; repeat; try ADMIN/unknown and missing user | 200 adds allowed role without removing old roles; repeat no duplicate audit; invalid role 400; missing user 404; non-admin 403 | Not executed at system level (B2). | Not Executed |
| TC-AUTH-012 | Role claims refresh | A token issued before role assignment | 1. Assign ORGANIZER; retry old token; login again and retry organizer endpoint | Old JWT retains old roles; newly issued token includes current assignment; account status alone is refreshed per request | Not executed at system level (B2). | Not Executed |
| TC-AUTH-013 | Frontend logout | Signed-in browser; token in localStorage | 1. Select Sign out; inspect storage and displayed mode; independently replay saved test token | ems_token removed and login shown; no server logout/revocation endpoint; saved valid token remains usable until expiry/status change | Not executed at system level (B2/B3). | Not Executed |

### Event management and viewing

| Test Case ID | Test Case Description | Preconditions | Test Steps | Expected Result | Actual Result | Test Status |
|---|---|---|---|---|---|---|
| TC-EVT-001 | Create event with authorization | O or D authenticated | 1. POST /events valid body; inspect creator, event and audit row; repeat as A/S/no token | 201 for O/D; creator current user; atomic audit; A/S 403; missing token 401 | Not executed at system level (B2). | Not Executed |
| TC-EVT-002 | Event text boundaries | O authenticated | 1. Try blank title/venue; title 200/201, description 5000/5001, category 100/101, venue 255/256; unknown field | 400 outside bounds; valid trimmed boundaries accepted; strict body rejects unknown fields | Not executed at system level (B2). | Not Executed |
| TC-EVT-003 | Event capacity boundaries | O authenticated | 1. Try capacity 0, -1, 1.5, 1, 4294967295 and 4294967296; numeric string 2 | Positive whole values through unsigned maximum accepted; numeric string coerced; others 400 | Not executed at system level (B2). | Not Executed |
| TC-EVT-004 | Date and URL validation | O authenticated | 1. Try invalid dates, equal/reversed end, deadline after start, equal deadline/start, HTTP/HTTPS and javascript URLs, URL >2048 | 400 invalid dates/order/protocol/length; deadline equality and HTTP(S) allowed; optional empty values accepted | Not executed at system level (B2). | Not Executed |
| TC-EVT-005 | Persistence errors on create | Injected DB failures | 1. Create with FK, data-too-long, datetime and general database failures | FK failure 401; mapped range failures 400; other failures safe 500; rollback event/audit and release | Not executed at system level (B2). | Not Executed |
| TC-EVT-006 | List and combined search | Scheduled and cancelled fixtures; authenticated user | 1. GET /events with q/category/date/venue individually and together; search percent, underscore, equals and SQL-like strings | 200 ordered by start; scheduled only; exact category, keyword/venue substring, whole date; bound values and literal wildcard handling | Not executed at system level (B2). | Not Executed |
| TC-EVT-007 | Invalid and empty search | Authenticated user | 1. Search no matches; use impossible date, unknown/array query and overlength q/category/venue; try blank filters | No match 200 empty array; invalid query 400; blank filters ignored; missing auth 401 | Not executed at system level (B2). | Not Executed |
| TC-EVT-008 | Event detail and privacy | E with A registration and B unregistered | 1. GET /events/E as A, B and O | 200; capacity/count/remaining and FULL/AVAILABLE/CLOSED; caller-specific registration/payment; non-attendee NOT_APPLICABLE; fee null; processingAvailable false | Not executed at system level (B2). | Not Executed |
| TC-EVT-009 | Missing details and external URL | Authenticated user | 1. GET invalid UUID, nonexistent/cancelled event; retrieve scheduled event without registration_url | 400 invalid ID; 404 unavailable; no URL produces NOT_CONFIGURED and null URL; DB errors safely forwarded | Not executed at system level (B2). | Not Executed |
| TC-EVT-010 | Edit and postpone own event | O owns E; confirmed attendees | 1. PUT /events/E with complete valid payload; change schedule then descriptive fields | 200; dates changed while status remains SCHEDULED; POSTPONE_EVENT or UPDATE_EVENT audit and appropriate in-app notification | Not executed at system level (B2). | Not Executed |
| TC-EVT-011 | Edit/cancel ownership | P and D do not own E | 1. PUT /events/E and PATCH /events/E/cancel as P/D; repeat absent/cancelled event; try A | P/D 404 due creator restriction; absent/cancelled 404; A 403; no mutation | Not executed at system level (B2). | Not Executed |
| TC-EVT-012 | Cancel own event | O owns scheduled E | 1. PATCH /events/E/cancel; retrieve list/detail; repeat cancellation | 200; CANCELLED and audit committed; confirmed attendees notified; hidden from scheduled list/detail; repeat 404 | Not executed at system level (B2). | Not Executed |
| TC-EVT-013 | Edit/cancel failure handling | O owns E; injected audit and notification failures | 1. Edit/cancel with audit write failure; repeat with only notification failure | Audit failure rolls back mutation; post-commit notification failure retains successful mutation | Not executed at system level (B2). | Not Executed |
| TC-EVT-014 | Capacity reduction investigation | E has two confirmed registrations | 1. PUT valid capacity 1; inspect count and details | Current code permits reduction below registrations; remaining clamped to 0; record over-capacity policy gap for product decision | Not executed at system level (B2). | Not Executed |

### Registration management

| Test Case ID | Test Case Description | Preconditions | Test Steps | Expected Result | Actual Result | Test Status |
|---|---|---|---|---|---|---|
| TC-ATT-001 | Owner and admin attendee lists | E has confirmed/cancelled and checked-in rows | 1. GET /events/E/attendees as O and D | 200 ordered registration list with contact/student data, registration status and check-in status; admin may view another owner's list | Not executed at system level (B2). | Not Executed |
| TC-ATT-002 | Attendee-list access and error cases | P, A, S and missing event | 1. Request E list as each; request bad/missing UUID; request empty event | P 403; A/S 403; no token 401; malformed ID 400; absent 404; empty 200 empty list; DB failures safe | Not executed at system level (B2). | Not Executed |

### Payments

| Test Case ID | Test Case Description | Preconditions | Test Steps | Expected Result | Actual Result | Test Status |
|---|---|---|---|---|---|---|
| TC-PAY-001 | Payment status ownership | A owns registration R | 1. GET /payments/registrations/R as A and B; use malformed/nonexistent ID | A 200 with tracked status and processingAvailable false; B/missing 404; malformed 400; non-attendee 403 | Not executed at system level (B2). | Not Executed |
| TC-PAY-002 | Unavailable processing and malicious fields | A owns R with PENDING payment | 1. POST /payments/registrations/R/process with client status and synthetic card fields; inspect rows/logs; try PATCH status route | 503 PAYMENT_PROCESSING_UNAVAILABLE; no persistence/echo/log of card fields or client status; no public status-update route (404) | Not executed at system level (B2). | Not Executed |
| TC-PAY-003 | Trusted internal status transitions | Stub connection; internal service only | 1. Call updatePaymentStatus from PENDING to SUCCESSFUL/FAILED; try unknown status, missing record, terminal status transition and PENDING to PENDING | Valid terminal updates allowed; unknown/missing/terminal transitions throw coded errors; current service also permits PENDING to PENDING | Related automated assertions passed; full-system execution remains Not Executed. See Unit Test Report. | Not Executed |

### Tickets and check-in

| Test Case ID | Test Case Description | Preconditions | Test Steps | Expected Result | Actual Result | Test Status |
|---|---|---|---|---|---|---|
| TC-TKT-001 | Ticket retrieval and QR privacy | A owns confirmed R | 1. GET /tickets/registrations/R twice; decode PNG QR locally; inspect ticket rows | 200; same unique ticket per registration; QR contains only UUID; attendee info outside QR; no payment-success requirement | Not executed at system level (B2). | Not Executed |
| TC-TKT-002 | Ticket retrieval access/errors | B token; cancelled/missing registration | 1. GET another user's R, invalid ID and cancelled registration; inject DB failure | 404 other/missing; 400 malformed; 409 ineligible; rollback/release; safe errors; non-attendee forbidden | Not executed at system level (B2). | Not Executed |
| TC-TKT-003 | Read-only ticket validation | S and eligible active ticket T for E | 1. POST /tickets/validate with ticketId and eventId; repeat using qrCode | 200 valid true and checkedIn false; no checked_in_at mutation; O/D/S allowed, A forbidden | Not executed at system level (B2). | Not Executed |
| TC-TKT-004 | Check-in and duplicate prevention | Eligible ticket T; S authenticated | 1. POST /tickets/check-in twice; query timestamp/staff; send concurrent requests with a fresh ticket | First 200 records staff/time; repeats/concurrent loser 409; only one check-in committed | Not executed at system level (B2). | Not Executed |
| TC-TKT-005 | Ticket request validation | S authenticated | 1. POST validate/check-in with neither/both ticketId and qrCode, bad UUID, absent/bad eventId and unknown ticket | 400 malformed/ambiguous input; 404 unknown ticket; no check-in mutation | Not executed at system level (B2). | Not Executed |
| TC-TKT-006 | Ticket eligibility failures | Fixtures for mismatch/revoked/cancelled/used | 1. Validate and check in each ticket against selected event | 409 mismatch/ineligible/already used; 410 revoked; no updates; database errors safely forwarded with rollback when transactional | Not executed at system level (B2). | Not Executed |

### Feedback

| Test Case ID | Test Case Description | Preconditions | Test Steps | Expected Result | Actual Result | Test Status |
|---|---|---|---|---|---|---|
| TC-FBK-001 | Submit completed-event feedback | A confirmed; E ended; scheduled status | 1. POST /events/E/feedback rating 1 then separate fixture rating 5; optional comment | 201; one feedback per attendee/event and registration; absent/blank comment stored null; boundaries accepted | Not executed at system level (B2). | Not Executed |
| TC-FBK-002 | Feedback validation boundaries | Eligible A | 1. Try rating 0/6/1.5/missing, numeric string 5, comment 2000/2001 and unknown fields | 400 invalid values; digit string coerced; 2000 accepted; 2001/unknown rejected; no invalid insert | Not executed at system level (B2). | Not Executed |
| TC-FBK-003 | Eligibility, duplicate and failure | Unregistered A; separate pre-end/cancelled/duplicate fixtures | 1. Submit each; try invalid/missing event and failing database | 403 unregistered; 409 before end/cancelled/duplicate; 400 malformed ID; 404 missing; safe failure handling | Not executed at system level (B2). | Not Executed |
| TC-FBK-004 | Feedback view scope and role precedence | A/B feedback; owner O; P; D; combined ATTENDEE+ORGANIZER | 1. GET /events/E/feedback as each role | A sees own only; O sees all if not also attendee; P 403; D all; combined non-admin attendee role scopes to own; S forbidden | Not executed at system level (B2). | Not Executed |

### Notifications

| Test Case ID | Test Case Description | Preconditions | Test Steps | Expected Result | Actual Result | Test Status |
|---|---|---|---|---|---|---|
| TC-NOT-001 | Notification recipients and deduplication | Confirmed and cancelled E registrations | 1. Trigger registration, schedule/update, cancellation and same reminder twice | Only intended confirmed recipients; stable dedupe key suppresses repeated identical trigger; messages include event/reference; delivery is in-app | Not executed at system level (B2). | Not Executed |
| TC-NOT-002 | Private listing and limit boundaries | A/B notifications | 1. GET /notifications as A; limits 1/100/0/101/1.5/abc; omit limit | Only A rows newest first; default 50; 1–100 integer accepted; invalid 400; missing auth 401 | Not executed at system level (B2). | Not Executed |
| TC-NOT-003 | Mark read authorization | Unread A and B rows | 1. PATCH /notifications/id/read for own, B, bad UUID and missing record | Own row 200 and is_read 1; other/missing 404; invalid 400; no other recipient mutation | Not executed at system level (B2). | Not Executed |
| TC-NOT-004 | Reminder ownership and failures | O owns E; P/D accounts | 1. POST /notifications/events/E/reminder as O/P/D; missing/cancelled/bad event; inject DB failure | Owner/admin allowed with delivered count; P 403; unavailable 404; bad ID 400; safe server error on failure | Not executed at system level (B2). | Not Executed |

### Reports

| Test Case ID | Test Case Description | Preconditions | Test Steps | Expected Result | Actual Result | Test Status |
|---|---|---|---|---|---|---|
| TC-RPT-001 | Aggregates and empty data | Known registration/check-in/payment fixtures | 1. GET /reports/events; compare each field and summary with independent SQL; repeat empty dataset | 200 correct distinct counts/numeric totals and zero summaries on empty results; payment totals are status counts, not revenue | Not executed at system level (B2). | Not Executed |
| TC-RPT-002 | Report scope and filters | O/P events; D account | 1. GET list with from/to/status; GET single report as owner/other/admin | O list own only; D system-wide; date range inclusive of selected days; other organizer single 403; admin single allowed | Not executed at system level (B2). | Not Executed |
| TC-RPT-003 | Report invalid input and failures | Authenticated O | 1. Try reversed/impossible dates, unknown filters/status, bad/missing event ID, A/no token and DB failure | 400 invalid filters/ID; 404 missing; A 403; no token 401; DB failure safe | Not executed at system level (B2). | Not Executed |

### Administration

| Test Case ID | Test Case Description | Preconditions | Test Steps | Expected Result | Actual Result | Test Status |
|---|---|---|---|---|---|---|
| TC-ADM-001 | User administration visibility | D and A/O/S | 1. GET /auth/users as each | Only D 200; grouped roles/status and basic identity without password hash; others 403; unauthenticated 401 | Not executed at system level (B2). | Not Executed |
| TC-ADM-002 | Activate/deactivate account | D; another active attendee | 1. PATCH /auth/users/id/status INACTIVE then ACTIVE; repeat same status; inspect audit | 200 transition and audit atomically; same state 200 without duplicate transition; deactivation blocks existing token next request | Not executed at system level (B2). | Not Executed |
| TC-ADM-003 | Administrative safeguards | D and controlled admin fixtures | 1. Try invalid status, nonexistent user, self-deactivation and last-active-admin deactivation | 400 invalid/self/last-admin; 404 absent; no state change; test concurrent last-admin invariant separately before asserting safety | Not executed at system level (B2). | Not Executed |
| TC-ADM-004 | Venue lifecycle | D; disposable unique venue | 1. GET/POST /admin/venues; PUT /admin/venues/id; PATCH id/status false then true and repeat | 201 create; 200 list/update/status; persisted active flags; audit mutations; repeated status no duplicate transition | Not executed at system level (B2). | Not Executed |
| TC-ADM-005 | Category lifecycle | D; disposable unique category | 1. GET/POST /admin/categories; PUT id; PATCH id/status false then true and repeat | 201 create; 200 list/update/status; unique names; persisted flag and transactional audit | Not executed at system level (B2). | Not Executed |
| TC-ADM-006 | Catalog validation and errors | D; existing venue/category | 1. Try duplicate name, missing id, name 1/2/max/max+1; venue address >500/description >1000; category description >500; nonboolean status; unknown fields | 409 duplicates; 404 absent update/status; 400 invalid strict payload; venue max255/category max100; other roles 403 | Not executed at system level (B2). | Not Executed |
| TC-ADM-007 | Configuration create/update/list | D; unique key | 1. PUT /admin/configurations/key with JSON scalar/object/null; GET list; update same key | 201 new, 200 update/list; JSON and updated_by persisted; audit contains safe config key only | Not executed at system level (B2). | Not Executed |
| TC-ADM-008 | Configuration validation | D | 1. Try key starting digit, illegal char or >100; missing configValue; description nonstring/>500; call as non-admin | 400 invalid input; 403 non-admin; database/audit failure rolls back; no secret values written to audit | Not executed at system level (B2). | Not Executed |

### Audit logging

| Test Case ID | Test Case Description | Preconditions | Test Steps | Expected Result | Actual Result | Test Status |
|---|---|---|---|---|---|---|
| TC-AUD-001 | Mutation and audit atomicity | O/D; injectable connection | 1. Create/update/cancel event, assign role, mutate user/catalog/config; fail audit insert in each | Successful changes have actor/action/entity/time and approved metadata; failed audit rolls back corresponding mutation | Not executed at system level (B2). | Not Executed |
| TC-AUD-002 | Audit privacy and reader access | Seed >100 audit rows including sensitive metadata | 1. GET /admin/audit-logs as D/A/O/S/no token; inspect sanitization/order | D sees latest 100 sorted time/id descending; sensitive metadata dropped, configuration values hidden and sensitive config IDs redacted; others 403/401 | Not executed at system level (B2). | Not Executed |

### Database and API errors

| Test Case ID | Test Case Description | Preconditions | Test Steps | Expected Result | Actual Result | Test Status |
|---|---|---|---|---|---|---|
| TC-DB-001 | Fresh schema installation | Empty isolated MySQL 8 database | 1. Apply schema.sql literally then migrations 001–012 numerically; capture first error | Installation should complete and create all required objects; source has a stray Markdown closing fence in schema.sql, so literal import requires investigation | Not executed at system level (B2). | Not Executed |
| TC-DB-002 | Constraints and rerun preservation | Disposable migrated database with sample data | 1. Attempt duplicate email/roles/registration/ticket/feedback; orphan FK; invalid enum/rating/date/capacity; rerun guarded migrations | Constraints reject invalid writes; migration guards preserve data; verify cascade and checked_in_by ON DELETE SET NULL; no live SQL proof claimed | Not executed at system level (B2). | Not Executed |
| TC-DB-003 | Isolated load database completeness | Dedicated load database; no shared data | 1. Run preparation tool; inspect migration list and external_form_submitted; attempt current registration | Current allowlist stops at 011 and omits 012; expect missing declaration column on fresh prepared database; acceptance requires current registration schema, unresolved gap | Not executed at system level (B2). | Not Executed |
| TC-API-001 | Health, unknown path and malformed JSON | Running API | 1. GET /api/health; GET /api/v1/unknown; send malformed JSON to registration | Health 200 success (not a DB readiness check); unknown 404 JSON; malformed JSON 400 controlled message | Not executed at system level (B2). | Not Executed |
| TC-API-002 | Body limit and upload error handling | O; API running | 1. Send JSON over 10kb; upload unsupported MIME, missing file and >5MiB file | Current generic middleware returns 500 for unhandled size/MIME errors; missing file 400; record client-error classification gap rather than assume 413/415 | Not executed at system level (B2). | Not Executed |
| TC-API-003 | Successful image upload and access | O/D; synthetic JPEG/PNG/WebP <=5MiB | 1. POST /images multipart image; GET returned /uploads URL; try A/no token and forged MIME | 201 URL with generated filename for allowed MIME; static image readable; A 403/no token 401; inspect spoofing risk because filter checks MIME only | Not executed at system level (B2). | Not Executed |
| TC-API-004 | Error response confidentiality | Inject DB exception in each controller family | 1. Call affected API and inspect body/log captures for SQL/stack/secrets | Controlled 500 body; no SQL/stack in client response; document any sensitive server logging discovered during execution | Not executed at system level (B2). | Not Executed |

### Frontend acceptance

| Test Case ID | Test Case Description | Preconditions | Test Steps | Expected Result | Actual Result | Test Status |
|---|---|---|---|---|---|---|
| TC-UI-001 | Register/login form and errors | Browser with API; disposable account | 1. Register; mismatch confirm password; login wrong then correct; inspect loading/success/error states | Validation and errors visible; success reaches role dashboard; token saved as ems_token; no accidental duplicate submit | Not executed at system level (B2/B3). | Not Executed |
| TC-UI-002 | Search and event details | Browser signed in with seeded events | 1. Filter events, reset filters, open details, switch events quickly; simulate empty/error response | Matching cards/details and availability rendered; loading/empty/error states usable; aborted/stale detail request does not overwrite selected event | Not executed at system level (B2/B3). | Not Executed |
| TC-UI-003 | External form registration and ticket | A signed in on E details | 1. Open external form URL; omit declaration then confirm/fill fields; submit; reload detail; inspect ticket | HTTP(S) link opens safely; missing fields/declaration blocked; confirmed state, pending payment, capacity and QR displayed; no independent Google response verification claim | Not executed at system level (B2/B3). | Not Executed |
| TC-UI-004 | Organizer and staff workflows | O and S sessions | 1. Create/edit/cancel owned event with image; view attendees/send reminder; check in ticket as S | Role-appropriate controls and feedback; persisted changes reload; duplicate check-in error shown; API enforces permissions independently | Not executed at system level (B2/B3). | Not Executed |
| TC-UI-005 | Feedback/reports/admin workflows | Eligible A, O and D sessions | 1. Submit/view feedback; filter reports; manage users/roles/venues/categories/configuration and load audit logs | UI reflects API results, scope and validation; errors surfaced; no unsupported payment completion presented | Not executed at system level (B2/B3). | Not Executed |
| TC-UI-006 | Network failure and rendering safety | Browser; synthetic HTML-like event/comment values | 1. Disconnect API during actions; restore; display literal markup; use javascript external URL fixture | Clear recoverable errors and released loading state; React text not executed; unsafe external scheme blocked by getSafeExternalUrl | Not executed at system level (B2/B3). | Not Executed |

### Non-functional verification

| Test Case ID | Test Case Description | Preconditions | Test Steps | Expected Result | Actual Result | Test Status |
|---|---|---|---|---|---|---|
| TC-NF-001 | Passwords, tokens and payment privacy | Automated security harness; synthetic credentials | 1. Run nonFunctionalSecurity tests and capture response/log/database stubs | bcrypt cost12; no passwords/hashes/tokens logged or exposed to other callers; expired JWT and forbidden roles denied; raw payment fields not persisted | Related automated assertions passed; full-system execution remains Not Executed. See Unit Test Report. | Not Executed |
| TC-NF-002 | Performance and scalability measurements | Isolated non-production deployment, k6, unique per-stage data and monitoring | 1. Inspect registration payload for required externalFormSubmitted first; run 50/100/250/500 VU stages only after fixture compatibility is resolved; retain native summaries, generated reports and resource samples | Each login/search/details/registration p95 <=3000ms; HTTP/unexpected response rates <1%; report actual throughput/resources; stop escalation on failure | Not executed at system level (B2/B4). | Not Executed |
| TC-NF-003 | Monthly availability | External monitor and complete calendar-month data | 1. Probe health every minute and authenticated DB-backed journey every 5 minutes; calculate outages/gaps | At least 99.5% monthly availability; missing data not uptime; health alone cannot establish database availability | Not executed at system level (B2/B4). | Not Executed |
| TC-NF-004 | Deployment transport and origins | Non-production deployment and TLS inspection tools | 1. Check HTTPS, TLS >=1.2, redirect/HSTS, allowed/disallowed Origin and browser access | Quality criterion: protected transport and configured origin restrictions; CORS alone does not authenticate; deployment evidence required | Not executed at system level (B2/B3). | Not Executed |
| TC-NF-005 | Usability, accessibility and compatibility | Representative users; desktop/mobile browsers | 1. Keyboard-navigate forms/dialogs, inspect labels/focus/errors/contrast, resize, run representative workflows | Quality criterion: usable keyboard/focus/error feedback and legible responsive layout across selected browsers; record browser/version and findings | Not executed at system level (B3). | Not Executed |
| TC-NF-006 | Tooling regression and honest reporting | Node and repository dependencies installed | 1. Run isolatedDatabaseSetup/loadTestDataSetup/loadTestScript/performanceReport/passwordComparisonPool tests | Isolation guards and deterministic cleanup hold; native k6 metrics reported accurately; missing/zero metrics incomplete; failed thresholds fail; bcrypt worker comparisons correct | Related automated assertions passed; full-system execution remains Not Executed. See Unit Test Report. | Not Executed |
| TC-NF-007 | Frontend production build | Node/npm; frontend dependencies | 1. Run npm --prefix frontend run build; retain console output | Build exits zero and creates usable production assets; build success does not imply browser acceptance | Build exited 0 and emitted HTML/CSS/JS assets (SV-BLD-001); browser acceptance was not run (B3). | Pass |
| TC-NF-008 | Session storage exposure and token replay | Browser signed in; test JWT copied securely | 1. Inspect localStorage from same-origin script; logout; replay copied token before expiry; deactivate user and repeat | Current token readable to same-origin JS and replayable after local logout; deactivation denies replay; record risk and cookie/revocation gap | Not executed at system level (B2/B3). | Not Executed |

## Automated test traceability

The following inventory is a source-level index, not a test execution report. Counts below are literal top-level `test("...")` declarations, excluding nested/data-driven subtests; they differ from runner totals because nested tests are reported separately. The document's 94 scenarios intentionally group related values and overlap more than one test file.

| Automated source | Documented cases / scope | Top-level declarations | Current result |
|---|---|---:|---|
| [test/attendeeList.test.js](../test/attendeeList.test.js) | TC-ATT-001–002 | 7 | Executed in automated suite; see Unit Test Report |
| [test/auditLogging.test.js](../test/auditLogging.test.js) | TC-AUD-001–002; TC-EVT-001/005/013; TC-AUTH-011 | 6 | Executed in automated suite; see Unit Test Report |
| [test/eventDetails.test.js](../test/eventDetails.test.js) | TC-EVT-008–009 | 5 | Executed in automated suite; see Unit Test Report |
| [test/eventRoutes.test.js](../test/eventRoutes.test.js) | TC-AUTH-008/010; protected event/registration/payment/ticket/feedback/report routes | 22 | Executed in automated suite; see Unit Test Report |
| [test/eventSearch.test.js](../test/eventSearch.test.js) | TC-EVT-006–007 | 8 | Executed in automated suite; see Unit Test Report |
| [test/eventValidators.test.js](../test/eventValidators.test.js) | TC-EVT-002–004 | 5 | Executed in automated suite; see Unit Test Report |
| [test/feedback.test.js](../test/feedback.test.js) | TC-FBK-001–004 | 12 | Executed in automated suite; see Unit Test Report |
| [test/isolatedDatabaseSetup.test.js](../test/isolatedDatabaseSetup.test.js) | TC-DB-001–003; TC-NF-006 | 7 | Executed in automated suite; source assertions only |
| [test/loadTestDataSetup.test.js](../test/loadTestDataSetup.test.js) | TC-NF-006 | 5 | Executed in automated suite; see Unit Test Report |
| [test/loadTestScript.test.js](../test/loadTestScript.test.js) | TC-NF-002/006 | 6 | Executed in automated suite; script assertions only |
| [test/nonFunctionalSecurity.test.js](../test/nonFunctionalSecurity.test.js) | TC-AUTH-001/005/008/010; TC-PAY-002; TC-NF-001 | 6 | Executed in automated suite; see Unit Test Report |
| [test/notifications.test.js](../test/notifications.test.js) | TC-NOT-001–004 | 7 | Executed in automated suite; see Unit Test Report |
| [test/passwordComparisonPool.test.js](../test/passwordComparisonPool.test.js) | TC-AUTH-005–006; TC-NF-006 | 1 | Executed in automated suite; see Unit Test Report |
| [test/paymentStatus.test.js](../test/paymentStatus.test.js) | TC-PAY-001–003; payment migration | 4 | Executed in automated suite; source assertions only |
| [test/performanceReport.test.js](../test/performanceReport.test.js) | TC-NF-002/006 | 11 | Executed in automated suite; report-tool assertions only |
| [test/registration.test.js](../test/registration.test.js) | TC-REG-001–014 (some added boundaries require manual/new harness checks) | 13 | Executed in automated suite; mocked workflows only |
| [test/reports.test.js](../test/reports.test.js) | TC-RPT-001–003 | 10 | Executed in automated suite; see Unit Test Report |
| [test/tickets.test.js](../test/tickets.test.js) | TC-TKT-001–006; TC-DB-002 | 10 | Executed in automated suite; mocked/source checks only |

**Automated-suite cross-reference:** 18 test files, 145 top-level tests and 13 nested subtests ran successfully (158/158; see the Unit Test Report). This suite is separate from the system-case status below. Interactive admin scripts and browser acceptance were not run.

## Test execution summary

| Scope | Total | Pass | Fail | Not Executed |
|---|---:|---:|---:|---:|
| Preserved and revised original registration scenarios | 12 | 0 | 0 | 12 |
| Newly documented scenarios | 82 | 1 | 0 | 81 |
| **Documented test cases** | **94** | **1** | **0** | **93** |

## Next-stage validation

1. Run the remaining 93 cases with an authorized non-production API/MySQL environment; record results and evidence by case ID.
2. Complete browser, deployment-security, live-load, and availability checks in their intended environments.
3. Before live load testing, align the registration payload with `externalFormSubmitted` and ensure the isolated database setup includes migration 012.

## Implementation notes

- **Registration and payments:** The external-form field records an attendee declaration; no Google response verification or payment gateway/revenue flow is evidenced.
- **Event lifecycle:** Current event states are `SCHEDULED` and `CANCELLED`. Publishing, attendee cancellation, and a capacity-reduction policy are not represented as complete workflows.
- **Authorization and session handling:** Role checks are covered by automated tests. Per-event staff assignment and server-side token revocation are not established by this execution.
- **Database and load setup:** A Markdown fence in `database/schema.sql`, the load preparer's migration list, and the load script payload should be reviewed before database installation or performance testing.
- **Operational assurance:** Deployed TLS, browser accessibility, live performance, monthly availability, backup/recovery, and retention testing remain outside the verified scope.

No application, test, database, or migration source was changed for this report revision.

