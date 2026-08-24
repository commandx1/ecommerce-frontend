import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { invoicesAPI } from "./invoices"
import { ApiRequestError } from "./request"

const PDF_BYTES = "%PDF-1.4 mock invoice"

function useInvoiceHandler(headers: Record<string, string>, body: string = PDF_BYTES) {
  server.use(http.post("*/backend-api/invoices", () => new HttpResponse(body, { status: 200, headers })))
}

describe("invoicesAPI.downloadInvoice contract", () => {
  it("sends orderId and sellerId as query params on a bodyless POST", async () => {
    const captured: { query: URLSearchParams | null; body: string | null; method: string | null } = {
      query: null,
      body: null,
      method: null,
    }

    server.use(
      http.post("*/backend-api/invoices", async ({ request }) => {
        captured.method = request.method
        captured.query = new URL(request.url).searchParams
        captured.body = await request.text()
        return new HttpResponse(PDF_BYTES, {
          status: 200,
          headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="invoice.pdf"' },
        })
      }),
    )

    await invoicesAPI.downloadInvoice("order-1", "seller-1")

    expect(captured.method).toBe("POST")
    expect(captured.query?.get("orderId")).toBe("order-1")
    expect(captured.query?.get("sellerId")).toBe("seller-1")
    expect(captured.body).toBe("")
  })

  it("returns the payload as a Blob together with the parsed file name", async () => {
    useInvoiceHandler({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="invoice-order-1.pdf"',
    })

    const download = await invoicesAPI.downloadInvoice("order-1", "seller-1")

    expect(download.blob).toBeInstanceOf(Blob)
    expect(download.blob.size).toBe(PDF_BYTES.length)
    expect(download.blob.type).toBe("application/pdf")
    expect(download.fileName).toBe("invoice-order-1.pdf")
  })

  it("parses an unquoted ascii filename", async () => {
    useInvoiceHandler({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=invoice-2026-05.pdf",
    })

    await expect(invoicesAPI.downloadInvoice("order-1", "seller-1")).resolves.toMatchObject({
      fileName: "invoice-2026-05.pdf",
    })
  })

  it("prefers and percent-decodes the RFC 5987 UTF-8 filename", async () => {
    useInvoiceHandler({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fatura.pdf"; filename*=UTF-8''${encodeURIComponent("fatura-özel.pdf")}`,
    })

    await expect(invoicesAPI.downloadInvoice("order-1", "seller-1")).resolves.toMatchObject({
      fileName: "fatura-özel.pdf",
    })
  })

  it("tolerates a charset suffix on the content type when picking the extension", async () => {
    useInvoiceHandler({ "Content-Type": "application/pdf; charset=binary" })

    await expect(invoicesAPI.downloadInvoice("order-9", "seller-1")).resolves.toMatchObject({
      fileName: "invoice-order-9.pdf",
    })
  })

  it.each([
    ["application/pdf", "invoice-order-1.pdf"],
    ["application/zip", "invoice-order-1.zip"],
    ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "invoice-order-1.docx"],
    ["image/png", "invoice-order-1.png"],
    ["image/jpeg", "invoice-order-1.jpg"],
    ["application/octet-stream", "invoice-order-1.pdf"],
  ])("derives the extension from content-type %s when no filename is sent", async (contentType, expected) => {
    useInvoiceHandler({ "Content-Type": contentType })

    await expect(invoicesAPI.downloadInvoice("order-1", "seller-1")).resolves.toMatchObject({ fileName: expected })
  })

  it("falls back to a .pdf name when the response carries no content-type either", async () => {
    server.use(
      http.post(
        "*/backend-api/invoices",
        () => new HttpResponse(PDF_BYTES, { status: 200, headers: { "Content-Type": "" } }),
      ),
    )

    await expect(invoicesAPI.downloadInvoice("order-42", "seller-1")).resolves.toMatchObject({
      fileName: "invoice-order-42.pdf",
    })
  })

  it("returns an empty Blob rather than throwing when the body is empty", async () => {
    server.use(
      http.post(
        "*/backend-api/invoices",
        () => new HttpResponse("", { status: 200, headers: { "Content-Type": "application/pdf" } }),
      ),
    )

    const download = await invoicesAPI.downloadInvoice("order-1", "seller-1")

    expect(download.blob.size).toBe(0)
    expect(download.fileName).toBe("invoice-order-1.pdf")
  })

  it.each([
    [403, "You cannot download another vendor's invoice"],
    [404, "Invoice not generated yet"],
    [409, "Order is not paid"],
    [500, "Invoice service unavailable"],
  ])("rejects with an ApiRequestError on %i", async (status, message) => {
    server.use(http.post("*/backend-api/invoices", () => HttpResponse.json({ message }, { status })))

    const error = await invoicesAPI.downloadInvoice("order-1", "seller-1").catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).status).toBe(status)
    // NOTE: a `responseType: "blob"` error body is read back with `Blob.text()`, which jsdom does
    // not implement, so the message degrades to the fallback here. In a browser the backend
    // message ("${message}") comes through instead.
    expect((error as ApiRequestError).message).toBe("Failed to download invoice")
  })

  it("flags a 401 as auth-handled", async () => {
    server.use(http.post("*/backend-api/invoices", () => HttpResponse.json({ message: "Expired" }, { status: 401 })))

    const error = await invoicesAPI.downloadInvoice("order-1", "seller-1").catch((caught: unknown) => caught)

    expect((error as ApiRequestError).authHandled).toBe(true)
  })

  it("rejects on a network failure", async () => {
    server.use(http.post("*/backend-api/invoices", () => HttpResponse.error()))

    await expect(invoicesAPI.downloadInvoice("order-1", "seller-1")).rejects.toBeInstanceOf(ApiRequestError)
  })
})
