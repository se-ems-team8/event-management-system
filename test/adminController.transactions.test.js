
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

const admin = require("../backend/src/controllers/adminController");

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

function makeConnection(executeHandler) {
  return {
    began: false,
    committed: false,
    rolledBack: false,
    released: false,

    async beginTransaction() {
      this.began = true;
    },

    async execute(sql, params) {
      return executeHandler(sql, params);
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

async function runTransaction(handler, options = {}) {
  const originalGetConnection = pool.getConnection;

  const connection = makeConnection(
    options.executeHandler ||
      (async () => [{ affectedRows: 1 }, []])
  );

  pool.getConnection = async () => connection;

  const req = {
    params: options.params || { id: "test-id", key: "site.name" },
    body: options.body || {},
    user: options.user || { id: "admin-1" }
  };

  const res = makeResponse();
  let forwardedError = null;

  try {
    await handler(req, res, error => {
      forwardedError = error;
    });
  } finally {
    pool.getConnection = originalGetConnection;
  }

  return { res, connection, forwardedError };
}

const venue = {
  venueName: "Main Auditorium",
  address: "Hyderabad",
  description: "College event venue"
};

const category = {
  categoryName: "Technology",
  description: "Technology events"
};

// CREATE VENUE

test("createVenue successfully creates a venue and commits", async () => {
  const result = await runTransaction(admin.createVenue, {
    body: venue
  });

  assert.equal(result.res.statusCode, 201);
  assert.equal(result.res.body.success, true);
  assert.equal(result.res.body.data.venueName, venue.venueName);
  assert.ok(result.res.body.data.venueId);

  assert.equal(result.connection.began, true);
  assert.equal(result.connection.committed, true);
  assert.equal(result.connection.rolledBack, false);
  assert.equal(result.connection.released, true);
});

test("createVenue handles duplicate venue names", async () => {
  const result = await runTransaction(admin.createVenue, {
    body: venue,
    executeHandler: async () => {
      const error = new Error("Duplicate venue");
      error.code = "ER_DUP_ENTRY";
      throw error;
    }
  });

  assert.equal(result.res.statusCode, 409);
  assert.match(result.res.body.message, /already exists/i);
  assert.equal(result.connection.rolledBack, true);
  assert.equal(result.connection.released, true);
});

test("createVenue forwards unexpected database errors", async () => {
  const error = new Error("Database unavailable");

  const result = await runTransaction(admin.createVenue, {
    body: venue,
    executeHandler: async () => {
      throw error;
    }
  });

  assert.equal(result.forwardedError, error);
  assert.equal(result.connection.rolledBack, true);
  assert.equal(result.connection.released, true);
});

// UPDATE VENUE

test("updateVenue returns 404 when venue does not exist", async () => {
  const result = await runTransaction(admin.updateVenue, {
    body: venue,
    executeHandler: async sql => {
      if (sql.includes("SELECT")) return [[], []];
      return [{ affectedRows: 1 }, []];
    }
  });

  assert.equal(result.res.statusCode, 404);
  assert.equal(result.connection.rolledBack, true);
  assert.equal(result.connection.committed, false);
  assert.equal(result.connection.released, true);
});

test("updateVenue successfully updates an existing venue", async () => {
  const result = await runTransaction(admin.updateVenue, {
    body: venue,
    executeHandler: async sql => {
      if (sql.includes("SELECT")) {
        return [[{
          venue_id: "test-id",
          venue_name: "Old Auditorium",
          address: "Old address",
          description: "Old description",
          is_active: 1
        }], []];
      }

      return [{ affectedRows: 1 }, []];
    }
  });

  assert.equal(result.res.statusCode, 200);
  assert.equal(result.res.body.success, true);
  assert.equal(result.res.body.data.venueName, venue.venueName);
  assert.equal(result.connection.committed, true);
  assert.equal(result.connection.released, true);
});

test("updateVenue handles duplicate venue names", async () => {
  const result = await runTransaction(admin.updateVenue, {
    body: venue,
    executeHandler: async sql => {
      if (sql.includes("SELECT")) {
        return [[{
          venue_id: "test-id",
          venue_name: "Old Auditorium",
          address: "",
          description: "",
          is_active: 1
        }], []];
      }

      const error = new Error("Duplicate venue");
      error.code = "ER_DUP_ENTRY";
      throw error;
    }
  });

  assert.equal(result.res.statusCode, 409);
  assert.equal(result.connection.rolledBack, true);
  assert.equal(result.connection.released, true);
});

// VENUE STATUS

test("updateVenueStatus returns 404 for a missing venue", async () => {
  const result = await runTransaction(admin.updateVenueStatus, {
    body: { isActive: true },
    executeHandler: async () => [[], []]
  });

  assert.equal(result.res.statusCode, 404);
  assert.equal(result.connection.rolledBack, true);
});

test("updateVenueStatus handles an unchanged status", async () => {
  const result = await runTransaction(admin.updateVenueStatus, {
    body: { isActive: true },
    executeHandler: async sql => {
      if (sql.includes("SELECT")) {
        return [[{
          venue_id: "test-id",
          venue_name: "Auditorium",
          is_active: 1
        }], []];
      }

      return [{ affectedRows: 1 }, []];
    }
  });

  assert.equal(result.res.statusCode, 200);
  assert.match(result.res.body.message, /already/i);
  assert.equal(result.connection.rolledBack, true);
  assert.equal(result.connection.committed, false);
});

test("updateVenueStatus activates an inactive venue", async () => {
  const result = await runTransaction(admin.updateVenueStatus, {
    body: { isActive: true },
    executeHandler: async sql => {
      if (sql.includes("SELECT")) {
        return [[{
          venue_id: "test-id",
          venue_name: "Auditorium",
          is_active: 0
        }], []];
      }

      return [{ affectedRows: 1 }, []];
    }
  });

  assert.equal(result.res.statusCode, 200);
  assert.match(result.res.body.message, /activated/i);
  assert.equal(result.connection.committed, true);
});

test("updateVenueStatus deactivates an active venue", async () => {
  const result = await runTransaction(admin.updateVenueStatus, {
    body: { isActive: false },
    executeHandler: async sql => {
      if (sql.includes("SELECT")) {
        return [[{
          venue_id: "test-id",
          venue_name: "Auditorium",
          is_active: 1
        }], []];
      }

      return [{ affectedRows: 1 }, []];
    }
  });

  assert.equal(result.res.statusCode, 200);
  assert.match(result.res.body.message, /deactivated/i);
  assert.equal(result.connection.committed, true);
});

// CREATE CATEGORY

test("createCategory successfully creates a category", async () => {
  const result = await runTransaction(admin.createCategory, {
    body: category
  });

  assert.equal(result.res.statusCode, 201);
  assert.equal(result.res.body.success, true);
  assert.equal(result.res.body.data.categoryName, category.categoryName);
  assert.ok(result.res.body.data.categoryId);
  assert.equal(result.connection.committed, true);
});

test("createCategory handles duplicate categories", async () => {
  const result = await runTransaction(admin.createCategory, {
    body: category,
    executeHandler: async () => {
      const error = new Error("Duplicate category");
      error.code = "ER_DUP_ENTRY";
      throw error;
    }
  });

  assert.equal(result.res.statusCode, 409);
  assert.match(result.res.body.message, /already exists/i);
  assert.equal(result.connection.rolledBack, true);
});

// UPDATE CATEGORY

test("updateCategory returns 404 for a missing category", async () => {
  const result = await runTransaction(admin.updateCategory, {
    body: category,
    executeHandler: async () => [[], []]
  });

  assert.equal(result.res.statusCode, 404);
  assert.equal(result.connection.rolledBack, true);
});

test("updateCategory successfully updates a category", async () => {
  const result = await runTransaction(admin.updateCategory, {
    body: category,
    executeHandler: async sql => {
      if (sql.includes("SELECT")) {
        return [[{
          category_id: "test-id",
          category_name: "Old Category",
          description: "Old description",
          is_active: 1
        }], []];
      }

      return [{ affectedRows: 1 }, []];
    }
  });

  assert.equal(result.res.statusCode, 200);
  assert.equal(result.res.body.success, true);
  assert.equal(result.res.body.data.categoryName, category.categoryName);
  assert.equal(result.connection.committed, true);
});

test("updateCategory handles duplicate category names", async () => {
  const result = await runTransaction(admin.updateCategory, {
    body: category,
    executeHandler: async sql => {
      if (sql.includes("SELECT")) {
        return [[{
          category_id: "test-id",
          category_name: "Old Category",
          description: "",
          is_active: 1
        }], []];
      }

      const error = new Error("Duplicate category");
      error.code = "ER_DUP_ENTRY";
      throw error;
    }
  });

  assert.equal(result.res.statusCode, 409);
  assert.equal(result.connection.rolledBack, true);
});

// CATEGORY STATUS

test("updateCategoryStatus returns 404 for a missing category", async () => {
  const result = await runTransaction(admin.updateCategoryStatus, {
    body: { isActive: true },
    executeHandler: async () => [[], []]
  });

  assert.equal(result.res.statusCode, 404);
  assert.equal(result.connection.rolledBack, true);
});

test("updateCategoryStatus handles an unchanged status", async () => {
  const result = await runTransaction(admin.updateCategoryStatus, {
    body: { isActive: false },
    executeHandler: async () => [[{
      category_id: "test-id",
      category_name: "Technology",
      is_active: 0
    }], []]
  });

  assert.equal(result.res.statusCode, 200);
  assert.match(result.res.body.message, /already/i);
  assert.equal(result.connection.rolledBack, true);
});

test("updateCategoryStatus activates an inactive category", async () => {
  const result = await runTransaction(admin.updateCategoryStatus, {
    body: { isActive: true },
    executeHandler: async sql => {
      if (sql.includes("SELECT")) {
        return [[{
          category_id: "test-id",
          category_name: "Technology",
          is_active: 0
        }], []];
      }

      return [{ affectedRows: 1 }, []];
    }
  });

  assert.equal(result.res.statusCode, 200);
  assert.match(result.res.body.message, /activated/i);
  assert.equal(result.connection.committed, true);
});

test("updateCategoryStatus deactivates an active category", async () => {
  const result = await runTransaction(admin.updateCategoryStatus, {
    body: { isActive: false },
    executeHandler: async sql => {
      if (sql.includes("SELECT")) {
        return [[{
          category_id: "test-id",
          category_name: "Technology",
          is_active: 1
        }], []];
      }

      return [{ affectedRows: 1 }, []];
    }
  });

  assert.equal(result.res.statusCode, 200);
  assert.match(result.res.body.message, /deactivated/i);
  assert.equal(result.connection.committed, true);
});

// CONFIGURATION

test("updateConfiguration creates a new configuration", async () => {
  const result = await runTransaction(admin.updateConfiguration, {
    params: { key: "site.name" },
    body: {
      configValue: "EMS Platform",
      description: "Website name"
    },
    executeHandler: async sql => {
      if (sql.includes("SELECT")) return [[], []];
      return [{ affectedRows: 1 }, []];
    }
  });

  assert.equal(result.res.statusCode, 201);
  assert.equal(result.res.body.success, true);
  assert.equal(result.res.body.data.configKey, "site.name");
  assert.equal(result.res.body.data.configValue, "EMS Platform");
  assert.equal(result.connection.committed, true);
});

test("updateConfiguration updates an existing configuration", async () => {
  const result = await runTransaction(admin.updateConfiguration, {
    params: { key: "site.name" },
    body: {
      configValue: "Updated EMS",
      description: "Updated name"
    },
    executeHandler: async sql => {
      if (sql.includes("SELECT")) {
        return [[{
          config_value: '"Old EMS"',
          description: "Old name"
        }], []];
      }

      return [{ affectedRows: 1 }, []];
    }
  });

  assert.equal(result.res.statusCode, 200);
  assert.equal(result.res.body.success, true);
  assert.equal(result.res.body.data.configValue, "Updated EMS");
  assert.equal(result.connection.committed, true);
});

test("updateConfiguration forwards database errors and rolls back", async () => {
  const error = new Error("Configuration database failure");

  const result = await runTransaction(admin.updateConfiguration, {
    params: { key: "site.name" },
    body: { configValue: "EMS" },
    executeHandler: async () => {
      throw error;
    }
  });

  assert.equal(result.forwardedError, error);
  assert.equal(result.connection.rolledBack, true);
  assert.equal(result.connection.released, true);
});
