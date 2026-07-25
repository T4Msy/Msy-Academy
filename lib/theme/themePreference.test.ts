import { describe, expect, it } from "vitest";
import { isThemePreference, resolveThemePreference } from "./themePreference";

describe("theme preference", () => {
  it("accepts the three supported preferences", () => {
    expect(["light", "dark", "system"].every((value) => isThemePreference(value))).toBe(true);
    expect(isThemePreference("sepia")).toBe(false);
  });

  it("resolves system to the current operating system theme", () => {
    expect(resolveThemePreference("light", "dark")).toBe("light");
    expect(resolveThemePreference("dark", "light")).toBe("dark");
    expect(resolveThemePreference("system", "light")).toBe("light");
    expect(resolveThemePreference("system", "dark")).toBe("dark");
  });
});
