
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

describe("GET /auth/session", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/auth/session.get")).default;
  });

  it("returns session data for authenticated user", async () => {
    mockModels.user.findOne.mockResolvedValue({
      ...mockUser,
      role: { id: "role-1", name: "User", permissions: [] },
      twoFactor: null,
      kyc: null,
      author: null,
      providerUsers: [],
      get() { return { ...this }; },
    });
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });

  it("throws 401 for unauthenticated request", async () => {
    await expect(handler(createHandler({ user: undefined }))).rejects.toThrow();
  });
});

describe("GET /auth/role", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/auth/role.get")).default;
  });

  it("returns role info for authenticated user", async () => {
    mockModels.role.findOne.mockResolvedValue({
      id: "role-1",
      name: "User",
      permissions: [{ id: "p1", name: "viewDashboard" }],
    });
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});

describe("POST /auth/logout", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/auth/logout.post")).default;
  });

  it("logs out successfully", async () => {
    const result = await handler(createHandler());
    expect(result).toHaveProperty("message");
  });
});
