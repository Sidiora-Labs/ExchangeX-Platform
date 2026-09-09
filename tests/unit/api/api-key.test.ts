
import { createHandler, createMockModels } from "./helpers";
// Note: this file is at tests/unit/api/ - helpers is in same dir

const mockModels = createMockModels({
  apiKey: {
    findOne: jest.fn(async () => null),
    findAll: jest.fn(async () => [{ id: "key-1", name: "My Key", key: "abc123" }]),
    create: jest.fn(async (d: any) => ({ ...d, id: "key-new" })),
    update: jest.fn(async () => [1]),
    destroy: jest.fn(async () => 1),
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
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("crypto", () => ({
  ...jest.requireActual("crypto"),
  randomBytes: jest.fn(() => Buffer.from("random123")),
}));

describe("API Key Management", () => {
  it("GET /api-key - lists user API keys", async () => {
    const h = (await import("@b/api/api-key/index.get")).default;
    const result = await h(createHandler());
    expect(result).toBeDefined();
  });

  it("POST /api-key - creates API key", async () => {
    const h = (await import("@b/api/api-key/index.post")).default;
    const result = await h(createHandler({ body: { name: "My Key" } }));
    expect(result).toBeDefined();
  });

  it("PUT /api-key/[id] - updates API key", async () => {
    const h = (await import("@b/api/api-key/[id]/index.put")).default;
    const result = await h(createHandler({ params: { id: "key-1" }, body: { name: "Updated Key" } }));
    expect(result).toBeDefined();
  });

  it("DELETE /api-key/[id] - deletes API key", async () => {
    const h = (await import("@b/api/api-key/[id]/index.del")).default;
    const result = await h(createHandler({ params: { id: "key-1" } }));
    expect(result).toBeDefined();
  });
});
