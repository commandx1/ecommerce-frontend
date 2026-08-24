import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from "react"

type NextImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean
  priority?: boolean
  placeholder?: string
  blurDataURL?: string
  quality?: number | string
  sizes?: string
  unoptimized?: boolean
  loader?: unknown
  onLoadingComplete?: unknown
}

/**
 * Renders a plain `<img>`. Next-only props are stripped so React does not warn about unknown
 * DOM attributes, but `alt` (and every other real img attribute) is preserved because a11y
 * assertions such as `getByAltText` / `getByRole("img", { name })` depend on it.
 */
export function MockNextImage({
  fill: _fill,
  priority: _priority,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  quality: _quality,
  sizes: _sizes,
  unoptimized: _unoptimized,
  loader: _loader,
  onLoadingComplete: _onLoadingComplete,
  alt,
  src,
  ...rest
}: NextImageProps) {
  // biome-ignore lint/performance/noImgElement: this IS the next/image stand-in for tests.
  return <img alt={alt ?? ""} src={typeof src === "string" ? src : ""} {...rest} />
}

type NextLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string }
  prefetch?: boolean
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
  passHref?: boolean
  legacyBehavior?: boolean
  children?: ReactNode
}

/** Renders a plain `<a href>`; Next-only routing props are stripped. */
export function MockNextLink({
  href,
  prefetch: _prefetch,
  replace: _replace,
  scroll: _scroll,
  shallow: _shallow,
  passHref: _passHref,
  legacyBehavior: _legacyBehavior,
  children,
  ...rest
}: NextLinkProps) {
  const resolved = typeof href === "string" ? href : (href?.pathname ?? "")
  return (
    <a href={resolved} {...rest}>
      {children}
    </a>
  )
}

export const nextImageMock = () => ({ __esModule: true, default: MockNextImage })
export const nextLinkMock = () => ({ __esModule: true, default: MockNextLink })
