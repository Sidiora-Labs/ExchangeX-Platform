import {
  slugify,
  RE_DIGIT,
  toCamelCase,
  randomUniqueId,
  formatNumber,
} from "@/utils/strings";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("trims surrounding whitespace", () => {
    expect(slugify("   Hello World   ")).toBe("hello-world");
  });

  it("strips punctuation", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("What's New?")).toBe("whats-new");
  });

  it("collapses repeated separators into one hyphen", () => {
    expect(slugify("Foo -- Bar")).toBe("foo-bar");
    expect(slugify("a    b")).toBe("a-b");
  });

  it("keeps digits", () => {
    expect(slugify("Bitcoin 2024 Report")).toBe("bitcoin-2024-report");
  });

  it("preserves existing hyphens", () => {
    expect(slugify("well-known")).toBe("well-known");
  });

  it("returns an empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("drops non-ASCII characters entirely", () => {
    // NOTE: the character class is [^a-z0-9 -], so accented and non-Latin
    // characters are removed rather than transliterated.
    expect(slugify("café")).toBe("caf");
    expect(slugify("日本語")).toBe("");
  });

  it("handles a string that is only punctuation", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("is idempotent", () => {
    const once = slugify("Hello, World!");
    expect(slugify(once)).toBe(once);
  });
});

describe("RE_DIGIT", () => {
  it("matches a run of digits", () => {
    expect(RE_DIGIT.test("0")).toBe(true);
    expect(RE_DIGIT.test("123")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(RE_DIGIT.test("")).toBe(false);
  });

  it("rejects mixed content", () => {
    expect(RE_DIGIT.test("12a")).toBe(false);
    expect(RE_DIGIT.test("a12")).toBe(false);
    expect(RE_DIGIT.test("1.2")).toBe(false);
    expect(RE_DIGIT.test("-1")).toBe(false);
    expect(RE_DIGIT.test(" 1")).toBe(false);
  });
});

describe("toCamelCase", () => {
  it("camel-cases a space-separated string", () => {
    expect(toCamelCase("hello world")).toBe("helloWorld");
  });

  it("lowercases the first word", () => {
    expect(toCamelCase("Hello World")).toBe("helloWorld");
  });

  it("handles three or more words", () => {
    expect(toCamelCase("one two three")).toBe("oneTwoThree");
  });

  it("processes each path segment independently", () => {
    expect(toCamelCase("my dir/my file")).toBe("myDir/myFile");
  });

  it("preserves the slash structure", () => {
    expect(toCamelCase("a b/c d/e f")).toBe("aB/cD/eF");
  });

  it("passes a single lowercase word through", () => {
    expect(toCamelCase("word")).toBe("word");
  });

  it("lowercases a single uppercase word", () => {
    expect(toCamelCase("WORD")).toBe("word");
  });

  it("returns an empty string for empty input", () => {
    expect(toCamelCase("")).toBe("");
  });
});

describe("randomUniqueId", () => {
  it("returns a string", () => {
    expect(typeof randomUniqueId()).toBe("string");
  });

  it("returns at most 9 characters", () => {
    expect(randomUniqueId().length).toBeLessThanOrEqual(9);
  });

  it("uses only base-36 characters", () => {
    for (let i = 0; i < 50; i++) {
      expect(randomUniqueId()).toMatch(/^[0-9a-z]*$/);
    }
  });

  it("is unlikely to collide across many calls", () => {
    const ids = new Set(Array.from({ length: 500 }, () => randomUniqueId()));
    // Not a guarantee, but 500 draws from 36^9 should not collide meaningfully.
    expect(ids.size).toBeGreaterThan(490);
  });
});

describe("formatNumber", () => {
  it("expands very small numbers to fixed notation", () => {
    expect(formatNumber(0.0001)).toBe("0.00010000");
  });

  it("expands numbers in scientific notation", () => {
    expect(formatNumber(1e-7)).toBe("0.00000010");
  });

  it("returns ordinary numbers unchanged", () => {
    expect(formatNumber(5)).toBe(5);
    expect(formatNumber(1234.56)).toBe(1234.56);
  });

  it("returns the 0.001 boundary unchanged", () => {
    // 0.001 is not < 0.001, so it falls through untouched.
    expect(formatNumber(0.001)).toBe(0.001);
  });

  it("returns zero unchanged", () => {
    // NOTE: the `value !== 0` guard means 0 skips formatting entirely and is
    // returned as a number, not a string.
    expect(formatNumber(0)).toBe(0);
  });

  it("passes non-numeric values straight through", () => {
    expect(formatNumber("abc")).toBe("abc");
    expect(formatNumber(null)).toBeNull();
    expect(formatNumber(undefined)).toBeUndefined();
  });

  it("passes negative numbers through when not small", () => {
    // NOTE: negatives are always < 0.001, so they take the formatting branch.
    expect(formatNumber(-5)).toBe("-5.00000000");
  });
});
