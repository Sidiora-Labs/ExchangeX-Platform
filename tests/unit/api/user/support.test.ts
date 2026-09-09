
import { createHandler, createMockModels, mockSupportTicket } from "../helpers";

const mockModels = createMockModels({
  supportTicket: {
    findOne: jest.fn(async () => mockSupportTicket),
    findAll: jest.fn(async () => [mockSupportTicket]),
    findByPk: jest.fn(async () => mockSupportTicket),
    create: jest.fn(async (d: any) => ({ ...d, id: "ticket-new" })),
    update: jest.fn(async () => [1]),
    destroy: jest.fn(async () => 1),
    count: jest.fn(async () => 1),
  },
  supportTicketReply: {
    create: jest.fn(async (d: any) => ({ ...d, id: "reply-1" })),
    findAll: jest.fn(async () => []),
  },
  chatMessage: {
    findAll: jest.fn(async () => []),
    create: jest.fn(async (d: any) => ({ ...d, id: "msg-1" })),
  },
});

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
  getFiltered: jest.fn(async () => ({ items: [mockSupportTicket], pagination: { page: 1 } })),
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/emails", () => ({ emailQueue: { add: jest.fn() } }));
jest.mock("@b/utils/notifications", () => ({ handleNotification: jest.fn() }));

describe("GET /user/support/ticket", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/support/ticket/index.get")).default;
  });

  it("returns user's support tickets", async () => {
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});

describe("POST /user/support/ticket", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/support/ticket/index.post")).default;
  });

  it("creates a new support ticket", async () => {
    mockModels.supportTicket.create.mockResolvedValue({ ...mockSupportTicket, id: "new-ticket" });
    const result = await handler(createHandler({
      body: { subject: "Test", message: "Help me", priority: "HIGH" },
    }));
    expect(result).toBeDefined();
  });
});

describe("GET /user/support/ticket/[id]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/support/ticket/[id]/index.get")).default;
  });

  it("returns a specific support ticket", async () => {
    const result = await handler(createHandler({ params: { id: "ticket-1" } }));
    expect(result).toBeDefined();
  });
});

describe("POST /user/support/ticket/[id]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/support/ticket/[id]/index.post")).default;
  });

  it("adds a reply to a support ticket", async () => {
    mockModels.supportTicketReply.create.mockResolvedValue({ id: "reply-new" });
    const result = await handler(createHandler({
      params: { id: "ticket-1" },
      body: { message: "I need more help" },
    }));
    expect(result).toBeDefined();
  });
});

describe("PUT /user/support/ticket/[id]/close", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/support/ticket/[id]/close.put")).default;
  });

  it("closes a support ticket", async () => {
    mockModels.supportTicket.update.mockResolvedValue([1]);
    const result = await handler(createHandler({ params: { id: "ticket-1" } }));
    expect(result).toBeDefined();
  });
});

describe("GET /user/support/chat", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/support/chat/index.get")).default;
  });

  it("returns chat history", async () => {
    mockModels.chatMessage.findAll.mockResolvedValue([]);
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});
