
import { createHandler, createMockModels } from "../helpers";

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

describe("Public Content - Posts", () => {
  it("GET /content/post - lists published posts", async () => {
    const h = (await import("@b/api/content/post/index.get")).default;
    mockModels.post.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /content/post/[slug] - gets post by slug", async () => {
    const h = (await import("@b/api/content/post/[slug]/index.get")).default;
    mockModels.post.findOne.mockResolvedValue({ id: "post-1", slug: "test-post", get() { return this; } });
    const result = await h(createHandler({ params: { slug: "test-post" } }));
    expect(result).toBeDefined();
  });
});

describe("Public Content - Pages", () => {
  it("GET /content/page - lists pages", async () => {
    const h = (await import("@b/api/content/page/index.get")).default;
    mockModels.page.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /content/page/[id] - gets page by id", async () => {
    const h = (await import("@b/api/content/page/[id]/index.get")).default;
    mockModels.page.findByPk.mockResolvedValue({ id: "page-1", get() { return this; } });
    const result = await h(createHandler({ params: { id: "page-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Public Content - Categories", () => {
  it("GET /content/category - lists categories", async () => {
    const h = (await import("@b/api/content/category/index.get")).default;
    mockModels.category.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /content/category/[id] - gets category", async () => {
    const h = (await import("@b/api/content/category/[id]/index.get")).default;
    mockModels.category.findByPk.mockResolvedValue({ id: "cat-1" });
    const result = await h(createHandler({ params: { id: "cat-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Public Content - Tags", () => {
  it("GET /content/tag - lists tags", async () => {
    const h = (await import("@b/api/content/tag/index.get")).default;
    mockModels.tag.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /content/tag/[slug] - gets tag by slug", async () => {
    const h = (await import("@b/api/content/tag/[slug]/index.get")).default;
    mockModels.tag.findOne.mockResolvedValue({ id: "tag-1", slug: "crypto" });
    const result = await h(createHandler({ params: { slug: "crypto" } }));
    expect(result).toBeDefined();
  });
});

describe("Public Content - Sliders", () => {
  it("GET /content/slider - lists sliders", async () => {
    const h = (await import("@b/api/content/slider/index.get")).default;
    mockModels.slider.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });
});

describe("Public Content - Comments", () => {
  it("GET /content/comment - lists comments", async () => {
    const h = (await import("@b/api/content/comment/index.get")).default;
    mockModels.comment.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /content/comment/[postId] - adds comment", async () => {
    const h = (await import("@b/api/content/comment/[postId]/index.post")).default;
    mockModels.post.findByPk.mockResolvedValue({ id: "post-1" });
    mockModels.comment.create.mockResolvedValue({ id: "comment-new" });
    const result = await h(createHandler({
      params: { postId: "post-1" },
      body: { content: "Great article!" },
    }));
    expect(result).toBeDefined();
  });
});

describe("Public Content - Authors", () => {
  it("GET /content/author - lists authors", async () => {
    const h = (await import("@b/api/content/author/index.get")).default;
    mockModels.author.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /content/author/[authorId] - gets author", async () => {
    const h = (await import("@b/api/content/author/[authorId]/index.get")).default;
    mockModels.author.findOne.mockResolvedValue({ id: "author-1" });
    const result = await h(createHandler({ params: { authorId: "author-1" } }));
    expect(result).toBeDefined();
  });
});
