import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { BACKEND, jsonRequest } from "@/test/route-harness"
import { POST } from "./route"

/**
 * AuthController.refreshToken (ecommerce-api auth/controller/AuthController.java:82-95) is the
 * real upstream this route proxies:
 *   - reads the refresh token from the `refreshToken` Cookie (@CookieValue, not the body)
 *   - on success, sets `Authorization: Bearer <token>` and a `Set-Cookie: refreshToken=...`
 *     response header, and returns `UserResponse` as the JSON body - there is NO
 *     `accessToken`/`refreshToken` key in the body itself
 *   - on a missing cookie, returns `ResponseEntity.status(UNAUTHORIZED).build()`: a 401 with an
 *     EMPTY body
 * This route.ts must reconstruct { accessToken, refreshToken, ...user } for the frontend from
 * those headers, and must not itself crash on the empty-body 401 case.
 */

const REFRESH_URL = `${BACKEND}/api/auth/refresh-token`
const user = { id: "user-1", name: "Serhat", surname: "Belen", email: "s@example.com", roleName: "Vendor" }

describe("POST /api/auth/refresh-token", () => {
  it("rebuilds accessToken/refreshToken from the Authorization and Set-Cookie response headers", async () => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(user, {
          headers: {
            Authorization: "Bearer new-access-token",
            "Set-Cookie": "refreshToken=new-refresh-token; Path=/; HttpOnly",
          },
        }),
      ),
    )

    const response = await POST(jsonRequest("/api/auth/refresh-token", { refreshToken: "old-refresh-token" }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.accessToken).toBe("new-access-token")
    expect(data.refreshToken).toBe("new-refresh-token")
    expect(data.id).toBe("user-1")
    expect(data.roleName).toBe("Vendor")
    expect(response.headers.get("Set-Cookie")).toContain("refreshToken=new-refresh-token")
  })

  it("falls back to the request's own refreshToken when the backend sets no new cookie", async () => {
    server.use(
      http.post(REFRESH_URL, () => HttpResponse.json(user, { headers: { Authorization: "Bearer new-access-token" } })),
    )

    const response = await POST(jsonRequest("/api/auth/refresh-token", { refreshToken: "old-refresh-token" }))
    const data = await response.json()

    expect(data.refreshToken).toBe("old-refresh-token")
  })

  it("proxies the real 401 status instead of masking it as a 500 on the backend's empty body", async () => {
    // AuthController.refreshToken's missing-cookie branch is `ResponseEntity.status(UNAUTHORIZED).build()`
    // - genuinely no response body. `await response.json()` on that throws a SyntaxError; before
    // this fix that propagated to the route's outer catch and returned a masked 500 instead of
    // relaying the real 401.
    server.use(http.post(REFRESH_URL, () => new HttpResponse(null, { status: 401 })))

    const response = await POST(jsonRequest("/api/auth/refresh-token", { refreshToken: "" }))

    expect(response.status).toBe(401)
  })

  it("relays a non-empty error body and status verbatim", async () => {
    server.use(http.post(REFRESH_URL, () => HttpResponse.json({ message: "Refresh token expired" }, { status: 403 })))

    const response = await POST(jsonRequest("/api/auth/refresh-token", { refreshToken: "expired" }))
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.message).toBe("Refresh token expired")
  })
})
