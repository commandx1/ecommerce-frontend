import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import Verify2FAPage from "./page"

const mockVerify = vi.fn()
vi.mock("@/lib/api/two-factor", () => ({
  verifyTwoFactorLogin: (...args: unknown[]) => mockVerify(...args),
}))

vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

const validVerifyResponse = {
  id: "1",
  name: "Buyer",
  surname: "One",
  email: "buyer@example.com",
  phoneNumber: "555",
  emailConfirmed: true,
  phoneNumberConfirmed: true,
  twoFactorEnabled: true,
  lockoutEnd: null,
  createdDate: "2026-01-01",
  accessToken: "access-1",
  refreshToken: "refresh-1",
}

const submitCode = async () => {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText("Verification Code"), "123456")
  await user.click(screen.getByRole("button", { name: /Verify & Sign In/i }))
}

beforeEach(() => {
  mockVerify.mockReset()
})

describe("Verify2FAPage success redirect", () => {
  it("pushes to the redirect param when it is a valid same-origin path", async () => {
    mockVerify.mockResolvedValue(validVerifyResponse)
    const { router } = render(<Verify2FAPage />, {
      searchParams: "email=buyer%40example.com&redirect=%2Fproducts%2Fabc",
    })

    await submitCode()

    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/products/abc"))
  })

  it("falls back to / when the redirect param is an open-redirect attempt", async () => {
    mockVerify.mockResolvedValue(validVerifyResponse)
    const { router } = render(<Verify2FAPage />, { searchParams: "email=buyer%40example.com&redirect=%2F%2Fevil.com" })

    await submitCode()

    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/"))
  })

  it("falls back to / when the redirect param is a tab-smuggled evil.com attempt", async () => {
    mockVerify.mockResolvedValue(validVerifyResponse)
    const { router } = render(<Verify2FAPage />, {
      searchParams: "email=buyer%40example.com&redirect=%2F%09%2Fevil.com",
    })

    await submitCode()

    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/"))
  })
})

describe("Verify2FAPage Back to Sign In link", () => {
  it("carries a valid redirect through to /login", () => {
    render(<Verify2FAPage />, { searchParams: "email=buyer%40example.com&redirect=%2Fproducts%2Fabc" })

    expect(screen.getByRole("link", { name: /Back to Sign In/i })).toHaveAttribute(
      "href",
      `/login?redirect=${encodeURIComponent("/products/abc")}`,
    )
  })

  it("drops a hostile (tab-smuggled) redirect, pointing plainly at /login", () => {
    render(<Verify2FAPage />, { searchParams: "email=buyer%40example.com&redirect=%2F%09%2Fevil.com" })

    expect(screen.getByRole("link", { name: /Back to Sign In/i })).toHaveAttribute("href", "/login")
  })
})
