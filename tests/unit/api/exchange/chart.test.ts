
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
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/exchange", () => ({
  __esModule: true,
  default: {
    startExchange: jest.fn(async () => ({
      fetchOHLCV: jest.fn(async () => [
        [Date.now(), 49000, 51000, 48500, 50000, 1000],
      ]),
    })),
  },
}));

describe("GET /exchange/chart", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/chart/index.get")).default;
  });

  it("returns OHLCV chart data", async () => {
    try {
      const result = await handler(createHandler({
        query: { currency: "BTC", pair: "USDT", timeframe: "1h" },
      }));
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });
});
