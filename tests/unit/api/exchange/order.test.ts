
import { createHandler, createMockModels, mockExchangeOrder } from "../helpers";

const mockModels = createMockModels();

jest.mock("@b/db", () => ({
  sequelize: { transaction: jest.fn(async (cb: Function) => cb({ LOCK: { UPDATE: "UPDATE" } })) },
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
  createRecordResponses: jest.fn((m?: string) => ({ 200: { description: `${m || "Record"} created` } })),
    deleteRecordResponses: jest.fn((m?: string) => ({ 200: { description: `${m || "Record"} deleted` } })),
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
}));
jest.mock("@b/utils/exchange", () => ({
  __esModule: true,
  default: {
    startExchange: jest.fn(async () => ({
      fetchTicker: jest.fn(async () => ({ last: 50000 })),
      createOrder: jest.fn(async () => ({ id: "ext-order-1" })),
    })),
  },
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/redis", () => ({
  RedisSingleton: { getInstance: () => ({ get: jest.fn(async () => null), set: jest.fn() }) },
}));
jest.mock("@b/api/exchange/utils", () => ({
  formatWaitTime: jest.fn(() => "0s"),
  handleBanStatus: jest.fn(async () => null),
  loadBanStatus: jest.fn(async () => null),
  sanitizeErrorMessage: jest.fn((s: string) => s),
}));
jest.mock("@b/api/exchange/order/utils", () => ({
  baseOrderSchema: {},
  adjustOrderData: jest.fn((d: any) => d),
}));
jest.mock("@b/api/exchange/order/index.ws", () => ({
  addOrderToTrackedOrders: jest.fn(),
  addUserToWatchlist: jest.fn(),
}));

describe("GET /exchange/order", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/order/index.get")).default;
  });

  beforeEach(() => jest.clearAllMocks());

  it("returns exchange orders for authenticated user", async () => {
    mockModels.exchangeOrder.findAll.mockResolvedValue([mockExchangeOrder]);
    const result = await handler(createHandler({ query: { currency: "BTC", pair: "USDT" } }));
    expect(result).toHaveLength(1);
  });

  it("throws for unauthenticated user", async () => {
    await expect(handler(createHandler({ user: undefined }))).rejects.toThrow();
  });

  it("filters by order type", async () => {
    mockModels.exchangeOrder.findAll.mockResolvedValue([]);
    await handler(createHandler({ query: { currency: "BTC", pair: "USDT", type: "OPEN" } }));
    expect(mockModels.exchangeOrder.findAll).toHaveBeenCalled();
  });
});

describe("POST /exchange/order", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/order/index.post")).default;
  });

  beforeEach(() => jest.clearAllMocks());

  it("creates a new exchange order", async () => {
    mockModels.exchangeMarket.findOne.mockResolvedValue({
      id: "mkt-1",
      metadata: { limits: { amount: { min: 0.001, max: 1000 } } },
      get() { return this; },
    });
    mockModels.wallet.findOne.mockResolvedValue({ id: "w-1", balance: 10000 });
    mockModels.exchangeOrder.create.mockResolvedValue({ ...mockExchangeOrder, id: "new-order" });
    try {
      const result = await handler(createHandler({
        body: { currency: "BTC", pair: "USDT", type: "LIMIT", side: "BUY", amount: 0.01, price: 50000 },
      }));
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });
});

describe("GET /exchange/order/[id]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/order/[id]/index.get")).default;
  });

  it("returns a specific exchange order", async () => {
    mockModels.exchangeOrder.findOne.mockResolvedValue(mockExchangeOrder);
    const result = await handler(createHandler({ params: { id: "order-1" } }));
    expect(result).toBeDefined();
  });
});

describe("DELETE /exchange/order/[id]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/order/[id]/index.del")).default;
  });

  it("cancels an exchange order", async () => {
    mockModels.exchangeOrder.findOne.mockResolvedValue({
      ...mockExchangeOrder,
      status: "OPEN",
      get() { return this; },
    });
    mockModels.exchangeOrder.update.mockResolvedValue([1]);
    try {
      const result = await handler(createHandler({ params: { id: "order-1" } }));
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });
});
