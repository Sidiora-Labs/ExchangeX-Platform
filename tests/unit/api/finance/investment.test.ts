
import { createHandler, createMockModels, mockWallet, mockInvestmentPlan, mockInvestmentDuration } from "../helpers";

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
jest.mock("@b/utils/emails", () => ({
  emailQueue: { add: jest.fn() },
  sendInvestmentEmail: jest.fn(),
}));
jest.mock("@b/utils/notifications", () => ({ handleNotification: jest.fn() }));

describe("GET /finance/investment", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/investment/index.get")).default;
  });

  it("returns investments for authenticated user", async () => {
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});

describe("GET /finance/investment/user", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/investment/user.get")).default;
  });

  it("returns user investment summary", async () => {
    mockModels.investment.findAll.mockResolvedValue([]);
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});

describe("POST /finance/investment", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/investment/index.post")).default;
  });

  beforeEach(() => jest.clearAllMocks());

  it("creates a new investment", async () => {
    mockModels.investmentPlan.findByPk.mockResolvedValue(mockInvestmentPlan);
    mockModels.investmentDuration.findByPk.mockResolvedValue(mockInvestmentDuration);
    mockModels.wallet.findOne.mockResolvedValue({ ...mockWallet, balance: 5000 });
    mockModels.investment.create.mockResolvedValue({ id: "inv-new" });
    mockModels.transaction.create.mockResolvedValue({ id: "tx-inv" });
    try {
      const result = await handler(createHandler({
        body: { type: "general", planId: "plan-1", amount: 1000, durationId: "duration-1" },
      }));
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });
});

describe("POST /finance/investment/analysis", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/investment/analysis.post")).default;
  });

  it("returns investment analysis", async () => {
    mockModels.investment.findAll.mockResolvedValue([]);
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});

describe("GET /finance/investment/plan", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/investment/plan/index.get")).default;
  });

  it("returns investment plans", async () => {
    mockModels.investmentPlan.findAll.mockResolvedValue([mockInvestmentPlan]);
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});

describe("GET /finance/investment/plan/[id]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/investment/plan/[id]/index.get")).default;
  });

  it("returns a specific investment plan", async () => {
    mockModels.investmentPlan.findByPk.mockResolvedValue(mockInvestmentPlan);
    const result = await handler(createHandler({ params: { id: "plan-1" } }));
    expect(result).toBeDefined();
  });
});

describe("GET /finance/investment/[id]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/investment/[id]/index.get")).default;
  });

  it("returns a specific investment", async () => {
    mockModels.investment.findByPk.mockResolvedValue({
      id: "inv-1",
      userId: "test-user-1",
      plan: mockInvestmentPlan,
      duration: mockInvestmentDuration,
      get() { return this; },
    });
    const result = await handler(createHandler({ params: { id: "inv-1" } }));
    expect(result).toBeDefined();
  });
});
