"use client"

export async function downloadImageAsFileViaProxy(url: string, filename: string): Promise<File> {
  const proxyUrl = `/api/images/proxy?url=${encodeURIComponent(url)}`
  const response = await fetch(proxyUrl)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }
  const blob = await response.blob()
  return new File([blob], filename, { type: blob.type || "image/jpeg" })
}

