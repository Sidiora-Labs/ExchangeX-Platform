/**
 * Shared test helpers for backend API unit tests.
 *
 * Every API route handler follows the same contract:
 *   export default async (data: Handler) => { ... }
 * where `Handler` = { user?, body?, query?, ... }
 *
 * This module provides:
 *   - createHandler()    – builds a fake Handler object
 *   - createMockModels() – returns a deeply-mocked @b/db.models
 *   - createMockSequelize() – returns a mocked sequelize with transaction support
 *   - mockModule()       – jest.mock wrapper for common @b/* modules
 */

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

export function createHandler(overrides: Partial<Handler> = {}): Handler {
  return {
    user: { id: "test-user-1", email: "test@example.com", roleId: "role-1" },
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as any;
}

export const adminHandler = (overrides: Partial<Handler> = {}) =>
  createHandler({
    user: {
      id: "admin-1",
      email: "admin@example.com",
      roleId: "admin-role",
      role: { name: "Admin" },
    },
    ...overrides,
  });

// ---------------------------------------------------------------------------
// Common mock data
// ---------------------------------------------------------------------------

export const mockUser = {
  id: "test-user-1",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  password: "$argon2id$v=19$m=65536,t=3,p=4$hashed",
  roleId: "role-1",
  status: "ACTIVE",
  emailVerified: true,
  twoFactor: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  get: function (opts?: any) {
    return { ...this };
  },
};

export const mockAdminUser = {
  ...mockUser,
  id: "admin-1",
  email: "admin@example.com",
  roleId: "admin-role",
  role: { id: "admin-role", name: "Admin", permissions: [] },
};

export const mockWallet = {
  id: "wallet-1",
  userId: "test-user-1",
  currency: "USD",
  type: "FIAT",
  balance: 10000,
  inOrder: 0,
  get: function () {
    return { ...this };
  },
};

export const mockSpotWallet = {
  ...mockWallet,
  id: "wallet-spot-1",
  type: "SPOT",
  currency: "BTC",
  balance: 1.5,
};

export const mockTransaction = {
  id: "tx-1",
  userId: "test-user-1",
  walletId: "wallet-1",
  type: "DEPOSIT",
  amount: 500,
  status: "PENDING",
  currency: "USD",
  createdAt: new Date(),
  get: function () {
    return { ...this };
  },
};

export const mockExchangeOrder = {
  id: "order-1",
  userId: "test-user-1",
  symbol: "BTC/USDT",
  type: "LIMIT",
  side: "BUY",
  amount: 0.1,
  price: 50000,
  status: "OPEN",
  createdAt: new Date(),
  get: function () {
    return { ...this };
  },
};

export const mockExchangeMarket = {
  id: "market-1",
  name: "BTC/USDT",
  currency: "BTC",
  pair: "USDT",
  status: true,
  metadata: {
    limits: { amount: { min: 0.001, max: 1000 } },
  },
  get: function () {
    return { ...this };
  },
};

export const mockBinaryOrder = {
  id: "bin-order-1",
  userId: "test-user-1",
  symbol: "BTC/USDT",
  side: "RISE",
  type: "RISE_FALL",
  amount: 100,
  status: "PENDING",
  profit: 87,
  result: "WIN",
  entryPrice: 50000,
  closedAt: new Date(Date.now() + 60000),
  createdAt: new Date(),
  get: function () {
    return { ...this };
  },
};

export const mockSupportTicket = {
  id: "ticket-1",
  userId: "test-user-1",
  subject: "Help needed",
  message: "I need help with my account",
  status: "OPEN",
  priority: "MEDIUM",
  createdAt: new Date(),
  get: function () {
    return { ...this };
  },
};

export const mockKYCTemplate = {
  id: "kyc-template-1",
  title: "Basic KYC",
  level: 1,
  status: true,
  fields: [],
  get: function () {
    return { ...this };
  },
};

export const mockKYCApplication = {
  id: "kyc-app-1",
  userId: "test-user-1",
  templateId: "kyc-template-1",
  status: "PENDING",
  data: {},
  createdAt: new Date(),
  get: function () {
    return { ...this };
  },
};

export const mockNotification = {
  id: "notif-1",
  userId: "test-user-1",
  title: "Test Notification",
  message: "This is a test",
  type: "INFO",
  read: false,
  createdAt: new Date(),
  get: function () {
    return { ...this };
  },
};

export const mockRole = {
  id: "role-1",
  name: "User",
  permissions: [],
  get: function () {
    return { ...this };
  },
};

export const mockInvestmentPlan = {
  id: "plan-1",
  title: "Starter Plan",
  currency: "USD",
  walletType: "SPOT",
  minAmount: 100,
  maxAmount: 10000,
  profitPercentage: 10,
  defaultProfit: 100,
  defaultResult: "WIN",
  status: true,
  get: function () {
    return { ...this };
  },
};

export const mockInvestmentDuration = {
  id: "duration-1",
  planId: "plan-1",
  duration: 1,
  timeframe: "DAY",
  get: function () {
    return { ...this };
  },
};

export const mockInvestment = {
  id: "inv-1",
  userId: "test-user-1",
  planId: "plan-1",
  durationId: "duration-1",
  walletId: "wallet-1",
  amount: 1000,
  profit: 100,
  result: "WIN",
  status: "ACTIVE",
  createdAt: new Date(),
  get: function () {
    return { ...this };
  },
};

// ---------------------------------------------------------------------------
// Sequelize / Model mock factory
// ---------------------------------------------------------------------------

export function createMockSequelize() {
  return {
    transaction: jest.fn(async (cb: Function) => {
      const fakeTx = { LOCK: { UPDATE: "UPDATE" } };
      return cb(fakeTx);
    }),
    LOCK: { UPDATE: "UPDATE" },
  };
}

/** Create a model mock with common CRUD methods that track state in memory. */
function crudModel(initialData: Record<string, any> = {}) {
  const store = { ...initialData };
  return {
    _store: store,
    findOne: jest.fn(async ({ where }: any) => {
      return Object.values(store).find((item: any) => {
        return Object.entries(where).every(([k, v]) => item[k] === v);
      }) || null;
    }),
    findByPk: jest.fn(async (id: string) => store[id] || null),
    findAll: jest.fn(async () => Object.values(store)),
    create: jest.fn(async (data: any) => {
      const id = data.id || `mock-${Math.random().toString(36).slice(2, 8)}`;
      const record = { ...data, id };
      store[id] = record;
      return record;
    }),
    update: jest.fn(async (data: any, { where }: any) => {
      let count = 0;
      for (const [id, item] of Object.entries(store) as any) {
        if (where.id ? item.id === where.id : Object.entries(where).every(([k, v]: any) => item[k] === v)) {
          store[id] = { ...item, ...data };
          count++;
        }
      }
      return [count];
    }),
    destroy: jest.fn(async ({ where }: any) => {
      let count = 0;
      for (const [id, item] of Object.entries(store) as any) {
        if (where.id ? item.id === where.id : Object.entries(where).every(([k, v]: any) => item[k] === v)) {
          delete store[id];
          count++;
        }
      }
      return count;
    }),
    count: jest.fn(async () => Object.keys(store).length),
    upsert: jest.fn(async (data: any) => [data, true]),
    findOrCreate: jest.fn(async ({ where, defaults }: any) => {
      const existing = Object.values(store).find((item: any) =>
        Object.entries(where).every(([k, v]) => item[k] === v)
      );
      if (existing) return [existing, false];
      const id = defaults?.id || `mock-${Math.random().toString(36).slice(2, 8)}`;
      const record = { ...defaults, ...where, id };
      store[id] = record;
      return [record, true];
    }),
    bulkCreate: jest.fn(async (items: any[]) => items.map(i => ({ ...i, id: i.id || `mock-${Math.random().toString(36).slice(2, 8)}` }))),
  };
}

/**
 * Creates a fully mocked models object with sensible defaults.
 * Pass overrides to seed specific models with initial data.
 */
export function createMockModels(overrides: Record<string, any> = {}) {
  const defaultModels: Record<string, any> = {
    user: crudModel({ "test-user-1": mockUser }),
    wallet: crudModel({ "wallet-1": mockWallet }),
    walletPnl: crudModel(),
    transaction: crudModel(),
    role: crudModel({ "role-1": mockRole }),
    permission: crudModel(),
    kyc: crudModel(),
    twoFactor: crudModel(),
    providerUser: crudModel(),
    author: crudModel(),
    exchangeOrder: crudModel(),
    exchangeMarket: crudModel(),
    exchangeCurrency: crudModel(),
    exchangeWatchlist: crudModel(),
    binaryOrder: crudModel(),
    notification: crudModel(),
    supportTicket: crudModel(),
    supportTicketReply: crudModel(),
    chatMessage: crudModel(),
    kycTemplate: crudModel(),
    kycApplication: crudModel(),
    investmentPlan: crudModel(),
    investmentDuration: crudModel(),
    investment: crudModel(),
    forexPlan: crudModel(),
    forexDuration: crudModel(),
    forexInvestment: crudModel(),
    forexAccount: crudModel(),
    forexTransaction: crudModel(),
    currency: crudModel(),
    currencyDepositMethod: crudModel(),
    depositGateway: crudModel(),
    withdrawMethod: crudModel(),
    withdrawMethodFee: crudModel(),
    profitSetting: crudModel(),
    announcement: crudModel(),
    setting: crudModel(),
    api: crudModel(),
    apiKey: crudModel(),
    extension: crudModel(),
    log: crudModel(),
    notificationTemplate: crudModel(),
    post: crudModel(),
    page: crudModel(),
    category: crudModel(),
    tag: crudModel(),
    comment: crudModel(),
    slider: crudModel(),
    media: crudModel(),
    ecosystemToken: crudModel(),
    ecosystemMarket: crudModel(),
    ecosystemOrder: crudModel(),
    ecosystemWallet: crudModel(),
    custodialWallet: crudModel(),
    masterWallet: crudModel(),
    ecosystemLedger: crudModel(),
    ecosystemUTXO: crudModel(),
    ecosystemBlockchain: crudModel(),
    futuresMarket: crudModel(),
    futuresOrder: crudModel(),
    futuresPosition: crudModel(),
    stakingPool: crudModel(),
    stakingDuration: crudModel(),
    stakingLog: crudModel(),
    icoProject: crudModel(),
    icoPhase: crudModel(),
    icoToken: crudModel(),
    icoContribution: crudModel(),
    icoAllocation: crudModel(),
    p2pOffer: crudModel(),
    p2pTrade: crudModel(),
    p2pPaymentMethod: crudModel(),
    p2pCommission: crudModel(),
    p2pEscrow: crudModel(),
    p2pReview: crudModel(),
    p2pDispute: crudModel(),
    ecommerceProduct: crudModel(),
    ecommerceCategory: crudModel(),
    ecommerceOrder: crudModel(),
    ecommerceDiscount: crudModel(),
    ecommerceShipping: crudModel(),
    ecommerceWishlist: crudModel(),
    ecommerceReview: crudModel(),
    affiliateReward: crudModel(),
    affiliateCondition: crudModel(),
    affiliateReferral: crudModel(),
    faqCategory: crudModel(),
    faqQuestion: crudModel(),
    mailwizardCampaign: crudModel(),
    mailwizardTemplate: crudModel(),
    aiInvestmentPlan: crudModel(),
    aiInvestmentDuration: crudModel(),
    aiInvestmentLog: crudModel(),
  };

  return { ...defaultModels, ...overrides };
}

// ---------------------------------------------------------------------------
// Module mock helpers
// ---------------------------------------------------------------------------

/** Install the common @b/db mock. Call at top level of every test file. */
export function mockDb(models?: Record<string, any>) {
  const m = models || createMockModels();
  jest.mock("@b/db", () => ({
    sequelize: createMockSequelize(),
    models: m,
  }));
  return m;
}

/** Install common utility module mocks. */
export function mockUtils() {
  jest.mock("@b/utils/logger", () => ({
    logError: jest.fn(),
    logInfo: jest.fn(),
    logWarn: jest.fn(),
  }));
  jest.mock("@b/utils/emails", () => ({
    emailQueue: { add: jest.fn() },
    sendEmail: jest.fn(),
    sendInvestmentEmail: jest.fn(),
    sendBinaryOrderEmail: jest.fn(),
    sendTransactionStatusUpdateEmail: jest.fn(),
  }));
  jest.mock("@b/utils/notifications", () => ({
    handleNotification: jest.fn(),
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
  jest.mock("@b/utils/redis", () => ({
    RedisSingleton: {
      getInstance: () => ({
        get: jest.fn(async () => null),
        set: jest.fn(async () => {}),
        del: jest.fn(async () => {}),
      }),
    },
  }));
  jest.mock("@b/utils/exchange", () => ({
    __esModule: true,
    default: {
      startExchange: jest.fn(),
      getInstance: jest.fn(),
    },
  }));
  jest.mock("@b/utils/cache", () => ({
    CacheManager: {
      getInstance: () => ({
        get: jest.fn(async () => null),
        set: jest.fn(async () => {}),
      }),
    },
  }));
  jest.mock("@b/handler/Websocket", () => ({
    sendMessageToRoute: jest.fn(),
  }));
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

/** Assert a function throws with a specific statusCode. */
export async function expectError(
  fn: () => Promise<any>,
  statusCode: number,
  messagePart?: string
) {
  await expect(fn()).rejects.toThrow(
    messagePart ? expect.objectContaining({ message: expect.stringContaining(messagePart) }) : /.+/
  );
  try {
    await fn();
  } catch (err: any) {
    expect(err.statusCode).toBe(statusCode);
  }
}

// Re-export jest for convenience
export { jest };
