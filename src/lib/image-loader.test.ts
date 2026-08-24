import { describe, expect, it } from "vitest"
import imageLoader from "./image-loader"

/**
 * Regression guard for K15's root cause: `next.config.ts` sets `images.loader: "custom"`, and on
 * the self-hosted standalone server Next.js's own `/_next/image` route handler always 404s when a
 * custom loader is configured. Previously this loader sent relative (local `public/`) paths
 * through `/_next/image?...` anyway, so every local image 404'd in production. The loader must
 * never produce a `/_next/image` URL — it just returns `src` unchanged.
 */
describe("imageLoader", () => {
  it("returns an absolute http(s) URL unchanged", () => {
    expect(imageLoader({ src: "https://cdn.example.com/photo.png", width: 64, quality: 75 })).toBe(
      "https://cdn.example.com/photo.png",
    )
    expect(imageLoader({ src: "http://cdn.example.com/photo.png", width: 64, quality: 75 })).toBe(
      "http://cdn.example.com/photo.png",
    )
  })

  it("returns a relative (local public/) path unchanged instead of routing through /_next/image", () => {
    const result = imageLoader({ src: "/DentyProLogo.png", width: 64, quality: 75 })

    expect(result).toBe("/DentyProLogo.png")
    expect(result).not.toContain("/_next/image")
  })

  it("does not append width/quality query params for a relative path", () => {
    const result = imageLoader({ src: "/dentypro-product-placeholder.png", width: 128, quality: 90 })

    expect(result).toBe("/dentypro-product-placeholder.png")
    expect(result).not.toContain("?")
  })

  it("ignores width/quality entirely and returns src as-is regardless of their value", () => {
    expect(imageLoader({ src: "/logo.png", width: 32, quality: 10 })).toBe("/logo.png")
    expect(imageLoader({ src: "/logo.png", width: 1920 })).toBe("/logo.png")
  })
})
