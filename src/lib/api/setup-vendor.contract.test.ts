import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { ApiRequestError } from "./request"
import { refreshTokenForVendorSetup } from "./setup-vendor"

let capturedBody: Record<string, unknown> | null = null

beforeEach(() => {
  capturedBody = null

  server.use(
    http.post("*/api/auth/refresh-token", async ({ request }) => {
      capturedBody = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({
        accessToken: "post-setup-access-token",
        refreshToken: "post-setup-refresh-token",
        roleName: "VENDOR",
      })
    }),
  )
})

describe("refreshTokenForVendorSetup contract", () => {
  it("refreshes the token after vendor setup completes, reusing the impersonation endpoint", async () => {
    const response = await refreshTokenForVendorSetup("pre-setup-refresh-token")

    expect(capturedBody).toEqual({ refreshToken: "pre-setup-refresh-token" })
    expect(response.accessToken).toBe("post-setup-access-token")
    expect(response.roleName).toBe("VENDOR")
  })

  it("tolerates a response without a new refreshToken", async () => {
    server.use(http.post("*/api/auth/refresh-token", () => HttpResponse.json({ accessToken: "a" })))

    const response = await refreshTokenForVendorSetup("refresh-1")

    expect(response.refreshToken).toBeUndefined()
  })

  it("rejects with a 401 when the setup refresh token is invalid", async () => {
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        HttpResponse.json({ message: "Invalid refresh token" }, { status: 401 }),
      ),
    )

    const error = await refreshTokenForVendorSetup("bad-token").catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error.status).toBe(401)
    expect(error.authHandled).toBe(true)
  })

  it("rejects with a 404 when the setup session no longer exists", async () => {
    server.use(
      http.post("*/api/auth/refresh-token", () => HttpResponse.json({ message: "Not found" }, { status: 404 })),
    )

    await expect(refreshTokenForVendorSetup("refresh-1")).rejects.toMatchObject({ status: 404 })
  })

  it("rejects with a 500 server error", async () => {
    server.use(
      http.post("*/api/auth/refresh-token", () => HttpResponse.json({ message: "Server error" }, { status: 500 })),
    )

    await expect(refreshTokenForVendorSetup("refresh-1")).rejects.toMatchObject({ status: 500 })
  })

  it("rejects on a network failure", async () => {
    server.use(http.post("*/api/auth/refresh-token", () => HttpResponse.error()))

    await expect(refreshTokenForVendorSetup("refresh-1")).rejects.toBeInstanceOf(ApiRequestError)
  })
})
