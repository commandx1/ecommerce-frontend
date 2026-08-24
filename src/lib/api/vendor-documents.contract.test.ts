import { HttpResponse, http } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { ApiRequestError, apiRequest } from "./request"
import type { ImportResult, VendorDocument } from "./vendor-documents"
import { extractFileName, vendorDocumentsAPI } from "./vendor-documents"

function makeDocument(overrides: Partial<VendorDocument> = {}): VendorDocument {
  return {
    id: "doc-1",
    ownerId: "vendor-1",
    filePath: "uploads/abc123_catalog.csv",
    approved: true,
    revisionRequested: false,
    revisionApproved: null,
    requestedEdits: null,
    revisedFilePath: null,
    invalidRecordsFilePath: null,
    createdDate: "2026-08-01T10:00:00Z",
    updatedDate: "2026-08-01T10:00:00Z",
    deleted: false,
    systemRejected: false,
    ...overrides,
  }
}

const mockImportResult: ImportResult = {
  documentId: "doc-1",
  success: true,
  message: "Import complete",
  acceptedCount: 98,
  skippedCount: 2,
  wrongCount: 0,
  invalidRecordsFilePath: null,
}

const mockDocumentsResponse = {
  content: [makeDocument()],
  pageable: { pageNumber: 0, pageSize: 10 },
  totalPages: 1,
  totalElements: 1,
  last: true,
  first: true,
  numberOfElements: 1,
  size: 10,
  number: 0,
  empty: false,
}

let capturedListQuery: URLSearchParams | null = null
let capturedDownloadQuery: URLSearchParams | null = null
let capturedDeleteUrl: string | null = null

beforeEach(() => {
  capturedListQuery = null
  capturedDownloadQuery = null
  capturedDeleteUrl = null

  server.use(
    http.get("*/backend-api/products/documents", ({ request }) => {
      capturedListQuery = new URL(request.url).searchParams
      return HttpResponse.json(mockDocumentsResponse)
    }),
    http.get("*/backend-api/products/documents/:id/file", ({ request }) => {
      capturedDownloadQuery = new URL(request.url).searchParams
      return new HttpResponse(new Blob(["file-bytes"], { type: "text/csv" }), {
        headers: { "Content-Type": "text/csv" },
      })
    }),
    http.delete("*/backend-api/products/documents/:id", ({ request }) => {
      capturedDeleteUrl = request.url
      return new HttpResponse(null, { status: 200 })
    }),
  )
})

// NOTE ON THIS DESCRIBE BLOCK:
// A real network round-trip for a `FormData`-bodied request (axios' XHR adapter, driven
// through mswjs/interceptors, under jsdom) hangs indefinitely in this test environment - it
// never resolves even after the mock handler has already produced and sent its response. This
// reproduces identically for the sibling `productsAPI.createProduct` FormData upload elsewhere
// in this codebase, so it is an environment-level incompatibility (jsdom + axios XHR adapter +
// MSW's XHR interceptor + FormData request bodies), not something introduced here, and it is
// out of scope to fix (touching mocks/**, vitest config, or the source is not permitted). See
// the task report for a flagged recommendation to add a Playwright/browser-mode coverage path
// for multipart uploads instead.
//
// To still lock in `uploadDocument`'s wire contract, these tests spy on `apiRequest.requestJson`
// (the thin transport `uploadDocument` delegates to) instead of driving a real MSW round trip.
// This verifies the exact request shape (client target, method, url, headers, FormData
// contents) and the pass-through of resolved/rejected values, without exercising the axios
// XHR + FormData path that hangs.
describe("vendorDocumentsAPI.uploadDocument contract", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("builds a multipart FormData with the file field and posts via the 'app' client with the bearer token", async () => {
    const requestJsonSpy = vi.spyOn(apiRequest, "requestJson").mockResolvedValue(mockImportResult)
    const file = new File(["a,b,c\n1,2,3"], "catalog.csv", { type: "text/csv" })

    const result = await vendorDocumentsAPI.uploadDocument(file, "token-1")

    expect(requestJsonSpy).toHaveBeenCalledTimes(1)
    const config = requestJsonSpy.mock.calls[0]?.[0] as {
      client: string
      method: string
      url: string
      headers: Record<string, string>
      data: FormData
    }
    expect(config.client).toBe("app")
    expect(config.method).toBe("POST")
    expect(config.url).toBe("/backend-api/products/documents/upload-and-import")
    expect(config.headers).toEqual({ Authorization: "Bearer token-1" })
    expect(config.data).toBeInstanceOf(FormData)
    expect(config.data.get("file")).toBe(file)
    expect(result).toEqual(mockImportResult)
  })

  it("returns a partial-success import result (some rows skipped/wrong)", async () => {
    const partialResult: ImportResult = {
      documentId: "doc-2",
      success: true,
      message: "Import completed with issues",
      acceptedCount: 70,
      skippedCount: 20,
      wrongCount: 10,
      invalidRecordsFilePath: "uploads/def456_invalid.csv",
    }
    vi.spyOn(apiRequest, "requestJson").mockResolvedValue(partialResult)

    const result = await vendorDocumentsAPI.uploadDocument(new File(["x"], "f.csv"), "token-1")

    expect(result.skippedCount).toBe(20)
    expect(result.wrongCount).toBe(10)
    expect(result.invalidRecordsFilePath).toBe("uploads/def456_invalid.csv")
  })

  it("rejects with a 400 for a malformed file", async () => {
    vi.spyOn(apiRequest, "requestJson").mockRejectedValue(
      new ApiRequestError("Unsupported file format", { status: 400 }),
    )

    await expect(vendorDocumentsAPI.uploadDocument(new File(["x"], "f.txt"), "token-1")).rejects.toMatchObject({
      status: 400,
    })
  })

  it("rejects with a 401 and marks the error auth-handled", async () => {
    vi.spyOn(apiRequest, "requestJson").mockRejectedValue(
      new ApiRequestError("Unauthorized", { status: 401, authHandled: true }),
    )

    const error = await vendorDocumentsAPI.uploadDocument(new File(["x"], "f.csv"), "expired").catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error.status).toBe(401)
    expect(error.authHandled).toBe(true)
  })

  it("rejects on a network failure", async () => {
    vi.spyOn(apiRequest, "requestJson").mockRejectedValue(new ApiRequestError("Network Error"))

    await expect(vendorDocumentsAPI.uploadDocument(new File(["x"], "f.csv"), "token-1")).rejects.toBeInstanceOf(
      ApiRequestError,
    )
  })
})

describe("vendorDocumentsAPI.getDocuments contract", () => {
  it("defaults to page 0, size 10, sort desc (0-indexed pagination)", async () => {
    await vendorDocumentsAPI.getDocuments({}, "token-1")

    expect(capturedListQuery?.get("page")).toBe("0")
    expect(capturedListQuery?.get("size")).toBe("10")
    expect(capturedListQuery?.get("sort")).toBe("desc")
  })

  it("sends explicit paging and sort params", async () => {
    await vendorDocumentsAPI.getDocuments({ page: 2, size: 5, sort: "asc" }, "token-1")

    expect(capturedListQuery?.get("page")).toBe("2")
    expect(capturedListQuery?.get("size")).toBe("5")
    expect(capturedListQuery?.get("sort")).toBe("asc")
  })

  it("returns the typed Spring page of documents", async () => {
    const response = await vendorDocumentsAPI.getDocuments({}, "token-1")

    expect(response.content).toEqual([makeDocument()])
    expect(response.totalElements).toBe(1)
  })

  it("tolerates an empty document list for a new vendor", async () => {
    server.use(
      http.get("*/backend-api/products/documents", () =>
        HttpResponse.json({
          content: [],
          pageable: { pageNumber: 0, pageSize: 10 },
          totalPages: 0,
          totalElements: 0,
          last: true,
          first: true,
          numberOfElements: 0,
          size: 10,
          number: 0,
          empty: true,
        }),
      ),
    )

    const response = await vendorDocumentsAPI.getDocuments({}, "token-1")

    expect(response.content).toEqual([])
  })

  it("tolerates a document with a rejected revision and no revised file yet", async () => {
    server.use(
      http.get("*/backend-api/products/documents", () =>
        HttpResponse.json({
          ...mockDocumentsResponse,
          content: [
            makeDocument({
              approved: false,
              revisionRequested: true,
              revisionApproved: false,
              requestedEdits: "Fix SKU column",
              revisedFilePath: null,
            }),
          ],
        }),
      ),
    )

    const response = await vendorDocumentsAPI.getDocuments({}, "token-1")

    expect(response.content[0]?.revisionApproved).toBe(false)
    expect(response.content[0]?.revisedFilePath).toBeNull()
  })

  it("rejects with a 500 server error", async () => {
    server.use(
      http.get("*/backend-api/products/documents", () =>
        HttpResponse.json({ message: "Server error" }, { status: 500 }),
      ),
    )

    await expect(vendorDocumentsAPI.getDocuments({}, "token-1")).rejects.toMatchObject({ status: 500 })
  })
})

describe("vendorDocumentsAPI.downloadDocument contract", () => {
  it("sends the fileType query param and returns a Blob", async () => {
    const blob = await vendorDocumentsAPI.downloadDocument("doc-1", "original", "token-1")

    expect(capturedDownloadQuery?.get("fileType")).toBe("original")
    expect(blob).toBeInstanceOf(Blob)
  })

  it("supports revised and invalid file types", async () => {
    await vendorDocumentsAPI.downloadDocument("doc-1", "revised", "token-1")
    expect(capturedDownloadQuery?.get("fileType")).toBe("revised")

    await vendorDocumentsAPI.downloadDocument("doc-1", "invalid", "token-1")
    expect(capturedDownloadQuery?.get("fileType")).toBe("invalid")
  })

  // `request.ts`'s `parseBlobErrorData` does `await blob.text()` inside a try/catch and falls
  // back to returning the original Blob unchanged if that throws. In this jsdom test
  // environment, `Blob#text()` on a Blob that came back through mswjs/interceptors' XHR
  // response handling throws, so the catch silently swallows it - the caller gets the generic
  // `fallbackMessage` ("Failed to download document") instead of the backend's actual JSON
  // "File not found", and `error.data` stays a Blob instead of the parsed object. This is a
  // real silent-failure risk (see task report): any 4xx/5xx on a blob-typed request loses its
  // backend error message whenever `.text()` fails for any reason, not just in tests.
  it(
    "falls back to the generic message when the blob error body cannot be parsed as JSON " +
      "(current, silent-failure-prone behavior - see report)",
    async () => {
      server.use(
        http.get("*/backend-api/products/documents/:id/file", () =>
          HttpResponse.json({ message: "File not found" }, { status: 404 }),
        ),
      )

      const error = await vendorDocumentsAPI.downloadDocument("doc-1", "original", "token-1").catch((e) => e)

      expect(error).toBeInstanceOf(ApiRequestError)
      expect(error.status).toBe(404)
      expect(error.message).toBe("Failed to download document")
      expect(error.data).toBeInstanceOf(Blob)
    },
  )
})

describe("vendorDocumentsAPI.deleteDocument contract", () => {
  it("calls DELETE with the document id in the path", async () => {
    await vendorDocumentsAPI.deleteDocument("doc-1", "token-1")

    expect(capturedDeleteUrl).toContain("/products/documents/doc-1")
  })

  it("rejects with a 404 when the document no longer exists", async () => {
    server.use(
      http.delete("*/backend-api/products/documents/:id", () =>
        HttpResponse.json({ message: "Not found" }, { status: 404 }),
      ),
    )

    await expect(vendorDocumentsAPI.deleteDocument("missing", "token-1")).rejects.toMatchObject({ status: 404 })
  })

  it("rejects with a 403 when deleting another vendor's document", async () => {
    server.use(
      http.delete("*/backend-api/products/documents/:id", () =>
        HttpResponse.json({ message: "Forbidden" }, { status: 403 }),
      ),
    )

    const error = await vendorDocumentsAPI.deleteDocument("someone-elses", "token-1").catch((e) => e)

    expect(error.status).toBe(403)
    expect(error.authHandled).toBe(false)
  })
})

describe("extractFileName", () => {
  it("strips the {uuid}_ prefix from a stored file path", () => {
    expect(extractFileName("uploads/abc-123-def_catalog.csv")).toBe("catalog.csv")
  })

  it("returns the raw segment when there is no underscore prefix", () => {
    expect(extractFileName("uploads/catalog.csv")).toBe("catalog.csv")
  })

  it("returns the whole path when there is no slash", () => {
    expect(extractFileName("abc123_catalog.csv")).toBe("catalog.csv")
  })
})
