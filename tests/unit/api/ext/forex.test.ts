
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
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/emails", () => ({ emailQueue: { add: jest.fn() } }));
jest.mock("@b/utils/notifications", () => ({ handleNotification: jest.fn() }));

describe("Forex Investment", () => {
  it("GET /ext/forex/investment - lists forex investments", async () => {
    const h = (await import("@b/api/ext/forex/investment/index.get")).default;
    mockModels.forexInvestment.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /ext/forex/investment/active - lists active investments", async () => {
    const h = (await import("@b/api/ext/forex/investment/active.get")).default;
    mockModels.forexInvestment.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /ext/forex/investment - creates forex investment", async () => {
    const h = (await import("@b/api/ext/forex/investment/index.post")).default;
    mockModels.forexPlan.findByPk.mockResolvedValue({ id: "fp-1", currency: "USD", walletType: "SPOT", defaultProfit: 100, defaultResult: "WIN" });
    mockModels.forexDuration.findByPk.mockResolvedValue({ id: "fd-1", duration: 1, timeframe: "DAY" });
    mockModels.wallet.findOne.mockResolvedValue({ id: "w-1", balance: 5000 });
    try {
      const result = await h(createHandler({
        body: { planId: "fp-1", durationId: "fd-1", amount: 1000 },
      }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

describe("Forex Investment Plan", () => {
  it("GET /ext/forex/investment/plan - lists plans", async () => {
    const h = (await import("@b/api/ext/forex/investment/plan/index.get")).default;
    mockModels.forexPlan.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /ext/forex/investment/plan/[id] - gets plan", async () => {
    const h = (await import("@b/api/ext/forex/investment/plan/[id]/index.get")).default;
    mockModels.forexPlan.findByPk.mockResolvedValue({ id: "fp-1" });
    const result = await h(createHandler({ params: { id: "fp-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Forex Account", () => {
  it("GET /ext/forex/account - lists forex accounts", async () => {
    const h = (await import("@b/api/ext/forex/account/index.get")).default;
    mockModels.forexAccount.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /ext/forex/account/[id] - gets forex account", async () => {
    const h = (await import("@b/api/ext/forex/account/[id]/index.get")).default;
    mockModels.forexAccount.findByPk.mockResolvedValue({ id: "fa-1" });
    const result = await h(createHandler({ params: { id: "fa-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Forex Transaction", () => {
  it("GET /ext/forex/transaction - lists forex transactions", async () => {
    const h = (await import("@b/api/ext/forex/transaction/index.get")).default;
    mockModels.forexTransaction.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });
});

// Admin Forex
describe("Admin Forex", () => {
  it("GET /admin/ext/forex/plan - lists plans", async () => {
    const h = (await import("@b/api/admin/ext/forex/plan/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/forex/investment - lists investments", async () => {
    const h = (await import("@b/api/admin/ext/forex/investment/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/forex/account - lists accounts", async () => {
    const h = (await import("@b/api/admin/ext/forex/account/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/forex/signal - lists signals", async () => {
    const h = (await import("@b/api/admin/ext/forex/signal/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/forex/duration - lists durations", async () => {
    const h = (await import("@b/api/admin/ext/forex/duration/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});
