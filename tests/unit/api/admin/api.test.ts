
import { adminHandler, createMockModels } from "../helpers";

const mockModels = createMockModels({
  api: {
    findOne: jest.fn(async () => null),
    findAll: jest.fn(async () => [{ id: "api-1", name: "v1" }]),
    findByPk: jest.fn(async () => ({ id: "api-1", name: "v1" })),
    create: jest.fn(async (d: any) => ({ ...d, id: "api-new" })),
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

describe("Admin API Management", () => {
  it("GET /admin/api - lists APIs", async () => {
    const h = (await import("@b/api/admin/api/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/api - creates API", async () => {
    const h = (await import("@b/api/admin/api/index.post")).default;
    const result = await h(adminHandler({ body: { name: "v2", key: "key123" } }));
    expect(result).toBeDefined();
  });

  it("GET /admin/api/[id] - gets API", async () => {
    const h = (await import("@b/api/admin/api/[id]/index.get")).default;
    const result = await h(adminHandler({ params: { id: "api-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/api/[id] - updates API", async () => {
    const h = (await import("@b/api/admin/api/[id]/index.put")).default;
    const result = await h(adminHandler({ params: { id: "api-1" }, body: { name: "v1-updated" } }));
    expect(result).toBeDefined();
  });

  it("DELETE /admin/api/[id] - deletes API", async () => {
    const h = (await import("@b/api/admin/api/[id]/index.del")).default;
    const result = await h(adminHandler({ params: { id: "api-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Analysis", () => {
  it("POST /admin/analysis - returns admin analysis data", async () => {
    const h = (await import("@b/api/admin/analysis.post")).default;
    mockModels.user.count.mockResolvedValue(100);
    mockModels.transaction.count.mockResolvedValue(500);
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});
