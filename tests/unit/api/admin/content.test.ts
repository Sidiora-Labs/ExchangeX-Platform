
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

describe("Admin Content - Posts", () => {
  it("GET /admin/content/post - lists posts", async () => {
    const h = (await import("@b/api/admin/content/post/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/content/post - creates post", async () => {
    const h = (await import("@b/api/admin/content/post/index.post")).default;
    mockModels.post.create.mockResolvedValue({ id: "post-new" });
    const result = await h(adminHandler({ body: { title: "Test Post", content: "Body" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Content - Pages", () => {
  it("GET /admin/content/page - lists pages", async () => {
    const h = (await import("@b/api/admin/content/page/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/content/page - creates page", async () => {
    const h = (await import("@b/api/admin/content/page/index.post")).default;
    mockModels.page.create.mockResolvedValue({ id: "page-new" });
    const result = await h(adminHandler({ body: { title: "About", content: "About us" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Content - Categories", () => {
  it("GET /admin/content/category - lists categories", async () => {
    const h = (await import("@b/api/admin/content/category/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/content/category - creates category", async () => {
    const h = (await import("@b/api/admin/content/category/index.post")).default;
    mockModels.category.create.mockResolvedValue({ id: "cat-new" });
    const result = await h(adminHandler({ body: { name: "News" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Content - Tags", () => {
  it("GET /admin/content/tag - lists tags", async () => {
    const h = (await import("@b/api/admin/content/tag/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});

describe("Admin Content - Sliders", () => {
  it("GET /admin/content/slider - lists sliders", async () => {
    const h = (await import("@b/api/admin/content/slider/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});

describe("Admin Content - Comments", () => {
  it("GET /admin/content/comment - lists comments", async () => {
    const h = (await import("@b/api/admin/content/comment/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});

describe("Admin Content - Media", () => {
  it("GET /admin/content/media - lists media", async () => {
    const h = (await import("@b/api/admin/content/media/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});

describe("Admin Content - Authors", () => {
  it("GET /admin/content/author - lists authors", async () => {
    const h = (await import("@b/api/admin/content/author/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});

describe("Admin Content - Editor", () => {
  it("GET /admin/content/editor - returns editor config", async () => {
    const h = (await import("@b/api/admin/content/editor/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});
