
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
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/redis", () => ({
  RedisSingleton: {
    getInstance: () => ({
      get: jest.fn(async () => JSON.stringify({
        "BTC/USDT": { last: 50000, bid: 49900, ask: 50100, high: 51000, low: 49000, volume: 1000 },
      })),
      set: jest.fn(),
    }),
  },
}));
jest.mock("@b/api/exchange/utils", () => ({ baseTickerSchema: {} }));

describe("GET /exchange/ticker", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/ticker/index.get")).default;
  });

  it("returns all tickers from Redis cache", async () => {
    const result = await handler(createHandler());
    expect(result).toHaveProperty("BTC/USDT");
    expect(result["BTC/USDT"]).toHaveProperty("last", 50000);
  });

  it("throws 404 when cache is empty", async () => {
    const { RedisSingleton } = require("@b/utils/redis");
    RedisSingleton.getInstance().get.mockResolvedValueOnce(null);
    await expect(handler(createHandler())).rejects.toThrow();
  });
});

describe("GET /exchange/ticker/[currency]/[pair]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/ticker/[currency]/[pair]/index.get")).default;
  });

  it("returns ticker for specific pair", async () => {
    const result = await handler(createHandler({ params: { currency: "BTC", pair: "USDT" } }));
    expect(result).toBeDefined();
  });
});
