
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
jest.mock("@b/utils/redis", () => ({
  RedisSingleton: { getInstance: () => ({ get: jest.fn(async () => null), set: jest.fn() }) },
}));

describe("GET /finance/currency", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/currency/index.get")).default;
  });

  it("returns available currencies", async () => {
    mockModels.currency.findAll.mockResolvedValue([
      { id: "USD", name: "US Dollar", price: 1 },
      { id: "BTC", name: "Bitcoin", price: 50000 },
    ]);
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});

describe("GET /finance/currency/rate", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/currency/rate.get")).default;
  });

  it("returns currency exchange rates", async () => {
    mockModels.currency.findAll.mockResolvedValue([
      { id: "USD", price: 1 },
      { id: "EUR", price: 1.1 },
    ]);
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});

describe("GET /finance/currency/valid", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/currency/valid.get")).default;
  });

  it("returns valid currencies for operations", async () => {
    mockModels.currency.findAll.mockResolvedValue([{ id: "USD" }]);
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});

describe("GET /finance/currency/[type]/[code]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/currency/[type]/[code]/index.get")).default;
  });

  it("returns deposit/withdraw methods for a currency", async () => {
    mockModels.currencyDepositMethod.findAll.mockResolvedValue([
      { id: "dm-1", currency: "BTC", chain: "Bitcoin" },
    ]);
    const result = await handler(createHandler({ params: { type: "deposit", code: "BTC" } }));
    expect(result).toBeDefined();
  });
});
