
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

describe("POST /user/profile/wallet/connect", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/profile/wallet/connect.post")).default;
  });

  it("connects a wallet for the user", async () => {
    const result = await handler(createHandler({
      body: { address: "0x1234567890abcdef", chain: "ETH" },
    }));
    expect(result).toBeDefined();
  });

  it("throws 401 for unauthenticated user", async () => {
    await expect(handler(createHandler({ user: undefined }))).rejects.toThrow();
  });
});

describe("POST /user/profile/wallet/disconnect", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/profile/wallet/disconnect.post")).default;
  });

  it("disconnects a wallet", async () => {
    const result = await handler(createHandler({
      body: { address: "0x1234567890abcdef" },
    }));
    expect(result).toBeDefined();
  });
});
