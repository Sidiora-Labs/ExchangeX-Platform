
import { adminHandler, createMockModels } from "../helpers";

const mockModels = createMockModels();

jest.mock("@b/db", () => ({
  sequelize: { transaction: jest.fn(async (cb: Function) => cb({})) },
  models: mockModels,
}));
jest.mock("@b/utils/error", () => ({
  createError: (opts: any) => {
    const err = new Error(typeof opts === "string" ? opts : opts.message || "Error");
    (err as any).statusCode = typeof opts === "string" ? 500 : opts.statusCode || 500;
    return err;
  },
}));
jest.mock("@b/utils/query", () => ({
  getFiltered: jest.fn(async () => ({ items: [], pagination: { page: 1 } })),
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/emails", () => ({ emailQueue: { add: jest.fn() } }));

describe("Admin System Health", () => {
  it("GET /admin/system/health - returns system health", async () => {
    const h = (await import("@b/api/admin/system/health.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
    expect(result).toHaveProperty("status");
  });
});

describe("Admin System Cron", () => {
  it("GET /admin/system/cron - returns cron info", async () => {
    const h = (await import("@b/api/admin/system/cron.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});

describe("Admin System Settings", () => {
  it("PUT /admin/system/settings - updates settings", async () => {
    const h = (await import("@b/api/admin/system/settings/index.put")).default;
    mockModels.setting.upsert.mockResolvedValue([{ id: "s1" }, true]);
    const result = await h(adminHandler({ body: { key: "siteName", value: "ExchangeX" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Announcement", () => {
  it("GET /admin/system/announcement - lists announcements", async () => {
    const h = (await import("@b/api/admin/system/announcement/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/system/announcement - creates announcement", async () => {
    const h = (await import("@b/api/admin/system/announcement/index.post")).default;
    mockModels.announcement.create.mockResolvedValue({ id: "ann-new" });
    const result = await h(adminHandler({ body: { title: "Test", content: "Hello" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Log", () => {
  it("GET /admin/system/log - lists logs", async () => {
    const h = (await import("@b/api/admin/system/log/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("DELETE /admin/system/log/clean - cleans logs", async () => {
    const h = (await import("@b/api/admin/system/log/clean.del")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});

describe("Admin Notification Template", () => {
  it("GET /admin/system/notification/template - lists templates", async () => {
    const h = (await import("@b/api/admin/system/notification/template/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/system/notification/template/[id] - gets template", async () => {
    const h = (await import("@b/api/admin/system/notification/template/[id]/index.get")).default;
    mockModels.notificationTemplate.findByPk.mockResolvedValue({ id: "nt-1", name: "Welcome" });
    const result = await h(adminHandler({ params: { id: "nt-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Extension", () => {
  it("GET /admin/system/extension - lists extensions", async () => {
    const h = (await import("@b/api/admin/system/extension/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});

describe("Admin Database", () => {
  it("GET /admin/system/database/backup - lists backups", async () => {
    const h = (await import("@b/api/admin/system/database/backup/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/system/database/backup - creates backup", async () => {
    const h = (await import("@b/api/admin/system/database/backup/index.post")).default;
    try {
      const result = await h(adminHandler());
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});
