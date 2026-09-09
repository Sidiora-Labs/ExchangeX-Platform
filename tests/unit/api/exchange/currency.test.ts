
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

describe("GET /exchange/currency", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/currency/index.get")).default;
  });

  it("returns exchange currencies", async () => {
    mockModels.exchangeCurrency.findAll.mockResolvedValue([
      { id: "cur-1", currency: "BTC", price: 50000 },
      { id: "cur-2", currency: "ETH", price: 3000 },
    ]);
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});

describe("GET /exchange/currency/[id]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/currency/[id]/index.get")).default;
  });

  it("returns a specific exchange currency", async () => {
    mockModels.exchangeCurrency.findByPk.mockResolvedValue({
      id: "cur-1", currency: "BTC", price: 50000, get() { return this; },
    });
    const result = await handler(createHandler({ params: { id: "cur-1" } }));
    expect(result).toBeDefined();
  });
});
