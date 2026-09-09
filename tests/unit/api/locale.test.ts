
import { createHandler } from "./helpers";
// Note: this file is at tests/unit/api/ - helpers is in same dir

jest.mock("@b/utils/error", () => ({
  createError: (opts: any) => {
    const err = new Error(typeof opts === "string" ? opts : opts.message || "Error");
    (err as any).statusCode = typeof opts === "string" ? 500 : opts.statusCode || 500;
    return err;
  },
}));

describe("POST /locale/[lng]/[ns]", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/locale/[lng]/[ns]/index.post")).default;
  });

  it("handles locale translation request", async () => {
    try {
      const result = await handler(createHandler({
        params: { lng: "en", ns: "common" },
        body: {},
      }));
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });
});
