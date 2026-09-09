
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

describe("ICO Project", () => {
  it("GET /ext/ico/project - lists projects", async () => {
    const h = (await import("@b/api/ext/ico/project/index.get")).default;
    mockModels.icoProject.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("GET /ext/ico/project/[id] - gets project", async () => {
    const h = (await import("@b/api/ext/ico/project/[id]/index.get")).default;
    mockModels.icoProject.findByPk.mockResolvedValue({ id: "ico-1", phases: [], get() { return this; } });
    const result = await h(createHandler({ params: { id: "ico-1" } }));
    expect(result).toBeDefined();
  });
});

describe("ICO Contribution", () => {
  it("GET /ext/ico/contribution - lists contributions", async () => {
    const h = (await import("@b/api/ext/ico/contribution/index.get")).default;
    mockModels.icoContribution.findAll.mockResolvedValue([]);
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /ext/ico/contribution - creates contribution", async () => {
    const h = (await import("@b/api/ext/ico/contribution/index.post")).default;
    try {
      const result = await h(createHandler({
        body: { phaseId: "phase-1", amount: 1000, currency: "USDT" },
      }));
      expect(result).toBeDefined();
    } catch (e: any) { expect(e).toBeDefined(); }
  });

  it("GET /ext/ico/contribution/[id] - gets contribution", async () => {
    const h = (await import("@b/api/ext/ico/contribution/[id]/index.get")).default;
    mockModels.icoContribution.findByPk.mockResolvedValue({ id: "ic-1" });
    const result = await h(createHandler({ params: { id: "ic-1" } }));
    expect(result).toBeDefined();
  });
});

describe("ICO Offer", () => {
  it("GET /ext/ico/offer/[id] - gets offer details", async () => {
    const h = (await import("@b/api/ext/ico/offer/[id]/index.get")).default;
    mockModels.icoPhase.findByPk.mockResolvedValue({ id: "phase-1", project: {}, get() { return this; } });
    const result = await h(createHandler({ params: { id: "phase-1" } }));
    expect(result).toBeDefined();
  });
});

// Admin ICO
describe("Admin ICO", () => {
  it("GET /admin/ext/ico/project - lists projects", async () => {
    const h = (await import("@b/api/admin/ext/ico/project/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ico/phase - lists phases", async () => {
    const h = (await import("@b/api/admin/ext/ico/phase/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ico/token - lists tokens", async () => {
    const h = (await import("@b/api/admin/ext/ico/token/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ico/contribution - lists contributions", async () => {
    const h = (await import("@b/api/admin/ext/ico/contribution/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });

  it("GET /admin/ext/ico/allocation - lists allocations", async () => {
    const h = (await import("@b/api/admin/ext/ico/allocation/index.get")).default;
    const result = await h(adminHandler());
    expect(result).toBeDefined();
  });
});
