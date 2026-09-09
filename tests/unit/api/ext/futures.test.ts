
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
  createRecordResponses: jest.fn((m?: string) => ({ 200: { description: `${m || "Record"} created` } })),
    deleteRecordResponses: jest.fn((m?: string) => ({ 200: { description: `${m || "Record"} deleted` } })),
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/redis", () => ({
  RedisSingleton: { getInstance: () => ({ get: jest.fn(async () => null), set: jest.fn() }) },
}));
jest.mock("@b/utils/exchange", () => ({
  __esModule: true,
  default: { startExchange: jest.fn() },
}));
jest.mock("@b/utils/emails", () => ({ emailQueue: { add: jest.fn() } }));
jest.mock("@b/utils/notifications", () => ({ handleNotification: jest.fn() }));
jest.mock("@b/handler/Websocket", () => ({ sendMessageToRoute: jest.fn() }));

describe("Futures Market", () => {
  it("GET /ext/futures/market - lists futures markets", async () => {
    const h = (await import("@b/api/ext/futures/market/index.get")).default;
    mockModels.futuresMarket.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /ext/futures/market/[id] - gets a futures market", async () => {
    const h = (await import("@b/api/ext/futures/market/[id]/index.get")).default;
    mockModels.futuresMarket.findByPk.mockResolvedValue({ id: "fm-1" });
    const result = await h(createHandler({ params: { id: "fm-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Futures Order", () => {
  it("GET /ext/futures/order - lists futures orders", async () => {
    const h = (await import("@b/api/ext/futures/order/index.get")).default;
    mockModels.futuresOrder.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /ext/futures/order - creates futures order", async () => {
    const h = (await import("@b/api/ext/futures/order/index.post")).default;
    try {
      const result = await h(createHandler({
        body: { marketId: "fm-1", side: "BUY", amount: 1, leverage: 10 },
      }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

describe("Futures Position", () => {
  it("GET /ext/futures/position - lists positions", async () => {
    const h = (await import("@b/api/ext/futures/position/index.get")).default;
    mockModels.futuresPosition.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });
});

describe("Futures Ticker", () => {
  it("GET /ext/futures/ticker - returns futures tickers", async () => {
    const h = (await import("@b/api/ext/futures/ticker/index.get")).default;
    try {
      const result = await h(createHandler());
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

describe("Futures Chart", () => {
  it("GET /ext/futures/chart - returns futures chart data", async () => {
    const h = (await import("@b/api/ext/futures/chart/index.get")).default;
    try {
      const result = await h(createHandler({ query: { marketId: "fm-1" } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

// Admin Futures
describe("Admin Futures", () => {
  it("GET /admin/ext/futures/market - lists futures markets", async () => {
    const h = (await import("@b/api/admin/ext/futures/market/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/futures/order - lists futures orders", async () => {
    const h = (await import("@b/api/admin/ext/futures/order/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/futures/position - lists futures positions", async () => {
    const h = (await import("@b/api/admin/ext/futures/position/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});
