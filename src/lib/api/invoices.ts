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
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1])
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
