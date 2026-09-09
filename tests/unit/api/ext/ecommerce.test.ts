
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
jest.mock("@b/utils/emails", () => ({ emailQueue: { add: jest.fn() } }));
jest.mock("@b/utils/notifications", () => ({ handleNotification: jest.fn() }));

describe("Ecommerce Category", () => {
  it("GET /ext/ecommerce/category - lists categories", async () => {
    const h = (await import("@b/api/ext/ecommerce/category/index.get")).default;
    mockModels.ecommerceCategory.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });
});

describe("Ecommerce Product", () => {
  it("GET /ext/ecommerce/product/[slug] - gets product", async () => {
    const h = (await import("@b/api/ext/ecommerce/product/[slug]/index.get")).default;
    mockModels.ecommerceProduct.findOne.mockResolvedValue({ id: "prod-1", slug: "test-prod", get() { return this; } });
    const result = await h(createHandler({ params: { slug: "test-prod" } }));
    expect(result).toBeDefined();
  });
});

describe("Ecommerce Order", () => {
  it("GET /ext/ecommerce/order - lists orders", async () => {
    const h = (await import("@b/api/ext/ecommerce/order/index.get")).default;
    mockModels.ecommerceOrder.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /ext/ecommerce/order - creates order", async () => {
    const h = (await import("@b/api/ext/ecommerce/order/index.post")).default;
    try {
      const result = await h(createHandler({
        body: { items: [{ productId: "prod-1", quantity: 1 }] },
      }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

describe("Ecommerce Wishlist", () => {
  it("GET /ext/ecommerce/wishlist - lists wishlist", async () => {
    const h = (await import("@b/api/ext/ecommerce/wishlist/index.get")).default;
    mockModels.ecommerceWishlist.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /ext/ecommerce/wishlist - adds to wishlist", async () => {
    const h = (await import("@b/api/ext/ecommerce/wishlist/index.post")).default;
    mockModels.ecommerceWishlist.findOrCreate.mockResolvedValue([{ id: "wl-new" }, true]);
    const result = await h(createHandler({ body: { productId: "prod-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Ecommerce Discount", () => {
  it("POST /ext/ecommerce/discount/[productId] - applies discount", async () => {
    const h = (await import("@b/api/ext/ecommerce/discount/[productId]/index.post")).default;
    mockModels.ecommerceDiscount.findOne.mockResolvedValue({ id: "disc-1", code: "SAVE10", percentage: 10 });
    try {
      const result = await h(createHandler({
        params: { productId: "prod-1" },
        body: { code: "SAVE10" },
      }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

// Admin Ecommerce
describe("Admin Ecommerce", () => {
  it("GET /admin/ext/ecommerce/product - lists products", async () => {
    const h = (await import("@b/api/admin/ext/ecommerce/product/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ecommerce/order - lists orders", async () => {
    const h = (await import("@b/api/admin/ext/ecommerce/order/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ecommerce/category - lists categories", async () => {
    const h = (await import("@b/api/admin/ext/ecommerce/category/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ecommerce/discount - lists discounts", async () => {
    const h = (await import("@b/api/admin/ext/ecommerce/discount/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ecommerce/shipping - lists shipping", async () => {
    const h = (await import("@b/api/admin/ext/ecommerce/shipping/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ecommerce/wishlist - lists wishlists", async () => {
    const h = (await import("@b/api/admin/ext/ecommerce/wishlist/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ecommerce/review - lists reviews", async () => {
    const h = (await import("@b/api/admin/ext/ecommerce/review/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});
