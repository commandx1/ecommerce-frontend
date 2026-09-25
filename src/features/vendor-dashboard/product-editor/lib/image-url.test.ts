import { describe, expect, it } from "vitest"
import { isValidImageUrl } from "./image-url"

describe("isValidImageUrl", () => {
  it.each([
    ["https://cdn.example/a.png", true],
    ["http://cdn.example/a.png", true],
    ["  https://cdn.example/a.png  ", true],
    ["ftp://example.com/a.png", false],
    ["javascript:alert(1)", false],
    ["not a url at all", false],
    ["/uploads/a.png", false],
    ["", false],
  ])("%s -> %s", (value, valid) => {
    expect(isValidImageUrl(value)).toBe(valid)
  })
})
