import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAuthStore } from "@/stores/authStore"
import { handleApiError } from "./api-error-handler"

describe("handleApiError", () => {
  beforeEach(() => {
    window.location.href = "http://localhost/some-page"
  })

  it("resolves without throwing for a 2xx response", async () => {
    const response = new Response(null, { status: 200 })
    await expect(handleApiError(response)).resolves.toBeUndefined()
  })

  it("throws on a non-401/403 error status without logging out", async () => {
    useAuthStore.setState({ isAuthenticated: true })
    const response = new Response(null, { status: 500 })

    await expect(handleApiError(response)).rejects.toThrow("Request failed with status 500")
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it("throws on a 404 without logging out", async () => {
    const response = new Response(null, { status: 404 })
    await expect(handleApiError(response)).rejects.toThrow("Request failed with status 404")
  })

  it("logs out and throws Unauthorized on a 401 response", async () => {
    useAuthStore.setState({ isAuthenticated: true })
    const response = new Response(null, { status: 401 })

    await expect(handleApiError(response)).rejects.toThrow("Unauthorized: Session expired or access denied")
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it("logs out and throws Unauthorized on a 403 response", async () => {
    useAuthStore.setState({ isAuthenticated: true })
    const response = new Response(null, { status: 403 })

    await expect(handleApiError(response)).rejects.toThrow("Unauthorized: Session expired or access denied")
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it("redirects via the provided router when given on a 401", async () => {
    const push = vi.fn()
    const response = new Response(null, { status: 401 })

    await expect(handleApiError(response, { push })).rejects.toThrow()
    expect(push).toHaveBeenCalledWith("/login")
  })

  it("falls back to window.location.href when no router is provided", async () => {
    const response = new Response(null, { status: 401 })

    await expect(handleApiError(response)).rejects.toThrow()
    expect(window.location.href).toBe("/login")
  })
})
