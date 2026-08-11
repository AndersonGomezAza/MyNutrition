import { describe, expect, it } from "vitest";
import { formatPortion, parsePresentation } from "./units";

describe("parsePresentation", () => {
  it("parses kg into grams", () => {
    expect(parsePresentation("2 kg")).toEqual({ value: 2000, unit: "g" });
  });

  it("parses decimal kg into grams", () => {
    expect(parsePresentation("0.5 kg")).toEqual({ value: 500, unit: "g" });
  });

  it("parses bare grams", () => {
    expect(parsePresentation("500 g")).toEqual({ value: 500, unit: "g" });
  });

  it("collapses a space-separated thousands amount before parsing", () => {
    expect(parsePresentation("1 100 ml")).toEqual({ value: 1100, unit: "ml" });
  });

  it("parses liters into ml", () => {
    expect(parsePresentation("1.5 l")).toEqual({ value: 1500, unit: "ml" });
  });

  it("parses unidades as a unit count", () => {
    expect(parsePresentation("12 unidades")).toEqual({ value: 12, unit: "unidad" });
  });

  it("returns null for missing or unparseable presentation", () => {
    expect(parsePresentation(null)).toBeNull();
    expect(parsePresentation(undefined)).toBeNull();
    expect(parsePresentation("")).toBeNull();
    expect(parsePresentation("surtido")).toBeNull();
  });
});

describe("formatPortion", () => {
  it("rounds weight/volume portions to the nearest 5", () => {
    expect(formatPortion(123, "g")).toBe("125 g");
    expect(formatPortion(87, "ml")).toBe("85 ml");
  });

  it("never rounds a real amount down to 0", () => {
    expect(formatPortion(1, "g")).toBe("5 g");
  });

  it("rounds unit counts to the nearest half", () => {
    expect(formatPortion(2.7, "unidad")).toBe("2.5 unidades");
    expect(formatPortion(1, "unidad")).toBe("1 unidad");
  });
});
