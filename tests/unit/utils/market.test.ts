import { formatLargeNumber, transformTickers } from "@/utils/market";

describe("formatLargeNumber", () => {
  describe("magnitude suffixes", () => {
    it("formats billions with a B suffix", () => {
      expect(formatLargeNumber(1_000_000_000)).toBe("1.00B");
      expect(formatLargeNumber(2_500_000_000)).toBe("2.50B");
    });

    it("formats millions with an M suffix", () => {
      expect(formatLargeNumber(1_000_000)).toBe("1.00M");
      expect(formatLargeNumber(52_050_000)).toBe("52.05M");
    });

    it("formats thousands with a K suffix", () => {
      expect(formatLargeNumber(1_000)).toBe("1.00K");
      expect(formatLargeNumber(7_230)).toBe("7.23K");
      expect(formatLargeNumber(999_499)).toBe("999.50K");
    });

    it("formats values between 1 and 1000 with two decimals", () => {
      expect(formatLargeNumber(1)).toBe("1.00");
      expect(formatLargeNumber(999.999)).toBe("1000.00");
      expect(formatLargeNumber(42.5)).toBe("42.50");
    });
  });

  describe("boundaries", () => {
    it("switches to K at exactly 1000", () => {
      expect(formatLargeNumber(999)).toBe("999.00");
      expect(formatLargeNumber(1000)).toBe("1.00K");
    });

    it("switches to M at exactly 1,000,000", () => {
      expect(formatLargeNumber(999_999)).toBe("1000.00K");
      expect(formatLargeNumber(1_000_000)).toBe("1.00M");
    });

    it("switches to B at exactly 1,000,000,000", () => {
      expect(formatLargeNumber(1_000_000_000)).toBe("1.00B");
    });
  });

  describe("sub-1 values", () => {
    it("returns the raw string when no precision is given", () => {
      expect(formatLargeNumber(0.5)).toBe("0.5");
      expect(formatLargeNumber(0.00001357)).toBe("0.00001357");
    });

    it("applies the precision argument when given", () => {
      expect(formatLargeNumber(0.5, 4)).toBe("0.5000");
      expect(formatLargeNumber(0.123456789, 8)).toBe("0.12345679");
    });

    it("formats zero", () => {
      expect(formatLargeNumber(0)).toBe("0");
      expect(formatLargeNumber(0, 2)).toBe("0.00");
    });
  });

  describe("negatives", () => {
    it("falls through to the sub-1 branch", () => {
      // NOTE: every comparison is `>=`, so negatives never match a magnitude
      // branch and are returned as-is regardless of size.
      expect(formatLargeNumber(-5)).toBe("-5");
      expect(formatLargeNumber(-1_000_000)).toBe("-1000000");
    });

    it("respects precision for negatives", () => {
      expect(formatLargeNumber(-5, 2)).toBe("-5.00");
    });
  });

  describe("string input", () => {
    it("parses numeric strings", () => {
      expect(formatLargeNumber("1500")).toBe("1.50K");
      expect(formatLargeNumber("0.5")).toBe("0.5");
    });

    it("parses leading numbers from mixed strings", () => {
      // parseFloat stops at the first non-numeric character.
      expect(formatLargeNumber("1500abc")).toBe("1.50K");
    });
  });

  describe("invalid input", () => {
    it('returns "0" for a non-numeric string', () => {
      expect(formatLargeNumber("abc")).toBe("0");
    });

    it('returns "0" for an empty string', () => {
      expect(formatLargeNumber("")).toBe("0");
    });

    it('returns "0" for NaN', () => {
      expect(formatLargeNumber(NaN)).toBe("0");
    });
  });
});

describe("transformTickers", () => {
  const sample = {
    "BTC/USDT": {
      last: 118_626.35,
      change: -9.2134,
      baseVolume: 5_370_000,
      quoteVolume: 54_190_000,
    },
    "ETH/USDC": {
      last: 3_120.5,
      change: 2.5,
      baseVolume: 1_200,
      quoteVolume: 3_400_000,
    },
  };

  it("returns one entry per symbol", () => {
    expect(transformTickers(sample)).toHaveLength(2);
  });

  it("splits the symbol into currency and pair", () => {
    const [btc] = transformTickers(sample);
    expect(btc.currency).toBe("BTC");
    expect(btc.pair).toBe("USDT");
    expect(btc.name).toBe("BTC/USDT");
  });

  it("carries the last price through untouched", () => {
    const [btc] = transformTickers(sample);
    expect(btc.price).toBe(118_626.35);
  });

  it("fixes change to two decimal places as a string", () => {
    const [btc, eth] = transformTickers(sample);
    expect(btc.change).toBe("-9.21");
    expect(eth.change).toBe("2.50");
  });

  it("formats both volumes with magnitude suffixes", () => {
    const [btc] = transformTickers(sample);
    expect(btc.baseVolume).toBe("5.37M");
    expect(btc.quoteVolume).toBe("54.19M");
  });

  it("formats a sub-million volume as K", () => {
    const [, eth] = transformTickers(sample);
    expect(eth.baseVolume).toBe("1.20K");
  });

  it("returns an empty array for an empty object", () => {
    expect(transformTickers({})).toEqual([]);
  });

  it("leaves change undefined when the ticker omits it", () => {
    // The implementation uses optional chaining: ticker.change?.toFixed(2).
    const result = transformTickers({
      "BTC/USDT": { last: 1, baseVolume: 1, quoteVolume: 1 },
    });
    expect(result[0].change).toBeUndefined();
  });

  it("handles a symbol with no slash", () => {
    // NOTE: split("/")[1] is undefined when the symbol is not a pair.
    const result = transformTickers({
      BTCUSDT: { last: 1, change: 0, baseVolume: 0, quoteVolume: 0 },
    });
    expect(result[0].currency).toBe("BTCUSDT");
    expect(result[0].pair).toBeUndefined();
  });
});
