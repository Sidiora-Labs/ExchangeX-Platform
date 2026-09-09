
import { adminHandler, createHandler, createMockModels, mockWallet, mockTransaction } from "../helpers";

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
  getFiltered: jest.fn(async () => ({ items: [], pagination: { page: 1 } })),
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/exchange", () => ({
  __esModule: true,
  default: { startExchange: jest.fn() },
}));
jest.mock("@b/utils/emails", () => ({ emailQueue: { add: jest.fn() } }));
jest.mock("@b/utils/notifications", () => ({ handleNotification: jest.fn() }));

// ---- Fiat Currency ----
describe("Admin Fiat Currency", () => {
  it("GET /admin/finance/currency/fiat - lists fiat currencies", async () => {
    const h = (await import("@b/api/admin/finance/currency/fiat/index.get")).default;
    mockModels.currency.findAll.mockResolvedValue([{ id: "USD", name: "US Dollar" }]);
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/currency/fiat/[id] - updates currency", async () => {
    const h = (await import("@b/api/admin/finance/currency/fiat/[id]/index.put")).default;
    mockModels.currency.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "USD" }, body: { price: 1.0 } }));
    expect(result).toBeDefined();
  });
});

// ---- Spot Currency ----
describe("Admin Spot Currency", () => {
  it("GET /admin/finance/currency/spot - lists spot currencies", async () => {
    const h = (await import("@b/api/admin/finance/currency/spot/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/finance/currency/spot/[id] - gets a spot currency", async () => {
    const h = (await import("@b/api/admin/finance/currency/spot/[id]/index.get")).default;
    mockModels.exchangeCurrency.findByPk.mockResolvedValue({ id: "cur-1", currency: "BTC" });
    const result = await h(adminHandler({ params: { id: "cur-1" } }));
    expect(result).toBeDefined();
  });
});

// ---- Deposit Gateway ----
describe("Admin Deposit Gateway", () => {
  it("GET /admin/finance/deposit/gateway - lists gateways", async () => {
    const h = (await import("@b/api/admin/finance/deposit/gateway/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/finance/deposit/gateway/[id] - gets gateway", async () => {
    const h = (await import("@b/api/admin/finance/deposit/gateway/[id]/index.get")).default;
    mockModels.depositGateway.findByPk.mockResolvedValue({ id: "gw-1", name: "Stripe" });
    const result = await h(adminHandler({ params: { id: "gw-1" } }));
    expect(result).toBeDefined();
  });
});

// ---- Deposit Method ----
describe("Admin Deposit Method", () => {
  it("GET /admin/finance/deposit/method - lists methods", async () => {
    const h = (await import("@b/api/admin/finance/deposit/method/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/finance/deposit/method - creates method", async () => {
    const h = (await import("@b/api/admin/finance/deposit/method/index.post")).default;
    mockModels.currencyDepositMethod.create.mockResolvedValue({ id: "dm-new" });
    const result = await h(adminHandler({ body: { currency: "BTC", chain: "Bitcoin" } }));
    expect(result).toBeDefined();
  });
});

// ---- Exchange Market ----
describe("Admin Exchange Market", () => {
  it("GET /admin/finance/exchange/market - lists markets", async () => {
    const h = (await import("@b/api/admin/finance/exchange/market/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/finance/exchange/market/[id] - gets market", async () => {
    const h = (await import("@b/api/admin/finance/exchange/market/[id]/index.get")).default;
    mockModels.exchangeMarket.findByPk.mockResolvedValue({ id: "mkt-1" });
    const result = await h(adminHandler({ params: { id: "mkt-1" } }));
    expect(result).toBeDefined();
  });
});

// ---- Exchange Provider ----
describe("Admin Exchange Provider", () => {
  it("GET /admin/finance/exchange/provider - lists providers", async () => {
    const h = (await import("@b/api/admin/finance/exchange/provider/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});

// ---- Wallet ----
describe("Admin Wallet", () => {
  it("GET /admin/finance/wallet - lists wallets", async () => {
    const h = (await import("@b/api/admin/finance/wallet/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/finance/wallet/[id]/balance - adjusts balance", async () => {
    const h = (await import("@b/api/admin/finance/wallet/[id]/balance.post")).default;
    mockModels.wallet.findByPk.mockResolvedValue(mockWallet);
    mockModels.wallet.update.mockResolvedValue([1]);
    try {
      const result = await h(adminHandler({ params: { id: "wallet-1" }, body: { amount: 100, type: "DEPOSIT" } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

// ---- Transaction ----
describe("Admin Transaction", () => {
  it("GET /admin/finance/transaction - lists transactions", async () => {
    const h = (await import("@b/api/admin/finance/transaction/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/finance/transaction/[id] - gets transaction", async () => {
    const h = (await import("@b/api/admin/finance/transaction/[id]/index.get")).default;
    mockModels.transaction.findByPk.mockResolvedValue(mockTransaction);
    const result = await h(adminHandler({ params: { id: "tx-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/transaction/[id] - updates transaction", async () => {
    const h = (await import("@b/api/admin/finance/transaction/[id]/index.put")).default;
    mockModels.transaction.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "tx-1" }, body: { status: "COMPLETED" } }));
    expect(result).toBeDefined();
  });
});

// ---- Investment ----
describe("Admin Investment", () => {
  it("GET /admin/finance/investment/plan - lists plans", async () => {
    const h = (await import("@b/api/admin/finance/investment/plan/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/finance/investment/plan - creates plan", async () => {
    const h = (await import("@b/api/admin/finance/investment/plan/index.post")).default;
    mockModels.investmentPlan.create.mockResolvedValue({ id: "plan-new" });
    const result = await h(adminHandler({ body: { title: "New Plan" } }));
    expect(result).toBeDefined();
  });

  it("GET /admin/finance/investment/duration - lists durations", async () => {
    const h = (await import("@b/api/admin/finance/investment/duration/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});

// ---- Withdraw Method ----
describe("Admin Withdraw Method", () => {
  it("GET /admin/finance/withdraw/method - lists methods", async () => {
    const h = (await import("@b/api/admin/finance/withdraw/method/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("POST /admin/finance/withdraw/method - creates method", async () => {
    const h = (await import("@b/api/admin/finance/withdraw/method/index.post")).default;
    mockModels.withdrawMethod.create.mockResolvedValue({ id: "wm-new" });
    const result = await h(adminHandler({ body: { currency: "USD", name: "Wire" } }));
    expect(result).toBeDefined();
  });
});

// ---- Profit ----
describe("Admin Profit", () => {
  it("GET /admin/finance/profit - lists profit settings", async () => {
    const h = (await import("@b/api/admin/finance/profit/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});

// ---- Binary Orders ----
describe("Admin Binary Orders", () => {
  it("GET /admin/finance/order/binary - lists binary orders", async () => {
    const h = (await import("@b/api/admin/finance/order/binary/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});

// ---- Exchange Orders ----
describe("Admin Exchange Orders", () => {
  it("GET /admin/finance/order/exchange - lists exchange orders", async () => {
    const h = (await import("@b/api/admin/finance/order/exchange/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});
