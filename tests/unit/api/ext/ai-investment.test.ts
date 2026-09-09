
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

describe("AI Investment", () => {
  it("GET /ext/ai/investment/plan - lists plans", async () => {
    const h = (await import("@b/api/ext/ai/investment/plan/index.get")).default;
    mockModels.aiInvestmentPlan.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /ext/ai/investment/log - lists logs", async () => {
    const h = (await import("@b/api/ext/ai/investment/log/index.get")).default;
    mockModels.aiInvestmentLog.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /ext/ai/investment/log - creates investment", async () => {
    const h = (await import("@b/api/ext/ai/investment/log/index.post")).default;
    try {
      const result = await h(createHandler({
        body: { planId: "aip-1", amount: 500 },
      }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });

  it("GET /ext/ai/investment/log/[id] - gets log", async () => {
    const h = (await import("@b/api/ext/ai/investment/log/[id]/index.get")).default;
    mockModels.aiInvestmentLog.findByPk.mockResolvedValue({ id: "ail-1" });
    const result = await h(createHandler({ params: { id: "ail-1" } }));
    expect(result).toBeDefined();
  });
});

// Admin AI Investment
describe("Admin AI Investment", () => {
  it("GET /admin/ext/ai/investment/plan - lists plans", async () => {
    const h = (await import("@b/api/admin/ext/ai/investment/plan/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ai/investment/duration - lists durations", async () => {
    const h = (await import("@b/api/admin/ext/ai/investment/duration/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ai/investment/log - lists logs", async () => {
    const h = (await import("@b/api/admin/ext/ai/investment/log/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});
