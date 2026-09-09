/**
 * Setup file for API unit tests.
 * Installs global mocks for modules that require MySQL/Redis connections.
 * This file runs before each test suite in the api-unit project.
 */

// ---- Global @b/utils/query mock ----
// Must mock BEFORE any handler imports this module
const mockFilteredResult = { items: [], pagination: { page: 1, totalPages: 1, totalItems: 0 } };

jest.mock("@b/utils/query", () => ({
  getFiltered: jest.fn(async () => mockFilteredResult),
  notFoundMetadataResponse: jest.fn((model?: string) => ({
    description: `${model || "Resource"} not found`,
  })),
  serverErrorResponse: { description: "Internal server error" },
  unauthorizedResponse: { description: "Unauthorized" },
  createRecordResponses: jest.fn((model?: string) => ({
    200: { description: `${model || "Record"} created successfully` },
  })),
  deleteRecordResponses: jest.fn((model?: string) => ({
    200: { description: `${model || "Record"} deleted successfully` },
  })),
  updateRecordResponses: jest.fn((model?: string) => ({
    200: { description: `${model || "Record"} updated successfully` },
  })),
  getRecordResponses: jest.fn((model?: string) => ({
    200: { description: `${model || "Record"} retrieved successfully` },
  })),
  recordNotFoundResponse: jest.fn((model?: string) => ({
    description: `${model || "Record"} not found`,
  })),
}));

// ---- Global @b/db mock ----
// Prevents Sequelize from trying to connect to MySQL
const createModelMethods = () => ({
  findOne: jest.fn(async () => null),
  findByPk: jest.fn(async () => null),
  findAll: jest.fn(async () => []),
  create: jest.fn(async (d: any) => ({ ...d, id: `mock-${Math.random().toString(36).slice(2, 8)}` })),
  update: jest.fn(async () => [0]),
  destroy: jest.fn(async () => 0),
  count: jest.fn(async () => 0),
  upsert: jest.fn(async (d: any) => [d, true]),
  findOrCreate: jest.fn(async ({ defaults }: any) => [{ ...defaults, id: "mock-created" }, true]),
  bulkCreate: jest.fn(async (items: any[]) => items),
});

jest.mock("@b/db", () => {
  const modelNames = [
    "user", "wallet", "walletPnl", "transaction", "role", "permission",
    "kyc", "twoFactor", "providerUser", "author",
    "exchangeOrder", "exchangeMarket", "exchangeCurrency", "exchangeWatchlist",
    "binaryOrder", "notification", "supportTicket", "supportTicketReply", "chatMessage",
    "kycTemplate", "kycApplication",
    "investmentPlan", "investmentDuration", "investment",
    "forexPlan", "forexDuration", "forexInvestment", "forexAccount", "forexTransaction",
    "currency", "currencyDepositMethod", "depositGateway",
    "withdrawMethod", "withdrawMethodFee", "profitSetting",
    "announcement", "setting", "api", "apiKey", "extension", "log", "notificationTemplate",
    "post", "page", "category", "tag", "comment", "slider", "media",
    "ecosystemToken", "ecosystemMarket", "ecosystemOrder", "ecosystemWallet",
    "custodialWallet", "masterWallet", "ecosystemLedger", "ecosystemUTXO", "ecosystemBlockchain",
    "futuresMarket", "futuresOrder", "futuresPosition",
    "stakingPool", "stakingDuration", "stakingLog",
    "icoProject", "icoPhase", "icoToken", "icoContribution", "icoAllocation",
    "p2pOffer", "p2pTrade", "p2pPaymentMethod", "p2pCommission", "p2pEscrow", "p2pReview", "p2pDispute",
    "ecommerceProduct", "ecommerceCategory", "ecommerceOrder", "ecommerceDiscount",
    "ecommerceShipping", "ecommerceWishlist", "ecommerceReview",
    "affiliateReward", "affiliateCondition", "affiliateReferral",
    "faqCategory", "faqQuestion",
    "mailwizardCampaign", "mailwizardTemplate",
    "aiInvestmentPlan", "aiInvestmentDuration", "aiInvestmentLog",
  ];

  const models: Record<string, any> = {};
  for (const name of modelNames) {
    models[name] = createModelMethods();
  }

  return {
    sequelize: {
      transaction: jest.fn(async (cb: Function) => {
        return cb({ LOCK: { UPDATE: "UPDATE" } });
      }),
      LOCK: { UPDATE: "UPDATE" },
    },
    models,
  };
});

// ---- Global @b/utils/logger mock ----
jest.mock("@b/utils/logger", () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logDebug: jest.fn(),
}));

// ---- Global @b/utils/emails mock ----
jest.mock("@b/utils/emails", () => ({
  emailQueue: { add: jest.fn() },
  sendEmail: jest.fn(async () => {}),
  sendInvestmentEmail: jest.fn(async () => {}),
  sendBinaryOrderEmail: jest.fn(async () => {}),
  sendTransactionStatusUpdateEmail: jest.fn(async () => {}),
  sendPasswordResetEmail: jest.fn(async () => {}),
}));

// ---- Global @b/utils/notifications mock ----
jest.mock("@b/utils/notifications", () => ({
  handleNotification: jest.fn(async () => {}),
}));

// ---- Global @b/utils/error mock ----
jest.mock("@b/utils/error", () => ({
  createError: (opts: any) => {
    const err = new Error(typeof opts === "string" ? opts : opts.message || "Error");
    (err as any).statusCode = typeof opts === "string" ? 500 : opts.statusCode || 500;
    return err;
  },
}));

// ---- Global @b/utils/passwords mock ----
jest.mock("@b/utils/passwords", () => ({
  hashPassword: jest.fn(async (p: string) => `$hashed$${p}`),
  verifyPassword: jest.fn(async () => true),
  validatePassword: jest.fn(() => true),
}));

// ---- Global @b/utils/redis mock ----
jest.mock("@b/utils/redis", () => ({
  RedisSingleton: {
    getInstance: () => ({
      get: jest.fn(async () => null),
      set: jest.fn(async () => {}),
      del: jest.fn(async () => {}),
    }),
  },
}));

// ---- Global @b/utils/exchange mock ----
jest.mock("@b/utils/exchange", () => ({
  __esModule: true,
  default: {
    startExchange: jest.fn(async () => ({
      fetchTicker: jest.fn(async () => ({ last: 50000 })),
      fetchOHLCV: jest.fn(async () => []),
      fetchOrderBook: jest.fn(async () => ({ bids: [], asks: [] })),
      createOrder: jest.fn(async () => ({ id: "ext-order-1" })),
    })),
    getInstance: jest.fn(),
  },
}));

// ---- Global @b/utils/cache mock ----
jest.mock("@b/utils/cache", () => ({
  CacheManager: {
    getInstance: () => ({
      get: jest.fn(async () => null),
      set: jest.fn(async () => {}),
    }),
  },
}));

// ---- Global @b/handler/Websocket mock ----
jest.mock("@b/handler/Websocket", () => ({
  sendMessageToRoute: jest.fn(),
}));

// ---- Global @b/utils/constants mock ----
jest.mock("@b/utils/constants", () => ({
  crudParameters: [],
  paginationSchema: {},
  APP_TWILIO_ACCOUNT_SID: "",
  APP_TWILIO_AUTH_TOKEN: "",
}));
