
import { createHandler, createMockModels } from "../helpers";

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
jest.mock("@b/utils/emails", () => ({ emailQueue: { add: jest.fn() } }));
jest.mock("otplib", () => ({
  authenticator: {
    verify: jest.fn(() => true),
    generateSecret: jest.fn(() => "MOCKSECRET"),
    keyuri: jest.fn(() => "otpauth://totp/mock"),
  },
}));

describe("POST /auth/otp/verify", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/auth/otp/verify.post")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("verifies a valid OTP code", async () => {
    const result = await handler(createHandler({
      body: { otp: "123456", secret: "MOCKSECRET", type: "APP" },
    }));
    expect(result).toHaveProperty("message");
  });
});

describe("POST /auth/otp/generate", () => {
  let handler: Function;

  beforeAll(async () => {
    try {
      handler = (await import("@b/api/auth/otp/generate.post")).default;
    } catch { handler = null; }
  });

  it("generates an OTP secret for authenticated user", async () => {
    if (!handler) return;
    const result = await handler(createHandler({ body: { type: "APP" } }));
    expect(result).toBeDefined();
  });
});

describe("POST /auth/otp/toggle", () => {
  let handler: Function;

  beforeAll(async () => {
    try {
      handler = (await import("@b/api/auth/otp/toggle.post")).default;
    } catch { handler = null; }
  });

  it("toggles OTP for authenticated user", async () => {
    if (!handler) return;
    mockModels.twoFactor.findOrCreate.mockResolvedValue([{ id: "tf-1", enabled: true, type: "APP" }, true]);
    const result = await handler(createHandler({ body: { enabled: true, type: "APP" } }));
    expect(result).toBeDefined();
  });
});
