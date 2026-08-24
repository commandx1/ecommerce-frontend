import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import BillingAgreementsSection from "./BillingAgreementsSection"

describe("BillingAgreementsSection", () => {
  it("links to the legal pages from the consent copy", () => {
    render(<BillingAgreementsSection termsAgreed={false} setTermsAgreed={vi.fn()} />)

    expect(screen.getByRole("link", { name: "Terms and Conditions" })).toHaveAttribute("href", "/legal")
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/legal")
  })

  it("starts unchecked and reports the buyer's consent", async () => {
    const user = userEvent.setup()
    const setTermsAgreed = vi.fn()
    render(<BillingAgreementsSection termsAgreed={false} setTermsAgreed={setTermsAgreed} />)

    const checkbox = screen.getByRole("checkbox", { name: /I agree to the/ })
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(setTermsAgreed).toHaveBeenCalledWith(true)
  })

  it("reports withdrawal of consent too", async () => {
    const user = userEvent.setup()
    const setTermsAgreed = vi.fn()
    render(<BillingAgreementsSection termsAgreed setTermsAgreed={setTermsAgreed} />)

    await user.click(screen.getByRole("checkbox", { name: /I agree to the/ }))

    expect(setTermsAgreed).toHaveBeenCalledWith(false)
  })
})
