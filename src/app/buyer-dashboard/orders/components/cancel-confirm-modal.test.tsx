import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PendingCancelAction } from "../types"
import CancelConfirmModal from "./cancel-confirm-modal"

const mockUseBuyerOrdersCancelModalState = vi.fn()
const mockUseBuyerOrdersCancelModalActions = vi.fn()

vi.mock("../context/buyer-orders-context", () => ({
  useBuyerOrdersCancelModalState: () => mockUseBuyerOrdersCancelModalState(),
  useBuyerOrdersCancelModalActions: () => mockUseBuyerOrdersCancelModalActions(),
}))

const samplePendingAction: PendingCancelAction = {
  description: "Item is defective",
  orderItemIds: ["item-1"],
}

function createStateValue(overrides?: Partial<ReturnType<typeof mockUseBuyerOrdersCancelModalState>>) {
  return {
    isConfirmingCancel: false,
    pendingCancelAction: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  mockUseBuyerOrdersCancelModalState.mockReset()
  mockUseBuyerOrdersCancelModalActions.mockReset()
})

describe("CancelConfirmModal", () => {
  it("does not render confirmation content when there is no pending cancel action", () => {
    mockUseBuyerOrdersCancelModalState.mockReturnValue(createStateValue({ pendingCancelAction: null }))
    mockUseBuyerOrdersCancelModalActions.mockReturnValue({
      confirmPendingCancelAction: vi.fn(),
      setPendingCancelAction: vi.fn(),
    })

    render(<CancelConfirmModal />)

    expect(screen.queryByText("Cancel order item(s)?")).not.toBeInTheDocument()
  })

  it("renders the confirmation prompt when a cancel action is pending", () => {
    mockUseBuyerOrdersCancelModalState.mockReturnValue(createStateValue({ pendingCancelAction: samplePendingAction }))
    mockUseBuyerOrdersCancelModalActions.mockReturnValue({
      confirmPendingCancelAction: vi.fn(),
      setPendingCancelAction: vi.fn(),
    })

    render(<CancelConfirmModal />)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Cancel order item(s)?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Keep order" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Confirm cancel" })).toBeInTheDocument()
  })

  it("clears the pending action without submitting a cancel request when 'Keep order' is clicked", async () => {
    const user = userEvent.setup()
    const confirmPendingCancelAction = vi.fn()
    const setPendingCancelAction = vi.fn()
    mockUseBuyerOrdersCancelModalState.mockReturnValue(createStateValue({ pendingCancelAction: samplePendingAction }))
    mockUseBuyerOrdersCancelModalActions.mockReturnValue({ confirmPendingCancelAction, setPendingCancelAction })

    render(<CancelConfirmModal />)
    await user.click(screen.getByRole("button", { name: "Keep order" }))

    expect(setPendingCancelAction).toHaveBeenCalledWith(null)
    expect(confirmPendingCancelAction).not.toHaveBeenCalled()
  })

  it("submits the cancellation request when 'Confirm cancel' is clicked", async () => {
    const user = userEvent.setup()
    const confirmPendingCancelAction = vi.fn()
    const setPendingCancelAction = vi.fn()
    mockUseBuyerOrdersCancelModalState.mockReturnValue(createStateValue({ pendingCancelAction: samplePendingAction }))
    mockUseBuyerOrdersCancelModalActions.mockReturnValue({ confirmPendingCancelAction, setPendingCancelAction })

    render(<CancelConfirmModal />)
    await user.click(screen.getByRole("button", { name: "Confirm cancel" }))

    expect(confirmPendingCancelAction).toHaveBeenCalledTimes(1)
    expect(setPendingCancelAction).not.toHaveBeenCalled()
  })

  it("closes via Escape without submitting a cancel request while idle", async () => {
    const user = userEvent.setup()
    const confirmPendingCancelAction = vi.fn()
    const setPendingCancelAction = vi.fn()
    mockUseBuyerOrdersCancelModalState.mockReturnValue(
      createStateValue({ pendingCancelAction: samplePendingAction, isConfirmingCancel: false }),
    )
    mockUseBuyerOrdersCancelModalActions.mockReturnValue({ confirmPendingCancelAction, setPendingCancelAction })

    render(<CancelConfirmModal />)
    await user.keyboard("{Escape}")

    await waitFor(() => expect(setPendingCancelAction).toHaveBeenCalledWith(null))
    expect(confirmPendingCancelAction).not.toHaveBeenCalled()
  })

  it("disables both buttons and shows progress state while a cancel request is in flight", async () => {
    const user = userEvent.setup()
    const confirmPendingCancelAction = vi.fn()
    const setPendingCancelAction = vi.fn()
    mockUseBuyerOrdersCancelModalState.mockReturnValue(
      createStateValue({ pendingCancelAction: samplePendingAction, isConfirmingCancel: true }),
    )
    mockUseBuyerOrdersCancelModalActions.mockReturnValue({ confirmPendingCancelAction, setPendingCancelAction })

    render(<CancelConfirmModal />)

    expect(screen.getByRole("button", { name: "Keep order" })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Canceling/ })).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Confirm cancel" })).not.toBeInTheDocument()

    // Escape must not close (or re-request a cancel) while the request is still in flight -
    // otherwise a second, uncontrolled request could fire on top of the one already running.
    await user.keyboard("{Escape}")
    expect(setPendingCancelAction).not.toHaveBeenCalled()
    expect(confirmPendingCancelAction).not.toHaveBeenCalled()
  })

  it("ignores overlay clicks while a cancel request is in flight", async () => {
    const user = userEvent.setup()
    const confirmPendingCancelAction = vi.fn()
    const setPendingCancelAction = vi.fn()
    mockUseBuyerOrdersCancelModalState.mockReturnValue(
      createStateValue({ pendingCancelAction: samplePendingAction, isConfirmingCancel: true }),
    )
    mockUseBuyerOrdersCancelModalActions.mockReturnValue({ confirmPendingCancelAction, setPendingCancelAction })

    render(<CancelConfirmModal />)
    const overlay = document.querySelector('[data-slot="dialog-overlay"]')
    expect(overlay).not.toBeNull()

    await user.click(overlay as HTMLElement)

    expect(setPendingCancelAction).not.toHaveBeenCalled()
  })
})
