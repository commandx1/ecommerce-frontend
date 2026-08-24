import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import AccountMenu from "./AccountMenu"

const items = [
  { label: "Dashboard", onClick: vi.fn() },
  { label: "Sign Out", onClick: vi.fn(), variant: "danger" as const },
]

describe("AccountMenu", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    for (const item of items) {
      item.onClick.mockClear()
    }
  })

  it("keeps the menu closed until the trigger is pressed", () => {
    render(<AccountMenu displayName="Serhat Belen" email="serhat@example.com" items={items} />)

    expect(screen.getByRole("button", { name: /My Account/ })).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("button", { name: "Dashboard" })).not.toBeInTheDocument()
  })

  it("opens with the account identity and every item", async () => {
    const user = userEvent.setup()
    render(<AccountMenu displayName="Serhat Belen" email="serhat@example.com" items={items} />)

    await user.click(screen.getByRole("button", { name: /My Account/ }))

    expect(screen.getByText("serhat@example.com")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Dashboard" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument()
  })

  it("runs the item handler and closes itself", async () => {
    const user = userEvent.setup()
    render(<AccountMenu displayName="Serhat Belen" items={items} />)

    await user.click(screen.getByRole("button", { name: /My Account/ }))
    await user.click(screen.getByRole("button", { name: "Dashboard" }))

    expect(items[0].onClick).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("button", { name: "Dashboard" })).not.toBeInTheDocument()
  })

  it("closes when a pointer lands outside it", async () => {
    const user = userEvent.setup()
    render(
      <div>
        <AccountMenu displayName="Serhat Belen" items={items} />
        <button type="button">elsewhere</button>
      </div>,
    )

    await user.click(screen.getByRole("button", { name: /My Account/ }))
    await user.click(screen.getByRole("button", { name: "elsewhere" }))

    expect(screen.queryByRole("button", { name: "Dashboard" })).not.toBeInTheDocument()
  })

  it("omits the email line when the account has none", async () => {
    const user = userEvent.setup()
    render(<AccountMenu displayName="Serhat Belen" email={null} items={items} />)

    await user.click(screen.getByRole("button", { name: /My Account/ }))

    expect(screen.queryByText(/@/)).not.toBeInTheDocument()
  })
})
