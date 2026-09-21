import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeLicense } from "@/test/factories"
import { render, screen, waitFor, within } from "@/test/render"
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

  it("never sends `email` to PUT /users/me, even though it is displayed in the form", async () => {
    // UserUpdateRequest.java (ecommerce-api auth/dto) has no `email` field and the backend has no
    // @JsonIgnoreProperties(ignoreUnknown = true) for it, so an `email` key in this body throws
    // Jackson's UnrecognizedPropertyException, which the GlobalExceptionHandler RuntimeException
    // catch-all turns into a 400 for the *entire* save (including name/surname/phone changes).
    // Revert-proof: putting `email: formData.email` back into the updateMe(...) call in
    // AccountSettingsShared.tsx's updateProfile makes this assertion fail (payload gains an
    // `email` key) - measured locally before writing this test.
    const user = userEvent.setup()
    signIn({ name: "Serhat", email: "serhat@example.com" })

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
    expect(payload).not.toHaveProperty("email")
  })

  it("renders the email field as read-only since this form cannot persist email changes", () => {
    signIn({ email: "serhat@example.com" })
    renderSettings()

    expect(screen.getByLabelText("Email Address")).toBeDisabled()
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
    expect(screen.getByRole("checkbox", { name: /Toggle two-factor authentication/ })).not.toBeChecked()

    await user.click(screen.getByRole("checkbox", { name: /Toggle two-factor authentication/ }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Two-factor authentication enabled"))
    expect(payload).toMatchObject({ twoFactorEnabled: true })
    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: /Toggle two-factor authentication/ })).toBeChecked(),
    )
  })

  it("leaves the two-factor switch untouched when the update fails", async () => {
    const user = userEvent.setup()
    signIn({ twoFactorEnabled: false })
    server.use(http.put("*/backend-api/users/me", () => new HttpResponse(null, { status: 500 })))

    renderSettings()

    await user.click(screen.getByRole("checkbox", { name: /Toggle two-factor authentication/ }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Failed to update security settings."))
    expect(screen.getByRole("checkbox", { name: /Toggle two-factor authentication/ })).not.toBeChecked()
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
    expect(screen.getByRole("link", { name: /Licenses/ })).toBeInTheDocument()
    expect(await screen.findByRole("heading", { level: 2, name: "Professional Licenses" })).toBeInTheDocument()
    buyerView.unmount()

    signIn({ roleName: "Vendor" })
    renderSettings()

    expect(screen.getByText("Vendor Account")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Company/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Payouts/ })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Licenses/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Professional Licenses" })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("heading", { name: "Payouts" })).toBeInTheDocument())
  })

  it("renders licenses as a separate card between the extra section and security", async () => {
    signIn({ roleName: "BUYER" })
    server.use(
      http.get("*/backend-api/licenses", () => HttpResponse.json({ licenses: [makeLicense({ id: "l-1" })], total: 1 })),
    )
    renderSettings(<div>Address manager</div>)

    const licensesHeading = await screen.findByRole("heading", { level: 2, name: "Professional Licenses" })

    const personalInfoHeading = screen.getByRole("heading", { name: "Personal Information" })
    const personalInfoSection = personalInfoHeading.closest("section")
    expect(personalInfoSection).not.toBeNull()
    expect(
      within(personalInfoSection as HTMLElement).queryByRole("heading", { name: "Professional Licenses" }),
    ).not.toBeInTheDocument()
    expect(licensesHeading.closest("section")).not.toBe(personalInfoSection)

    const order = [
      personalInfoHeading,
      screen.getByText("Address manager"),
      licensesHeading,
      screen.getByRole("heading", { name: "Security" }),
    ]
    for (const [before, after] of [
      [order[0], order[1]],
      [order[1], order[2]],
      [order[2], order[3]],
    ]) {
      expect(before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
  })

  it("orders the quick nav to match the page order for buyers", () => {
    signIn({ roleName: "BUYER" })
    renderSettings(<div>Address manager</div>)

    const nav = screen.getByRole("navigation", { name: "Jump to settings section" })
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent?.trim()),
    ).toEqual(["Profile", "Address", "Licenses", "Security"])
  })

  it("adds a quick-nav entry for an embedded extra section", () => {
    signIn()
    renderSettings(<div>Address manager</div>)

    expect(screen.getByRole("link", { name: "Address" })).toBeInTheDocument()
    expect(screen.getByText("Address manager")).toBeInTheDocument()
  })

  it("places the extra section between personal information and security", () => {
    signIn()
    renderSettings(<div>Address manager</div>)

    const order = [
      screen.getByRole("heading", { name: "Personal Information" }),
      screen.getByText("Address manager"),
      screen.getByRole("heading", { name: "Security" }),
    ]
    for (const [before, after] of [
      [order[0], order[1]],
      [order[1], order[2]],
    ]) {
      expect(before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
  })
})
