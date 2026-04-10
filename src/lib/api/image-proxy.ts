"use client"

import { apiRequest } from "./request"

export async function downloadImageAsFileViaProxy(url: string, filename: string): Promise<File> {
  const proxyUrl = `/api/images/proxy?url=${encodeURIComponent(url)}`
  const response = await apiRequest.requestResponse<Blob>({
    client: "app",
    method: "GET",
    url: proxyUrl,
    responseType: "blob",
    fallbackMessage: "Failed to download image",
  })
  const blob = response.data
  return new File([blob], filename, { type: blob.type || "image/jpeg" })
}
