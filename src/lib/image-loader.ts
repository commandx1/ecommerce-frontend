import type { ImageLoaderProps } from "next/image"

/**
 * Harici CDN'ler (net32 gibi Cloudflare arkasındaki host'lar) Next.js image
 * optimizer'ın sunucu taraflı isteklerini 403 ile reddediyor. Bu yüzden harici
 * mutlak URL'ler optimizer'dan geçirilmeden doğrudan tarayıcıya bırakılıyor.
 *
 * next.config.ts'te `images.loader: "custom"` ayarlı olduğunda, Next.js'in
 * kendi sunucusu (`/_next/image` route handler) self-hosted standalone
 * build'de HER ZAMAN 404 döner (bkz. next-server.js: loader !== 'default' ise
 * endpoint devre dışı). Bu yüzden relative (kendi public/ altındaki) yollar da
 * optimizer'a hiç sokulmuyor, olduğu gibi servis ediliyor. Bedeli: yerel
 * asset'ler artık optimize edilmiyor (resize/format dönüşümü yok), ama en
 * azından production'da 404 vermiyorlar.
 */
const imageLoader = ({ src }: ImageLoaderProps): string => {
  return src
}

export default imageLoader
