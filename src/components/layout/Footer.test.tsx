import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import Footer from "./Footer"

describe("Footer", () => {
  // These four used to point at /privacy-policy, /terms-of-service, /hipaa-compliance and
  // /cookie-policy. None of those routes exist, so every one 404'd - on every page of the app,
  // since the footer is in the root layout. The documents themselves were written and shipped all
  // along: /legal is a document centre that selects one by `?doc=<id>`, and src/data/legal-*.json
  // carry exactly these four ids. Only the links were wrong.
  //
  // This is locked because a 404 on Privacy Policy and Terms of Service is not just a broken link.
  it.each([
    ["Privacy Policy", "/legal?doc=privacy-policy"],
    ["Terms of Service", "/legal?doc=terms-of-service"],
    ["HIPAA Compliance", "/legal?doc=hipaa-compliance"],
    ["Cookie Policy", "/legal?doc=cookie-policy"],
  ])("points %s at the legal document that actually exists", (label, href) => {
    render(<Footer />)

    expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href)
  })

  it("keeps the three support links that do resolve to real routes", () => {
    render(<Footer />)

    expect(screen.getByRole("link", { name: "Legal" })).toHaveAttribute("href", "/legal")
    expect(screen.getByRole("link", { name: "Help Center" })).toHaveAttribute("href", "/help-center")
    expect(screen.getByRole("link", { name: "Shipping Information" })).toHaveAttribute("href", "/shipping-information")
  })
})
