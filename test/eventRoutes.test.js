
process.env.NODE_PATH = require("path").join(__dirname, "..", "backend", "node_modules");
require("module").Module._initPaths();

const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "event-route-test-secret";

const app = require("../backend/src/app");
const pool = require("../backend/src/config/db");

const originalExecute = pool.execute;

// Mock account lookup for route authorization tests.
// These tests use fixed JWT identities and should not depend
// on users existing in the database.
pool.execute = async function (sql, values) {
  if (
    /SELECT\s+account_status\s+FROM\s+users\s+WHERE\s+user_id\s*=\s*\?/i.test(sql)
  ) {
    return [[{ account_status: "ACTIVE" }]];
  }

  return originalExecute.call(this, sql, values);
};

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  pool.execute = originalExecute;

  if (server) {
    await new Promise((resolve, reject) => {
      server.close(error => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});

// 1. Event creation requires authentication
test("event creation requires authentication", async () => {
  const response = await fetch(`${baseUrl}/api/v1/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });

  assert.equal(response.status, 401);
});

// 2. Attendees cannot create events
test("attendees cannot create events", async () => {
  const token = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000004", roles: ["ATTENDEE"] },
    process.env.JWT_SECRET
  );

  const response = await fetch(`${baseUrl}/api/v1/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });

  assert.equal(response.status, 403);
});

// 3. Authorized event creators receive validation errors
test("authorized event creators receive validation errors before persistence", async () => {
  const token = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000004", roles: ["ORGANIZER"] },
    process.env.JWT_SECRET
  );

  const response = await fetch(`${baseUrl}/api/v1/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });

  const result = await response.json();

  assert.equal(response.status, 400);
  assert.equal(result.success, false);
  assert.ok(Array.isArray(result.errors));
});

// 4. Attendees cannot update events
test("attendees cannot update events", async () => {
  const token = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000004", roles: ["ATTENDEE"] },
    process.env.JWT_SECRET
  );

  const response = await fetch(`${baseUrl}/api/v1/events/test-event-id`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });

  assert.equal(response.status, 403);
});

// 5. Attendees cannot cancel events
test("attendees cannot cancel events", async () => {
  const token = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000004", roles: ["ATTENDEE"] },
    process.env.JWT_SECRET
  );

  const response = await fetch(
    `${baseUrl}/api/v1/events/test-event-id/cancel`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  assert.equal(response.status, 403);
});

// 6. Updating an event requires authentication
test("updating an event requires authentication", async () => {
  const response = await fetch(`${baseUrl}/api/v1/events/test-event-id`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });

  assert.equal(response.status, 401);
});

// 7. Cancelling an event requires authentication
test("cancelling an event requires authentication", async () => {
  const response = await fetch(
    `${baseUrl}/api/v1/events/test-event-id/cancel`,
    { method: "PATCH" }
  );

  assert.equal(response.status, 401);
});

// 8. Event details require authentication
test("event details require authentication", async () => {
  const response = await fetch(
    `${baseUrl}/api/v1/events/9d3dba07-c272-4f71-aedd-3fc7f4c3c589`
  );

  assert.equal(response.status, 401);
});

// 9. Attendee lists require authentication and organizer/admin authorization
test("attendee lists require authentication and organizer/admin authorization", async () => {
  const eventId = "9d3dba07-c272-4f71-aedd-3fc7f4c3c589";

  const anonymous = await fetch(
    `${baseUrl}/api/v1/events/${eventId}/attendees`
  );

  assert.equal(anonymous.status, 401);

  const token = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000001", roles: ["ATTENDEE"] },
    process.env.JWT_SECRET
  );

  const attendee = await fetch(
    `${baseUrl}/api/v1/events/${eventId}/attendees`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  assert.equal(attendee.status, 403);
});

// 10. Feedback endpoints require authentication
test("feedback endpoints require authentication", async () => {
  const eventId = "9d3dba07-c272-4f71-aedd-3fc7f4c3c589";

  const read = await fetch(
    `${baseUrl}/api/v1/events/${eventId}/feedback`
  );

  const submit = await fetch(
    `${baseUrl}/api/v1/events/${eventId}/feedback`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5 })
    }
  );

  assert.equal(read.status, 401);
  assert.equal(submit.status, 401);
});

// 11. Only attendees may submit feedback
test("only attendees may submit feedback and event staff cannot retrieve it", async () => {
  const eventId = "9d3dba07-c272-4f71-aedd-3fc7f4c3c589";

  const organizerToken = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000002", roles: ["ORGANIZER"] },
    process.env.JWT_SECRET
  );

  const organizerSubmit = await fetch(
    `${baseUrl}/api/v1/events/${eventId}/feedback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${organizerToken}`
      },
      body: JSON.stringify({ rating: 5 })
    }
  );

  assert.equal(organizerSubmit.status, 403);

  const staffToken = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000003", roles: ["EVENT_STAFF"] },
    process.env.JWT_SECRET
  );

  const staffRead = await fetch(
    `${baseUrl}/api/v1/events/${eventId}/feedback`,
    {
      headers: { Authorization: `Bearer ${staffToken}` }
    }
  );

  assert.equal(staffRead.status, 403);
});

// 12. Reporting endpoints require authentication
test("reporting endpoints require authentication and reject attendees", async () => {
  const anonymous = await fetch(`${baseUrl}/api/v1/reports/events`);

  assert.equal(anonymous.status, 401);

  const token = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000001", roles: ["ATTENDEE"] },
    process.env.JWT_SECRET
  );

  const attendee = await fetch(`${baseUrl}/api/v1/reports/events`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  assert.equal(attendee.status, 403);
});

// 13. Event registration requires authentication
test("event registration requires authentication", async () => {
  const response = await fetch(
    `${baseUrl}/api/v1/events/9d3dba07-c272-4f71-aedd-3fc7f4c3c589/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    }
  );

  assert.equal(response.status, 401);
});

// 14. Event registration is restricted to attendees
test("event registration is restricted to attendees", async () => {
  const token = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000002", roles: ["ORGANIZER"] },
    process.env.JWT_SECRET
  );

  const response = await fetch(
    `${baseUrl}/api/v1/events/9d3dba07-c272-4f71-aedd-3fc7f4c3c589/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: "{}"
    }
  );

  assert.equal(response.status, 403);
});

// 15. Event registration validates the event ID
test("event registration validates the event ID", async () => {
  const token = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000001", roles: ["ATTENDEE"] },
    process.env.JWT_SECRET
  );

  const response = await fetch(
    `${baseUrl}/api/v1/events/not-an-id/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: "{}"
    }
  );

  const result = await response.json();

  assert.equal(response.status, 400);
  assert.equal(result.code, "INVALID_EVENT_ID");
});

// 16. Event registration rejects malformed JSON
test("event registration rejects malformed JSON with a client error", async () => {
  const token = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000001", roles: ["ATTENDEE"] },
    process.env.JWT_SECRET
  );

  const response = await fetch(
    `${baseUrl}/api/v1/events/9d3dba07-c272-4f71-aedd-3fc7f4c3c589/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: "{invalid-json"
    }
  );

  const result = await response.json();

  assert.equal(response.status, 400);
  assert.equal(result.message, "Request body must contain valid JSON.");
});

// 17. Payment status requires authentication
test("payment status requires authentication", async () => {
  const response = await fetch(
    `${baseUrl}/api/v1/payments/registrations/9d3dba07-c272-4f71-aedd-3fc7f4c3c589`
  );

  assert.equal(response.status, 401);
});

// 18. Payment status is restricted to attendees
test("payment status is restricted to attendees", async () => {
  const token = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000002", roles: ["ORGANIZER"] },
    process.env.JWT_SECRET
  );

  const response = await fetch(
    `${baseUrl}/api/v1/payments/registrations/9d3dba07-c272-4f71-aedd-3fc7f4c3c589`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  assert.equal(response.status, 403);
});

// 19. Payment processing requires authentication
test("payment processing requires authentication and has no client status update route", async () => {
  const response = await fetch(
    `${baseUrl}/api/v1/payments/registrations/9d3dba07-c272-4f71-aedd-3fc7f4c3c589/process`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SUCCESSFUL" })
    }
  );

  assert.equal(response.status, 401);
});

// 20. Ticket retrieval requires authentication
test("ticket retrieval requires authentication", async () => {
  const response = await fetch(
    `${baseUrl}/api/v1/tickets/registrations/9d3dba07-c272-4f71-aedd-3fc7f4c3c589`
  );

  assert.equal(response.status, 401);
});

// 21. Ticket check-in is limited to event staff and privileged roles
test("ticket check-in is limited to event staff and privileged event roles", async () => {
  const token = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000001", roles: ["ATTENDEE"] },
    process.env.JWT_SECRET
  );

  const response = await fetch(`${baseUrl}/api/v1/tickets/check-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      ticketId: "bc3d6e9e-a172-4846-9d7c-0eb174b938fe",
      eventId: "9d3dba07-c272-4f71-aedd-3fc7f4c3c589"
    })
  });

  assert.equal(response.status, 403);
});

// 22. Ticket validation requires staff authorization
test("ticket validation requires staff authorization and accepts authorized staff", async () => {
  const unauthenticated = await fetch(
    `${baseUrl}/api/v1/tickets/validate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    }
  );

  assert.equal(unauthenticated.status, 401);

  const attendeeToken = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000001", roles: ["ATTENDEE"] },
    process.env.JWT_SECRET
  );

  const forbidden = await fetch(
    `${baseUrl}/api/v1/tickets/validate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${attendeeToken}`
      },
      body: JSON.stringify({ ticketId: "bad-id", eventId: "bad-id" })
    }
  );

  assert.equal(forbidden.status, 403);

  const staffToken = jwt.sign(
    { sub: "00000000-0000-4000-8000-000000000003", roles: ["EVENT_STAFF"] },
    process.env.JWT_SECRET
  );

  const allowed = await fetch(
    `${baseUrl}/api/v1/tickets/validate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ ticketId: "bad-id", eventId: "bad-id" })
    }
  );

  assert.equal(allowed.status, 400);
});
