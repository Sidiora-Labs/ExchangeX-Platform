
import { createHandler, createMockModels, mockExchangeMarket } from "../helpers";

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
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/redis", () => ({
  RedisSingleton: {
    getInstance: () => ({
      get: jest.fn(async () => null),
      set: jest.fn(async () => {}),
    }),
  },
}));
jest.mock("@b/api/exchange/market/utils", () => ({
  baseMarketSchema: {},
}));

describe("GET /exchange/market", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/market/index.get")).default;
  });

  it("returns all exchange markets", async () => {
    mockModels.exchangeMarket.findAll.mockResolvedValue([mockExchangeMarket]);
    const result = await handler(createHandler({ query: { eco: "false" } }));
    expect(result).toBeDefined();
  });
});

describe("GET /exchange/market/[id]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/market/[id]/index.get")).default;
  });

  it("returns a specific market", async () => {
    mockModels.exchangeMarket.findByPk.mockResolvedValue(mockExchangeMarket);
    const result = await handler(createHandler({ params: { id: "market-1" } }));
    expect(result).toBeDefined();
  });
});
