import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import type { SpecificationItem } from "../types"
import ProductSpecifications from "./ProductSpecifications"

const specifications: SpecificationItem[] = [
  { label: "Packaging", value: "8.5 gram syringe" },
  { label: "Type", value: "Adhesive resin cement" },
]

describe("ProductSpecifications", () => {
  it("renders each specification as a name/value pair in a definition list", () => {
    const { container } = render(<ProductSpecifications specifications={specifications} sdsUrl={null} />)

    expect(container.querySelector("dl")).not.toBeNull()
    expect(screen.getByText("Packaging")).toBeInTheDocument()
    expect(screen.getByText("8.5 gram syringe")).toBeInTheDocument()
    expect(screen.getByText("Type")).toBeInTheDocument()
    expect(screen.getByText("Adhesive resin cement")).toBeInTheDocument()
  })

  it("renders nothing when there are no specifications and no SDS link", () => {
    const { container } = render(<ProductSpecifications specifications={[]} sdsUrl={null} />)
    expect(container.querySelector("dl")).toBeNull()
    expect(container.querySelector("a")).toBeNull()
    expect(container.querySelector("div")).toBeNull()
  })

  it("links to the SDS with target=_blank and rel=noopener noreferrer", () => {
    render(<ProductSpecifications specifications={specifications} sdsUrl="https://example.com/sds.pdf" />)

    const link = screen.getByRole("link", { name: /safety data sheet/i })
    expect(link).toHaveAttribute("href", "https://example.com/sds.pdf")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("renders both rows when the same attribute name repeats, without a key collision", () => {
    const repeated: SpecificationItem[] = [
      { label: "Color", value: "Shade A2" },
      { label: "Color", value: "Shade B1" },
    ]
    render(<ProductSpecifications specifications={repeated} sdsUrl={null} />)

    expect(screen.getByText("Shade A2")).toBeInTheDocument()
    expect(screen.getByText("Shade B1")).toBeInTheDocument()
  })
})
