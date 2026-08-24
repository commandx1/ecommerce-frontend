import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import AccountSettingsShared from "./AccountSettingsShared"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const signIn = (overrides: Partial<ReturnType<typeof makeAccountUser>> = {}) => {
  const user = makeAccountUser({ roleName: "BUYER", ...overrides })
  useAuthStore.setState({
    user: { ...user, roleName: user.roleName },
    accessToken: "access-token",
    refreshToken: "refresh-token",
    isAuthenticated: true,
  })
  return user
}

const renderSettings = (children?: React.ReactNode) =>
  render(
    <AccountSettingsShared title="Account Settings" description="Manage your profile.">
      {children}
    </AccountSettingsShared>,
  )

beforeEach(() => {
  vi.restoreAllMocks()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
})

describe("AccountSettingsShared", () => {
  it("prefills the profile form from the signed-in user", () => {
    signIn({ name: "Serhat", surname: "Belen", email: "serhat@example.com", phoneNumber: "+15551234567" })
    renderSettings()

    expect(screen.getByLabelText("First Name")).toHaveValue("Serhat")
    expect(screen.getByLabelText("Last Name")).toHaveValue("Belen")
    expect(screen.getByLabelText("Email Address")).toHaveValue("serhat@example.com")
    // NOTE: the phone number is rendered raw — this screen does not run it through
    // `formatPhoneNumber`, so whatever the backend stored is what the buyer sees.
    expect(screen.getByLabelText("Phone Number")).toHaveValue("+15551234567")
  })

  it("marks an unverified email address as such", () => {
    signIn({ emailConfirmed: false })
    renderSettings()

    expect(screen.getByText("Not verified")).toBeInTheDocument()
    expect(screen.queryByText("Verified")).not.toBeInTheDocument()
  })

  it("saves profile edits and pushes the server's version back into the store", async () => {
    const user = userEvent.setup()
    signIn({ name: "Serhat" })

    let payload: Record<string, unknown> | null = null
    server.use(
      http.put("*/backend-api/users/me", async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(makeAccountUser({ name: "Serhat Updated", roleName: "BUYER" }))
      }),
    )

    renderSettings()

    const firstName = screen.getByLabelText("First Name")
    await user.clear(firstName)
    await user.type(firstName, "Serhat Updated")
    await user.click(screen.getByRole("button", { name: /Save Changes/ }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Profile updated successfully!"))
    expect(payload).toMatchObject({ name: "Serhat Updated" })
    expect(useAuthStore.getState().user?.name).toBe("Serhat Updated")
  })

  it("reports a failed profile save without clearing the form", async () => {
    const user = userEvent.setup()
    signIn({ name: "Serhat" })
    server.use(http.put("*/backend-api/users/me", () => new HttpResponse(null, { status: 500 })))

    renderSettings()

    await user.click(screen.getByRole("button", { name: /Save Changes/ }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Failed to update profile. Please try again."))
    expect(screen.getByLabelText("First Name")).toHaveValue("Serhat")
  })

  it("turns two-factor authentication on through the same endpoint", async () => {
    const user = userEvent.setup()
    signIn({ twoFactorEnabled: false })

    let payload: Record<string, unknown> | null = null
    server.use(
      http.put("*/backend-api/users/me", async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(makeAccountUser({ twoFactorEnabled: true, roleName: "BUYER" }))
      }),
    )

    renderSettings()
    expect(screen.getByText("2FA Off")).toBeInTheDocument()

    await user.click(screen.getByRole("checkbox", { name: /Toggle two-factor authentication/ }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Two-factor authentication enabled"))
    expect(payload).toMatchObject({ twoFactorEnabled: true })
    expect(await screen.findByText("2FA Enabled")).toBeInTheDocument()
  })

  it("leaves the two-factor switch untouched when the update fails", async () => {
    const user = userEvent.setup()
    signIn({ twoFactorEnabled: false })
    server.use(http.put("*/backend-api/users/me", () => new HttpResponse(null, { status: 500 })))

    renderSettings()

    await user.click(screen.getByRole("checkbox", { name: /Toggle two-factor authentication/ }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Failed to update security settings."))
    expect(screen.getByRole("checkbox", { name: /Toggle two-factor authentication/ })).not.toBeChecked()
    expect(screen.getByText("2FA Off")).toBeInTheDocument()
  })

  it("warns while the account is locked out", () => {
    signIn({ lockoutEnd: new Date(Date.now() + 60 * 60 * 1000).toISOString() })
    renderSettings()

    expect(screen.getByRole("heading", { name: "Account temporarily locked" })).toBeInTheDocument()
  })

  it("hides the lockout warning once the lockout has expired", () => {
    signIn({ lockoutEnd: new Date(Date.now() - 60 * 60 * 1000).toISOString() })
    renderSettings()

    expect(screen.queryByRole("heading", { name: "Account temporarily locked" })).not.toBeInTheDocument()
  })

  it("shows licenses to buyers and company/payout cards to vendors", async () => {
    signIn({ roleName: "BUYER" })
    const buyerView = renderSettings()

    expect(screen.getByText("Buyer Account")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Company/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Payouts/ })).not.toBeInTheDocument()
    buyerView.unmount()

    signIn({ roleName: "Vendor" })
    renderSettings()

    expect(screen.getByText("Vendor Account")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Company/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Payouts/ })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("heading", { name: "Payouts" })).toBeInTheDocument())
  })

  it("adds a quick-nav entry for an embedded extra section", () => {
    signIn()
    renderSettings(<div>Address manager</div>)

    expect(screen.getByRole("link", { name: /Addresses/ })).toBeInTheDocument()
    expect(screen.getByText("Address manager")).toBeInTheDocument()
  })

  it("copies the account id to the clipboard", async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } })
    signIn({ id: "0123456789abcdef" })

    renderSettings()

    await user.click(screen.getByRole("button", { name: "ID 01234567" }))

    expect(writeText).toHaveBeenCalledWith("0123456789abcdef")
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument()
  })
})
