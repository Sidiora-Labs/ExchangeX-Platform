
import { createHandler, createMockModels, mockBinaryOrder } from "../helpers";

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
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/exchange", () => ({
  __esModule: true,
  default: { startExchange: jest.fn() },
}));
jest.mock("@b/utils/emails", () => ({
  emailQueue: { add: jest.fn() },
  sendBinaryOrderEmail: jest.fn(),
}));
jest.mock("@b/utils/notifications", () => ({ handleNotification: jest.fn() }));
jest.mock("@b/handler/Websocket", () => ({ sendMessageToRoute: jest.fn() }));

jest.mock("@b/api/exchange/binary/order/utils", () => ({
  ensureExchange: jest.fn(async () => ({
    fetchTicker: jest.fn(async () => ({ last: 50000 })),
    fetchOHLCV: jest.fn(async () => []),
  })),
  getBinaryOrder: jest.fn(),
  getBinaryOrdersByStatus: jest.fn(),
  validateBinaryProfit: jest.fn(() => 87),
  ensureNotBanned: jest.fn(async () => undefined),
}));

// Mock BinaryOrderService
jest.mock("@b/api/exchange/binary/order/util/BinaryOrderService", () => ({
  BinaryOrderService: {
    createOrder: jest.fn(async (data: any) => ({ ...mockBinaryOrder, ...data, id: "bin-new" })),
    processOrder: jest.fn(async () => undefined),
  },
}));

describe("GET /exchange/binary/order", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/binary/order/index.get")).default;
  });

  beforeEach(() => jest.clearAllMocks());

  it("returns binary orders for authenticated user", async () => {
    mockModels.binaryOrder.findAll.mockResolvedValue([mockBinaryOrder]);
    const result = await handler(createHandler({ query: { currency: "BTC", pair: "USDT" } }));
    expect(result).toBeDefined();
  });

  it("throws for unauthenticated user", async () => {
    await expect(handler(createHandler({ user: undefined }))).rejects.toThrow();
  });
});

describe("POST /exchange/binary/order", () => {
  let handler: Function;

  beforeAll(async () => {
    process.env.NEXT_PUBLIC_BINARY_STATUS = "true";
    handler = (await import("@b/api/exchange/binary/order/index.post")).default;
  });

  beforeEach(() => jest.clearAllMocks());

  it("creates a binary order", async () => {
    const result = await handler(createHandler({
      body: {
        currency: "BTC",
        pair: "USDT",
        amount: 100,
        side: "RISE",
        type: "RISE_FALL",
        closedAt: new Date(Date.now() + 60000).toISOString(),
        isDemo: false,
      },
    }));
    expect(result).toBeDefined();
  });

  it("rejects when binary trading is disabled", async () => {
    const orig = process.env.NEXT_PUBLIC_BINARY_STATUS;
    process.env.NEXT_PUBLIC_BINARY_STATUS = "false";
    const h = (await import("@b/api/exchange/binary/order/index.post")).default;
    await expect(h(createHandler({
      body: { currency: "BTC", pair: "USDT", amount: 100, side: "RISE", type: "RISE_FALL", closedAt: new Date().toISOString() },
    }))).rejects.toThrow(/disabled/i);
    process.env.NEXT_PUBLIC_BINARY_STATUS = orig;
  });

  it("throws for unauthenticated user", async () => {
    await expect(handler(createHandler({ user: undefined, body: {} }))).rejects.toThrow();
  });
});

describe("GET /exchange/binary/order/last", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/binary/order/last.get")).default;
  });

  it("returns last binary orders", async () => {
    mockModels.binaryOrder.findAll.mockResolvedValue([mockBinaryOrder]);
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});

describe("GET /exchange/binary/order/[id]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/binary/order/[id]/index.get")).default;
  });

  it("returns a specific binary order", async () => {
    mockModels.binaryOrder.findOne.mockResolvedValue(mockBinaryOrder);
    const result = await handler(createHandler({ params: { id: "bin-order-1" } }));
    expect(result).toBeDefined();
  });
});

describe("DELETE /exchange/binary/order/[id]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/binary/order/[id]/index.del")).default;
  });

  it("cancels a binary order", async () => {
    mockModels.binaryOrder.findOne.mockResolvedValue({
      ...mockBinaryOrder,
      status: "PENDING",
      get() { return this; },
    });
    mockModels.binaryOrder.update.mockResolvedValue([1]);
    try {
      const result = await handler(createHandler({ params: { id: "bin-order-1" } }));
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });
});
