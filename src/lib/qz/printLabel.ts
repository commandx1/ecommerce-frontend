declare global {
  interface Window {
    qz?: QzApi
  }
}

type QzColorType = "color" | "grayscale"

interface QzApi {
  websocket?: {
    isActive?: () => boolean
    connect: () => Promise<void>
  }
  printers: {
    find: () => Promise<string[]>
  }
  configs: {
    create: (
      printer: string | null,
      options: {
        copies: number
        colorType: QzColorType
      },
    ) => unknown
  }
  print: (config: unknown, data: Array<{ type: "pdf"; data: string }>) => Promise<void>
  api?: {
    getVersion?: () => Promise<string>
  }
}

export type QzPrintOptions = {
  printer?: string
  copies?: number
  colorType?: QzColorType
}

type QzStatus = "connected" | "script_load_failed" | "connect_failed" | "printer_lookup_failed" | "no_printers"

export interface QzConnectionStatus {
  status: QzStatus
  printers: string[]
  message: string
  version: string | null
  scriptSource: string | null
  isBundledFallback: boolean
  debugMessage: string | null
}

type QzScriptCandidate = {
  url: string
  label: string
  isBundledFallback: boolean
}

type QzScriptLoadResult = {
  scriptSource: string
  isBundledFallback: boolean
}

const QZ_SCRIPT_CANDIDATES: readonly QzScriptCandidate[] = [
  {
    url: "https://localhost:8181/qz-tray.js",
    label: "QZ Tray localhost 8181",
    isBundledFallback: false,
  },
  {
    url: "https://localhost:8181/js/qz-tray.js",
    label: "QZ Tray localhost 8181 /js",
    isBundledFallback: false,
  },
  {
    url: "http://localhost:8182/qz-tray.js",
    label: "QZ Tray localhost 8182",
    isBundledFallback: false,
  },
  {
    url: "http://localhost:8182/js/qz-tray.js",
    label: "QZ Tray localhost 8182 /js",
    isBundledFallback: false,
  },
  {
    url: "/qz-tray.js",
    label: "Bundled qz-tray.js fallback",
    isBundledFallback: true,
  },
] as const

const QZ_SCRIPT_ATTRIBUTE = "data-qz-script-loader"

let qzScriptLoading: Promise<QzScriptLoadResult> | null = null
let loadedScriptSource: QzScriptLoadResult | null = null

function reportQzIssue(level: "warn" | "error", message: string, error: unknown) {
  // biome-ignore lint/suspicious/noConsole: QZ local integration failures must stay visible in browser diagnostics.
  console[level](message, error)
}

function isQzApi(value: unknown): value is QzApi {
  if (typeof value !== "object" || value === null) return false

  const maybeQz = value as Partial<QzApi>
  return Boolean(
    maybeQz.websocket &&
    typeof maybeQz.websocket.connect === "function" &&
    maybeQz.printers &&
    typeof maybeQz.printers.find === "function" &&
    maybeQz.configs &&
    typeof maybeQz.configs.create === "function" &&
    typeof maybeQz.print === "function",
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error

  try {
    return JSON.stringify(error)
  } catch {
    return "Unknown error"
  }
}

function removeManagedQzScripts() {
  document.querySelectorAll(`script[${QZ_SCRIPT_ATTRIBUTE}]`).forEach((element) => {
    element.parentElement?.removeChild(element)
  })
}

function loadScriptCandidate(candidate: QzScriptCandidate): Promise<QzScriptLoadResult> {
  return new Promise<QzScriptLoadResult>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = candidate.url
    script.async = true
    script.setAttribute(QZ_SCRIPT_ATTRIBUTE, candidate.url)

    script.onload = () => {
      if (isQzApi(window.qz)) {
        resolve({
          scriptSource: candidate.label,
          isBundledFallback: candidate.isBundledFallback,
        })
        return
      }

      script.remove()
      reject(new Error(`QZ script loaded from ${candidate.url} but window.qz was unavailable.`))
    }

    script.onerror = () => {
      script.remove()
      reject(new Error(`Failed to load QZ script from ${candidate.url}.`))
    }

    document.body.appendChild(script)
  })
}

async function loadQzScriptSequentially(): Promise<QzScriptLoadResult> {
  const loadErrors: string[] = []

  for (const candidate of QZ_SCRIPT_CANDIDATES) {
    try {
      removeManagedQzScripts()
      const result = await loadScriptCandidate(candidate)
      loadedScriptSource = result
      return result
    } catch (error) {
      loadErrors.push(getErrorMessage(error))
    }
  }

  throw new Error(loadErrors.join(" "))
}

async function ensureQzLoaded(): Promise<QzScriptLoadResult | null> {
  if (typeof window === "undefined") return null

  if (isQzApi(window.qz)) {
    return (
      loadedScriptSource ?? {
        scriptSource: "Existing window.qz",
        isBundledFallback: false,
      }
    )
  }

  if (!qzScriptLoading) {
    qzScriptLoading = loadQzScriptSequentially()
  }

  try {
    const result = await qzScriptLoading
    loadedScriptSource = result
    return result
  } catch (error) {
    qzScriptLoading = null
    loadedScriptSource = null
    reportQzIssue("error", "QZ Tray script load failed:", error)
    return null
  }
}

async function ensureQzConnected() {
  const qz = window.qz
  if (!isQzApi(qz)) {
    throw new Error("QZ Tray API is not available on window.")
  }

  const websocket = qz.websocket
  if (!websocket) {
    throw new Error("QZ Tray websocket API is unavailable.")
  }

  if (!websocket.isActive?.()) {
    await websocket.connect()
  }

  return qz
}

async function getQzVersion(qz: QzApi): Promise<string | null> {
  if (!qz.api?.getVersion) return null

  try {
    return await qz.api.getVersion()
  } catch (error) {
    reportQzIssue("warn", "QZ Tray version lookup failed:", error)
    return null
  }
}

export async function getQzConnectionStatus(): Promise<QzConnectionStatus> {
  if (typeof window === "undefined") {
    return {
      status: "script_load_failed",
      printers: [],
      message: "QZ Tray is only available in the browser.",
      version: null,
      scriptSource: null,
      isBundledFallback: false,
      debugMessage: "window is undefined",
    }
  }

  const scriptResult = await ensureQzLoaded()
  if (!scriptResult || !isQzApi(window.qz)) {
    return {
      status: "script_load_failed",
      printers: [],
      message: "QZ Tray script could not be loaded. Labels will open in your browser.",
      version: null,
      scriptSource: scriptResult?.scriptSource ?? null,
      isBundledFallback: scriptResult?.isBundledFallback ?? false,
      debugMessage: "No QZ script candidate produced a usable window.qz instance.",
    }
  }

  try {
    const qz = await ensureQzConnected()
    const version = await getQzVersion(qz)

    try {
      const printers = await qz.printers.find()
      if (printers.length === 0) {
        return {
          status: "no_printers",
          printers: [],
          message: "QZ Tray is connected but no printers were reported. Labels will open in your browser.",
          version,
          scriptSource: scriptResult.scriptSource,
          isBundledFallback: scriptResult.isBundledFallback,
          debugMessage: "qz.printers.find() returned an empty array.",
        }
      }

      return {
        status: "connected",
        printers,
        message: "",
        version,
        scriptSource: scriptResult.scriptSource,
        isBundledFallback: scriptResult.isBundledFallback,
        debugMessage: null,
      }
    } catch (error) {
      const debugMessage = getErrorMessage(error)
      reportQzIssue("error", "QZ Tray printer discovery failed:", error)

      return {
        status: "printer_lookup_failed",
        printers: [],
        message: "QZ Tray connected, but printer lookup failed. Labels will open in your browser.",
        version,
        scriptSource: scriptResult.scriptSource,
        isBundledFallback: scriptResult.isBundledFallback,
        debugMessage,
      }
    }
  } catch (error) {
    const debugMessage = getErrorMessage(error)
    reportQzIssue("error", "QZ Tray connection failed:", error)

    return {
      status: "connect_failed",
      printers: [],
      message: "QZ Tray could not establish a local connection. Labels will open in your browser.",
      version: null,
      scriptSource: scriptResult.scriptSource,
      isBundledFallback: scriptResult.isBundledFallback,
      debugMessage,
    }
  }
}

export async function connectQzAndGetPrinters(): Promise<string[]> {
  const status = await getQzConnectionStatus()
  return status.printers
}

export async function printShippingLabel(url: string, options: QzPrintOptions = {}) {
  if (typeof window === "undefined") return

  const scriptResult = await ensureQzLoaded()
  if (!scriptResult || !isQzApi(window.qz)) {
    window.open(url, "_blank", "noopener,noreferrer")
    return
  }

  try {
    const qz = await ensureQzConnected()
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
  } catch (error) {
    reportQzIssue("error", "QZ Tray print failed:", error)
    window.open(url, "_blank", "noopener,noreferrer")
  }
}
