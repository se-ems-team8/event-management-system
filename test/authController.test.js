
process.env.NODE_PATH = require("path").join(__dirname, "..", "backend", "node_modules");
require("module").Module._initPaths();

const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../backend/src/config/db");

const {
  register,
  login,
  assignRole,
  getUsers,
  updateUserStatus
} = require("../backend/src/controllers/authController");

function makeResponse() {
  return {
    statusCode: null,
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

function makeConnection(executeHandler) {
  const calls = [];

  return {
    calls,
    committed: false,
    rolledBack: false,
    released: false,

    async beginTransaction() {},

    async execute(sql, values) {
      calls.push({ sql, values });
      return executeHandler(sql, values, calls.length);
    },

    async commit() {
      this.committed = true;
    },

    async rollback() {
      this.rolledBack = true;
    },

    release() {
      this.released = true;
    }
  };
}

async function runConnectionRequest(handler, {
  params = {},
  body = {},
  user = { id: "admin-1" },
  executeHandler = () => [[]]
} = {}) {
  const original = pool.getConnection;
  const connection = makeConnection(executeHandler);
  pool.getConnection = async () => connection;

  const response = makeResponse();
  let forwardedError;

  try {
    await handler(
      { params, body, user },
      response,
      error => { forwardedError = error; }
    );
  } finally {
    pool.getConnection = original;
  }

  return { response, connection, forwardedError };
}

async function runQueryRequest(handler, {
  params = {},
  body = {},
  user = { id: "admin-1" },
  result = [[]],
  failure = null
} = {}) {
  const original = pool.execute;
  const queries = [];

  pool.execute = async (sql, values) => {
    queries.push({ sql, values });
    if (failure) throw failure;
    return result;
  };

  const response = makeResponse();
  let forwardedError;

  try {
    await handler(
      { params, body, user },
      response,
      error => { forwardedError = error; }
    );
  } finally {
    pool.execute = original;
  }

  return { response, queries, forwardedError };
}

// REGISTER

test("registration rejects invalid input before database access", async () => {
  const { response } = await runConnectionRequest(register, {
    body: { name: "A", email: "invalid", password: "123" }
  });

  assert.equal(response.statusCode, 400);
});

test("registration rejects an existing email and rolls back", async () => {
  const { response, connection } = await runConnectionRequest(register, {
    body: {
      name: "Test User",
      email: "TEST@example.com",
      password: "StrongPass123!"
    },
    executeHandler: () => [[{ user_id: "existing-user" }]]
  });

  assert.equal(response.statusCode, 409);
  assert.equal(connection.rolledBack, true);
  assert.equal(connection.released, true);
});

test("registration rejects a missing attendee role", async () => {
  const { response, connection, forwardedError } =
    await runConnectionRequest(register, {
      body: {
        name: "Test User",
        email: "new@example.com",
        password: "StrongPass123!"
      },
      executeHandler: (sql, values, count) => {
        if (count === 1) return [[]];
        if (count === 2) return [[]];
        return [[]];
      }
    });

  assert.ok(forwardedError);
  assert.equal(connection.rolledBack, true);
  assert.equal(connection.released, true);
});

test("registration successfully creates an attendee account", async () => {
  const { response, connection } = await runConnectionRequest(register, {
    body: {
      name: "Test User",
      email: "NEW@example.com",
      password: "StrongPass123!"
    },
    executeHandler: (sql, values, count) => {
      if (count === 1) return [[]];
      if (count === 2) return [[{ role_id: "attendee-role" }]];
      if (count === 3) return [{ affectedRows: 1 }];
      if (count === 4) return [[{ user_id: "new-user" }]];
      return [{ affectedRows: 1 }];
    }
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.id, "new-user");
  assert.equal(response.body.data.email, "new@example.com");
  assert.equal(connection.committed, true);
  assert.equal(connection.released, true);
});

// LOGIN

test("login rejects invalid input", async () => {
  const { response, queries } = await runQueryRequest(login, {
    body: { email: "invalid", password: "" }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(queries.length, 0);
});

test("login rejects an unknown email", async () => {
  const { response } = await runQueryRequest(login, {
    body: {
      email: "unknown@example.com",
      password: "StrongPass123!"
    },
    result: [[]]
  });

  assert.equal(response.statusCode, 401);
});

test("login rejects inactive accounts", async () => {
  const { response } = await runQueryRequest(login, {
    body: {
      email: "inactive@example.com",
      password: "StrongPass123!"
    },
    result: [[{
      user_id: "user-1",
      full_name: "Test User",
      email: "inactive@example.com",
      password_hash: "unused",
      account_status: "INACTIVE",
      role_name: "ATTENDEE"
    }]]
  });

  assert.equal(response.statusCode, 403);
});

// ROLE ASSIGNMENT

test("role assignment rejects invalid role details", async () => {
  const { response } = await runConnectionRequest(assignRole, {
    body: { userId: "user-1", roleName: "INVALID" }
  });

  assert.equal(response.statusCode, 400);
});

test("role assignment returns 404 for an unknown user", async () => {
  const { response, connection } = await runConnectionRequest(assignRole, {
    body: { userId: "missing-user", roleName: "ORGANIZER" },
    executeHandler: () => [[]]
  });

  assert.equal(response.statusCode, 404);
  assert.equal(connection.rolledBack, true);
});

test("role assignment rejects a role missing from the database", async () => {
  const { response, connection } = await runConnectionRequest(assignRole, {
    body: { userId: "user-1", roleName: "ORGANIZER" },
    executeHandler: (sql, values, count) => {
      return count === 1 ? [[{ user_id: "user-1" }]] : [[]];
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(connection.rolledBack, true);
});

test("role assignment succeeds without duplicating an existing role", async () => {
  const { response, connection } = await runConnectionRequest(assignRole, {
    body: { userId: "user-1", roleName: "ORGANIZER" },
    executeHandler: (sql, values, count) => {
      if (count === 1) return [[{ user_id: "user-1" }]];
      if (count === 2) return [[{ role_id: "role-1" }]];
      return [{ affectedRows: 0 }];
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(connection.committed, true);
  assert.equal(connection.released, true);
});

// GET USERS

test("getUsers maps user records and roles correctly", async () => {
  const rows = [
    {
      user_id: "user-1",
      full_name: "Test User",
      email: "test@example.com",
      account_status: "ACTIVE",
      roles: "ADMIN,ORGANIZER"
    },
    {
      user_id: "user-2",
      full_name: "Second User",
      email: "second@example.com",
      account_status: "INACTIVE",
      roles: null
    }
  ];

  const { response } = await runQueryRequest(getUsers, {
    result: [rows]
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.data[0].roles, ["ADMIN", "ORGANIZER"]);
  assert.deepEqual(response.body.data[1].roles, []);
});

// UPDATE USER STATUS

test("updateUserStatus rejects invalid account status", async () => {
  const { response } = await runConnectionRequest(updateUserStatus, {
    params: { userId: "user-2" },
    body: { accountStatus: "BLOCKED" }
  });

  assert.equal(response.statusCode, 400);
});

test("an administrator cannot deactivate their own account", async () => {
  const { response } = await runConnectionRequest(updateUserStatus, {
    params: { userId: "admin-1" },
    body: { accountStatus: "INACTIVE" },
    user: { id: "admin-1" }
  });

  assert.equal(response.statusCode, 400);
});

test("updateUserStatus returns 404 for a missing user", async () => {
  const { response, connection } =
    await runConnectionRequest(updateUserStatus, {
      params: { userId: "missing-user" },
      body: { accountStatus: "ACTIVE" },
      executeHandler: () => [[]]
    });

  assert.equal(response.statusCode, 404);
  assert.equal(connection.rolledBack, true);
});

test("updateUserStatus handles an unchanged status", async () => {
  const { response, connection } =
    await runConnectionRequest(updateUserStatus, {
      params: { userId: "user-2" },
      body: { accountStatus: "ACTIVE" },
      executeHandler: () => [[{
        user_id: "user-2",
        account_status: "ACTIVE"
      }]]
    });

  assert.equal(response.statusCode, 200);
  assert.match(response.body.message, /already ACTIVE/);
  assert.equal(connection.rolledBack, true);
});

test("last active administrator cannot be deactivated", async () => {
  const { response, connection } =
    await runConnectionRequest(updateUserStatus, {
      params: { userId: "admin-2" },
      body: { accountStatus: "INACTIVE" },
      executeHandler: (sql, values, count) => {
        if (count === 1) {
          return [[{
            user_id: "admin-2",
            account_status: "ACTIVE"
          }]];
        }

        if (count === 2) return [[{ active_admins: 1 }]];
        return [[{ is_admin: 1 }]];
      }
    });

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /last active administrator/);
  assert.equal(connection.rolledBack, true);
});
