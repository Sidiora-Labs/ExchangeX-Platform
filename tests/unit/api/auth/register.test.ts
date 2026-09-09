
import { createHandler, createMockModels } from "../helpers";

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
jest.mock("@b/utils/passwords", () => ({
  hashPassword: jest.fn(async (p: string) => `$hashed$${p}`),
  validatePassword: jest.fn(() => true),
  verifyPassword: jest.fn(async () => true),
}));
jest.mock("@b/utils/affiliate", () => ({
  handleReferralRegister: jest.fn(),
}));
jest.mock("../utils", () => ({
  returnUserWithTokens: jest.fn(async ({ message }: any) => ({
    message,
    cookies: { accessToken: "tok", sessionId: "sid", csrfToken: "csrf" },
  })),
  sendEmailVerificationToken: jest.fn(),
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/emails", () => ({ emailQueue: { add: jest.fn() } }));

describe("POST /auth/register", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/auth/register/index.post")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockModels.user.findOne.mockResolvedValue(null);
    mockModels.role.findOne.mockResolvedValue({ id: "role-1", name: "User" });
    mockModels.user.create.mockResolvedValue({
      id: "new-user-1",
      email: "new@example.com",
      firstName: "New",
      lastName: "User",
      emailVerified: false,
    });
  });

  it("registers a new user with valid data", async () => {
    const result = await handler(createHandler({
      body: { firstName: "New", lastName: "User", email: "new@example.com", password: "ValidPass123!" },
    }));
    expect(result).toHaveProperty("message");
  });

  it("rejects registration with already-used email", async () => {
    mockModels.user.findOne.mockResolvedValue({ id: "existing", email: "taken@example.com", emailVerified: true });
    await expect(
      handler(createHandler({
        body: { firstName: "Dup", lastName: "User", email: "taken@example.com", password: "ValidPass123!" },
      }))
    ).rejects.toThrow(/already in use/i);
  });

  it("rejects registration with invalid password format", async () => {
    const { validatePassword } = require("@b/utils/passwords");
    (validatePassword as jest.Mock).mockReturnValue(false);
    await expect(
      handler(createHandler({
        body: { firstName: "Bad", lastName: "Pass", email: "bad@example.com", password: "123" },
      }))
    ).rejects.toThrow(/password/i);
    (validatePassword as jest.Mock).mockReturnValue(true);
  });

  it("handles referral code during registration", async () => {
    const { handleReferralRegister } = require("@b/utils/affiliate");
    await handler(createHandler({
      body: { firstName: "Ref", lastName: "User", email: "ref@example.com", password: "ValidPass123!", ref: "REF123" },
    }));
    expect(handleReferralRegister).toHaveBeenCalledWith("REF123", "new-user-1");
  });
});
