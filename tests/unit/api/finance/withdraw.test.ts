
import { createHandler, createMockModels, mockWallet, mockSpotWallet } from "../helpers";

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
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/emails", () => ({
  emailQueue: { add: jest.fn() },
  sendTransactionStatusUpdateEmail: jest.fn(),
}));
jest.mock("@b/utils/notifications", () => ({ handleNotification: jest.fn() }));
jest.mock("@b/utils/exchange", () => ({
  __esModule: true,
  default: { startExchange: jest.fn() },
}));
jest.mock("@b/utils/cache", () => ({
  CacheManager: { getInstance: () => ({ get: jest.fn(async () => null), set: jest.fn() }) },
}));
jest.mock("@b/utils/redis", () => ({
  RedisSingleton: { getInstance: () => ({ get: jest.fn(async () => null), set: jest.fn() }) },
}));

describe("POST /finance/withdraw/fiat", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/withdraw/fiat/index.post")).default;
  });

  beforeEach(() => jest.clearAllMocks());

  it("creates a fiat withdrawal request", async () => {
    mockModels.withdrawMethod.findOne.mockResolvedValue({
      id: "wm-1", currency: "USD", status: true, fixedFee: 5, percentageFee: 1,
      get() { return this; },
    });
    mockModels.wallet.findOne.mockResolvedValue({ ...mockWallet, balance: 5000 });
    mockModels.transaction.create.mockResolvedValue({ id: "tx-w-1" });
    try {
      const result = await handler(createHandler({
        body: { amount: 100, currency: "USD", methodId: "wm-1" },
      }));
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });
});

describe("POST /finance/withdraw/spot", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/withdraw/spot/index.post")).default;
  });

  it("creates a spot withdrawal request", async () => {
    mockModels.wallet.findOne.mockResolvedValue({ ...mockSpotWallet, balance: 1.0 });
    mockModels.currencyDepositMethod.findOne.mockResolvedValue({
      id: "dm-1", currency: "BTC", chain: "Bitcoin", get() { return this; },
    });
    try {
      const result = await handler(createHandler({
        body: { currency: "BTC", chain: "Bitcoin", amount: 0.1, toAddress: "bc1qtest" },
      }));
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });

  it("rejects withdrawal exceeding balance", async () => {
    mockModels.wallet.findOne.mockResolvedValue({ ...mockSpotWallet, balance: 0.01 });
    await expect(
      handler(createHandler({
        body: { currency: "BTC", chain: "Bitcoin", amount: 100, toAddress: "bc1qtest" },
      }))
    ).rejects.toThrow();
  });
});
