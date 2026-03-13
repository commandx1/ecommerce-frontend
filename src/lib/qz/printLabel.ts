declare global {
  interface Window {
    // QZ Tray global nesnesi
    // biome-ignore lint/suspicious/noExplicitAny: harici kütüphane tipi
    qz?: any
  }
}

export type QzPrintOptions = {
  printer?: string
  copies?: number
  colorType?: "color" | "grayscale"
}

let qzScriptLoading: Promise<void> | null = null

// Local script exposed by the QZ Tray desktop app
// When the app is running, it usually serves qz-tray.js from: https://localhost:8181/js/qz-tray.js
const QZ_SCRIPT_URL = "/qz-tray.js"

async function ensureQzLoaded() {
  if (typeof window === "undefined") return

  if (window.qz) return

  if (!qzScriptLoading) {
    qzScriptLoading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script")
      script.src = QZ_SCRIPT_URL
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load QZ Tray script"))
      document.body.appendChild(script)
    })
  }

  try {
    await qzScriptLoading
  } catch {
    // Script failed to load; fallback (open in new tab) will be used
  }
}

async function ensureQzConnected() {
  if (typeof window === "undefined") return
  const qz = window.qz
  if (!qz) return

  if (!qz.websocket?.isActive?.()) {
    await qz.websocket.connect()
  }
}

export async function connectQzAndGetPrinters(): Promise<string[]> {
  if (typeof window === "undefined") return []

  await ensureQzLoaded()
  const qz = window.qz

  if (!qz) return []

  try {
    await ensureQzConnected()
    const printers: string[] = await qz.printers.find()
    return printers
  } catch {
    return []
  }
}

export async function printShippingLabel(url: string, options: QzPrintOptions = {}) {
  if (typeof window === "undefined") return

  await ensureQzLoaded()
  const qz = window.qz

  if (!qz) {
    window.open(url, "_blank", "noopener,noreferrer")
    return
  }

  try {
    await ensureQzConnected()
    const config = qz.configs.create(options.printer || null, {
      copies: options.copies ?? 1,
      colorType: options.colorType ?? "color",
    })
    await qz.print(config, [
      {
        type: "pdf",
        data: url,
      },
    ])
  } catch {
    window.open(url, "_blank", "noopener,noreferrer")
  }
}

