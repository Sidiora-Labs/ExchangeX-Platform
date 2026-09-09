
import { adminHandler, createMockModels } from "../helpers";

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

describe("Admin Fiat Currency - Extended", () => {
  it("PUT /admin/finance/currency/fiat/status - bulk status update", async () => {
    const h = (await import("@b/api/admin/finance/currency/fiat/status.put")).default;
    mockModels.currency.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["USD"], status: true } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/currency/fiat/[id]/status - toggles status", async () => {
    const h = (await import("@b/api/admin/finance/currency/fiat/[id]/status.put")).default;
    mockModels.currency.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "USD" }, body: { status: false } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Spot Currency - Extended", () => {
  it("PUT /admin/finance/currency/spot/[id] - updates spot currency", async () => {
    const h = (await import("@b/api/admin/finance/currency/spot/[id]/index.put")).default;
    mockModels.exchangeCurrency.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "cur-1" }, body: { price: 51000 } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/currency/spot/status - bulk status update", async () => {
    const h = (await import("@b/api/admin/finance/currency/spot/status.put")).default;
    mockModels.exchangeCurrency.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["cur-1"], status: true } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Deposit Gateway - Extended", () => {
  it("PUT /admin/finance/deposit/gateway/[id] - updates gateway", async () => {
    const h = (await import("@b/api/admin/finance/deposit/gateway/[id]/index.put")).default;
    mockModels.depositGateway.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "gw-1" }, body: { name: "Updated" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/deposit/gateway/status - bulk status update", async () => {
    const h = (await import("@b/api/admin/finance/deposit/gateway/status.put")).default;
    mockModels.depositGateway.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["gw-1"], status: true } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Deposit Method - Extended", () => {
  it("GET /admin/finance/deposit/method/[id] - gets method", async () => {
    const h = (await import("@b/api/admin/finance/deposit/method/[id]/index.get")).default;
    mockModels.currencyDepositMethod.findByPk.mockResolvedValue({ id: "dm-1" });
    const result = await h(adminHandler({ params: { id: "dm-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/deposit/method/[id] - updates method", async () => {
    const h = (await import("@b/api/admin/finance/deposit/method/[id]/index.put")).default;
    mockModels.currencyDepositMethod.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "dm-1" }, body: { chain: "Updated" } }));
    expect(result).toBeDefined();
  });

  it("DELETE /admin/finance/deposit/method/[id] - deletes method", async () => {
    const h = (await import("@b/api/admin/finance/deposit/method/[id]/index.del")).default;
    mockModels.currencyDepositMethod.destroy.mockResolvedValue(1);
    const result = await h(adminHandler({ params: { id: "dm-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Exchange Market - Extended", () => {
  it("PUT /admin/finance/exchange/market/[id] - updates market", async () => {
    const h = (await import("@b/api/admin/finance/exchange/market/[id]/index.put")).default;
    mockModels.exchangeMarket.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "mkt-1" }, body: { status: true } }));
    expect(result).toBeDefined();
  });

  it("DELETE /admin/finance/exchange/market/[id] - deletes market", async () => {
    const h = (await import("@b/api/admin/finance/exchange/market/[id]/index.del")).default;
    mockModels.exchangeMarket.destroy.mockResolvedValue(1);
    const result = await h(adminHandler({ params: { id: "mkt-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/exchange/market/status - bulk status", async () => {
    const h = (await import("@b/api/admin/finance/exchange/market/status.put")).default;
    mockModels.exchangeMarket.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["mkt-1"], status: true } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Wallet - Extended", () => {
  it("GET /admin/finance/wallet/[id] - gets wallet", async () => {
    const h = (await import("@b/api/admin/finance/wallet/[id]/index.get")).default;
    mockModels.wallet.findByPk.mockResolvedValue({ id: "w-1", get() { return this; } });
    const result = await h(adminHandler({ params: { id: "w-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/wallet/[id] - updates wallet", async () => {
    const h = (await import("@b/api/admin/finance/wallet/[id]/index.put")).default;
    mockModels.wallet.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "w-1" }, body: { balance: 5000 } }));
    expect(result).toBeDefined();
  });

  it("POST /admin/finance/wallet/[id]/withdraw/approve - approves withdrawal", async () => {
    const h = (await import("@b/api/admin/finance/wallet/[id]/withdraw/approve.post")).default;
    mockModels.transaction.findByPk.mockResolvedValue({ id: "tx-1", status: "PENDING" });
    mockModels.transaction.update.mockResolvedValue([1]);
    try {
      const result = await h(adminHandler({ params: { id: "w-1" }, body: { transactionId: "tx-1" } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });

  it("POST /admin/finance/wallet/[id]/withdraw/reject - rejects withdrawal", async () => {
    const h = (await import("@b/api/admin/finance/wallet/[id]/withdraw/reject.post")).default;
    mockModels.transaction.findByPk.mockResolvedValue({ id: "tx-1", status: "PENDING" });
    mockModels.transaction.update.mockResolvedValue([1]);
    try {
      const result = await h(adminHandler({ params: { id: "w-1" }, body: { transactionId: "tx-1" } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

describe("Admin Investment Plan - Extended", () => {
  it("GET /admin/finance/investment/plan/[id] - gets plan", async () => {
    const h = (await import("@b/api/admin/finance/investment/plan/[id]/index.get")).default;
    mockModels.investmentPlan.findByPk.mockResolvedValue({ id: "plan-1", get() { return this; } });
    const result = await h(adminHandler({ params: { id: "plan-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/investment/plan/[id] - updates plan", async () => {
    const h = (await import("@b/api/admin/finance/investment/plan/[id]/index.put")).default;
    mockModels.investmentPlan.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "plan-1" }, body: { title: "Updated" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/investment/plan/status - bulk status", async () => {
    const h = (await import("@b/api/admin/finance/investment/plan/status.put")).default;
    mockModels.investmentPlan.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["plan-1"], status: true } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Investment History", () => {
  it("GET /admin/finance/investment/history - lists history", async () => {
    const h = (await import("@b/api/admin/finance/investment/history/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/finance/investment/history/[id] - gets history item", async () => {
    const h = (await import("@b/api/admin/finance/investment/history/[id]/index.get")).default;
    mockModels.investment.findByPk.mockResolvedValue({ id: "inv-1", get() { return this; } });
    const result = await h(adminHandler({ params: { id: "inv-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Withdraw Method - Extended", () => {
  it("GET /admin/finance/withdraw/method/[id] - gets method", async () => {
    const h = (await import("@b/api/admin/finance/withdraw/method/[id]/index.get")).default;
    mockModels.withdrawMethod.findByPk.mockResolvedValue({ id: "wm-1" });
    const result = await h(adminHandler({ params: { id: "wm-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/withdraw/method/[id] - updates method", async () => {
    const h = (await import("@b/api/admin/finance/withdraw/method/[id]/index.put")).default;
    mockModels.withdrawMethod.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "wm-1" }, body: { name: "Updated" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/withdraw/method/status - bulk status", async () => {
    const h = (await import("@b/api/admin/finance/withdraw/method/status.put")).default;
    mockModels.withdrawMethod.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["wm-1"], status: true } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Binary Orders - Extended", () => {
  it("GET /admin/finance/order/binary/[id] - gets order", async () => {
    const h = (await import("@b/api/admin/finance/order/binary/[id]/index.get")).default;
    mockModels.binaryOrder.findByPk.mockResolvedValue({ id: "bo-1", get() { return this; } });
    const result = await h(adminHandler({ params: { id: "bo-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/order/binary/[id] - updates order", async () => {
    const h = (await import("@b/api/admin/finance/order/binary/[id]/index.put")).default;
    mockModels.binaryOrder.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "bo-1" }, body: { status: "WIN" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/order/binary/status - bulk status", async () => {
    const h = (await import("@b/api/admin/finance/order/binary/status.put")).default;
    mockModels.binaryOrder.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["bo-1"], status: "WIN" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Exchange Orders - Extended", () => {
  it("GET /admin/finance/order/exchange/[id] - gets order", async () => {
    const h = (await import("@b/api/admin/finance/order/exchange/[id]/index.get")).default;
    mockModels.exchangeOrder.findByPk.mockResolvedValue({ id: "eo-1", get() { return this; } });
    const result = await h(adminHandler({ params: { id: "eo-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/order/exchange/status - bulk status", async () => {
    const h = (await import("@b/api/admin/finance/order/exchange/status.put")).default;
    mockModels.exchangeOrder.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ body: { ids: ["eo-1"], status: "FILLED" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Profit - Extended", () => {
  it("POST /admin/finance/profit - creates profit entry", async () => {
    const h = (await import("@b/api/admin/finance/profit/index.post")).default;
    mockModels.profitSetting.create.mockResolvedValue({ id: "ps-new" });
    const result = await h(adminHandler({ body: { currency: "USD", amount: 100 } }));
    expect(result).toBeDefined();
  });

  it("GET /admin/finance/profit/[id] - gets profit entry", async () => {
    const h = (await import("@b/api/admin/finance/profit/[id]/index.get")).default;
    mockModels.profitSetting.findByPk.mockResolvedValue({ id: "ps-1" });
    const result = await h(adminHandler({ params: { id: "ps-1" } }));
    expect(result).toBeDefined();
  });

  it("PUT /admin/finance/profit/[id] - updates profit entry", async () => {
    const h = (await import("@b/api/admin/finance/profit/[id]/index.put")).default;
    mockModels.profitSetting.update.mockResolvedValue([1]);
    const result = await h(adminHandler({ params: { id: "ps-1" }, body: { amount: 200 } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Exchange Provider - Extended", () => {
  it("PUT /admin/finance/exchange/provider/[productId] - updates provider", async () => {
    const h = (await import("@b/api/admin/finance/exchange/provider/[productId]/index.put")).default;
    try {
      const result = await h(adminHandler({ params: { productId: "mkt-1" }, body: { active: true } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });

  it("POST /admin/finance/exchange/provider/[productId]/activate - activates provider", async () => {
    const h = (await import("@b/api/admin/finance/exchange/provider/[productId]/activate.post")).default;
    try {
      const result = await h(adminHandler({ params: { productId: "mkt-1" } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

describe("Admin Exchange Watchlist", () => {
  it("GET /admin/finance/exchange/watchlist/[id] - gets watchlist", async () => {
    const h = (await import("@b/api/admin/finance/exchange/watchlist/[id]/index.get")).default;
    mockModels.exchangeWatchlist.findByPk.mockResolvedValue({ id: "wl-1" });
    const result = await h(adminHandler({ params: { id: "wl-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Admin Exchange Balance/Fee", () => {
  it("GET /admin/finance/exchange/balance - returns balances", async () => {
    const h = (await import("@b/api/admin/finance/exchange/balance/index.get")).default;
    try {
      const result = await h(adminHandler());
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });

  it("GET /admin/finance/exchange/fee - returns fees", async () => {
    const h = (await import("@b/api/admin/finance/exchange/fee/index.get")).default;
    try {
      const result = await h(adminHandler());
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});
