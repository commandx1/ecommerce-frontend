import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import NotificationSocketBridge from "./NotificationSocketBridge"

const useNotificationSocket = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useNotificationSocket", () => ({ useNotificationSocket }))

describe("NotificationSocketBridge", () => {
  it("runs the socket hook and renders nothing", () => {
    const { container } = render(<NotificationSocketBridge />)

    expect(useNotificationSocket).toHaveBeenCalledTimes(1)
    expect(container).toBeEmptyDOMElement()
  })
})
