
import { createHandler, createMockModels, mockWallet } from "../helpers";

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
jest.mock("@b/utils/eco/wallet", () => ({
  getWalletByUserIdAndCurrency: jest.fn(async () => mockWallet),
}));
jest.mock("@b/utils/emails", () => ({ emailQueue: { add: jest.fn() } }));
jest.mock("@b/utils/cache", () => ({
  CacheManager: { getInstance: () => ({ get: jest.fn(async () => null), set: jest.fn() }) },
}));

jest.mock("@b/api/finance/transfer/utils", () => ({
  calculateNewBalance: jest.fn((bal: number, amt: number) => bal - amt),
  calculateTransferFee: jest.fn(() => 0),
  createTransferTransaction: jest.fn(async () => ({ id: "tx-t-1" })),
  getCurrencyData: jest.fn(async () => ({ price: 1 })),
  getSortedChainBalances: jest.fn(async () => []),
  recordAdminProfit: jest.fn(),
  requiresPrivateLedgerUpdate: jest.fn(() => false),
  sendTransferEmails: jest.fn(),
  updatePrivateLedger: jest.fn(),
  updateWalletBalances: jest.fn(),
}));

describe("POST /finance/transfer", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/finance/transfer/index.post")).default;
  });

  beforeEach(() => jest.clearAllMocks());

  it("performs a wallet-to-wallet transfer", async () => {
    const result = await handler(createHandler({
      body: {
        fromType: "SPOT",
        toType: "FIAT",
        fromCurrency: "USD",
        toCurrency: "USD",
        amount: 100,
        transferType: "wallet",
      },
    }));
    expect(result).toBeDefined();
  });

  it("rejects transfer with zero amount", async () => {
    await expect(
      handler(createHandler({
        body: {
          fromType: "SPOT",
          toType: "FIAT",
          fromCurrency: "USD",
          amount: 0,
          transferType: "wallet",
        },
      }))
    ).rejects.toThrow();
  });
});
