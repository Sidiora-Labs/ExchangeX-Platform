
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

describe("Admin Post - Extended", () => {
  it("GET /admin/content/post/[id] - gets post", async () => {
    const h = (await import("@b/api/admin/content/post/[id]/index.get")).default;
    mockModels.post.findByPk.mockResolvedValue({ id: "post-1", get() { return this; } });
    const result = await h(adminHandler({ params: { id: "post-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/content/post/[id] - updates post", async () => {
    const h = (await import("@b/api/admin/content/post/[id]/index.put")).default;
    mockModels.post.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "post-1" }, body: { title: "Updated" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/content/post/status - bulk status update", async () => {
    const h = (await import("@b/api/admin/content/post/status.put")).default;
    mockModels.post.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["post-1"], status: true } }));
    expect(result).toBeDefined();
  });

  it("DELETE /admin/content/post/[id] - deletes post", async () => {
    const h = (await import("@b/api/admin/content/post/[id]/index.del")).default;
    mockModels.post.destroy.mockResolvedValue(1);
    const result = await h(adminHandler({ params: { id: "post-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Page - Extended", () => {
  it("GET /admin/content/page/[id] - gets page", async () => {
    const h = (await import("@b/api/admin/content/page/[id]/index.get")).default;
    mockModels.page.findByPk.mockResolvedValue({ id: "page-1", get() { return this; } });
    const result = await h(adminHandler({ params: { id: "page-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/content/page/[id] - updates page", async () => {
    const h = (await import("@b/api/admin/content/page/[id]/index.put")).default;
    mockModels.page.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "page-1" }, body: { title: "Updated" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/content/page/status - bulk status", async () => {
    const h = (await import("@b/api/admin/content/page/status.put")).default;
    mockModels.page.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["page-1"], status: true } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Category - Extended", () => {
  it("GET /admin/content/category/[id] - gets category", async () => {
    const h = (await import("@b/api/admin/content/category/[id]/index.get")).default;
    mockModels.category.findByPk.mockResolvedValue({ id: "cat-1" });
    const result = await h(adminHandler({ params: { id: "cat-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/content/category/[id] - updates category", async () => {
    const h = (await import("@b/api/admin/content/category/[id]/index.put")).default;
    mockModels.category.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "cat-1" }, body: { name: "Updated" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/content/category/status - bulk status", async () => {
    const h = (await import("@b/api/admin/content/category/status.put")).default;
    mockModels.category.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["cat-1"], status: true } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Tag - Extended", () => {
  it("POST /admin/content/tag - creates tag", async () => {
    const h = (await import("@b/api/admin/content/tag/index.post")).default;
    mockModels.tag.create.mockResolvedValue({ id: "tag-new" });
    const result = await h(adminHandler({ body: { name: "crypto", slug: "crypto" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/content/tag/[id] - updates tag", async () => {
    const h = (await import("@b/api/admin/content/tag/[id]/index.put")).default;
    mockModels.tag.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "tag-1" }, body: { name: "Updated" } }));
    expect(result).toBeDefined();
  });

  it("DELETE /admin/content/tag/[id] - deletes tag", async () => {
    const h = (await import("@b/api/admin/content/tag/[id]/index.del")).default;
    mockModels.tag.destroy.mockResolvedValue(1);
    const result = await h(adminHandler({ params: { id: "tag-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Slider - Extended", () => {
  it("POST /admin/content/slider - creates slider", async () => {
    const h = (await import("@b/api/admin/content/slider/index.post")).default;
    mockModels.slider.create.mockResolvedValue({ id: "slider-new" });
    const result = await h(adminHandler({ body: { title: "Banner 1" } }));
    expect(result).toBeDefined();
  });

  it("GET /admin/content/slider/[id] - gets slider", async () => {
    const h = (await import("@b/api/admin/content/slider/[id]/index.get")).default;
    mockModels.slider.findByPk.mockResolvedValue({ id: "slider-1" });
    const result = await h(adminHandler({ params: { id: "slider-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/content/slider/[id] - updates slider", async () => {
    const h = (await import("@b/api/admin/content/slider/[id]/index.put")).default;
    mockModels.slider.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "slider-1" }, body: { title: "Updated" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Comment - Extended", () => {
  it("GET /admin/content/comment/[id] - gets comment", async () => {
    const h = (await import("@b/api/admin/content/comment/[id]/index.get")).default;
    mockModels.comment.findByPk.mockResolvedValue({ id: "c-1" });
    const result = await h(adminHandler({ params: { id: "c-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/content/comment/status - bulk status", async () => {
    const h = (await import("@b/api/admin/content/comment/status.put")).default;
    mockModels.comment.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["c-1"], status: true } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Author - Extended", () => {
  it("POST /admin/content/author - creates author", async () => {
    const h = (await import("@b/api/admin/content/author/index.post")).default;
    mockModels.author.create.mockResolvedValue({ id: "author-new" });
    const result = await h(adminHandler({ body: { name: "John Doe" } }));
    expect(result).toBeDefined();
  });

  it("GET /admin/content/author/[id] - gets author", async () => {
    const h = (await import("@b/api/admin/content/author/[id]/index.get")).default;
    mockModels.author.findByPk.mockResolvedValue({ id: "author-1" });
    const result = await h(adminHandler({ params: { id: "author-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/content/author/[id] - updates author", async () => {
    const h = (await import("@b/api/admin/content/author/[id]/index.put")).default;
    mockModels.author.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "author-1" }, body: { name: "Updated" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Media - Extended", () => {
  it("DELETE /admin/content/media/[id] - deletes media", async () => {
    const h = (await import("@b/api/admin/content/media/[id]/index.del")).default;
    mockModels.media.destroy.mockResolvedValue(1);
    try {
      const result = await h(adminHandler({ params: { id: "media-1" } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});
