
process.env.NODE_PATH = require("path").join(__dirname, "..", "backend", "node_modules");
require("module").Module._initPaths();

const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../backend/src/config/db");

const {
  getVenues,
  createVenue,
  updateVenue,
  updateVenueStatus,
  getCategories,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  getConfigurations,
  updateConfiguration
} = require("../backend/src/controllers/adminController");

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

async function runRequest(handler, { params = {}, body = {}, user = { id: "admin-1" }, result = [[]], failure = null } = {}) {
  const originalExecute = pool.execute;
  const queries = [];

  pool.execute = async (sql, values) => {
    queries.push({ sql, values });
    if (failure) throw failure;
    return result;
  };

  const response = makeResponse();
  let forwardedError;

  try {
    await handler({ params, body, user }, response, error => {
      forwardedError = error;
    });
  } finally {
    pool.execute = originalExecute;
  }

  return { response, queries, forwardedError };
}

test("getVenues returns venue records", async () => {
  const venues = [{ venueId: "v1", venueName: "Main Hall" }];
  const { response } = await runRequest(getVenues, { result: [venues] });

  assert.equal(response.body.success, true);
  assert.deepEqual(response.body.data, venues);
});

test("getVenues forwards database errors", async () => {
  const error = new Error("Database unavailable");
  const { forwardedError } = await runRequest(getVenues, { failure: error });
  assert.equal(forwardedError, error);
});

test("createVenue rejects invalid input", async () => {
  const { response, queries } = await runRequest(createVenue, {
    body: { venueName: "A" }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(queries.length, 0);
});

test("updateVenue rejects invalid input", async () => {
  const { response, queries } = await runRequest(updateVenue, {
    params: { id: "v1" },
    body: { venueName: "" }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(queries.length, 0);
});

test("updateVenueStatus rejects non-boolean status", async () => {
  const { response, queries } = await runRequest(updateVenueStatus, {
    params: { id: "v1" },
    body: { isActive: "true" }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(queries.length, 0);
});

test("getCategories returns category records", async () => {
  const categories = [{ categoryId: "c1", categoryName: "Technology" }];
  const { response } = await runRequest(getCategories, {
    result: [categories]
  });

  assert.equal(response.body.success, true);
  assert.deepEqual(response.body.data, categories);
});

test("getCategories forwards database errors", async () => {
  const error = new Error("Database unavailable");
  const { forwardedError } = await runRequest(getCategories, {
    failure: error
  });

  assert.equal(forwardedError, error);
});

test("createCategory rejects invalid input", async () => {
  const { response, queries } = await runRequest(createCategory, {
    body: { categoryName: "A" }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(queries.length, 0);
});

test("updateCategory rejects invalid input", async () => {
  const { response, queries } = await runRequest(updateCategory, {
    params: { id: "c1" },
    body: { categoryName: "" }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(queries.length, 0);
});

test("updateCategoryStatus rejects non-boolean status", async () => {
  const { response, queries } = await runRequest(updateCategoryStatus, {
    params: { id: "c1" },
    body: { isActive: "yes" }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(queries.length, 0);
});

test("getConfigurations maps database fields to response fields", async () => {
  const rows = [{
    config_key: "registration.open",
    config_value: "true",
    description: "Registration setting",
    updated_by: "admin-1",
    created_at: "created",
    updated_at: "updated"
  }];

  const { response } = await runRequest(getConfigurations, {
    result: [rows]
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.data[0], {
    configKey: "registration.open",
    configValue: "true",
    description: "Registration setting",
    updatedBy: "admin-1",
    createdAt: "created",
    updatedAt: "updated"
  });
});

test("getConfigurations forwards database errors", async () => {
  const error = new Error("Database unavailable");
  const { forwardedError } = await runRequest(getConfigurations, {
    failure: error
  });

  assert.equal(forwardedError, error);
});

test("updateConfiguration rejects invalid keys", async () => {
  const { response, queries } = await runRequest(updateConfiguration, {
    params: { key: "invalid key!" },
    body: { configValue: true }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(queries.length, 0);
});

test("updateConfiguration requires a configuration value", async () => {
  const { response, queries } = await runRequest(updateConfiguration, {
    params: { key: "registration.open" },
    body: {}
  });

  assert.equal(response.statusCode, 400);
  assert.equal(queries.length, 0);
});

test("updateConfiguration rejects invalid descriptions", async () => {
  const { response, queries } = await runRequest(updateConfiguration, {
    params: { key: "registration.open" },
    body: { configValue: true, description: 123 }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(queries.length, 0);
});
