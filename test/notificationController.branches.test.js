
process.env.NODE_PATH = require("path").join(
  __dirname,
  "..",
  "backend",
  "node_modules"
);
require("module").Module._initPaths();

const test = require("node:test");
const assert = require("node:assert/strict");

const pool = require("../backend/src/config/db");
const notifications = require("../backend/src/services/notificationService");
const controller = require("../backend/src/controllers/notificationController");

const VALID_ID = "123e4567-e89b-42d3-a456-426614174000";

function makeResponse() {
  return {
    statusCode: 200,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    }
  };
}

async function runRequest(handler, options = {}) {
  const originalExecute = pool.execute;
  const originalList = notifications.listNotifications;
  const originalMark = notifications.markRead;
  const originalNotify = notifications.notifyEventAttendees;

  if (options.execute) pool.execute = options.execute;
  if (options.list) notifications.listNotifications = options.list;
  if (options.mark) notifications.markRead = options.mark;
  if (options.notify) notifications.notifyEventAttendees = options.notify;

  const req = {
    query: options.query || {},
    params: options.params || { id: VALID_ID, eventId: VALID_ID },
    user: options.user || {
      id: "user-1",
      roles: ["ORGANIZER"]
    }
  };

  const res = makeResponse();
  let forwardedError = null;

  try {
    await handler(req, res, error => {
      forwardedError = error;
    });
  } finally {
    pool.execute = originalExecute;
    notifications.listNotifications = originalList;
    notifications.markRead = originalMark;
    notifications.notifyEventAttendees = originalNotify;
  }

  return { req, res, forwardedError };
}

// LIST NOTIFICATIONS

test("listMine uses the default limit when no limit is supplied", async () => {
  let receivedUser;
  let receivedLimit;

  const result = await runRequest(controller.listMine, {
    list: async (userId, limit) => {
      receivedUser = userId;
      receivedLimit = limit;
      return [{ id: VALID_ID }];
    }
  });

  assert.equal(result.res.statusCode, 200);
  assert.equal(receivedUser, "user-1");
  assert.equal(receivedLimit, 50);
  assert.equal(result.res.body.data.notifications.length, 1);
});

test("listMine accepts a valid custom limit", async () => {
  let receivedLimit;

  const result = await runRequest(controller.listMine, {
    query: { limit: "25" },
    list: async (userId, limit) => {
      receivedLimit = limit;
      return [];
    }
  });

  assert.equal(result.res.statusCode, 200);
  assert.equal(receivedLimit, 25);
  assert.deepEqual(result.res.body.data.notifications, []);
});

test("listMine rejects a zero limit", async () => {
  const result = await runRequest(controller.listMine, {
    query: { limit: "0" }
  });

  assert.equal(result.res.statusCode, 400);
  assert.match(result.res.body.message, /between 1 and 100/i);
});

test("listMine rejects a limit greater than 100", async () => {
  const result = await runRequest(controller.listMine, {
    query: { limit: "101" }
  });

  assert.equal(result.res.statusCode, 400);
});

test("listMine rejects a fractional limit", async () => {
  const result = await runRequest(controller.listMine, {
    query: { limit: "2.5" }
  });

  assert.equal(result.res.statusCode, 400);
});

test("listMine forwards notification service errors", async () => {
  const error = new Error("Notification service unavailable");

  const result = await runRequest(controller.listMine, {
    list: async () => {
      throw error;
    }
  });

  assert.equal(result.forwardedError, error);
});

// MARK NOTIFICATION AS READ

test("markMineRead rejects an invalid notification ID", async () => {
  const result = await runRequest(controller.markMineRead, {
    params: { id: "invalid-id" }
  });

  assert.equal(result.res.statusCode, 400);
  assert.match(result.res.body.message, /invalid notification id/i);
});

test("markMineRead returns 404 when notification does not exist", async () => {
  let receivedUser;
  let receivedId;

  const result = await runRequest(controller.markMineRead, {
    mark: async (userId, id) => {
      receivedUser = userId;
      receivedId = id;
      return false;
    }
  });

  assert.equal(result.res.statusCode, 404);
  assert.equal(receivedUser, "user-1");
  assert.equal(receivedId, VALID_ID);
});

test("markMineRead successfully marks a notification as read", async () => {
  const result = await runRequest(controller.markMineRead, {
    mark: async () => true
  });

  assert.equal(result.res.statusCode, 200);
  assert.equal(result.res.body.success, true);
  assert.match(result.res.body.message, /marked as read/i);
});

test("markMineRead forwards service errors", async () => {
  const error = new Error("Unable to update notification");

  const result = await runRequest(controller.markMineRead, {
    mark: async () => {
      throw error;
    }
  });

  assert.equal(result.forwardedError, error);
});

// SEND EVENT REMINDER

test("sendReminder rejects an invalid event ID", async () => {
  const result = await runRequest(controller.sendReminder, {
    params: { eventId: "not-a-uuid" }
  });

  assert.equal(result.res.statusCode, 400);
  assert.match(result.res.body.message, /invalid event id/i);
});

test("sendReminder returns 404 when event does not exist", async () => {
  const result = await runRequest(controller.sendReminder, {
    execute: async () => [[], []]
  });

  assert.equal(result.res.statusCode, 404);
  assert.match(result.res.body.message, /scheduled event not found/i);
});

test("sendReminder returns 404 for an event that is not scheduled", async () => {
  const result = await runRequest(controller.sendReminder, {
    execute: async () => [[{
      event_id: VALID_ID,
      status: "CANCELLED",
      created_by: "user-1"
    }], []]
  });

  assert.equal(result.res.statusCode, 404);
});

test("sendReminder prevents an organizer from reminding attendees of another organizer's event", async () => {
  let notificationCalled = false;

  const result = await runRequest(controller.sendReminder, {
    user: {
      id: "organizer-1",
      roles: ["ORGANIZER"]
    },
    execute: async () => [[{
      event_id: VALID_ID,
      status: "SCHEDULED",
      created_by: "organizer-2"
    }], []],
    notify: async () => {
      notificationCalled = true;
      return 1;
    }
  });

  assert.equal(result.res.statusCode, 403);
  assert.equal(notificationCalled, false);
});

test("sendReminder allows an administrator to remind attendees of another organizer's event", async () => {
  let notificationCalled = false;

  const result = await runRequest(controller.sendReminder, {
    user: {
      id: "admin-1",
      roles: ["ADMIN"]
    },
    execute: async () => [[{
      event_id: VALID_ID,
      title: "Technology Summit",
      status: "SCHEDULED",
      created_by: "organizer-2",
      start_datetime: "2026-12-01 10:00:00"
    }], []],
    notify: async data => {
      notificationCalled = true;
      assert.equal(data.type, "EVENT_REMINDER");
      assert.equal(data.title, "Event reminder");
      assert.equal(data.event.created_by, "organizer-2");
      return 2;
    }
  });

  assert.equal(result.res.statusCode, 200);
  assert.equal(notificationCalled, true);
  assert.equal(result.res.body.data.delivered, 2);
  assert.match(result.res.body.message, /sent/i);
});

test("sendReminder allows an organizer to remind attendees of their own event", async () => {
  const result = await runRequest(controller.sendReminder, {
    user: {
      id: "organizer-1",
      roles: ["ORGANIZER"]
    },
    execute: async () => [[{
      event_id: VALID_ID,
      title: "College Fest",
      status: "SCHEDULED",
      created_by: "organizer-1",
      start_datetime: "2026-12-01 10:00:00"
    }], []],
    notify: async data => {
      assert.equal(data.event.title, "College Fest");
      return 3;
    }
  });

  assert.equal(result.res.statusCode, 200);
  assert.equal(result.res.body.data.delivered, 3);
  assert.match(result.res.body.message, /sent/i);
});

test("sendReminder returns the no-new-reminders message when count is zero", async () => {
  const result = await runRequest(controller.sendReminder, {
    execute: async () => [[{
      event_id: VALID_ID,
      title: "College Fest",
      status: "SCHEDULED",
      created_by: "user-1",
      start_datetime: "2026-12-01 10:00:00"
    }], []],
    notify: async () => 0
  });

  assert.equal(result.res.statusCode, 200);
  assert.equal(result.res.body.data.delivered, 0);
  assert.match(result.res.body.message, /no new reminders/i);
});

test("sendReminder forwards database errors", async () => {
  const error = new Error("Database unavailable");

  const result = await runRequest(controller.sendReminder, {
    execute: async () => {
      throw error;
    }
  });

  assert.equal(result.forwardedError, error);
});

test("sendReminder forwards notification delivery errors", async () => {
  const error = new Error("Reminder delivery failed");

  const result = await runRequest(controller.sendReminder, {
    execute: async () => [[{
      event_id: VALID_ID,
      title: "College Fest",
      status: "SCHEDULED",
      created_by: "user-1",
      start_datetime: "2026-12-01 10:00:00"
    }], []],
    notify: async () => {
      throw error;
    }
  });

  assert.equal(result.forwardedError, error);
});
