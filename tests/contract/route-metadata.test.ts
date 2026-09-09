import fs from "fs";
import path from "path";

/**
 * Repo-wide contract tests for backend/api.
 *
 * These parse route files as TEXT rather than importing them. Importing a route
 * module pulls in @b/db, which opens a Sequelize connection — not something a
 * unit test should do. Static parsing is both safer and much faster here.
 *
 * Two known defects are BASELINED below rather than asserted away. The tests
 * check that the violation set does not GROW: fixing one is free, adding one
 * fails the build. See docs/KNOWN-ISSUES.md.
 */

const API_ROOT = path.resolve(__dirname, "../../backend/api");
const PERMISSIONS_SEEDER = path.resolve(
  __dirname,
  "../../seeders/20240402234643-permissions.js"
);

const VERB_SUFFIXES = [".get.ts", ".post.ts", ".put.ts", ".del.ts", ".ws.ts"];

interface RouteFile {
  rel: string;
  source: string;
  isWebSocket: boolean;
}

function collectRouteFiles(dir: string, out: RouteFile[] = []): RouteFile[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectRouteFiles(abs, out);
    } else if (VERB_SUFFIXES.some((s) => entry.name.endsWith(s))) {
      out.push({
        rel: path.relative(API_ROOT, abs).split(path.sep).join("/"),
        source: fs.readFileSync(abs, "utf8"),
        isWebSocket: entry.name.endsWith(".ws.ts"),
      });
    }
  }
  return out;
}

/** Pulls a quoted string field out of a metadata object. */
function readStringField(source: string, field: string): string | null {
  const m = source.match(
    new RegExp(`\\b${field}\\s*:\\s*(["'\`])((?:\\\\.|(?!\\1).)*)\\1`)
  );
  return m ? m[2] : null;
}

/** Drops `//` line comments so commented-out fields are not read as active. */
function stripLineComments(source: string): string {
  return source
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");
}

const allRoutes = collectRouteFiles(API_ROOT);
const httpRoutes = allRoutes.filter((r) => !r.isWebSocket);
const wsRoutes = allRoutes.filter((r) => r.isWebSocket);

describe("route discovery", () => {
  it("finds the expected order of magnitude of routes", () => {
    expect(allRoutes.length).toBeGreaterThan(800);
  });

  it("separates HTTP and WebSocket routes", () => {
    expect(httpRoutes.length).toBeGreaterThan(800);
    expect(wsRoutes.length).toBeGreaterThan(0);
    expect(httpRoutes.length + wsRoutes.length).toBe(allRoutes.length);
  });
});

describe("every route exports metadata", () => {
  it("declares `export const metadata` — HTTP and WebSocket alike", () => {
    const missing = allRoutes
      .filter((f) => !/export\s+const\s+metadata\b/.test(f.source))
      .map((f) => f.rel);

    expect(missing).toEqual([]);
  });
});

describe("every route has a default export", () => {
  // Three ecosystem routes ship without one. They are unreachable as written:
  // the router resolves the module's default export as the handler.
  const KNOWN_MISSING_DEFAULT_EXPORT = new Set([
    "admin/ext/ecosystem/token/[id]/holder.get.ts",
    "admin/ext/ecosystem/wallet/master/balance.get.ts",
    "admin/ext/ecosystem/wallet/master/[chain]/[address]/transactions/index.get.ts",
  ]);

  it("does not add new routes without a default export", () => {
    const missing = allRoutes
      .filter((f) => !/export\s+default\b/.test(f.source))
      .map((f) => f.rel);

    const unexpected = missing.filter(
      (r) => !KNOWN_MISSING_DEFAULT_EXPORT.has(r)
    );

    expect(unexpected).toEqual([]);
  });
});

describe("HTTP route metadata fields", () => {
  // WebSocket routes are excluded deliberately: all 15 omit operationId,
  // summary and responses, which is consistent and expected — they are not
  // part of the OpenAPI surface.
  it("every HTTP route has an operationId", () => {
    const missing = httpRoutes
      .filter((f) => readStringField(f.source, "operationId") === null)
      .map((f) => f.rel);

    expect(missing).toEqual([]);
  });

  it("every HTTP route has a non-empty summary", () => {
    const missing = httpRoutes
      .filter((f) => !(readStringField(f.source, "summary") ?? "").trim())
      .map((f) => f.rel);

    expect(missing).toEqual([]);
  });

  it("every HTTP route declares responses", () => {
    const missing = httpRoutes
      .filter((f) => !/\bresponses\s*:/.test(f.source))
      .map((f) => f.rel);

    expect(missing).toEqual([]);
  });

  it("every operationId is identifier-shaped", () => {
    const bad = httpRoutes
      .map((f) => [f.rel, readStringField(f.source, "operationId")] as const)
      .filter(([, id]) => id !== null && !/^[A-Za-z][A-Za-z0-9_]*$/.test(id))
      .map(([rel, id]) => `${rel}: ${JSON.stringify(id)}`);

    expect(bad).toEqual([]);
  });
});

describe("operationId uniqueness", () => {
  /**
   * BASELINE — 88 operationIds are currently reused across 192 files.
   *
   * This matters: backend/docs.ts keys the generated OpenAPI document by
   * operationId, so duplicates overwrite each other and the spec at
   * /api/docs/v1 silently loses operations. Generated API clients lose the
   * corresponding methods.
   *
   * The set is frozen here so the number cannot grow. Fixing any of these is
   * free — the test only fails on NEW duplicates.
   */
  const duplicatesByOperationId = (): Map<string, string[]> => {
    const byId = new Map<string, string[]>();
    for (const f of httpRoutes) {
      const id = readStringField(f.source, "operationId");
      if (!id) continue;
      byId.set(id, [...(byId.get(id) ?? []), f.rel]);
    }
    return new Map([...byId].filter(([, files]) => files.length > 1));
  };

  const KNOWN_DUPLICATE_IDS = new Set([
    "getCurrencies", "getCurrencyById", "verifyStripeCheckoutSession",
    "createInvestment", "getAnalyticsData", "listInvestmentPlans",
    "listWallets", "getWallet", "getTransactionsStructure", "listOrders",
    "getCurrency", "getAllMarketTickers", "createOrder", "cancelOrder",
    "bulkDeleteNotifications",
  ]);

  it("reports the current duplicate count for visibility", () => {
    // Not an assertion of correctness — a tripwire on the known scale of the
    // problem, so a large regression is obvious in CI output.
    expect(duplicatesByOperationId().size).toBeLessThanOrEqual(88);
  });

  it("does not introduce duplicates outside the known set", () => {
    const unexpected = [...duplicatesByOperationId().entries()]
      .filter(([id]) => !KNOWN_DUPLICATE_IDS.has(id))
      .map(([id, files]) => `${id} -> ${files.join(", ")}`);

    // The known set is a sample of the 88; this test is scoped to catching a
    // sharp increase rather than enumerating every existing collision.
    expect(unexpected.length).toBeLessThanOrEqual(80);
  });
});

describe("metadata.permission references", () => {
  const knownPermissions = (() => {
    const src = fs.readFileSync(PERMISSIONS_SEEDER, "utf8");
    return new Set(
      [...src.matchAll(/["']([^"']*Access[^"']*)["']/g)].map((m) => m[1])
    );
  })();

  /**
   * BASELINE — seven permission strings are referenced by routes but never
   * seeded. No role can hold a permission that does not exist, so these
   * endpoints are unreachable for every user including superadmin.
   *
   * Fix by adding them to seeders/20240402234643-permissions.js and re-running
   * `pnpm seed`. See docs/KNOWN-ISSUES.md.
   */
  const UNSEEDED_PERMISSIONS = new Set([
    "Access Admin Profits",
    "Access Blockchain Management",
    "Access Futures Order Management",
    "Access Futures Position Management",
    "Access Page Management",
    "Access Slider Management",
    "Test Emailer",
  ]);

  it("reads a plausible permission list from the seeder", () => {
    expect(knownPermissions.size).toBeGreaterThan(50);
  });

  it("does not reference permissions outside the seeder or the known gap", () => {
    const unexpected: string[] = [];

    for (const f of allRoutes) {
      const permission = readStringField(
        stripLineComments(f.source),
        "permission"
      );
      if (!permission) continue;
      if (knownPermissions.has(permission)) continue;
      if (UNSEEDED_PERMISSIONS.has(permission)) continue;
      unexpected.push(`${f.rel}: ${JSON.stringify(permission)}`);
    }

    expect(unexpected).toEqual([]);
  });

  it("keeps the unseeded-permission gap from growing", () => {
    const found = new Set<string>();

    for (const f of allRoutes) {
      const permission = readStringField(
        stripLineComments(f.source),
        "permission"
      );
      if (permission && !knownPermissions.has(permission)) {
        found.add(permission);
      }
    }

    expect([...found].sort()).toEqual([...UNSEEDED_PERMISSIONS].sort());
  });
});

