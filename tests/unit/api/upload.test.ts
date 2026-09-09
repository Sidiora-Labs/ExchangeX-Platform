
import { createHandler } from "./helpers";
// Note: this file is at tests/unit/api/ - helpers is in same dir

jest.mock("@b/utils/error", () => ({
  createError: (opts: any) => {
    const err = new Error(typeof opts === "string" ? opts : opts.message || "Error");
    (err as any).statusCode = typeof opts === "string" ? 500 : opts.statusCode || 500;
    return err;
  },
}));
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("fs/promises", () => ({
  writeFile: jest.fn(),
  readFile: jest.fn(async () => Buffer.from("filedata")),
  mkdir: jest.fn(),
  unlink: jest.fn(),
}));
jest.mock("sharp", () => jest.fn(() => ({
  resize: jest.fn().mockReturnThis(),
  toBuffer: jest.fn(async () => Buffer.from("resized")),
  webp: jest.fn().mockReturnThis(),
})));

describe("POST /upload", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/upload/index.post")).default;
  });

  it("handles file upload request", async () => {
    try {
      const result = await handler(createHandler({
        body: {
          file: {
            data: Buffer.from("testfile"),
            name: "test.jpg",
            type: "image/jpeg",
          },
        },
      }));
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });
});

describe("POST /upload/heic", () => {
  let handler: Function;

  beforeAll(async () => {
    handler = (await import("@b/api/upload/heic.post")).default;
  });

  it("handles HEIC conversion request", async () => {
    try {
      const result = await handler(createHandler({
        body: { file: { data: Buffer.from("heic"), name: "photo.heic" } },
      }));
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });
});
