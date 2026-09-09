
import { createHandler, createMockModels, mockKYCTemplate, mockKYCApplication } from "../helpers";

const mockModels = createMockModels({
  kycTemplate: (() => {
    const m = (require("../helpers") as any).createMockModels ? {} : {};
    return {
      findOne: jest.fn(async () => mockKYCTemplate),
      findAll: jest.fn(async () => [mockKYCTemplate]),
      findByPk: jest.fn(async () => mockKYCTemplate),
      create: jest.fn(async (d: any) => ({ ...d, id: "kyc-template-new" })),
      update: jest.fn(async () => [1]),
      destroy: jest.fn(async () => 1),
      count: jest.fn(async () => 1),
    };
  })(),
  kycApplication: {
    findOne: jest.fn(async () => mockKYCApplication),
    findAll: jest.fn(async () => [mockKYCApplication]),
    findByPk: jest.fn(async () => mockKYCApplication),
    create: jest.fn(async (d: any) => ({ ...d, id: "kyc-app-new" })),
    update: jest.fn(async () => [1]),
    destroy: jest.fn(async () => 1),
    count: jest.fn(async () => 1),
  },
});

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
  getFiltered: jest.fn(async () => ({ items: [mockKYCTemplate], pagination: { page: 1 } })),
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));

describe("GET /user/kyc/template", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/kyc/template/index.get")).default;
  });

  it("returns KYC templates for user", async () => {
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});

describe("GET /user/kyc/application", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/kyc/application/index.get")).default;
  });

  it("returns user's KYC applications", async () => {
    mockModels.kycApplication.findAll.mockResolvedValue([mockKYCApplication]);
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});

describe("POST /user/kyc/application", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/kyc/application/index.post")).default;
  });

  it("submits a new KYC application", async () => {
    mockModels.kycApplication.create.mockResolvedValue({ ...mockKYCApplication, id: "new-app" });
    const result = await handler(createHandler({
      body: { templateId: "kyc-template-1", data: { name: "Test User" } },
    }));
    expect(result).toBeDefined();
  });
});

describe("PUT /user/kyc/application/[id]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/kyc/application/[id]/index.put")).default;
  });

  it("updates an existing KYC application", async () => {
    mockModels.kycApplication.update.mockResolvedValue([1]);
    const result = await handler(createHandler({
      params: { id: "kyc-app-1" },
      body: { data: { name: "Updated" } },
    }));
    expect(result).toBeDefined();
  });
});
