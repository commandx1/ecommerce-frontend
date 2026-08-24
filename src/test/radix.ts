import { vi } from "vitest"

/**
 * Radix primitives that use pointer capture (Select, Popover, DropdownMenu) call APIs jsdom does
 * not implement. Without these stubs `userEvent.click` on a `SelectTrigger` throws
 * `target.hasPointerCapture is not a function` before the menu ever opens.
 *
 * Call once at the top of a test file (module scope) that drives such a primitive.
 */
export function installRadixPointerPolyfills(): void {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false) as unknown as Element["hasPointerCapture"]
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn() as unknown as Element["setPointerCapture"]
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn() as unknown as Element["releasePointerCapture"]
  }
}
