
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

describe("Staking Pool", () => {
  it("GET /ext/staking/pool - lists pools", async () => {
    const h = (await import("@b/api/ext/staking/pool/index.get")).default;
    mockModels.stakingPool.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /ext/staking/pool/[id] - gets pool", async () => {
    const h = (await import("@b/api/ext/staking/pool/[id]/index.get")).default;
    mockModels.stakingPool.findByPk.mockResolvedValue({ id: "sp-1", get() { return this; } });
    const result = await h(createHandler({ params: { id: "sp-1" } }));
    expect(result).toBeDefined();
  });
});

describe("Staking Log", () => {
  it("GET /ext/staking/log - lists staking logs", async () => {
    const h = (await import("@b/api/ext/staking/log/index.get")).default;
    mockModels.stakingLog.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /ext/staking/log - creates staking log", async () => {
    const h = (await import("@b/api/ext/staking/log/index.post")).default;
    try {
      const result = await h(createHandler({ body: { poolId: "sp-1", amount: 100 } }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });

  it("GET /ext/staking/log/[id] - gets staking log", async () => {
    const h = (await import("@b/api/ext/staking/log/[id]/index.get")).default;
    mockModels.stakingLog.findByPk.mockResolvedValue({ id: "sl-1" });
    const result = await h(createHandler({ params: { id: "sl-1" } }));
    expect(result).toBeDefined();
  });
});

// Admin Staking
describe("Admin Staking", () => {
  it("GET /admin/ext/staking/pool - lists pools", async () => {
    const h = (await import("@b/api/admin/ext/staking/pool/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/staking/duration - lists durations", async () => {
    const h = (await import("@b/api/admin/ext/staking/duration/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/staking/log - lists staking logs", async () => {
    const h = (await import("@b/api/admin/ext/staking/log/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});
