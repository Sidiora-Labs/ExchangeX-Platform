
import { createHandler, adminHandler, createMockModels } from "../helpers";

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

describe("FAQ", () => {
  it("GET /ext/faq - lists FAQ items", async () => {
    const h = (await import("@b/api/ext/faq/index.get")).default;
    mockModels.faqCategory.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });
});

// Admin FAQ
describe("Admin FAQ", () => {
  it("GET /admin/ext/faq/category - lists categories", async () => {
    const h = (await import("@b/api/admin/ext/faq/category/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/faq/question - lists questions", async () => {
    const h = (await import("@b/api/admin/ext/faq/question/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});
