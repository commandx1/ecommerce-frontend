import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen } from "@/test/render"
import RegisterForm from "./RegisterForm"

installRadixPointerPolyfills()

vi.mock("@/lib/api/auth-direct", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/auth-direct")>("@/lib/api/auth-direct")
  return {
    ...actual,
    authAPIDirect: {
      ...actual.authAPIDirect,
      register: vi.fn(),
      validateSignupToken: vi.fn(),
    },
  }
})

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Radix Select (>= 2.3.1) mirrors its value into a hidden native `<select required>`, so
  // without `noValidate` an unpicked required business-type select would let the browser's own
  // constraint validation block the submit before the zod-backed `validateForm` ever runs.
  it("shows the app's own validation message for an unpicked required select instead of being blocked", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<RegisterForm />)

    await user.click(screen.getByRole("button", { name: /Create Account/ }))

    expect(await screen.findByText("Business type is required")).toBeInTheDocument()
  })
})
