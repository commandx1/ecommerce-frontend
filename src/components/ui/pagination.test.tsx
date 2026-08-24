import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination"

// jsdom logs "Not implemented: navigation" for a real anchor click, so the handler cancels it.
const renderPagination = (onSelect = vi.fn((event: React.MouseEvent) => event.preventDefault())) => {
  render(
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2" isActive onClick={onSelect}>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=3" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  )
  return onSelect
}

describe("Pagination", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("exposes itself as a labelled navigation landmark", () => {
    renderPagination()

    expect(screen.getByRole("navigation", { name: "pagination" })).toBeInTheDocument()
  })

  it("marks only the active page with aria-current", () => {
    renderPagination()

    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "1" })).not.toHaveAttribute("aria-current")
  })

  it("labels the previous and next controls for screen readers", () => {
    renderPagination()

    expect(screen.getByRole("link", { name: "Go to previous page" })).toHaveAttribute("href", "?page=1")
    expect(screen.getByRole("link", { name: "Go to next page" })).toHaveAttribute("href", "?page=3")
  })

  it("hides the ellipsis from assistive tech but keeps a text alternative", () => {
    renderPagination()

    expect(screen.getByText("More pages")).toBeInTheDocument()
    expect(screen.getByText("More pages").closest("span[aria-hidden]")).not.toBeNull()
  })

  it("forwards a click on a page link", async () => {
    const user = userEvent.setup()
    const onSelect = renderPagination()

    await user.click(screen.getByRole("link", { name: "2" }))

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("keeps every page control inside its own list item", () => {
    renderPagination()

    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(5)
    for (const item of items) {
      expect(item.querySelectorAll("a, span[aria-hidden]").length).toBeGreaterThan(0)
    }
  })
})
