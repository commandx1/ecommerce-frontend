import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { refreshTokenForImpersonation } from "./impersonation"
import { ApiRequestError } from "./request"

let capturedBody: Record<string, unknown> | null = null

beforeEach(() => {
  capturedBody = null

  server.use(
    http.post("*/api/auth/refresh-token", async ({ request }) => {
      capturedBody = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        roleName: "VENDOR",
      })
    }),
  )
})

describe("refreshTokenForImpersonation contract", () => {
  it("exchanges a refresh token for a new access token on a happy path", async () => {
    const response = await refreshTokenForImpersonation("admin-issued-refresh-token")

    expect(capturedBody).toEqual({ refreshToken: "admin-issued-refresh-token" })
    expect(response.accessToken).toBe("new-access-token")
    expect(response.refreshToken).toBe("new-refresh-token")
    expect(response.roleName).toBe("VENDOR")
  })

  // NOTE: this endpoint is the Next.js BFF at src/app/api/auth/refresh-token/route.ts, not the
  // ecommerce-api backend directly - it always builds `refreshToken: refreshToken ||
  // refreshTokenValue`, so its own body can never literally omit `refreshToken` (it falls back
  // to the token the caller sent). `roleName`, however, only exists if the backend's
  // `UserResponse` includes it, so that part is a real, reachable case. This test covers
  // refreshTokenForImpersonation's own tolerance for a response shape that a *different* caller
  // of this same client function could still send it (e.g. a stale/misbehaving proxy), not a
  // shape the current route.ts produces.
  it("tolerates a response that omits roleName, and does not crash if refreshToken were absent", async () => {
    server.use(http.post("*/api/auth/refresh-token", () => HttpResponse.json({ accessToken: "new-access-token" })))

    const response = await refreshTokenForImpersonation("refresh-1")

    expect(response.accessToken).toBe("new-access-token")
    expect(response.refreshToken).toBeUndefined()
    expect(response.roleName).toBeUndefined()
  })

  it("tolerates a null roleName", async () => {
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        HttpResponse.json({ accessToken: "new-access-token", refreshToken: "r", roleName: null }),
      ),
    )

    const response = await refreshTokenForImpersonation("refresh-1")

    expect(response.roleName).toBeNull()
  })

  it("passes through extra backend-added fields via the index signature", async () => {
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        HttpResponse.json({ accessToken: "a", refreshToken: "r", roleName: "VENDOR", userId: "user-9" }),
      ),
    )

    const response = await refreshTokenForImpersonation("refresh-1")

    expect(response.userId).toBe("user-9")
  })

  it("rejects with a 401 for an invalid/expired impersonation token", async () => {
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        HttpResponse.json({ message: "Invalid or expired refresh token" }, { status: 401 }),
      ),
    )

    const error = await refreshTokenForImpersonation("bad-token").catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error.status).toBe(401)
    expect(error.message).toBe("Invalid or expired refresh token")
    // Impersonation exchange runs against the "app" client (appApiClient), which also carries
    // the shared auth interceptor - a 401 here is still flagged auth-handled the same way a
    // normal backend-client 401 would be.
    expect(error.authHandled).toBe(true)
  })

  it("rejects with a 403 when the admin lacks impersonation rights", async () => {
    server.use(
      http.post("*/api/auth/refresh-token", () => HttpResponse.json({ message: "Forbidden" }, { status: 403 })),
    )

    const error = await refreshTokenForImpersonation("refresh-1").catch((e) => e)

    expect(error.status).toBe(403)
    expect(error.authHandled).toBe(false)
  })

  it("rejects with a 500 server error", async () => {
    server.use(
      http.post("*/api/auth/refresh-token", () => HttpResponse.json({ message: "Server error" }, { status: 500 })),
    )

    await expect(refreshTokenForImpersonation("refresh-1")).rejects.toMatchObject({ status: 500 })
  })

  it("rejects on a network failure with the fallback message", async () => {
    server.use(http.post("*/api/auth/refresh-token", () => HttpResponse.error()))

    const error = await refreshTokenForImpersonation("refresh-1").catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
  })
})
