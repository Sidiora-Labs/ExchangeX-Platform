
import { createHandler, createMockModels, createMockSequelize, mockUser } from "../helpers";

const mockModels = createMockModels();
const mockSequelize = createMockSequelize();

jest.mock("@b/db", () => ({ sequelize: mockSequelize, models: mockModels }));
jest.mock("@b/utils/error", () => ({
  createError: (opts: any) => {
    const err = new Error(typeof opts === "string" ? opts : opts.message || "Error");
    (err as any).statusCode = typeof opts === "string" ? 500 : opts.statusCode || 500;
    return err;
  },
}));
jest.mock("@b/utils/passwords", () => ({
  verifyPassword: jest.fn(async () => true),
  hashPassword: jest.fn(async (p: string) => `$hashed$${p}`),
  validatePassword: jest.fn(() => true),
}));
jest.mock("@b/utils/emails", () => ({
  emailQueue: { add: jest.fn() },
  sendEmail: jest.fn(),
  sendEmailVerificationToken: jest.fn(),
}));
jest.mock("@b/utils/notifications", () => ({ handleNotification: jest.fn() }));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("../utils", () => ({
  returnUserWithTokens: jest.fn(async ({ user, message }: any) => ({
    message,
    cookies: { accessToken: "tok", sessionId: "sid", csrfToken: "csrf" },
  })),
  sendEmailVerificationToken: jest.fn(),
  verifyRecaptcha: jest.fn(async () => true),
}));
jest.mock("@b/utils/constants", () => ({
  APP_TWILIO_ACCOUNT_SID: "",
  APP_TWILIO_AUTH_TOKEN: "",
}));

const { verifyPassword } = require("@b/utils/passwords");

describe("POST /auth/login", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/auth/login/index.post")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (verifyPassword as jest.Mock).mockResolvedValue(true);
    mockModels.user.findOne.mockResolvedValue({
      ...mockUser,
      twoFactor: null,
      get() { return { ...this }; },
    });
  });

  it("logs in a valid user with correct credentials", async () => {
    const result = await handler(createHandler({ body: { email: "test@example.com", password: "Pass123!" } }));
    expect(result).toHaveProperty("message");
    expect(result.message).toContain("logged in");
  });

  it("rejects login for non-existent user", async () => {
    mockModels.user.findOne.mockResolvedValue(null);
    await expect(
      handler(createHandler({ body: { email: "nobody@example.com", password: "x" } }))
    ).rejects.toThrow();
  });

  it("rejects login with wrong password", async () => {
    (verifyPassword as jest.Mock).mockResolvedValue(false);
    await expect(
      handler(createHandler({ body: { email: "test@example.com", password: "wrong" } }))
    ).rejects.toThrow();
  });

  it("rejects login for banned user", async () => {
    mockModels.user.findOne.mockResolvedValue({
      ...mockUser,
      status: "BANNED",
      twoFactor: null,
      get() { return { ...this }; },
    });
    await expect(
      handler(createHandler({ body: { email: "test@example.com", password: "Pass123!" } }))
    ).rejects.toThrow(/banned/i);
  });

  it("rejects login for suspended user", async () => {
    mockModels.user.findOne.mockResolvedValue({
      ...mockUser,
      status: "SUSPENDED",
      twoFactor: null,
      get() { return { ...this }; },
    });
    await expect(
      handler(createHandler({ body: { email: "test@example.com", password: "Pass123!" } }))
    ).rejects.toThrow(/suspended/i);
  });

  it("rejects login for inactive user", async () => {
    mockModels.user.findOne.mockResolvedValue({
      ...mockUser,
      status: "INACTIVE",
      twoFactor: null,
      get() { return { ...this }; },
    });
    await expect(
      handler(createHandler({ body: { email: "test@example.com", password: "Pass123!" } }))
    ).rejects.toThrow(/inactive/i);
  });
});
