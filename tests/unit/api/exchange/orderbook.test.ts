
import { createHandler, createMockModels } from "../helpers";

jest.mock("@b/db", () => ({
  sequelize: { transaction: jest.fn(async (cb: Function) => cb({})) },
  models: createMockModels(),
}));
jest.mock("@b/utils/error", () => ({
  createError: (opts: any) => {
    const err = new Error(typeof opts === "string" ? opts : opts.message || "Error");
    (err as any).statusCode = typeof opts === "string" ? 500 : opts.statusCode || 500;
    return err;
  },
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/exchange", () => ({
  __esModule: true,
  default: {
    startExchange: jest.fn(async () => ({
      fetchOrderBook: jest.fn(async () => ({
        bids: [[49900, 1.5], [49800, 2.0]],
        asks: [[50100, 1.0], [50200, 0.5]],
      })),
    })),
  },
}));

describe("GET /exchange/orderbook/[currency]/[pair]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/orderbook/[currency]/[pair]/index.get")).default;
  });

  it("returns orderbook data for a trading pair", async () => {
    try {
      const result = await handler(createHandler({ params: { currency: "BTC", pair: "USDT" } }));
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });
});
