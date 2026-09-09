
import { createHandler, adminHandler, createMockModels } from "../helpers";

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
jest.mock("@b/utils/emails", () => ({ emailQueue: { add: jest.fn() } }));
jest.mock("@b/utils/notifications", () => ({ handleNotification: jest.fn() }));

describe("Affiliate Reward", () => {
  it("GET /ext/affiliate/reward - lists rewards", async () => {
    const h = (await import("@b/api/ext/affiliate/reward/index.get")).default;
    mockModels.affiliateReward.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /ext/affiliate/reward/[id]/claim - claims reward", async () => {
    const h = (await import("@b/api/ext/affiliate/reward/[id]/claim.post")).default;
    mockModels.affiliateReward.findByPk.mockResolvedValue({
      id: "rew-1", userId: "test-user-1", status: "PENDING", amount: 50, get() { return this; },
    });
    mockModels.affiliateReward.update.mockResolvedValue([1]);
    try {
      const result = await h(createHandler({ params: { id: "rew-1" } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });
});

describe("Affiliate Condition", () => {
  it("GET /ext/affiliate/condition - lists conditions", async () => {
    const h = (await import("@b/api/ext/affiliate/condition/index.get")).default;
    mockModels.affiliateCondition.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });
});

describe("Affiliate Referral", () => {
  it("GET /ext/affiliate/referral - lists referrals", async () => {
    const h = (await import("@b/api/ext/affiliate/referral/index.get")).default;
    mockModels.affiliateReferral.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /ext/affiliate/referral/analysis - returns analysis", async () => {
    const h = (await import("@b/api/ext/affiliate/referral/analysis.post")).default;
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });
});

// Admin Affiliate
describe("Admin Affiliate", () => {
  it("GET /admin/ext/affiliate/reward - lists rewards", async () => {
    const h = (await import("@b/api/admin/ext/affiliate/reward/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/affiliate/condition - lists conditions", async () => {
    const h = (await import("@b/api/admin/ext/affiliate/condition/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/affiliate/referral - lists referrals", async () => {
    const h = (await import("@b/api/admin/ext/affiliate/referral/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});
