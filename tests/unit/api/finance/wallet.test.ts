
import { createHandler, createMockModels, mockWallet, mockSpotWallet } from "../helpers";

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
  getFiltered: jest.fn(async () => ({
    items: [
      { ...mockWallet, type: "FIAT", currency: "USD" },
      { ...mockSpotWallet, type: "SPOT", currency: "BTC" },
    ],
    pagination: { page: 1, totalPages: 1 },
  })),
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
}));
jest.mock("@b/utils/constants", () => ({
  crudParameters: [],
  paginationSchema: {},
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/eco/matchingEngine", () => ({
  MatchingEngine: {
    getInstance: jest.fn(async () => ({
      getTickers: jest.fn(async () => ({})),
    })),
  },
}));
jest.mock("@b/utils/redis", () => ({
  RedisSingleton: { getInstance: () => ({ get: jest.fn(async () => null), set: jest.fn() }) },
}));
jest.mock("@b/utils/cache", () => ({
  CacheManager: { getInstance: () => ({ get: jest.fn(async () => null), set: jest.fn() }) },
}));

describe("GET /finance/wallet", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/wallet/index.get")).default;
  });

  beforeEach(() => jest.clearAllMocks());

  it("returns user wallets with pagination", async () => {
    const result = await handler(createHandler({ query: {} }));
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("pagination");
    expect(result.items).toHaveLength(2);
  });

  it("throws 401 for unauthenticated user", async () => {
    await expect(handler(createHandler({ user: undefined }))).rejects.toThrow();
  });

  it("filters wallets by type", async () => {
    const { getFiltered } = require("@b/utils/query");
    await handler(createHandler({ query: { walletType: "SPOT" } }));
    expect(getFiltered).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ type: "SPOT" }) })
    );
  });
});

describe("GET /finance/wallet/symbol", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/wallet/symbol.get")).default;
  });

  it("returns wallet symbols", async () => {
    mockModels.wallet.findAll.mockResolvedValue([
      { currency: "USD", type: "FIAT" },
      { currency: "BTC", type: "SPOT" },
    ]);
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});
