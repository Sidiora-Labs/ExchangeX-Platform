
import { createHandler, createMockModels, mockNotification } from "../helpers";

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
  getFiltered: jest.fn(async () => ({ items: [mockNotification], pagination: { page: 1 } })),
  notFoundMetadataResponse: jest.fn((m?: string) => ({ description: `${m} not found` })),
  serverErrorResponse: { description: "Server error" },
  unauthorizedResponse: { description: "Unauthorized" },
}));

describe("GET /user/notification", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/notification/index.get")).default;
  });

  it("returns user notifications", async () => {
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });

  it("throws 401 for unauthenticated request", async () => {
    await expect(handler(createHandler({ user: undefined }))).rejects.toThrow();
  });
});

describe("DELETE /user/notification/[id]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/notification/[id]/index.del")).default;
  });

  it("deletes a specific notification", async () => {
    mockModels.notification.destroy.mockResolvedValue(1);
    const result = await handler(createHandler({ params: { id: "notif-1" } }));
    expect(result).toHaveProperty("message");
  });
});

describe("DELETE /user/notification/index", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/notification/index.del")).default;
  });

  it("clears all user notifications", async () => {
    mockModels.notification.destroy.mockResolvedValue(5);
    const result = await handler(createHandler());
    expect(result).toHaveProperty("message");
  });
});

describe("DELETE /user/notification/clean", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/user/notification/clean.del")).default;
  });

  it("cleans old read notifications", async () => {
    mockModels.notification.destroy.mockResolvedValue(3);
    const result = await handler(createHandler());
    expect(result).toHaveProperty("message");
  });
});
