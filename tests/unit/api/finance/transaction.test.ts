
import { createHandler, createMockModels, mockTransaction } from "../helpers";

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
  getFiltered: jest.fn(async () => ({ items: [mockTransaction], pagination: { page: 1 } })),
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
}));
jest.mock("@b/utils/constants", () => ({ crudParameters: [], paginationSchema: {} }));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));

describe("GET /finance/transaction", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/transaction/index.get")).default;
  });

  it("returns transactions with pagination", async () => {
    const result = await handler(createHandler());
    expect(result).toHaveProperty("items");
  });
});

describe("GET /finance/transaction/[id]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/transaction/[id]/index.get")).default;
  });

  it("returns a specific transaction", async () => {
    mockModels.transaction.findByPk.mockResolvedValue(mockTransaction);
    const result = await handler(createHandler({ params: { id: "tx-1" } }));
    expect(result).toBeDefined();
  });
});

describe("POST /finance/transaction/analysis", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/transaction/analysis.post")).default;
  });

  it("returns transaction analysis data", async () => {
    mockModels.transaction.findAll.mockResolvedValue([mockTransaction]);
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});
