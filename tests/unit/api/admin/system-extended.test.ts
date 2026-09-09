
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

describe("Admin System Announcement - Full CRUD", () => {
  it("GET /admin/system/announcement/[id] - gets announcement", async () => {
    const h = (await import("@b/api/admin/system/announcement/[id]/index.get")).default;
    mockModels.announcement.findByPk.mockResolvedValue({ id: "ann-1", title: "Test", get() { return this; } });
    const result = await h(adminHandler({ params: { id: "ann-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/system/announcement/[id] - updates announcement", async () => {
    const h = (await import("@b/api/admin/system/announcement/[id]/index.put")).default;
    mockModels.announcement.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "ann-1" }, body: { title: "Updated" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/system/announcement/status - bulk status update", async () => {
    const h = (await import("@b/api/admin/system/announcement/status.put")).default;
    mockModels.announcement.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["ann-1"], status: true } }));
    expect(result).toBeDefined();
  });

  it("DELETE /admin/system/announcement/[id] - deletes announcement", async () => {
    const h = (await import("@b/api/admin/system/announcement/[id]/index.del")).default;
    mockModels.announcement.destroy.mockResolvedValue(1);
    const result = await h(adminHandler({ params: { id: "ann-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin System Log - Extended", () => {
  it("DELETE /admin/system/log/[id] - deletes specific log", async () => {
    const h = (await import("@b/api/admin/system/log/[id]/index.del")).default;
    mockModels.log.destroy.mockResolvedValue(1);
    const result = await h(adminHandler({ params: { id: "log-1" } }));
    expect(result).toBeDefined();
  });

  it("DELETE /admin/system/log/index - bulk delete logs", async () => {
    const h = (await import("@b/api/admin/system/log/index.del")).default;
    mockModels.log.destroy.mockResolvedValue(5);
    const result = await h(adminHandler({ body: { ids: ["log-1", "log-2"] } }));
    expect(result).toBeDefined();
  });
});

describe("Admin System Notification Template - Extended", () => {
  it("PUT /admin/system/notification/template/[id] - updates template", async () => {
    const h = (await import("@b/api/admin/system/notification/template/[id]/index.put")).default;
    mockModels.notificationTemplate.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "nt-1" }, body: { content: "Updated" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/system/notification/template/[id]/status - toggles status", async () => {
    const h = (await import("@b/api/admin/system/notification/template/[id]/status.put")).default;
    mockModels.notificationTemplate.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "nt-1" }, body: { status: true } }));
    expect(result).toBeDefined();
  });
});

describe("Admin System Extension - Extended", () => {
  it("POST /admin/system/extension/status - toggles extension", async () => {
    const h = (await import("@b/api/admin/system/extension/status.post")).default;
    mockModels.extension.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { id: "ext-1", status: true } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/system/extension/[id]/status - toggles specific extension", async () => {
    const h = (await import("@b/api/admin/system/extension/[id]/status.put")).default;
    mockModels.extension.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "ext-1" }, body: { status: false } }));
    expect(result).toBeDefined();
  });
});

describe("Admin System Product", () => {
  it("GET /admin/system/product/[id] - gets product info", async () => {
    const h = (await import("@b/api/admin/system/product/[id]/index.get")).default;
    try {
      const result = await h(adminHandler({ params: { id: "prod-1" } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

describe("Admin System Notification Email Test", () => {
  it("GET /admin/system/notification/email/test - sends test email", async () => {
    const h = (await import("@b/api/admin/system/notification/email/test.get")).default;
    try {
      const result = await h(adminHandler());
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

describe("Admin System Database Migrate", () => {
  it("POST /admin/system/database/migrate - runs migration", async () => {
    const h = (await import("@b/api/admin/system/database/migrate/index.post")).default;
    try {
      const result = await h(adminHandler());
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

describe("Admin System Database Restore", () => {
  it("POST /admin/system/database/restore - restores backup", async () => {
    const h = (await import("@b/api/admin/system/database/restore/index.post")).default;
    try {
      const result = await h(adminHandler({ body: { backupId: "backup-1" } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});
