import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import VerifyEmailHeader from "./VerifyEmailHeader"

describe("VerifyEmailHeader", () => {
  it("names the address the code was sent to when it is known", () => {
    render(<VerifyEmailHeader email="buyer@example.com" />)

    expect(screen.getByText("buyer@example.com")).toBeInTheDocument()
    expect(screen.getByText(/Enter the 6-digit verification code sent to/)).toBeInTheDocument()
  })

  it("falls back to a complete sentence instead of trailing off when email is empty", () => {
    render(<VerifyEmailHeader email="" />)

    expect(screen.getByText("Enter the 6-digit verification code sent to your email address.")).toBeInTheDocument()
  })
})
