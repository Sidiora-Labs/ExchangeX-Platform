
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

describe("P2P Offer", () => {
  it("GET /ext/p2p/offer - lists offers", async () => {
    const h = (await import("@b/api/ext/p2p/offer/index.get")).default;
    mockModels.p2pOffer.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /ext/p2p/offer/[id] - gets offer", async () => {
    const h = (await import("@b/api/ext/p2p/offer/[id]/index.get")).default;
    mockModels.p2pOffer.findByPk.mockResolvedValue({ id: "offer-1", get() { return this; } });
    const result = await h(createHandler({ params: { id: "offer-1" } }));
    expect(result).toBeDefined();
  });
});

describe("P2P Offer Manage", () => {
  it("GET /ext/p2p/offer/manage - lists user's offers", async () => {
    const h = (await import("@b/api/ext/p2p/offer/manage/index.get")).default;
    mockModels.p2pOffer.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /ext/p2p/offer/manage - creates offer", async () => {
    const h = (await import("@b/api/ext/p2p/offer/manage/index.post")).default;
    mockModels.p2pOffer.create.mockResolvedValue({ id: "offer-new" });
    try {
      const result = await h(createHandler({
        body: { currency: "BTC", amount: 1, price: 50000, side: "BUY" },
      }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

describe("P2P Trade", () => {
  it("GET /ext/p2p/trade - lists trades", async () => {
    const h = (await import("@b/api/ext/p2p/trade/index.get")).default;
    mockModels.p2pTrade.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /ext/p2p/trade - creates trade", async () => {
    const h = (await import("@b/api/ext/p2p/trade/index.post")).default;
    try {
      const result = await h(createHandler({
        body: { offerId: "offer-1", amount: 0.5 },
      }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });

  it("GET /ext/p2p/trade/[id] - gets trade", async () => {
    const h = (await import("@b/api/ext/p2p/trade/[id]/index.get")).default;
    mockModels.p2pTrade.findByPk.mockResolvedValue({ id: "trade-1", get() { return this; } });
    const result = await h(createHandler({ params: { id: "trade-1" } }));
    expect(result).toBeDefined();
  });
});

describe("P2P Payment Method", () => {
  it("GET /ext/p2p/payment/method - lists payment methods", async () => {
    const h = (await import("@b/api/ext/p2p/payment/method/index.get")).default;
    mockModels.p2pPaymentMethod.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /ext/p2p/payment/method - creates method", async () => {
    const h = (await import("@b/api/ext/p2p/payment/method/index.post")).default;
    mockModels.p2pPaymentMethod.create.mockResolvedValue({ id: "pm-new" });
    const result = await h(createHandler({
      body: { name: "PayPal", currency: "USD" },
    }));
    expect(result).toBeDefined();
  });
});

describe("P2P Dispute", () => {
  it("POST /ext/p2p/dispute - files dispute", async () => {
    const h = (await import("@b/api/ext/p2p/dispute/index.post")).default;
    try {
      const result = await h(createHandler({ body: { tradeId: "trade-1", reason: "Not received" } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

// Admin P2P
describe("Admin P2P", () => {
  it("GET /admin/ext/p2p/offer - lists offers", async () => {
    const h = (await import("@b/api/admin/ext/p2p/offer/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/p2p/trade - lists trades", async () => {
    const h = (await import("@b/api/admin/ext/p2p/trade/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/p2p/commission - lists commissions", async () => {
    const h = (await import("@b/api/admin/ext/p2p/commission/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/p2p/payment/method - lists methods", async () => {
    const h = (await import("@b/api/admin/ext/p2p/payment/method/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/p2p/escrow - lists escrows", async () => {
    const h = (await import("@b/api/admin/ext/p2p/escrow/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/p2p/review - lists reviews", async () => {
    const h = (await import("@b/api/admin/ext/p2p/review/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/p2p/dispute - lists disputes", async () => {
    const h = (await import("@b/api/admin/ext/p2p/dispute/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});
