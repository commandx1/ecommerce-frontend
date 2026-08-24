import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { vendorDocumentsAPI } from "@/lib/api/vendor-documents"
import { server } from "@/mocks/server"
import { render, screen, waitFor } from "@/test/render"
import { signInVendor } from "@/test/vendor-products-page-harness"
import ImportDocumentsModal from "./ImportDocumentsModal"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))
vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const UPLOADED_DOCUMENT = {
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

beforeEach(() => {
  vi.restoreAllMocks()
  for (const spy of Object.values(toastSpies)) spy.mockClear()
  signInVendor()
})

describe("ImportDocumentsModal", () => {
  // The history list is only fetched when the modal opens, so a vendor who uploads
  // into an empty history has to see their file without reloading the page.
  it("refreshes the upload history after a successful import", async () => {
    let listRequests = 0

    server.use(
      http.get("*/backend-api/products/documents", () => {
        listRequests += 1
        return HttpResponse.json(
          listRequests === 1
            ? { content: [], totalPages: 0, totalElements: 0 }
            : { content: [UPLOADED_DOCUMENT], totalPages: 1, totalElements: 1 },
        )
      }),
      http.get("*/backend-api/user-products/documents/:documentId/products", () =>
        HttpResponse.json({ documentId: "doc-1", products: [], wrongRows: [] }),
      ),
    )
    vi.spyOn(vendorDocumentsAPI, "uploadDocument").mockResolvedValue(IMPORT_RESULT)

    const user = userEvent.setup()
    render(<ImportDocumentsModal isOpen onClose={vi.fn()} />)

    // The modal opens on the Upload tab, having already fetched an empty history.
    await waitFor(() => expect(listRequests).toBe(1))

    const file = new File(["x"], "products.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    await user.upload(screen.getByLabelText(/select your Excel file/i), file)
    await user.click(screen.getByRole("button", { name: /Upload Document/i }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalled())
    await waitFor(() => expect(listRequests).toBe(2))

    await user.click(screen.getByRole("button", { name: "View My Uploads" }))
    expect(await screen.findByText("products.xlsx")).toBeInTheDocument()
  })
})
