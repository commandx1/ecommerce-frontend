import { describe, expect, it } from "vitest"
import { readApiErrorMessage } from "./api-error"

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } })

describe("readApiErrorMessage", () => {
  it("returns the message field when present", () => {
    return readApiErrorMessage(jsonResponse({ message: "Invalid credentials" }), "fallback").then((result) => {
      expect(result).toBe("Invalid credentials")
    })
  })

  it("falls back to the error field when message is absent", () => {
    return readApiErrorMessage(jsonResponse({ error: "Bad request" }), "fallback").then((result) => {
      expect(result).toBe("Bad request")
    })
  })

  it("prefers message over error when both are present", () => {
    return readApiErrorMessage(jsonResponse({ message: "primary", error: "secondary" }), "fallback").then((result) => {
      expect(result).toBe("primary")
    })
  })

  it("parses a nested JSON string inside the error field", () => {
    const nested = JSON.stringify({ message: "Nested message" })
    return readApiErrorMessage(jsonResponse({ error: nested }), "fallback").then((result) => {
      expect(result).toBe("Nested message")
    })
  })

  it("falls back to the nested error field when the nested payload has no message", () => {
    const nested = JSON.stringify({ error: "Nested error" })
    return readApiErrorMessage(jsonResponse({ error: nested }), "fallback").then((result) => {
      expect(result).toBe("Nested error")
    })
  })

  it("returns the raw error string when the nested JSON is malformed", () => {
    const malformed = "{not valid json"
    return readApiErrorMessage(jsonResponse({ error: malformed }), "fallback").then((result) => {
      expect(result).toBe(malformed)
    })
  })

  it("returns the fallback when message and error are both blank", () => {
    return readApiErrorMessage(jsonResponse({ message: "   ", error: "" }), "fallback").then((result) => {
      expect(result).toBe("fallback")
    })
  })

  it("returns the fallback for a plain string body (not an object)", () => {
    const response = new Response(JSON.stringify("just a string"), {
      headers: { "Content-Type": "application/json" },
    })
    return readApiErrorMessage(response, "fallback").then((result) => {
      expect(result).toBe("fallback")
    })
  })

  it("returns the fallback for a null body", () => {
    const response = new Response(JSON.stringify(null), { headers: { "Content-Type": "application/json" } })
    return readApiErrorMessage(response, "fallback").then((result) => {
      expect(result).toBe("fallback")
    })
  })

  it("returns the fallback for an empty object", () => {
    return readApiErrorMessage(jsonResponse({}), "fallback").then((result) => {
      expect(result).toBe("fallback")
    })
  })

  it("returns the fallback when the body is not valid JSON (network/non-JSON error)", () => {
    const response = new Response("<html>not json</html>", { headers: { "Content-Type": "text/html" } })
    return readApiErrorMessage(response, "fallback").then((result) => {
      expect(result).toBe("fallback")
    })
  })
})
