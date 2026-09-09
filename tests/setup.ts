// Shared Jest setup. Runs before every test file.

// Deterministic env for anything that reads config at import time.
process.env.TZ = "UTC";
process.env.NEXT_PUBLIC_SITE_NAME ??= "ExchangeX";
process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";

// Keep test output readable: fail loudly on unhandled rejections.
process.on("unhandledRejection", (err) => {
  throw err;
});

jest.setTimeout(15000);
