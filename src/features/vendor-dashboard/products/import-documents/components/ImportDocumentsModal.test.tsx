import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ApiRequestError } from "@/lib/api/request"
import { vendorDocumentsAPI } from "@/lib/api/vendor-documents"
import { server } from "@/mocks/server"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen, waitFor } from "@/test/render"
import { signInVendor } from "@/test/vendor-products-page-harness"
import ImportDocumentsModal from "./ImportDocumentsModal"

// Radix Dialog (Modal wraps it) uses pointer-capture APIs jsdom does not implement.
installRadixPointerPolyfills()

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))
vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

function makeDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: "doc-1",
    ownerId: "user-1",
    filePath: "vendorDocuments/uuid_products.xlsx",
    approved: false,
    revisionRequested: false,
    revisionApproved: null,
    requestedEdits: null,
    revisedFilePath: null,
    invalidRecordsFilePath: null,
    createdDate: "2026-08-24T10:00:00Z",
    updatedDate: "2026-08-24T10:00:00Z",
    deleted: false,
    systemRejected: false,
    ...overrides,
  }
}

const IMPORT_RESULT = {
  documentId: "doc-1",
  success: true,
  message: "1 product imported.",
  acceptedCount: 1,
  skippedCount: 0,
  wrongCount: 0,
  invalidRecordsFilePath: null,
}

function serveEmptyHistory() {
  server.use(
    http.get("*/backend-api/products/documents", () =>
      HttpResponse.json({ content: [], totalPages: 0, totalElements: 0 }),
    ),
  )
}

function serveHistory(documents: ReturnType<typeof makeDocument>[], meta: { totalPages?: number } = {}) {
  server.use(
    http.get("*/backend-api/products/documents", () =>
      HttpResponse.json({
        content: documents,
        totalPages: meta.totalPages ?? 1,
        totalElements: documents.length,
      }),
    ),
  )
}

function serveDocumentProducts(documentId = "doc-1") {
  server.use(
    http.get("*/backend-api/user-products/documents/:documentId/products", () =>
      HttpResponse.json({ documentId, products: [], wrongRows: [] }),
    ),
  )
}

const excelFile = (name = "products.xlsx") =>
  new File(["x"], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

beforeEach(() => {
  vi.restoreAllMocks()
  URL.createObjectURL = vi.fn(() => "blob:mock")
  URL.revokeObjectURL = vi.fn()
  for (const spy of Object.values(toastSpies)) spy.mockClear()
  signInVendor()
  serveEmptyHistory()
})

describe("ImportDocumentsModal file selection (handleFileChange)", () => {
  it("rejects a file with an unsupported extension and never stores it", async () => {
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    // `userEvent.upload` itself refuses a file that fails the input's `accept` filter (it never
    // fires a change event), so the app-level extension check inside `handleFileChange` is
    // exercised directly via a raw `change` event instead - this is the path a spoofed/renamed
    // file (real name ending in something other than .xlsx/.xls but sneaking past `accept`, or
    // a browser that ignores `accept`) would actually take.
    const input = screen.getByLabelText(/select your Excel file/i) as HTMLInputElement
    const badFile = new File(["x"], "products.csv", { type: "text/csv" })
    Object.defineProperty(input, "files", { value: [badFile], configurable: true })
    input.dispatchEvent(new Event("change", { bubbles: true }))

    expect(toastSpies.error).toHaveBeenCalledWith("Please select an Excel file (.xlsx or .xls)")
    // The dropzone still shows the "nothing selected" copy, and Upload stays disabled.
    expect(screen.getByText(/Click to select your Excel file/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Upload Document/i })).toBeDisabled()
  })

  it("accepts a valid .xlsx file and enables the Upload button", async () => {
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile("catalog.xlsx"))

    expect(screen.getByText("catalog.xlsx")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Upload Document/i })).toBeEnabled()
    expect(toastSpies.error).not.toHaveBeenCalled()
  })

  it("accepts a .xls file too", async () => {
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    const file = new File(["x"], "legacy.xls", { type: "application/vnd.ms-excel" })
    await user.upload(screen.getByLabelText(/select your Excel file/i), file)

    expect(screen.getByText("legacy.xls")).toBeInTheDocument()
  })

  it("swaps the selected file when a second one is chosen", async () => {
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    const input = screen.getByLabelText(/select your Excel file/i)
    await user.upload(input, excelFile("first.xlsx"))
    expect(screen.getByText("first.xlsx")).toBeInTheDocument()

    await user.upload(input, excelFile("second.xlsx"))
    expect(screen.getByText("second.xlsx")).toBeInTheDocument()
    expect(screen.queryByText("first.xlsx")).not.toBeInTheDocument()
  })

  // `handleFileChange` bails out on `e.target.files?.[0]` being undefined - this happens when a
  // native file picker is cancelled (the change event still fires with an empty FileList).
  it("does nothing when the file picker is cancelled (empty FileList)", async () => {
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    const input = screen.getByLabelText(/select your Excel file/i) as HTMLInputElement
    Object.defineProperty(input, "files", { value: [], configurable: true })
    input.dispatchEvent(new Event("change", { bubbles: true }))

    expect(toastSpies.error).not.toHaveBeenCalled()
    expect(screen.getByText(/Click to select your Excel file/i)).toBeInTheDocument()
  })

  // Regression: the server has no spring.servlet.multipart.max-file-size override, so the
  // Spring Boot default of 1MB applies (verified against ecommerce-api's application*.properties).
  // Without a client-side check, picking an oversized file used to sail past this screen and only
  // fail once uploaded, surfacing MaxUploadSizeExceededException's raw nested-exception text
  // ("Maximum upload size exceeded (1048576); nested exception is ...") to the vendor via toast.
  it("rejects a file over the server's 1MB limit and never stores it", async () => {
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    const oversized = new File([new Uint8Array(1024 * 1024 + 1)], "big-catalog.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    await user.upload(screen.getByLabelText(/select your Excel file/i), oversized)

    expect(toastSpies.error).toHaveBeenCalledWith("File is too large", expect.stringContaining("1MB"))
    expect(screen.getByText(/Click to select your Excel file/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Upload Document/i })).toBeDisabled()
  })

  it("accepts a file exactly at the 1MB boundary", async () => {
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    const atLimit = new File([new Uint8Array(1024 * 1024)], "at-limit.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    await user.upload(screen.getByLabelText(/select your Excel file/i), atLimit)

    expect(toastSpies.error).not.toHaveBeenCalled()
    expect(screen.getByText("at-limit.xlsx")).toBeInTheDocument()
  })
})

describe("ImportDocumentsModal upload (handleUpload)", () => {
  it("shows a plain success toast when every row is accepted", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue(IMPORT_RESULT)
    serveDocumentProducts()
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))

    await waitFor(() =>
      expect(toastSpies.success).toHaveBeenCalledWith("Import complete", "1 product(s) imported successfully."),
    )
    expect(toastSpies.warning).not.toHaveBeenCalled()
    expect(toastSpies.error).not.toHaveBeenCalled()
  })

  it("shows a warning toast for a partial success (some rows skipped/wrong)", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue({
      ...IMPORT_RESULT,
      acceptedCount: 5,
      skippedCount: 2,
      wrongCount: 1,
      invalidRecordsFilePath: "vendorDocuments/uuid_invalid_records.xlsx",
    })
    serveDocumentProducts()
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))

    await waitFor(() =>
      expect(toastSpies.warning).toHaveBeenCalledWith(
        "Import completed with issues",
        "5 accepted, 2 skipped, 1 failed.",
      ),
    )
    // The correction card only shows up when the backend produced an invalid-records file.
    expect(await screen.findByText("Correction needed")).toBeInTheDocument()
  })

  it("shows an error toast when nothing was accepted", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue({
      ...IMPORT_RESULT,
      acceptedCount: 0,
      skippedCount: 1,
      wrongCount: 3,
    })
    serveDocumentProducts()
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))

    await waitFor(() =>
      expect(toastSpies.error).toHaveBeenCalledWith("Import failed", "1 skipped, 3 failed. See details below."),
    )
  })

  it("surfaces the backend's 400 message for a malformed file", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockRejectedValue(
      new ApiRequestError("Unsupported file format", { status: 400 }),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Unsupported file format"))
    // Stays on the upload form - no result view was produced.
    expect(screen.getByRole("button", { name: /Upload Document/i })).toBeInTheDocument()
  })

  // Regression test for a real bug: the axios interceptor already logs the vendor out and
  // redirects to /login on a 401 (auth-error.ts / client.ts), marking the error `authHandled`.
  // Before this fix `handleUpload`'s catch block showed a second, redundant toast on top of
  // that redirect - reverting the `authHandled` guard in ImportDocumentsModal.tsx makes this
  // test fail because `toastSpies.error` gets called.
  it("does not show a second toast for a session-expiry (401, authHandled) error", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockRejectedValue(
      new ApiRequestError("Unauthorized", { status: 401, authHandled: true }),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))

    await waitFor(() => expect(screen.getByRole("button", { name: /Upload Document/i })).toBeEnabled())
    expect(toastSpies.error).not.toHaveBeenCalled()
    expect(toastSpies.warning).not.toHaveBeenCalled()
    expect(toastSpies.success).not.toHaveBeenCalled()
  })

  it("shows a generic error message on a network failure", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockRejectedValue(new ApiRequestError("Network Error"))
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Network Error"))
  })

  it("disables the Upload button while a request is in flight, preventing a double submit", async () => {
    let resolveUpload!: (value: typeof IMPORT_RESULT) => void
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve
        }),
    )
    serveDocumentProducts()
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    const uploadButton = screen.getByRole("button", { name: /Upload Document/i })
    await user.click(uploadButton)

    expect(await screen.findByRole("button", { name: /Uploading/i })).toBeDisabled()
    expect(vendorDocumentsAPI.uploadDocument).toHaveBeenCalledTimes(1)

    resolveUpload(IMPORT_RESULT)
    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
  })

  // Closing the modal mid-upload used to be untested. The upload promise resolving after
  // `handleClose` has already fired must not blow up with a "state update on an unmounted
  // component" warning once the parent actually unmounts the tree on close.
  it("does not warn about a state update on an unmounted component when closed mid-upload", async () => {
    let resolveUpload!: (value: typeof IMPORT_RESULT) => void
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve
        }),
    )
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    function Harness() {
      return <ImportDocumentsModal isOpen onClose={() => {}} />
    }
    const user = userEvent.setup()
    const { unmount } = render(<Harness />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))
    expect(await screen.findByRole("button", { name: /Uploading/i })).toBeInTheDocument()

    // Simulate the parent reacting to onClose by unmounting the modal.
    unmount()
    resolveUpload(IMPORT_RESULT)
    await new Promise((r) => setTimeout(r, 0))

    const stateUpdateWarning = consoleError.mock.calls.some((call) =>
      String(call[0]).includes("state update on an unmounted component"),
    )
    expect(stateUpdateWarning).toBe(false)
    consoleError.mockRestore()
  })

  it("resets the file input and lets the vendor upload another file after a result", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue(IMPORT_RESULT)
    serveDocumentProducts()
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))
    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())

    await user.click(screen.getByRole("button", { name: "Upload Another" }))
    expect(screen.getByText(/Click to select your Excel file/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Upload Document/i })).toBeDisabled()
  })
})

describe("ImportDocumentsModal.parseImportMessage via the result view", () => {
  it("splits the summary from the row-level Details block", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue({
      ...IMPORT_RESULT,
      message: "2 accepted, 1 failed.\n\nDetails:\n- Row 2: Missing SKU\n- Row 4: Price is not numeric",
    })
    server.use(
      http.get("*/backend-api/user-products/documents/:documentId/products", () =>
        HttpResponse.json({
          documentId: "doc-1",
          products: [],
          wrongRows: [
            { Row: "2", Manufacturer_Code: "MC-1" },
            { Row: "4", Manufacturer_Code: "MC-2" },
          ],
        }),
      ),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))

    expect(await screen.findByText("2 accepted, 1 failed.")).toBeInTheDocument()
    // The parsed per-row reasons reach the reason column of DocumentProductsPanel.
    expect(await screen.findByText("Missing SKU")).toBeInTheDocument()
    expect(screen.getByText("Price is not numeric")).toBeInTheDocument()
  })

  it("treats a message with no Details block as the whole summary", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue({
      ...IMPORT_RESULT,
      message: "All 3 products imported successfully.",
    })
    serveDocumentProducts()
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))

    expect(await screen.findByText("All 3 products imported successfully.")).toBeInTheDocument()
  })

  // A Details block whose lines don't start with "-" (a format parseImportMessage never
  // promised to handle) must not crash the modal - it degrades to zero row issues.
  it("tolerates a Details block with no dash-prefixed lines", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue({
      ...IMPORT_RESULT,
      message: "Import finished.\n\nDetails:\nsomething unexpected happened",
    })
    serveDocumentProducts()
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))

    expect(await screen.findByText("Import finished.")).toBeInTheDocument()
  })
})

describe("ImportDocumentsModal downloading the generated invalid-records file", () => {
  it("downloads the invalid-records file without a duplicate error toast", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue({
      ...IMPORT_RESULT,
      acceptedCount: 1,
      skippedCount: 1,
      invalidRecordsFilePath: "vendorDocuments/uuid_invalid_records.xlsx",
    })
    server.use(
      http.get("*/backend-api/user-products/documents/:documentId/products", () =>
        HttpResponse.json({ documentId: "doc-1", products: [], wrongRows: [] }),
      ),
      http.get("*/backend-api/products/documents/:id/file", () =>
        HttpResponse.json({}, { status: 200, headers: { "Content-Type": "application/octet-stream" } }),
      ),
    )
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))

    const downloadButton = await screen.findByRole("button", { name: /Download/i })
    await user.click(downloadButton)

    await waitFor(() => expect(clickSpy).toHaveBeenCalled())
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
    expect(toastSpies.error).not.toHaveBeenCalled()
    clickSpy.mockRestore()
  })

  it("shows the backend's 400 message when the invalid-records download fails", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue({
      ...IMPORT_RESULT,
      acceptedCount: 1,
      skippedCount: 1,
      invalidRecordsFilePath: "vendorDocuments/uuid_invalid_records.xlsx",
    })
    server.use(
      http.get("*/backend-api/user-products/documents/:documentId/products", () =>
        HttpResponse.json({ documentId: "doc-1", products: [], wrongRows: [] }),
      ),
      http.get("*/backend-api/products/documents/:id/file", () =>
        HttpResponse.json({ message: "Invalid records file does not exist for this document" }, { status: 400 }),
      ),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))

    await user.click(await screen.findByRole("button", { name: /Download/i }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Failed to download document"))
  })

  it("does not show a second toast when the invalid-records download hits a 401", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue({
      ...IMPORT_RESULT,
      acceptedCount: 1,
      skippedCount: 1,
      invalidRecordsFilePath: "vendorDocuments/uuid_invalid_records.xlsx",
    })
    server.use(
      http.get("*/backend-api/user-products/documents/:documentId/products", () =>
        HttpResponse.json({ documentId: "doc-1", products: [], wrongRows: [] }),
      ),
    )
    vi.spyOn(vendorDocumentsAPI, "downloadDocument").mockRejectedValue(
      new ApiRequestError("Unauthorized", { status: 401, authHandled: true }),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))

    await user.click(await screen.findByRole("button", { name: /Download/i }))

    await waitFor(() => expect(vendorDocumentsAPI.downloadDocument).toHaveBeenCalled())
    expect(toastSpies.error).not.toHaveBeenCalled()
  })
})

describe("ImportDocumentsModal upload history (My Uploads tab)", () => {
  it("shows an empty state for a vendor with no uploads yet", async () => {
    serveEmptyHistory()
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    expect(await screen.findByText("No uploads yet")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Upload Now" }))
    expect(screen.getByText(/Click to select your Excel file/i)).toBeInTheDocument()
  })

  it("shows a retry action when the history fails to load, and refetches on click", async () => {
    let attempts = 0
    server.use(
      http.get("*/backend-api/products/documents", () => {
        attempts += 1
        return attempts === 1
          ? HttpResponse.json({ message: "Server error" }, { status: 500 })
          : HttpResponse.json({ content: [makeDocument()], totalPages: 1, totalElements: 1 })
      }),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    expect(await screen.findByText("Failed to load upload history")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByText("products.xlsx")).toBeInTheDocument()
  })

  it("renders every status badge variant", async () => {
    serveHistory([
      makeDocument({ id: "d-rejected", filePath: "x/1_a.xlsx", systemRejected: true }),
      makeDocument({ id: "d-approved", filePath: "x/2_b.xlsx", approved: true }),
      makeDocument({
        id: "d-submitted",
        filePath: "x/3_c.xlsx",
        revisionRequested: true,
        revisedFilePath: "x/rev_c.xlsx",
        revisionApproved: null,
      }),
      makeDocument({
        id: "d-action",
        filePath: "x/4_d.xlsx",
        revisionRequested: true,
        revisionApproved: false,
        requestedEdits: "Fix the SKU column",
      }),
      makeDocument({ id: "d-pending", filePath: "x/5_e.xlsx", revisionRequested: true }),
      makeDocument({ id: "d-default", filePath: "x/6_f.xlsx" }),
    ])
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    expect(await screen.findByText("System Rejected")).toBeInTheDocument()
    expect(screen.getByText("Approved")).toBeInTheDocument()
    expect(screen.getByText("Revision Submitted")).toBeInTheDocument()
    expect(screen.getByText("Action Required")).toBeInTheDocument()
    expect(screen.getByText("Revision Requested")).toBeInTheDocument()
    expect(screen.getByText("Pending Review")).toBeInTheDocument()
  })

  it("truncates a long requestedEdits note behind Show more / Show less", async () => {
    const longNote = "Fix this: ".repeat(30) // > 180 chars
    serveHistory([
      makeDocument({
        revisionRequested: true,
        revisionApproved: false,
        requestedEdits: longNote,
      }),
    ])
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    const showMore = await screen.findByRole("button", { name: "Show more" })
    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument()

    await user.click(showMore)
    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument()
  })

  it("shows a short requestedEdits note in full with no toggle", async () => {
    serveHistory([
      makeDocument({
        revisionRequested: true,
        revisionApproved: null,
        revisedFilePath: null,
        requestedEdits: "Fix SKU",
      }),
    ])
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    expect(await screen.findByText("Fix SKU")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument()
  })

  it("formats a valid ISO date and degrades to Invalid Date for a malformed one, without crashing", async () => {
    serveHistory([
      makeDocument({ id: "d-good", filePath: "x/1_a.xlsx", createdDate: "2026-01-15T10:00:00Z" }),
      makeDocument({ id: "d-bad", filePath: "x/2_b.xlsx", createdDate: "not-a-real-date" }),
    ])
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    expect(await screen.findByText("Jan 15, 2026")).toBeInTheDocument()
    // `new Date("not-a-real-date")` is a valid Date object whose toLocaleDateString() is the
    // literal string "Invalid Date" - this does not throw, so the row still renders.
    expect(screen.getByText("Invalid Date")).toBeInTheDocument()
  })

  it("downloads a history document's original file", async () => {
    serveHistory([makeDocument()])
    server.use(http.get("*/backend-api/products/documents/:id/file", () => new HttpResponse(new Blob(["bytes"]))))
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    await user.click(await screen.findByRole("button", { name: "File" }))

    await waitFor(() => expect(clickSpy).toHaveBeenCalled())
    expect(toastSpies.error).not.toHaveBeenCalled()
    clickSpy.mockRestore()
  })

  it("surfaces the backend's 400 message on a history download failure", async () => {
    serveHistory([makeDocument()])
    server.use(
      http.get("*/backend-api/products/documents/:id/file", () =>
        HttpResponse.json({ message: "Document not found" }, { status: 400 }),
      ),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    await user.click(await screen.findByRole("button", { name: "File" }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Failed to download document"))
  })

  it("expands and collapses a document's imported-product details", async () => {
    serveHistory([makeDocument()])
    server.use(
      http.get("*/backend-api/user-products/documents/:documentId/products", () =>
        HttpResponse.json({ documentId: "doc-1", products: [], wrongRows: [] }),
      ),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    await user.click(await screen.findByRole("button", { name: "Details" }))
    expect(await screen.findByRole("button", { name: "Hide details" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Hide details" }))
    expect(await screen.findByRole("button", { name: "Details" })).toBeInTheDocument()
  })

  it("paginates between pages of upload history", async () => {
    const pages: Record<number, ReturnType<typeof makeDocument>[]> = {
      0: [makeDocument({ id: "p0", filePath: "x/1_page-zero.xlsx" })],
      1: [makeDocument({ id: "p1", filePath: "x/1_page-one.xlsx" })],
    }
    server.use(
      http.get("*/backend-api/products/documents", ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get("page") ?? "0")
        return HttpResponse.json({ content: pages[page] ?? [], totalPages: 2, totalElements: 2 })
      }),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    expect(await screen.findByText("page-zero.xlsx")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(await screen.findByText("page-one.xlsx")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Previous" }))
    expect(await screen.findByText("page-zero.xlsx")).toBeInTheDocument()
  })
})

describe("ImportDocumentsModal deleting a document (handleDelete)", () => {
  it("asks for confirmation before deleting, and Cancel backs out without calling the API", async () => {
    serveHistory([makeDocument({ approved: false })])
    const deleteSpy = vi.spyOn(vendorDocumentsAPI, "deleteDocument")
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    await user.click(await screen.findByRole("button", { name: "Delete" }))
    expect(await screen.findByText("Delete document?")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.queryByText("Delete document?")).not.toBeInTheDocument()
    expect(deleteSpy).not.toHaveBeenCalled()
  })

  it("deletes on confirm, shows a success toast and refreshes the list", async () => {
    let listRequests = 0
    server.use(
      http.get("*/backend-api/products/documents", () => {
        listRequests += 1
        return HttpResponse.json({
          content: listRequests === 1 ? [makeDocument({ approved: false })] : [],
          totalPages: listRequests === 1 ? 1 : 0,
          totalElements: listRequests === 1 ? 1 : 0,
        })
      }),
      http.delete("*/backend-api/products/documents/:id", () => new HttpResponse(null, { status: 200 })),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    await user.click(await screen.findByRole("button", { name: "Delete" }))
    await user.click(screen.getAllByRole("button", { name: "Delete" })[1] as HTMLElement)

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Document deleted"))
    await waitFor(() => expect(listRequests).toBe(2))
    expect(await screen.findByText("No uploads yet")).toBeInTheDocument()
  })

  it("collapses an expanded document's details once it is deleted", async () => {
    server.use(
      http.get("*/backend-api/products/documents", () =>
        HttpResponse.json({ content: [makeDocument({ approved: false })], totalPages: 1, totalElements: 1 }),
      ),
      http.get("*/backend-api/user-products/documents/:documentId/products", () =>
        HttpResponse.json({ documentId: "doc-1", products: [], wrongRows: [] }),
      ),
      http.delete("*/backend-api/products/documents/:id", () => new HttpResponse(null, { status: 200 })),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    await user.click(await screen.findByRole("button", { name: "Details" }))
    expect(await screen.findByRole("button", { name: "Hide details" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Delete" }))
    await user.click(screen.getAllByRole("button", { name: "Delete" })[1] as HTMLElement)

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
  })

  it("disables the confirm Delete button while the request is in flight", async () => {
    serveHistory([makeDocument({ approved: false })])
    let resolveDelete!: () => void
    vi.spyOn(vendorDocumentsAPI, "deleteDocument").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = () => resolve(undefined)
        }),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    await user.click(await screen.findByRole("button", { name: "Delete" }))
    const confirmButtons = screen.getAllByRole("button", { name: "Delete" })
    await user.click(confirmButtons[1] as HTMLElement)

    await waitFor(() => expect(screen.getAllByRole("button", { name: "Delete" })[1]).toBeDisabled())
    resolveDelete()
    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
  })

  it("surfaces a 400 'not authorized' error for someone else's document (real backend contract - not 403)", async () => {
    serveHistory([makeDocument({ approved: false })])
    server.use(
      http.delete("*/backend-api/products/documents/:id", () =>
        HttpResponse.json({ message: "You are not authorized to access/delete this document" }, { status: 400 }),
      ),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    await user.click(await screen.findByRole("button", { name: "Delete" }))
    await user.click(screen.getAllByRole("button", { name: "Delete" })[1] as HTMLElement)

    await waitFor(() =>
      expect(toastSpies.error).toHaveBeenCalledWith("You are not authorized to access/delete this document"),
    )
  })

  it("surfaces a 400 'not found' error for an already-deleted document (real backend contract - not 404)", async () => {
    serveHistory([makeDocument({ approved: false })])
    server.use(
      http.delete("*/backend-api/products/documents/:id", () =>
        HttpResponse.json({ message: "Document not found" }, { status: 400 }),
      ),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    await user.click(await screen.findByRole("button", { name: "Delete" }))
    await user.click(screen.getAllByRole("button", { name: "Delete" })[1] as HTMLElement)

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Document not found"))
  })

  // BUG LOCKED, NOT FIXED (backend-caused - see task report): `VendorDocumentServiceImpl`
  // unconditionally sets `approved = true` on every document created through the
  // upload-and-import endpoint this modal calls, and `deleteDocument` refuses to delete any
  // approved document. So a document created by this exact modal can never actually be
  // deleted; the backend answers 400 "Document is approved and cannot be deleted" every time.
  // This locks in today's (broken) behavior - the vendor gets a clear error message and the
  // confirm box is left open (no reset on failure), rather than crashing or silently failing.
  it("shows the backend's 'approved, cannot delete' message when deleting a document this flow itself created", async () => {
    serveHistory([makeDocument({ approved: false })])
    server.use(
      http.delete("*/backend-api/products/documents/:id", () =>
        HttpResponse.json({ message: "Document is approved and cannot be deleted" }, { status: 400 }),
      ),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    await user.click(await screen.findByRole("button", { name: "Delete" }))
    await user.click(screen.getAllByRole("button", { name: "Delete" })[1] as HTMLElement)

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Document is approved and cannot be deleted"))
    // Current behavior: the confirm box is not dismissed on failure, so it is still on screen.
    expect(screen.getByText("Delete document?")).toBeInTheDocument()
  })

  it("does not show a second toast for a session-expiry (401, authHandled) delete error", async () => {
    serveHistory([makeDocument({ approved: false })])
    vi.spyOn(vendorDocumentsAPI, "deleteDocument").mockRejectedValue(
      new ApiRequestError("Unauthorized", { status: 401, authHandled: true }),
    )
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "My Uploads" }))

    await user.click(await screen.findByRole("button", { name: "Delete" }))
    await user.click(screen.getAllByRole("button", { name: "Delete" })[1] as HTMLElement)

    await waitFor(() => expect(vendorDocumentsAPI.deleteDocument).toHaveBeenCalled())
    expect(toastSpies.error).not.toHaveBeenCalled()
  })
})

describe("ImportDocumentsModal.handleClose", () => {
  it("resets the upload tab state (selected file, tab, result) when closed", async () => {
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue(IMPORT_RESULT)
    serveDocumentProducts()
    let listRequests = 0
    server.use(
      http.get("*/backend-api/products/documents", () => {
        listRequests += 1
        return HttpResponse.json(
          listRequests === 1
            ? { content: [], totalPages: 0, totalElements: 0 }
            : {
                content: [makeDocument({ filePath: "vendorDocuments/uuid_products.xlsx" })],
                totalPages: 1,
                totalElements: 1,
              },
        )
      }),
    )
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={onClose} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))
    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    await user.click(screen.getByRole("button", { name: "View My Uploads" }))
    expect(await screen.findByText("products.xlsx")).toBeInTheDocument()

    // Close via the header X button.
    await user.click(screen.getByRole("button", { name: "" }))
    expect(onClose).toHaveBeenCalledTimes(1)

    // Internal state was reset even though the parent kept `isOpen` true in this harness:
    // back on the Upload tab, no leftover result, no leftover file.
    expect(screen.getByText(/Click to select your Excel file/i)).toBeInTheDocument()
  })

  it("resets state via the Cancel button on the upload form too", async () => {
    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    await user.upload(screen.getByLabelText(/select your Excel file/i), excelFile())
    expect(screen.getByText("products.xlsx")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.getByText(/Click to select your Excel file/i)).toBeInTheDocument()
  })
})
