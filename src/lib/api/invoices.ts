import { apiRequest } from "./request"

export interface InvoiceDownload {
  blob: Blob
  fileName: string
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/png": "png",
  "image/jpeg": "jpg",
}

function extractFileNameFromDisposition(contentDisposition: string | undefined): string | null {
  if (!contentDisposition) return null
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      // Malformed percent-encoding (e.g. a stray "%" or a truncated escape) makes
      // decodeURIComponent throw a URIError. The PDF itself downloaded fine, so fall through to
      // the ascii filename (or the generic `invoice-${orderId}.${extension}` name below) instead
      // of turning a successful download into a thrown error.
    }
  }
  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return asciiMatch?.[1] ?? null
}

async function downloadInvoice(orderId: string, sellerId: string): Promise<InvoiceDownload> {
  const response = await apiRequest.requestResponse<Blob>({
    client: "backend",
    method: "POST",
    url: "/invoices",
    params: { orderId, sellerId },
    responseType: "blob",
    fallbackMessage: "Failed to download invoice",
  })

  const contentType = response.headers["content-type"]?.split(";")[0]?.trim()
  const extension = (contentType && EXTENSION_BY_MIME[contentType]) || "pdf"
  const fileName =
    extractFileNameFromDisposition(response.headers["content-disposition"]) ?? `invoice-${orderId}.${extension}`

  return { blob: response.data, fileName }
}

export const invoicesAPI = { downloadInvoice }
