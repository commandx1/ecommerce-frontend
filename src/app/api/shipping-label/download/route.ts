import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const ALLOWED_LABEL_HOSTS = new Set(["deliver.goshippo.com"])

function getSafeFileName(value: string | null): string {
  const normalized = (value || "shipping-label.pdf")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)

  if (!normalized) return "shipping-label.pdf"
  return normalized.toLowerCase().endsWith(".pdf") ? normalized : `${normalized}.pdf`
}

export async function GET(request: NextRequest) {
  const labelUrlValue = request.nextUrl.searchParams.get("url")

  if (!labelUrlValue) {
    return NextResponse.json({ message: "Shipping label URL is required" }, { status: 400 })
  }

  let labelUrl: URL
  try {
    labelUrl = new URL(labelUrlValue)
  } catch {
    return NextResponse.json({ message: "Invalid shipping label URL" }, { status: 400 })
  }

  if (labelUrl.protocol !== "https:" || !ALLOWED_LABEL_HOSTS.has(labelUrl.hostname)) {
    return NextResponse.json({ message: "Shipping label host is not allowed" }, { status: 400 })
  }

  const response = await fetch(labelUrl.toString(), { cache: "no-store" })
  if (!response.ok || !response.body) {
    return NextResponse.json({ message: "Shipping label could not be downloaded" }, { status: response.status || 502 })
  }

  const fileName = getSafeFileName(request.nextUrl.searchParams.get("filename"))

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": response.headers.get("content-type") || "application/pdf",
    },
  })
}
