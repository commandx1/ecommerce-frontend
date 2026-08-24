import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import { showToast, Toast } from "./Toast"

/** `sonner` is mocked globally in `src/test/setup.ts`; `toast.custom` records the render call. */
const customMock = toast.custom as unknown as ReturnType<typeof vi.fn>

const renderLatestToast = () => {
  const [renderToast] = customMock.mock.calls.at(-1) as [(id: string) => React.ReactElement]
  render(renderToast("toast-1"))
}

describe("showToast", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    customMock.mockClear()
  })

  it("uses a default title when only a message is given", () => {
    showToast.error("Something went wrong")
    renderLatestToast()

    expect(screen.getByRole("heading", { name: "Error" })).toBeInTheDocument()
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
  })

  it("uses the first argument as the title when two strings are given", () => {
    showToast.success("Saved", "Your changes are live.")
    renderLatestToast()

    expect(screen.getByRole("heading", { name: "Saved" })).toBeInTheDocument()
    expect(screen.getByText("Your changes are live.")).toBeInTheDocument()
  })

  it("reads a numeric second argument as the duration, not the message", () => {
    showToast.info("Heads up", 8000)

    expect(customMock).toHaveBeenCalledWith(expect.any(Function), { duration: 8000 })
    renderLatestToast()
    expect(screen.getByRole("heading", { name: "Info" })).toBeInTheDocument()
    expect(screen.getByText("Heads up")).toBeInTheDocument()
  })

  it("defaults to a four-second display", () => {
    showToast.warning("Careful")

    expect(customMock).toHaveBeenCalledWith(expect.any(Function), { duration: 4000 })
  })

  it("keeps a loading toast on screen until it is dismissed", () => {
    showToast.loading("Uploading")

    expect(customMock).toHaveBeenCalledWith(expect.any(Function), { duration: Number.POSITIVE_INFINITY })
  })
})

describe("Toast", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("dismisses itself by id from its close control", async () => {
    const user = userEvent.setup()
    render(<Toast id="toast-9" type="success" title="Saved" message="All good" />)

    await user.click(screen.getByRole("button"))

    expect(toast.dismiss).toHaveBeenCalledWith("toast-9")
  })

  it("omits the progress bar for a loading toast", () => {
    const { container, rerender } = render(<Toast id="t" type="success" title="Saved" message="All good" />)
    expect(container.querySelector(".toast-progress")).not.toBeNull()

    rerender(<Toast id="t" type="loading" title="Loading" message="Working" />)
    expect(container.querySelector(".toast-progress")).toBeNull()
  })
})
