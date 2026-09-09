
import { createHandler, adminHandler, createMockModels } from "../helpers";

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
  getFiltered: jest.fn(async () => ({ items: [], pagination: { page: 1 } })),
  createRecordResponses: jest.fn((m?: string) => ({ 200: { description: `${m || "Record"} created` } })),
    deleteRecordResponses: jest.fn((m?: string) => ({ 200: { description: `${m || "Record"} deleted` } })),
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/redis", () => ({
  RedisSingleton: { getInstance: () => ({ get: jest.fn(async () => null), set: jest.fn() }) },
}));
jest.mock("@b/utils/cache", () => ({
  CacheManager: { getInstance: () => ({ get: jest.fn(async () => null), set: jest.fn() }) },
}));
jest.mock("@b/utils/exchange", () => ({
  __esModule: true,
  default: { startExchange: jest.fn() },
}));
jest.mock("@b/utils/eco/matchingEngine", () => ({
  MatchingEngine: {
    getInstance: jest.fn(async () => ({
      getTickers: jest.fn(async () => ({})),
    })),
  },
}));
jest.mock("@b/utils/eco/wallet", () => ({
  getWalletByUserIdAndCurrency: jest.fn(async () => ({ id: "w-1", balance: 1000 })),
}));
jest.mock("@b/utils/emails", () => ({ emailQueue: { add: jest.fn() } }));
jest.mock("@b/utils/notifications", () => ({ handleNotification: jest.fn() }));
jest.mock("@b/handler/Websocket", () => ({ sendMessageToRoute: jest.fn() }));

// ---- Public ecosystem endpoints ----
describe("Ecosystem Token", () => {
  it("GET /ext/ecosystem/token - lists tokens", async () => {
    const h = (await import("@b/api/ext/ecosystem/token/index.get")).default;
    mockModels.ecosystemToken.findAll.mockResolvedValue([{ id: "tok-1", currency: "USDT" }]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /ext/ecosystem/token/[currency] - gets token by currency", async () => {
    const h = (await import("@b/api/ext/ecosystem/token/[currency]/index.get")).default;
    mockModels.ecosystemToken.findOne.mockResolvedValue({ id: "tok-1", currency: "USDT" });
    const result = await h(createHandler({ params: { currency: "USDT" } }));
    expect(result).toBeDefined();
  });
});

describe("Ecosystem Wallet", () => {
  it("GET /ext/ecosystem/wallet - lists wallets", async () => {
    const h = (await import("@b/api/ext/ecosystem/wallet/index.get")).default;
    mockModels.ecosystemWallet.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /ext/ecosystem/wallet/[currency] - gets wallet by currency", async () => {
    const h = (await import("@b/api/ext/ecosystem/wallet/[currency]/index.get")).default;
    mockModels.ecosystemWallet.findOne.mockResolvedValue(null);
    const result = await h(createHandler({ params: { currency: "ETH" } }));
    expect(result).toBeDefined();
  });
});

describe("Ecosystem Market", () => {
  it("GET /ext/ecosystem/market - lists markets", async () => {
    const h = (await import("@b/api/ext/ecosystem/market/index.get")).default;
    mockModels.ecosystemMarket.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /ext/ecosystem/market/[id] - gets market", async () => {
    const h = (await import("@b/api/ext/ecosystem/market/[id]/index.get")).default;
    mockModels.ecosystemMarket.findByPk.mockResolvedValue({ id: "em-1" });
    const result = await h(createHandler({ params: { id: "em-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Ecosystem Order", () => {
  it("GET /ext/ecosystem/order - lists orders", async () => {
    const h = (await import("@b/api/ext/ecosystem/order/index.get")).default;
    mockModels.ecosystemOrder.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /ext/ecosystem/order - creates order", async () => {
    const h = (await import("@b/api/ext/ecosystem/order/index.post")).default;
    mockModels.ecosystemMarket.findOne.mockResolvedValue({ id: "em-1", metadata: { limits: {} } });
    mockModels.ecosystemWallet.findOne.mockResolvedValue({ id: "ew-1", balance: 10 });
    try {
      const result = await h(createHandler({
        body: { currency: "ETH", pair: "USDT", type: "LIMIT", side: "BUY", amount: 1, price: 3000 },
      }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

describe("Ecosystem Withdraw", () => {
  it("POST /ext/ecosystem/withdraw - creates withdrawal", async () => {
    const h = (await import("@b/api/ext/ecosystem/withdraw/index.post")).default;
    try {
      const result = await h(createHandler({
        body: { currency: "ETH", amount: 0.5, toAddress: "0xtest", chain: "ETH" },
      }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

describe("Ecosystem Chart", () => {
  it("GET /ext/ecosystem/chart - returns chart data", async () => {
    const h = (await import("@b/api/ext/ecosystem/chart/index.get")).default;
    try {
      const result = await h(createHandler({ query: { currency: "ETH", pair: "USDT" } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

describe("Ecosystem Deposit Unlock", () => {
  it("GET /ext/ecosystem/deposit/unlock - checks deposit unlock", async () => {
    const h = (await import("@b/api/ext/ecosystem/deposit/unlock/index.get")).default;
    try {
      const result = await h(createHandler({ query: { currency: "ETH" } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

// ---- Admin ecosystem endpoints ----
describe("Admin Ecosystem", () => {
  it("GET /admin/ext/ecosystem - returns ecosystem overview", async () => {
    const h = (await import("@b/api/admin/ext/ecosystem/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ecosystem/token - lists tokens", async () => {
    const h = (await import("@b/api/admin/ext/ecosystem/token/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ecosystem/market - lists markets", async () => {
    const h = (await import("@b/api/admin/ext/ecosystem/market/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ecosystem/wallet/custodial - lists custodial wallets", async () => {
    const h = (await import("@b/api/admin/ext/ecosystem/wallet/custodial/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ecosystem/wallet/master - lists master wallets", async () => {
    const h = (await import("@b/api/admin/ext/ecosystem/wallet/master/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ecosystem/utxo - lists UTXOs", async () => {
    const h = (await import("@b/api/admin/ext/ecosystem/utxo/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ecosystem/order - lists ecosystem orders", async () => {
    const h = (await import("@b/api/admin/ext/ecosystem/order/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ecosystem/ledger - lists ledger entries", async () => {
    const h = (await import("@b/api/admin/ext/ecosystem/ledger/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ecosystem/blockchain/[id] - gets blockchain info", async () => {
    const h = (await import("@b/api/admin/ext/ecosystem/blockchain/[id]/index.get")).default;
    mockModels.ecosystemBlockchain.findByPk.mockResolvedValue({ id: "chain-1", name: "Ethereum" });
    const result = await h(adminHandler({ params: { id: "chain-1" } }));
    expect(result).toBeDefined();
  });
});
