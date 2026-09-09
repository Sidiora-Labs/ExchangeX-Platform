
import { createHandler, createMockModels } from "./helpers";
// Note: this file is at tests/unit/api/ - helpers is in same dir

const mockModels = createMockModels({
  setting: {
    findAll: jest.fn(async () => [
      { key: "siteName", value: "ExchangeX" },
      { key: "maintenanceMode", value: "false" },
    ]),
    findOne: jest.fn(async ({ where }: any) => {
      const settings: Record<string, string> = { siteName: "ExchangeX", maintenanceMode: "false" };
      return settings[where.key] ? { key: where.key, value: settings[where.key] } : null;
    }),
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

describe("GET /settings", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/settings/index.get")).default;
  });

  it("returns public settings", async () => {
    const result = await handler(createHandler());
    expect(result).toBeDefined();
  });
});
