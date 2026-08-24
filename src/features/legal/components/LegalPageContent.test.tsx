import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { LegalDocument } from "@/features/legal/types"
import { render, screen, within } from "@/test/render"
import LegalPageContent from "./LegalPageContent"

const mockToastInfo = vi.fn()
vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    info: (...args: unknown[]) => mockToastInfo(...args),
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

const document_: LegalDocument = {
  id: "terms-of-service",
  title: "Terms of Service",
  subtitle: "The agreement between you and DentyPro",
  lastUpdated: "August 1, 2026",
  icon: "file-contract",
  notice: { type: "warning", title: "Read carefully", text: "These terms are binding." },
  sections: [
    { title: "Scope", content: "These terms cover marketplace use.", list: ["Buyers", "Vendors"] },
    { title: "Restrictions", items: ["No resale"], warning: true },
  ],
}

describe("LegalPageContent", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockToastInfo.mockClear()
  })

  it("renders the sidebar next to the selected document", () => {
    render(<LegalPageContent selectedDocument={document_} selectedId="terms-of-service" />)

    expect(screen.getByRole("heading", { name: "Document Categories" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Terms of Service", level: 2 })).toBeInTheDocument()
  })

  it("renders only the sidebar when no document matches the id", () => {
    render(<LegalPageContent selectedDocument={undefined} selectedId="unknown" />)

    expect(screen.getByRole("heading", { name: "Document Categories" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Download PDF/ })).not.toBeInTheDocument()
  })

  it("links each sidebar entry to its own doc query", () => {
    render(<LegalPageContent selectedDocument={document_} selectedId="terms-of-service" />)

    const nav = screen.getByRole("navigation")
    for (const link of within(nav).getAllByRole("link")) {
      expect(link.getAttribute("href")).toMatch(/^\/legal\?doc=/)
    }
  })

  describe("DocumentSection", () => {
    it("shows the document's title, subtitle and last-updated date", () => {
      render(<LegalPageContent selectedDocument={document_} selectedId="terms-of-service" />)

      expect(screen.getByText("The agreement between you and DentyPro")).toBeInTheDocument()
      expect(screen.getByText("Last updated: August 1, 2026")).toBeInTheDocument()
    })

    it("renders the notice banner above the sections", () => {
      render(<LegalPageContent selectedDocument={document_} selectedId="terms-of-service" />)

      expect(screen.getByText("Read carefully")).toBeInTheDocument()
      expect(screen.getByText("These terms are binding.")).toBeInTheDocument()
    })

    it("omits the notice when the document has none", () => {
      render(<LegalPageContent selectedDocument={{ ...document_, notice: undefined }} selectedId="terms-of-service" />)

      expect(screen.queryByText("Read carefully")).not.toBeInTheDocument()
    })

    it("renders each section with its heading, prose and list", () => {
      render(<LegalPageContent selectedDocument={document_} selectedId="terms-of-service" />)

      expect(screen.getByRole("heading", { name: "Scope", level: 3 })).toBeInTheDocument()
      expect(screen.getByText("These terms cover marketplace use.")).toBeInTheDocument()
      expect(screen.getByText("Buyers")).toBeInTheDocument()
      expect(screen.getByRole("heading", { name: "Restrictions", level: 3 })).toBeInTheDocument()
      // Warning items render with a bullet prefix inside a dedicated red panel.
      expect(screen.getByText("• No resale")).toBeInTheDocument()
      expect(screen.getByRole("heading", { name: "You may not use our Service:" })).toBeInTheDocument()
    })

    it("prints the page from the Print action", async () => {
      const user = userEvent.setup()
      const print = vi.fn()
      vi.stubGlobal("print", print)
      render(<LegalPageContent selectedDocument={document_} selectedId="terms-of-service" />)

      await user.click(screen.getByRole("button", { name: /Print/ }))

      expect(print).toHaveBeenCalledTimes(1)
      vi.unstubAllGlobals()
    })

    // BULGU: "Download PDF" produces no file — it only raises an informational toast.
    it("only toasts when the PDF download is requested (current behaviour)", async () => {
      const user = userEvent.setup()
      render(<LegalPageContent selectedDocument={document_} selectedId="terms-of-service" />)

      await user.click(screen.getByRole("button", { name: /Download PDF/ }))

      expect(mockToastInfo).toHaveBeenCalledWith("Download requested", "PDF downloads will be available soon.")
    })
  })
})
