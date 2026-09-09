
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
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/passwords", () => ({
  verifyPassword: jest.fn(async () => true),
}));

describe("POST /auth/delete", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/auth/delete/index.post")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initiates account deletion request", async () => {
    mockModels.user.findOne.mockResolvedValue(mockUser);
    const result = await handler(createHandler({ body: { password: "Pass123!" } }));
    expect(result).toHaveProperty("message");
  });
});

describe("POST /auth/delete/confirm", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/auth/delete/confirm.post")).default;
  });

  it("confirms account deletion with valid token", async () => {
    mockModels.user.findOne.mockResolvedValue(mockUser);
    const result = await handler(createHandler({ body: { token: "valid-token" } }));
    expect(result).toHaveProperty("message");
  });
});
