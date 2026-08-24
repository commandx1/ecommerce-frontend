import type { UserProductDetailResponse } from "./products"
import { apiRequest } from "./request"

export interface VendorDocument {
  id: string
  ownerId: string | null
  filePath: string
  approved: boolean
  revisionRequested: boolean
  revisionApproved: boolean | null
  requestedEdits: string | null
  revisedFilePath: string | null
  invalidRecordsFilePath: string | null
  createdDate: string
  updatedDate: string
  deleted: boolean
  systemRejected: boolean
}

export interface ImportResult {
  documentId: string
  success: boolean
  message: string
  acceptedCount: number
  skippedCount: number
  wrongCount: number
  invalidRecordsFilePath: string | null
}

// Mirrors backend DocumentProductStatusDto — `status` is null when the document
// produced no invalid-records file (the backend then scans the original file and
// has no per-row status to report).
export interface DocumentProductStatus {
  status: "success" | "skip" | null
  product: UserProductDetailResponse
}

// Mirrors backend DocumentProductsResponseDto (GET /api/user-products/documents/:id/products)
export interface DocumentProductsResponse {
  documentId: string
  products: DocumentProductStatus[]
  // Raw spreadsheet cells for rows that failed; column names are file-driven, not fixed.
  wrongRows: Record<string, string>[]
}

export interface VendorDocumentsResponse {
  content: VendorDocument[]
  pageable: {
    pageNumber: number
    pageSize: number
  }
  totalPages: number
  totalElements: number
  last: boolean
  first: boolean
  numberOfElements: number
  size: number
  number: number
  empty: boolean
}

// Query keys live next to the calls they describe so cache invalidation and
// fetching can never drift apart.
export const vendorDocumentsQueryKey = (page?: number) =>
  page === undefined ? (["vendor-documents"] as const) : (["vendor-documents", page] as const)

export const documentProductsQueryKey = (documentId: string) => ["document-products", documentId] as const

function extractFileName(filePath: string): string {
  const parts = filePath.split("/")
  const raw = parts[parts.length - 1] ?? filePath
  // strip UUID prefix: {uuid}_{original_name}
  const underscoreIdx = raw.indexOf("_")
  return underscoreIdx !== -1 ? raw.slice(underscoreIdx + 1) : raw
}

export { extractFileName }

class VendorDocumentsAPI {
  async uploadDocument(file: File, token: string): Promise<ImportResult> {
    const formData = new FormData()
    formData.append("file", file)
    // Use "app" client (no default Content-Type) so XHR can set multipart/form-data with boundary
    return apiRequest.requestJson<ImportResult>({
      client: "app",
      method: "POST",
      url: "/backend-api/products/documents/upload-and-import",
      headers: { Authorization: `Bearer ${token}` },
      data: formData,
      fallbackMessage: "Failed to upload document",
    })
  }

  async getDocuments(
    params: { page?: number; size?: number; sort?: "asc" | "desc" },
    token: string,
  ): Promise<VendorDocumentsResponse> {
    return apiRequest.requestJson<VendorDocumentsResponse>({
      client: "backend",
      method: "GET",
      url: "/products/documents",
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        sort: params.sort ?? "desc",
      },
      fallbackMessage: "Failed to fetch documents",
    })
  }

  async getDocumentProducts(documentId: string, token: string): Promise<DocumentProductsResponse> {
    return apiRequest.requestJson<DocumentProductsResponse>({
      client: "backend",
      method: "GET",
      url: `/user-products/documents/${documentId}/products`,
      headers: { Authorization: `Bearer ${token}` },
      fallbackMessage: "Failed to load imported products",
    })
  }

  async downloadDocument(id: string, fileType: "original" | "revised" | "invalid", token: string): Promise<Blob> {
    const response = await apiRequest.requestResponse<Blob>({
      client: "backend",
      method: "GET",
      url: `/products/documents/${id}/file`,
      headers: { Authorization: `Bearer ${token}` },
      params: { fileType },
      responseType: "blob",
      fallbackMessage: "Failed to download document",
    })
    return response.data
  }

  async deleteDocument(id: string, token: string): Promise<void> {
    await apiRequest.requestJson<void>({
      client: "backend",
      method: "DELETE",
      url: `/products/documents/${id}`,
      headers: { Authorization: `Bearer ${token}` },
      fallbackMessage: "Failed to delete document",
    })
  }
}

export const vendorDocumentsAPI = new VendorDocumentsAPI()
