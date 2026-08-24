import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { makeAccountUser } from "@/test/factories"
import { type UpdateMePayload, updateMe } from "./account"
import { ApiRequestError } from "./request"

const mockUser = makeAccountUser()

let capturedPutBody: UpdateMePayload | null = null
let capturedAuthHeader: string | null = null

/**
 * These handlers capture the outgoing request so the assertions below can pin the exact wire
 * contract. They are registered per test because the global setup resets handlers after every
 * test case.
 */
beforeEach(() => {
  capturedPutBody = null
  capturedAuthHeader = null

  server.use(
    http.put("*/backend-api/users/me", async ({ request }) => {
      capturedPutBody = (await request.json()) as UpdateMePayload
      capturedAuthHeader = request.headers.get("Authorization")
      return HttpResponse.json(mockUser)
    }),
  )
})

describe("updateMe contract", () => {
  it("returns the typed account user on a happy path", async () => {
    const response = await updateMe("token-1", { name: "Serhat", surname: "Belen" })

    expect(response).toEqual(mockUser)
    expect(typeof response.id).toBe("string")
    expect(typeof response.emailConfirmed).toBe("boolean")
    expect(typeof response.twoFactorEnabled).toBe("boolean")
  })

  it("sends the bearer token and only the payload fields provided by the caller", async () => {
    const payload: UpdateMePayload = { name: "Serhat", surname: "Belen" }
    await updateMe("token-1", payload)

    expect(capturedAuthHeader).toBe("Bearer token-1")
    // updateMe forwards exactly what the caller passes - it does not merge in the
    // previously-fetched user, so a caller that omits optional fields sends a payload
    // without them (i.e. this is not a "only changed fields" diff, it is a pass-through).
    expect(capturedPutBody).toEqual(payload)
    expect(capturedPutBody).not.toHaveProperty("email")
    expect(capturedPutBody).not.toHaveProperty("phoneNumber")
    expect(capturedPutBody).not.toHaveProperty("twoFactorEnabled")
  })

  it("sends optional fields when the caller supplies them", async () => {
    const payload: UpdateMePayload = {
      name: "Serhat",
      surname: "Belen",
      email: "new@example.com",
      phoneNumber: "+15559998888",
      twoFactorEnabled: true,
    }
    await updateMe("token-1", payload)

    expect(capturedPutBody).toEqual(payload)
  })

  it("rejects with a 400 validation error", async () => {
    server.use(
      http.put("*/backend-api/users/me", () => HttpResponse.json({ message: "Invalid phone number" }, { status: 400 })),
    )

    await expect(updateMe("token-1", { name: "Serhat", surname: "Belen" })).rejects.toMatchObject({
      status: 400,
      message: "Invalid phone number",
    })
  })

  it("rejects with a 401 and marks the error as auth-handled", async () => {
    server.use(
      http.put("*/backend-api/users/me", () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 })),
    )

    const error = await updateMe("token-expired", { name: "Serhat", surname: "Belen" }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error.status).toBe(401)
    expect(error.authHandled).toBe(true)
  })

  it("rejects with a 403 without marking the error as auth-handled", async () => {
    server.use(http.put("*/backend-api/users/me", () => HttpResponse.json({ message: "Forbidden" }, { status: 403 })))

    const error = await updateMe("token-1", { name: "Serhat", surname: "Belen" }).catch((e) => e)

    expect(error.status).toBe(403)
    expect(error.authHandled).toBe(false)
  })

  it("rejects with a 500 server error", async () => {
    server.use(
      http.put("*/backend-api/users/me", () => HttpResponse.json({ message: "Server error" }, { status: 500 })),
    )

    await expect(updateMe("token-1", { name: "Serhat", surname: "Belen" })).rejects.toMatchObject({ status: 500 })
  })

  it("rejects on a network failure", async () => {
    server.use(http.put("*/backend-api/users/me", () => HttpResponse.error()))

    await expect(updateMe("token-1", { name: "Serhat", surname: "Belen" })).rejects.toBeInstanceOf(ApiRequestError)
  })

  it("tolerates a null lockoutEnd and missing optional roleName", async () => {
    const { roleName: _roleName, ...withoutRoleName } = mockUser
    server.use(http.put("*/backend-api/users/me", () => HttpResponse.json({ ...withoutRoleName, lockoutEnd: null })))

    const response = await updateMe("token-1", { name: "Serhat", surname: "Belen" })

    expect(response.lockoutEnd).toBeNull()
    expect(response.roleName).toBeUndefined()
  })
})
