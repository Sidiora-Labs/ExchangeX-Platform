import {
  formatBalance,
  formatCryptoBalance,
  formatFiatBalance,
  formatPercentage,
} from "@/utils/format";

describe("formatBalance", () => {
  describe("default formatting", () => {
    it("uses 3 decimal places by default", () => {
      expect(formatBalance(1)).toBe("1.000");
    });

    it("adds thousand separators", () => {
      expect(formatBalance(1234567.891, 3)).toBe("1,234,567.891");
    });

    it("rounds to the requested precision", () => {
      expect(formatBalance(1234.5678, 2)).toBe("1,234.57");
      expect(formatBalance(1234.5643, 2)).toBe("1,234.56");
    });

    it("pads when the value has fewer decimals than requested", () => {
      expect(formatBalance(5, 4)).toBe("5.0000");
    });

    it("supports zero decimals", () => {
      expect(formatBalance(1234.99, 0)).toBe("1,235");
    });
  });

  describe("currency prefix", () => {
    it("prepends the currency with a space", () => {
      expect(formatBalance(1234.5678, 2, "USD")).toBe("USD 1,234.57");
    });

    it("omits the prefix when no currency is given", () => {
      expect(formatBalance(1234.5678, 2)).toBe("1,234.57");
    });

    it("prefixes the zero fallback too", () => {
      expect(formatBalance(null, 2, "EUR")).toBe("EUR 0.00");
    });

    // NOTE: an empty-string currency is falsy, so the prefix branch is skipped
    // entirely rather than producing a leading space.
    it("treats an empty currency as no currency", () => {
      expect(formatBalance(1, 2, "")).toBe("1.00");
    });
  });

  describe("invalid input", () => {
    it("returns a zero-value string for null", () => {
      expect(formatBalance(null)).toBe("0.000");
    });

    it("returns a zero-value string for undefined", () => {
      expect(formatBalance(undefined)).toBe("0.000");
    });

    it("returns a zero-value string for a non-numeric string", () => {
      expect(formatBalance("abc")).toBe("0.000");
    });

    it("returns a zero-value string for NaN", () => {
      expect(formatBalance(NaN)).toBe("0.000");
    });

    it("honours the decimals argument in the fallback", () => {
      expect(formatBalance(null, 5)).toBe("0.00000");
      expect(formatBalance(undefined, 0)).toBe("0.");
    });
  });

  describe("numeric strings and edge values", () => {
    // NOTE: Number("") is 0, not NaN, so an empty string formats as zero
    // rather than taking the invalid-input branch. Same result here, but the
    // path differs — worth knowing if the fallback ever changes.
    it("treats an empty string as zero", () => {
      expect(formatBalance("", 2)).toBe("0.00");
    });

    it("parses numeric strings", () => {
      expect(formatBalance("1234.5", 2)).toBe("1,234.50");
    });

    it("handles negative values", () => {
      expect(formatBalance(-1234.5, 2)).toBe("-1,234.50");
    });

    it("handles zero", () => {
      expect(formatBalance(0, 2)).toBe("0.00");
    });

    it("handles very large numbers", () => {
      expect(formatBalance(1_000_000_000_000, 0)).toBe("1,000,000,000,000");
    });

    it("handles very small numbers by rounding to the requested precision", () => {
      expect(formatBalance(0.0000001, 2)).toBe("0.00");
    });

    it("keeps precision for small numbers when asked", () => {
      expect(formatBalance(0.00000012, 8)).toBe("0.00000012");
    });
  });
});

describe("formatCryptoBalance", () => {
  it("defaults to 6 decimal places", () => {
    expect(formatCryptoBalance(1.5, "BTC")).toBe("BTC 1.500000");
  });

  it("always includes the currency", () => {
    expect(formatCryptoBalance(0.12345678, "ETH")).toBe("ETH 0.123457");
  });

  it("accepts a custom precision", () => {
    expect(formatCryptoBalance(0.12345678, "ETH", 8)).toBe("ETH 0.12345678");
  });

  it("falls back to zero for invalid input", () => {
    expect(formatCryptoBalance(null, "BTC")).toBe("BTC 0.000000");
    expect(formatCryptoBalance("nope", "BTC")).toBe("BTC 0.000000");
  });

  it("adds separators to large balances", () => {
    expect(formatCryptoBalance(21000000, "BTC")).toBe("BTC 21,000,000.000000");
  });
});

describe("formatFiatBalance", () => {
  it("defaults to USD and 2 decimal places", () => {
    expect(formatFiatBalance(1234.5)).toBe("USD 1,234.50");
  });

  it("accepts a different currency", () => {
    expect(formatFiatBalance(1234.5, "EUR")).toBe("EUR 1,234.50");
  });

  it("accepts a custom precision", () => {
    expect(formatFiatBalance(1234.5, "JPY", 0)).toBe("JPY 1,235");
  });

  it("falls back to zero for invalid input", () => {
    expect(formatFiatBalance(null)).toBe("USD 0.00");
    expect(formatFiatBalance(undefined, "GBP")).toBe("GBP 0.00");
  });

  it("handles negatives", () => {
    expect(formatFiatBalance(-99.999)).toBe("USD -100.00");
  });
});

describe("formatPercentage", () => {
  it("appends a percent sign", () => {
    expect(formatPercentage(5)).toBe("5.00%");
  });

  it("defaults to 2 decimal places", () => {
    expect(formatPercentage(12.3456)).toBe("12.35%");
  });

  it("accepts a custom precision", () => {
    expect(formatPercentage(12.3456, 1)).toBe("12.3%");
    expect(formatPercentage(12.3456, 0)).toBe("12%");
  });

  it("handles negative percentages", () => {
    expect(formatPercentage(-9.21)).toBe("-9.21%");
  });

  it("handles zero", () => {
    expect(formatPercentage(0)).toBe("0.00%");
  });

  it("adds separators above a thousand", () => {
    expect(formatPercentage(1234.5)).toBe("1,234.50%");
  });

  it("parses numeric strings", () => {
    expect(formatPercentage("42.5")).toBe("42.50%");
  });

  describe("invalid input", () => {
    it("returns a zero percentage for null", () => {
      expect(formatPercentage(null)).toBe("0.00%");
    });

    it("returns a zero percentage for undefined", () => {
      expect(formatPercentage(undefined)).toBe("0.00%");
    });

    it("returns a zero percentage for a non-numeric string", () => {
      expect(formatPercentage("abc")).toBe("0.00%");
    });

    it("returns a zero percentage for NaN", () => {
      expect(formatPercentage(NaN)).toBe("0.00%");
    });

    it("honours the decimals argument in the fallback", () => {
      expect(formatPercentage(null, 3)).toBe("0.000%");
    });
  });
});
