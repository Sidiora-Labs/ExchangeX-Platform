
import { createHandler, createMockModels, mockUser } from "../helpers";

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
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
  getFiltered: jest.fn(),
  createRecordResponses: jest.fn((m?: string) => ({ 200: { description: `${m || "Record"} created` } })),
    deleteRecordResponses: jest.fn((m?: string) => ({ 200: { description: `${m || "Record"} deleted` } })),
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("fs/promises", () => ({ unlink: jest.fn() }));

describe("GET /user/profile", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/profile/index.get")).default;
  });

  beforeEach(() => jest.clearAllMocks());

  it("returns full profile for authenticated user", async () => {
    mockModels.user.findOne.mockResolvedValue({
      ...mockUser,
      role: { id: "role-1", name: "User", permissions: [] },
      twoFactor: { type: "APP", enabled: false },
      kyc: { status: "PENDING", level: 1 },
      author: null,
      providerUsers: [],
      get() { return { ...this }; },
    });
    const result = await handler(createHandler());
    expect(result).toHaveProperty("id", "test-user-1");
    expect(result).toHaveProperty("email", "test@example.com");
  });

  it("throws 401 for unauthenticated user", async () => {
    await expect(handler(createHandler({ user: undefined }))).rejects.toThrow();
  });

  it("throws when user not found in DB", async () => {
    mockModels.user.findOne.mockResolvedValue(null);
    await expect(handler(createHandler())).rejects.toThrow(/not found/i);
  });
});

describe("PUT /user/profile", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/profile/index.put")).default;
  });

  beforeEach(() => jest.clearAllMocks());

  it("updates user profile fields", async () => {
    mockModels.user.update.mockResolvedValue([1]);
    const result = await handler(createHandler({
      body: { firstName: "Updated", lastName: "Name" },
    }));
    expect(result).toHaveProperty("message");
  });

  it("throws when no user in request", async () => {
    await expect(handler(createHandler({ user: undefined }))).rejects.toThrow();
  });
});
