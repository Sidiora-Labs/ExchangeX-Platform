import { capitalize, weightDescription } from "@/utils/text";

describe("capitalize", () => {
  it("uppercases the first character", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("leaves the rest of the string untouched", () => {
    expect(capitalize("hELLO wORLD")).toBe("HELLO wORLD");
  });

  it("is a no-op on an already-capitalized string", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });

  it("handles a single character", () => {
    expect(capitalize("a")).toBe("A");
  });

  it("leaves a leading digit alone", () => {
    expect(capitalize("1st place")).toBe("1st place");
  });

  it("does not trim leading whitespace", () => {
    expect(capitalize(" hello")).toBe(" hello");
  });

  // NOTE: `capitalize` indexes text[0] without a guard, so an empty string
  // throws "Cannot read properties of undefined (reading 'toUpperCase')".
  // Callers must not pass "". Asserting current behavior.
  it("throws on an empty string", () => {
    expect(() => capitalize("")).toThrow(TypeError);
  });
});

describe("weightDescription", () => {
  it("maps 400 to Regular", () => {
    expect(weightDescription(400)).toBe("Regular");
  });

  it("maps 500 to Medium", () => {
    expect(weightDescription(500)).toBe("Medium");
  });

  // NOTE: every other weight falls through to "Bold", including 100 and 900.
  it.each([100, 200, 300, 600, 700, 800, 900])(
    "maps %i to Bold",
    (weight) => {
      expect(weightDescription(weight)).toBe("Bold");
    }
  );

  it("maps 0 to Bold", () => {
    expect(weightDescription(0)).toBe("Bold");
  });
});
