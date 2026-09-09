
import { adminHandler, createMockModels } from "../helpers";

const mockModels = createMockModels({
  mailwizardCampaign: {
    findAll: jest.fn(async () => []),
    findByPk: jest.fn(async () => ({ id: "mc-1" })),
    create: jest.fn(async (d: any) => ({ ...d, id: "mc-new" })),
    update: jest.fn(async () => [1]),
    destroy: jest.fn(async () => 1),
    count: jest.fn(async () => 1),
  },
  mailwizardTemplate: {
    findAll: jest.fn(async () => []),
    findByPk: jest.fn(async () => ({ id: "mt-1" })),
    create: jest.fn(async (d: any) => ({ ...d, id: "mt-new" })),
    update: jest.fn(async () => [1]),
    destroy: jest.fn(async () => 1),
    count: jest.fn(async () => 1),
  },
});

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

describe("Admin Mailwizard Campaign", () => {
  it("GET /admin/ext/mailwizard/campaign - lists campaigns", async () => {
    const h = (await import("@b/api/admin/ext/mailwizard/campaign/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/ext/mailwizard/campaign - creates campaign", async () => {
    const h = (await import("@b/api/admin/ext/mailwizard/campaign/index.post")).default;
    const result = await h(adminHandler({ body: { name: "Test Campaign" } }));
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/mailwizard/campaign/[id] - gets campaign", async () => {
    const h = (await import("@b/api/admin/ext/mailwizard/campaign/[id]/index.get")).default;
    const result = await h(adminHandler({ params: { id: "mc-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/ext/mailwizard/campaign/[id] - updates campaign", async () => {
    const h = (await import("@b/api/admin/ext/mailwizard/campaign/[id]/index.put")).default;
    const result = await h(adminHandler({ params: { id: "mc-1" }, body: { name: "Updated" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Mailwizard Template", () => {
  it("GET /admin/ext/mailwizard/template - lists templates", async () => {
    const h = (await import("@b/api/admin/ext/mailwizard/template/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/ext/mailwizard/template - creates template", async () => {
    const h = (await import("@b/api/admin/ext/mailwizard/template/index.post")).default;
    const result = await h(adminHandler({ body: { name: "Welcome", content: "Hello!" } }));
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/mailwizard/template/[id] - gets template", async () => {
    const h = (await import("@b/api/admin/ext/mailwizard/template/[id]/index.get")).default;
    const result = await h(adminHandler({ params: { id: "mt-1" } }));
    expect(result).toBeDefined();
  });
});
