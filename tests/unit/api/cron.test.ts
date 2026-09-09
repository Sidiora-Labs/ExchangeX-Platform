
import { adminHandler, createMockModels } from "./helpers";
// Note: this file is at tests/unit/api/ - helpers is in same dir

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

describe("GET /cron", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/cron/index.get")).default;
  });

  it("returns cron job status", async () => {
    const result = await handler(adminHandler());
    expect(result).toBeDefined();
  });
});
