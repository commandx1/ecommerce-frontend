import userEvent from "@testing-library/user-event"
import { delay, HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { act, fireEvent, render, screen, waitFor, within } from "@/test/render"
import BrandFilterDropdown from "./BrandFilterDropdown"

// Several scenarios below (debounce settling, an in-flight request outliving a closed
// dropdown, a deliberately slow "stale response" race) need real elapsed time rather than
// fake timers, per the project's testing notes: `vi.useFakeTimers()` freezes the MSW/axios
// request pipeline, so debounce and race tests wait out real milliseconds instead.
vi.setConfig({ testTimeout: 20_000 })

const ENDPOINT = "*/api/products/brands/search"
const TOKEN = "test-access-token"

interface PageOpts {
  content: string[]
  number?: number
  last?: boolean
}

const pageResponse = ({ content, number = 0, last = true }: PageOpts) => ({
  content,
  totalElements: content.length,
  totalPages: last ? number + 1 : number + 2,
  number,
  size: 20,
  numberOfElements: content.length,
  first: number === 0,
  last,
  empty: content.length === 0,
})

let requests: Array<{ search: string; page: string; authorization: string | null }>

const installHandler = (resolver: (params: URLSearchParams) => object | Response | Promise<object | Response>) => {
  server.use(
    http.get(ENDPOINT, async ({ request }) => {
      const url = new URL(request.url)
      requests.push({
        search: url.searchParams.get("search") ?? "",
        page: url.searchParams.get("page") ?? "0",
        authorization: request.headers.get("Authorization"),
      })
      const body = await resolver(url.searchParams)
      return body instanceof Response ? body : HttpResponse.json(body)
    }),
  )
}

const installStaticHandler = (opts: PageOpts) => installHandler(() => pageResponse(opts))

// Locates the trigger button before the panel opens, where it is the only element with
// this accessible name (the panel injects a second "All Brands" button once open).
const trigger = (name: string | RegExp) => screen.getByRole("button", { name })
const searchInput = () => screen.getByPlaceholderText("Search brand...")
const panel = () => searchInput().closest("div.absolute") as HTMLElement
const listEl = () => panel().querySelector<HTMLDivElement>(".overflow-y-auto") as HTMLDivElement

const setScrollMetrics = (el: HTMLElement, { scrollHeight, scrollTop, clientHeight }: Record<string, number>) => {
  // jsdom always reports 0 for these layout properties, so infinite-scroll tests must
  // define them directly to simulate a real scroll position.
  Object.defineProperty(el, "scrollHeight", { value: scrollHeight, configurable: true })
  Object.defineProperty(el, "scrollTop", { value: scrollTop, configurable: true })
  Object.defineProperty(el, "clientHeight", { value: clientHeight, configurable: true })
}

describe("BrandFilterDropdown", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    requests = []
  })

  describe("auth guard", () => {
    it("never calls the brands endpoint without an access token", async () => {
      installStaticHandler({ content: ["Acme"] })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={null} />)

      await user.click(trigger("All Brands"))
      await screen.findByPlaceholderText("Search brand...")
      await act(async () => {
        await new Promise((r) => setTimeout(r, 100))
      })

      expect(requests).toHaveLength(0)
    })
  })

  describe("opening", () => {
    it("focuses the search field when the dropdown opens", async () => {
      installStaticHandler({ content: ["Acme"] })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))

      await waitFor(() => expect(searchInput()).toHaveFocus())
    })
  })

  describe("debounce", () => {
    it("fires a single request for the settled query after fast typing", async () => {
      installStaticHandler({ content: ["Acme"] })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))
      await waitFor(() => expect(requests).toHaveLength(1)) // initial fetch for ""
      await user.type(searchInput(), "acm")

      await act(async () => {
        await new Promise((r) => setTimeout(r, 500))
      })

      expect(requests).toHaveLength(2)
      expect(requests[1]?.search).toBe("acm")
    })

    it("does not fetch the typed term if the dropdown is closed before the debounce settles", async () => {
      installStaticHandler({ content: ["Acme"] })
      const user = userEvent.setup()
      render(
        <div>
          <BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />
          <button type="button">outside</button>
        </div>,
      )

      await user.click(trigger("All Brands"))
      await waitFor(() => expect(requests).toHaveLength(1))
      await user.type(searchInput(), "acm")
      await user.click(screen.getByText("outside"))

      await act(async () => {
        await new Promise((r) => setTimeout(r, 500))
      })

      expect(requests).toHaveLength(1)
      expect(requests[0]?.search).toBe("")
    })
  })

  describe("selection", () => {
    it("selects a brand, calls onChange, and closes the dropdown", async () => {
      installStaticHandler({ content: ["Acme"] })
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={onChange} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))
      const option = await within(panel()).findByRole("button", { name: "Acme" })
      await user.click(option)

      expect(onChange).toHaveBeenCalledWith("Acme")
      expect(screen.queryByPlaceholderText("Search brand...")).not.toBeInTheDocument()
    })

    it("selects All Brands and calls onChange with null", async () => {
      installStaticHandler({ content: ["Acme"] })
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<BrandFilterDropdown value="Acme" onChange={onChange} accessToken={TOKEN} />)

      await user.click(trigger("Acme"))
      const allBrandsOption = within(panel()).getByRole("button", { name: "All Brands" })
      await user.click(allBrandsOption)

      expect(onChange).toHaveBeenCalledWith(null)
      expect(screen.queryByPlaceholderText("Search brand...")).not.toBeInTheDocument()
    })

    it("clears the selected brand from the trigger's inline clear control", async () => {
      installStaticHandler({ content: ["Acme"] })
      const onChange = vi.fn()
      const user = userEvent.setup()
      const { container } = render(<BrandFilterDropdown value="Acme" onChange={onChange} accessToken={TOKEN} />)

      const clearControl = container.querySelector('span[role="button"]') as HTMLElement
      expect(clearControl).toBeTruthy()
      await user.click(clearControl)

      expect(onChange).toHaveBeenCalledWith(null)
      // Clicking the inline clear control must not also open the dropdown underneath it.
      expect(screen.queryByPlaceholderText("Search brand...")).not.toBeInTheDocument()
    })

    it("hides the All Brands option when hideAllOption is set, for a required-field usage", async () => {
      installStaticHandler({ content: ["Acme"] })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} hideAllOption />)

      await user.click(trigger("Select brand"))
      await within(panel()).findByRole("button", { name: "Acme" })

      expect(within(panel()).queryByRole("button", { name: "All Brands" })).not.toBeInTheDocument()
    })
  })

  describe("click outside", () => {
    it("closes when clicking outside the dropdown", async () => {
      installStaticHandler({ content: ["Acme"] })
      const user = userEvent.setup()
      render(
        <div>
          <BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />
          <button type="button">outside</button>
        </div>,
      )

      await user.click(trigger("All Brands"))
      await screen.findByPlaceholderText("Search brand...")
      await user.click(screen.getByText("outside"))

      expect(screen.queryByPlaceholderText("Search brand...")).not.toBeInTheDocument()
    })

    it("stays open when clicking inside the dropdown", async () => {
      installStaticHandler({ content: ["Acme"] })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))
      await screen.findByPlaceholderText("Search brand...")
      await user.click(searchInput())

      expect(screen.getByPlaceholderText("Search brand...")).toBeInTheDocument()
    })
  })

  describe("infinite scroll", () => {
    it("loads and appends the next page once the scroll threshold is crossed", async () => {
      installHandler((params) => {
        const page = params.get("page")
        if (page === "1") return pageResponse({ content: ["Brand-B"], number: 1, last: true })
        return pageResponse({ content: ["Brand-A"], number: 0, last: false })
      })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))
      await within(panel()).findByRole("button", { name: "Brand-A" })

      const list = listEl()
      setScrollMetrics(list, { scrollHeight: 500, scrollTop: 260, clientHeight: 200 }) // distance = 40 <= 48
      fireEvent.scroll(list)

      await within(panel()).findByRole("button", { name: "Brand-B" })
      expect(within(panel()).getByRole("button", { name: "Brand-A" })).toBeInTheDocument()
      expect(requests.map((r) => r.page)).toEqual(["0", "1"])
    })

    it("does not fetch more while still above the scroll threshold", async () => {
      installHandler((params) => {
        const page = params.get("page")
        if (page === "1") return pageResponse({ content: ["Brand-B"], number: 1, last: true })
        return pageResponse({ content: ["Brand-A"], number: 0, last: false })
      })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))
      await within(panel()).findByRole("button", { name: "Brand-A" })

      const list = listEl()
      setScrollMetrics(list, { scrollHeight: 500, scrollTop: 100, clientHeight: 200 }) // distance = 200 > 48
      fireEvent.scroll(list)

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100))
      })
      expect(requests).toHaveLength(1)
    })

    it("does not request another page once hasMore is false", async () => {
      installStaticHandler({ content: ["Brand-A"], last: true })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))
      await within(panel()).findByRole("button", { name: "Brand-A" })

      const list = listEl()
      setScrollMetrics(list, { scrollHeight: 500, scrollTop: 260, clientHeight: 200 })
      fireEvent.scroll(list)

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100))
      })
      expect(requests).toHaveLength(1)
    })

    it("does not fire a second page request while the first one is still loading", async () => {
      installHandler(async (params) => {
        const page = params.get("page")
        if (page === "1") {
          await delay(150)
          return pageResponse({ content: ["Brand-B"], number: 1, last: true })
        }
        return pageResponse({ content: ["Brand-A"], number: 0, last: false })
      })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))
      await within(panel()).findByRole("button", { name: "Brand-A" })

      const list = listEl()
      setScrollMetrics(list, { scrollHeight: 500, scrollTop: 260, clientHeight: 200 })
      fireEvent.scroll(list)
      fireEvent.scroll(list) // fired again while the first page-1 request is in flight

      await within(panel()).findByRole("button", { name: "Brand-B" })
      expect(requests.filter((r) => r.page === "1")).toHaveLength(1)
    })
  })

  describe("stale response protection", () => {
    it("cancels an in-flight request when a newer search fires, and never shows the stale result", async () => {
      installHandler(async (params) => {
        const search = params.get("search")
        if (!search) {
          // Deliberately never resolves inside the test's lifetime: the assertion is that
          // this response never gets a chance to overwrite the newer, faster one.
          await delay(5_000)
          return pageResponse({ content: ["Stale-Brand"] })
        }
        return pageResponse({ content: ["Fresh-Brand"] })
      })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))
      await waitFor(() => expect(requests).toHaveLength(1))
      await user.type(searchInput(), "fresh")

      await within(panel()).findByRole("button", { name: "Fresh-Brand" }, { timeout: 3000 })
      expect(screen.queryByText("Stale-Brand")).not.toBeInTheDocument()
    })

    it("aborts the pending request on unmount", async () => {
      installHandler(async () => {
        await delay(300)
        return pageResponse({ content: ["Acme"] })
      })
      const abortSpy = vi.spyOn(AbortController.prototype, "abort")
      const user = userEvent.setup()
      const { unmount } = render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))
      await waitFor(() => expect(requests).toHaveLength(1))
      const callsBeforeUnmount = abortSpy.mock.calls.length

      unmount()

      expect(abortSpy.mock.calls.length).toBeGreaterThan(callsBeforeUnmount)
    })
  })

  describe("error vs empty result (B6i)", () => {
    it("shows a real empty catalog as 'No brands found' without an alert", async () => {
      installStaticHandler({ content: [] })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))

      expect(await screen.findByText("No brands found")).toBeInTheDocument()
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })

    it("shows an error, not 'No brands found', when the initial fetch fails, and lets the vendor retry", async () => {
      let attempt = 0
      installHandler(() => {
        attempt += 1
        if (attempt === 1) {
          return new HttpResponse(null, { status: 500 })
        }
        return pageResponse({ content: ["Acme"] })
      })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))

      const alert = await screen.findByRole("alert")
      expect(alert).toHaveTextContent(/couldn't load brands/i)
      expect(screen.queryByText("No brands found")).not.toBeInTheDocument()

      await user.click(within(alert).getByRole("button", { name: /try again/i }))

      await within(panel()).findByRole("button", { name: "Acme" })
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })

    it("shows an error below the existing list when loading more fails, without wiping what is already shown", async () => {
      installHandler((params) => {
        const page = params.get("page")
        if (page === "1") {
          return new HttpResponse(null, { status: 500 })
        }
        return pageResponse({ content: ["Brand-A"], number: 0, last: false })
      })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))
      await within(panel()).findByRole("button", { name: "Brand-A" })

      const list = listEl()
      setScrollMetrics(list, { scrollHeight: 500, scrollTop: 260, clientHeight: 200 })
      fireEvent.scroll(list)

      const alert = await screen.findByRole("alert")
      expect(alert).toHaveTextContent(/couldn't load brands/i)
      expect(within(panel()).getByRole("button", { name: "Brand-A" })).toBeInTheDocument()
    })
  })

  describe("data edge cases", () => {
    it("renders a single result", async () => {
      installStaticHandler({ content: ["OnlyBrand"] })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))

      expect(await within(panel()).findByRole("button", { name: "OnlyBrand" })).toBeInTheDocument()
    })

    it("renders a very long brand name without crashing", async () => {
      const longName = "A".repeat(200)
      installStaticHandler({ content: [longName] })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))

      expect(await within(panel()).findByRole("button", { name: longName })).toBeInTheDocument()
    })

    it("renders every occurrence when the backend repeats the same brand name", async () => {
      installStaticHandler({ content: ["DUP", "DUP"] })
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))

      await waitFor(() => expect(within(panel()).getAllByRole("button", { name: "DUP" })).toHaveLength(2))
    })
  })

  describe("malformed 200 response (C axis)", () => {
    // The BFF (`/api/products/brands/search/route.ts`) passes a successful upstream body through
    // verbatim with no shape validation, so a degenerate 200 - `content` missing, null, or not an
    // array - reaches this component as-is. Reading it with a bare spread/`.length` would throw
    // during render and blank the whole page for every vendor, not just show "no brands".
    it("treats a response with no `content` field as empty rather than crashing", async () => {
      installHandler(() => ({ totalElements: 0, totalPages: 0, number: 0, size: 20, last: true, empty: true }))
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))

      expect(await screen.findByText("No brands found")).toBeInTheDocument()
    })

    it("treats a response with `content: null` as empty rather than crashing", async () => {
      installHandler(() => ({ content: null, totalElements: 0, totalPages: 0, number: 0, size: 20, last: true }))
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))

      expect(await screen.findByText("No brands found")).toBeInTheDocument()
    })

    it("treats a response with a non-array `content` (200-with-error-shape) as empty rather than crashing", async () => {
      installHandler(() => ({ content: { message: "unexpected shape" } }))
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))

      expect(await screen.findByText("No brands found")).toBeInTheDocument()
    })

    it("stops paginating instead of looping when `last` is missing from an otherwise valid page", async () => {
      installHandler(() => ({ content: ["Acme"], totalElements: 1, totalPages: 1, number: 0, size: 20 }))
      const user = userEvent.setup()
      render(<BrandFilterDropdown value={null} onChange={vi.fn()} accessToken={TOKEN} />)

      await user.click(trigger("All Brands"))
      await within(panel()).findByRole("button", { name: "Acme" })

      const list = listEl()
      setScrollMetrics(list, { scrollHeight: 500, scrollTop: 260, clientHeight: 200 })
      fireEvent.scroll(list)

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100))
      })
      // Missing `last` defaults to "no more pages", not "keep scrolling forever".
      expect(requests).toHaveLength(1)
    })
  })
})
