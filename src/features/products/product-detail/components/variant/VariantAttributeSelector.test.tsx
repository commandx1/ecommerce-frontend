import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { getRouterMock } from "@/test/mocks/next-navigation"
import { render, screen, waitFor } from "@/test/render"
import VariantAttributeSelector from "./VariantAttributeSelector"

/** Resolves/rejects on demand so a test can observe the in-flight state before settling it. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const readyAttributesResponse = {
  attributes: [
    {
      attribute: "Size",
      values: [
        { value: "Small", selected: true, option: true, available: true, name: null },
        { value: "Large", selected: false, option: true, available: true, name: null },
      ],
    },
    {
      attribute: "Color",
      values: [{ value: "Translucent", selected: false, option: true, available: true, name: null }],
    },
  ],
}

describe("VariantAttributeSelector", () => {
  it("shows an aria-hidden skeleton with no buttons while the attributes fetch is in flight", async () => {
    const { promise, resolve } = deferred<Response>()
    server.use(
      http.post("*/backend-api/products/variant-attributes", () => promise),
      http.post("*/backend-api/products/variant-attributes/match", () =>
        HttpResponse.json({ product: { id: "unused" }, userProducts: [] }),
      ),
    )

    const { container } = render(<VariantAttributeSelector productId="p-1" currentProductName="unrelated product" />)

    expect(container.querySelector("[aria-hidden]")).toBeInTheDocument()
    expect(container.querySelectorAll("button")).toHaveLength(0)

    resolve(HttpResponse.json({ attributes: [] }))
    await waitFor(() => expect(container.querySelector("[aria-hidden]")).not.toBeInTheDocument())
  })

  it("renders nothing when the attributes fetch fails (400 - variant-less product)", async () => {
    server.use(
      http.post("*/backend-api/products/variant-attributes", () =>
        HttpResponse.json({ message: "No variant of this product is currently available for sale." }, { status: 400 }),
      ),
    )

    const { container } = render(<VariantAttributeSelector productId="p-1" currentProductName="unrelated product" />)

    await waitFor(() => expect(container.querySelector("[aria-hidden]")).not.toBeInTheDocument())
    // ThemeProvider (next-themes) always injects a <script> into the container, so it's never
    // truly toBeEmptyDOMElement() - assert the product-facing content (chips, aria-busy wrapper)
    // is absent instead.
    expect(container.querySelectorAll("button")).toHaveLength(0)
    expect(container.querySelector("[aria-busy]")).not.toBeInTheDocument()
  })

  it("renders nothing when the fetch succeeds with no usable groups", async () => {
    server.use(http.post("*/backend-api/products/variant-attributes", () => HttpResponse.json({ attributes: [] })))

    const { container } = render(<VariantAttributeSelector productId="p-1" currentProductName="unrelated product" />)

    await waitFor(() => expect(container.querySelector("[aria-hidden]")).not.toBeInTheDocument())
    expect(container.querySelectorAll("button")).toHaveLength(0)
    expect(container.querySelector("[aria-busy]")).not.toBeInTheDocument()
  })

  it("renders one label and one chip per choice, per group, sorted by attribute name", async () => {
    server.use(http.post("*/backend-api/products/variant-attributes", () => HttpResponse.json(readyAttributesResponse)))

    const { container } = render(<VariantAttributeSelector productId="p-1" currentProductName="unrelated product" />)

    await screen.findByText("Color")

    // Response order is Size, Color - sortVariantGroups sorts alphabetically, so Color must
    // render first in the DOM.
    const labels = [...container.querySelectorAll(".mb-2")].map((el) => el.textContent)
    expect(labels).toEqual(["Color", "Size"])

    expect(screen.getByRole("button", { name: "Translucent" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Small" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Large" })).toBeInTheDocument()
  })

  it("marks the container aria-busy and disables every chip while a selection is pending, then navigates on success", async () => {
    const { promise, resolve } = deferred<Response>()
    server.use(
      http.post("*/backend-api/products/variant-attributes", () => HttpResponse.json(readyAttributesResponse)),
      http.post("*/backend-api/products/variant-attributes/match", () => promise),
    )

    const user = userEvent.setup()
    const { container } = render(<VariantAttributeSelector productId="p-1" currentProductName="unrelated product" />)
    const largeButton = await screen.findByRole("button", { name: "Large" })

    await user.click(largeButton)

    // ThemeProvider injects a <script> as the container's first child, so the aria-busy wrapper
    // (the component's own root) has to be found by attribute, not by position.
    await waitFor(() => expect(container.querySelector("[aria-busy]")).toHaveAttribute("aria-busy", "true"))
    for (const button of container.querySelectorAll("button")) {
      expect(button).toBeDisabled()
    }

    resolve(HttpResponse.json({ product: { id: "p-large" }, userProducts: [] }))

    await waitFor(() => expect(getRouterMock().push).toHaveBeenCalledWith("/products/p-large"))
    await waitFor(() => expect(container.querySelector("[aria-busy]")).toHaveAttribute("aria-busy", "false"))
  })
})
