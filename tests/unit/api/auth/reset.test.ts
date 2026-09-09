
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
jest.mock("@b/utils/passwords", () => ({
  hashPassword: jest.fn(async (p: string) => `$hashed$${p}`),
  verifyPassword: jest.fn(async () => true),
  validatePassword: jest.fn(() => true),
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/emails", () => ({
  emailQueue: { add: jest.fn() },
  sendEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));
jest.mock("../utils", () => ({
  sendEmailVerificationToken: jest.fn(),
}));

describe("POST /auth/reset", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/auth/reset/index.post")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initiates password reset for existing user", async () => {
    mockModels.user.findOne.mockResolvedValue(mockUser);
    const result = await handler(createHandler({ body: { email: "test@example.com" } }));
    expect(result).toHaveProperty("message");
  });

  it("returns success even for non-existent user (prevent enumeration)", async () => {
    mockModels.user.findOne.mockResolvedValue(null);
    const result = await handler(createHandler({ body: { email: "nobody@example.com" } }));
    expect(result).toHaveProperty("message");
  });
});

describe("POST /auth/verify/reset", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/auth/verify/reset.post")).default;
  });

  it("resets password with valid token", async () => {
    mockModels.user.findOne.mockResolvedValue({ ...mockUser, emailVerified: true });
    const result = await handler(createHandler({
      body: { token: "valid-token", password: "NewPass123!" },
    }));
    expect(result).toHaveProperty("message");
  });
});

describe("POST /auth/verify/email", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/auth/verify/email.post")).default;
  });

  it("verifies email with valid token", async () => {
    mockModels.user.findOne.mockResolvedValue({ ...mockUser, emailVerified: false });
    const result = await handler(createHandler({ body: { token: "valid-token" } }));
    expect(result).toHaveProperty("message");
  });
});
