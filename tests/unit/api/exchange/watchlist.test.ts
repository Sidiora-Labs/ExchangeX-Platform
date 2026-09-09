
import { createHandler, createMockModels } from "../helpers";

const mockModels = createMockModels({
  exchangeWatchlist: {
    findOne: jest.fn(async () => null),
    findAll: jest.fn(async () => [{ id: "wl-1", userId: "test-user-1", symbol: "BTC/USDT" }]),
    create: jest.fn(async (d: any) => ({ ...d, id: "wl-new" })),
    destroy: jest.fn(async () => 1),
  },
});

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
  createRecordResponses: jest.fn((m?: string) => ({ 200: { description: `${m || "Record"} created` } })),
    deleteRecordResponses: jest.fn((m?: string) => ({ 200: { description: `${m || "Record"} deleted` } })),
}));

describe("GET /exchange/watchlist", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/watchlist/index.get")).default;
  });

  it("returns user's watchlist", async () => {
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});

describe("POST /exchange/watchlist (toggle)", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/watchlist/index.post")).default;
  });

  beforeEach(() => jest.clearAllMocks());

  it("adds item to watchlist when not existing", async () => {
    mockModels.exchangeWatchlist.findOne.mockResolvedValue(null);
    const result = await handler(createHandler({ body: { symbol: "ETH/USDT" } }));
    expect(result.message).toContain("added");
    expect(mockModels.exchangeWatchlist.create).toHaveBeenCalled();
  });

  it("removes item from watchlist when already existing", async () => {
    mockModels.exchangeWatchlist.findOne.mockResolvedValue({ id: "wl-1" });
    const result = await handler(createHandler({ body: { symbol: "BTC/USDT" } }));
    expect(result.message).toContain("removed");
    expect(mockModels.exchangeWatchlist.destroy).toHaveBeenCalled();
  });

  it("throws on missing symbol", async () => {
    await expect(handler(createHandler({ body: {} }))).rejects.toThrow(/symbol/i);
  });
});

describe("DELETE /exchange/watchlist", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/exchange/watchlist/index.del")).default;
  });

  it("removes item from watchlist by id", async () => {
    mockModels.exchangeWatchlist.destroy.mockResolvedValue(1);
    const result = await handler(createHandler({ body: { id: "wl-1" } }));
    expect(result).toHaveProperty("message");
  });
});
