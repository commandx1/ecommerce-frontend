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
  createdDate: string
  updatedDate: string
  deleted: boolean
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

function extractFileName(filePath: string): string {
  const parts = filePath.split("/")
  const raw = parts[parts.length - 1] ?? filePath
  // strip UUID prefix: {uuid}_{original_name}
  const underscoreIdx = raw.indexOf("_")
  return underscoreIdx !== -1 ? raw.slice(underscoreIdx + 1) : raw
}

export { extractFileName }

class VendorDocumentsAPI {
  async uploadDocument(file: File, token: string): Promise<VendorDocument> {
    const formData = new FormData()
    formData.append("file", file)
    // Use "app" client (no default Content-Type) so XHR can set multipart/form-data with boundary
    return apiRequest.requestJson<VendorDocument>({
      client: "app",
      method: "POST",
      url: "/backend-api/products/documents/upload",
      headers: { Authorization: `Bearer ${token}` },
      data: formData,
      fallbackMessage: "Failed to upload document",
    })
  }

  async reviseDocument(id: string, file: File, token: string): Promise<VendorDocument> {
    const formData = new FormData()
    formData.append("file", file)
    // Use "app" client (no default Content-Type) so XHR can set multipart/form-data with boundary
    return apiRequest.requestJson<VendorDocument>({
      client: "app",
      method: "POST",
      url: `/backend-api/products/documents/${id}/revision`,
      headers: { Authorization: `Bearer ${token}` },
      data: formData,
      fallbackMessage: "Failed to submit revision",
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

  async downloadDocument(id: string, fileType: "original" | "revised", token: string): Promise<Blob> {
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
