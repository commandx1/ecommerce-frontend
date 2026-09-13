import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/**
 * Notification bell popover (rendered in every dashboard header) plus the
 * full `/{role}-dashboard/notifications` page. The bell has no dedicated
 * route of its own - `path` points at the vendor variant of the full page
 * since `gotoVendor()`/`gotoBuyer()` are the two concrete navigation entry
 * points tests actually use (mirrors the `abstract readonly path` contract
 * on BasePage, which every other POM in this dir satisfies with a single
 * fixed route).
 */
export class NotificationsPage extends BasePage {
  readonly path = "/vendor-dashboard/notifications"

  async gotoVendor(): Promise<void> {
    await this.page.goto("/vendor-dashboard/notifications")
  }

  async gotoBuyer(): Promise<void> {
    await this.page.goto("/buyer-dashboard/notifications")
  }

  /** Header bell trigger - accessible name flips between "Notifications" and "Notifications, N unread". */
  get bellButton(): Locator {
    return this.page.getByRole("button", { name: /^Notifications/ })
  }

  async openBell(): Promise<void> {
    await this.bellButton.click()
  }

  /**
   * Radix Popover.Content renders `role="dialog"` (verified against
   * node_modules/@radix-ui/react-popover), but the mobile sidebar `<aside>`
   * ALSO renders `role="dialog"` (Radix Dialog/Sheet) and is present in the
   * DOM at the same time - `data-side` is set by Popover.Content (via
   * `data-side="bottom"|"top"`, from its `side` prop) and not by the sidebar,
   * so it disambiguates the two.
   */
  get popover(): Locator {
    return this.page.getByRole("dialog").and(this.page.locator("[data-side]"))
  }

  /** "Mark all as read" exists both on the bell popover and the full page - pass the scope you mean. */
  markAllReadButton(scope: Pick<Locator, "getByRole"> = this.page): Locator {
    return scope.getByRole("button", { name: "Mark all as read" })
  }

  get viewAllLink(): Locator {
    return this.popover.getByRole("link", { name: "View all notifications" })
  }

  /** `/{role}-dashboard/notifications` page's h1 (NotificationsPage.tsx). */
  get pageHeading(): Locator {
    return this.page.getByRole("heading", { name: "Notifications", level: 1 })
  }

  /** "All" / "Unread" tab (NotificationsTabs.tsx) - `^` anchors past the async unread-count badge suffix. */
  tab(label: "All" | "Unread"): Locator {
    return this.page.getByRole("button", { name: new RegExp(`^${label}`) })
  }

  /** Every `<li data-testid="notification-item">` row, on the bell popover or the full page. */
  get items(): Locator {
    return this.page.getByTestId("notification-item")
  }

  itemByTitle(title: string): Locator {
    return this.items.filter({ hasText: title })
  }

  /** Full-variant rows only (NotificationsPage) render this control; compact bell rows don't. */
  toggleReadButton(title: string): Locator {
    return this.itemByTitle(title).getByRole("button", { name: /^Mark as (read|unread)$/ })
  }

  get nextPageButton(): Locator {
    return this.page.getByLabel("Go to next page")
  }
}
