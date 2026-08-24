import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createQzMock, type QzMock, removeQzMock } from "@/test/mocks/qz"

/**
 * `printLabel.ts` memoises the injected <script> in module scope (`qzScriptLoading`,
 * `loadedScriptSource`) and offers no reset hook, so every test imports a fresh module.
 */
const importPrintLabel = async () => {
  vi.resetModules()
  return import("./printLabel")
}

/**
 * jsdom never fetches `<script src=...>`, so neither `load` nor `error` would ever fire and
 * `ensureQzLoaded()` would hang. Each test decides what happens when a script is created.
 */
const stubScriptLoading = (outcome: "error" | "load", onCreate?: () => void) => {
  const realCreateElement = document.createElement.bind(document)
  vi.spyOn(document, "createElement").mockImplementation(((tag: string, options?: ElementCreationOptions) => {
    const element = realCreateElement(tag, options)
    if (tag === "script") {
      queueMicrotask(() => {
        onCreate?.()
        element.dispatchEvent(new Event(outcome))
      })
    }
    return element
  }) as typeof document.createElement)
}

let openSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.restoreAllMocks()
  removeQzMock()
  openSpy = vi.fn(() => null)
  window.open = openSpy as unknown as typeof window.open
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(console, "warn").mockImplementation(() => {})
})

afterEach(() => {
  removeQzMock()
})

/** The shape `printLabel.ts` accepts: websocket.connect, printers.find, configs.create, print. */
const installUsableQz = (overrides: Partial<QzMock> = {}): QzMock => {
  const qz = { ...createQzMock(), ...overrides } as QzMock
  ;(window as unknown as { qz?: QzMock }).qz = qz
  return qz
}

describe("getQzConnectionStatus", () => {
  it("reports every printer QZ knows about once connected", async () => {
    const qz = installUsableQz()
    qz.printers.find.mockResolvedValue(["Zebra ZD410", "PDF Printer"])
    const { getQzConnectionStatus } = await importPrintLabel()

    const status = await getQzConnectionStatus()

    expect(status.status).toBe("connected")
    expect(status.printers).toEqual(["Zebra ZD410", "PDF Printer"])
    expect(status.message).toBe("")
    expect(qz.websocket.connect).toHaveBeenCalledTimes(1)
  })

  it("does not reconnect an already active websocket", async () => {
    const qz = installUsableQz()
    qz.websocket.isActive.mockReturnValue(true)
    const { getQzConnectionStatus } = await importPrintLabel()

    await getQzConnectionStatus()

    expect(qz.websocket.connect).not.toHaveBeenCalled()
  })

  it("explains that labels fall back to the browser when QZ Tray is not installed", async () => {
    stubScriptLoading("error")
    const { getQzConnectionStatus } = await importPrintLabel()

    const status = await getQzConnectionStatus()

    expect(status.status).toBe("script_load_failed")
    expect(status.message).toBe("QZ Tray script could not be loaded. Labels will open in your browser.")
    expect(status.printers).toEqual([])
    // NOTE: the message never points at qz.io/download — there is no install link anywhere
    // in this module, so a vendor without QZ Tray is not told how to get it.
    expect(status.message).not.toMatch(/download|install/i)
  })

  it("loads QZ from the first script candidate that yields a usable window.qz", async () => {
    stubScriptLoading("load", () => {
      installUsableQz()
    })
    const { getQzConnectionStatus } = await importPrintLabel()

    const status = await getQzConnectionStatus()

    expect(status.status).toBe("connected")
    expect(status.scriptSource).toBe("QZ Tray localhost 8181")
    expect(status.isBundledFallback).toBe(false)
  })

  it("surfaces a websocket connection failure with the underlying reason", async () => {
    const qz = installUsableQz()
    qz.websocket.isActive.mockReturnValue(false)
    qz.websocket.connect.mockRejectedValue(new Error("Connection refused"))
    const { getQzConnectionStatus } = await importPrintLabel()

    const status = await getQzConnectionStatus()

    expect(status.status).toBe("connect_failed")
    expect(status.debugMessage).toBe("Connection refused")
    expect(status.printers).toEqual([])
  })

  it("separates a printer lookup failure from a connection failure", async () => {
    const qz = installUsableQz()
    qz.printers.find.mockRejectedValue(new Error("Spooler unavailable"))
    const { getQzConnectionStatus } = await importPrintLabel()

    const status = await getQzConnectionStatus()

    expect(status.status).toBe("printer_lookup_failed")
    expect(status.debugMessage).toBe("Spooler unavailable")
  })

  it("reports 'no printers' distinctly from a lookup failure", async () => {
    const qz = installUsableQz()
    qz.printers.find.mockResolvedValue([])
    const { getQzConnectionStatus } = await importPrintLabel()

    const status = await getQzConnectionStatus()

    expect(status.status).toBe("no_printers")
    expect(status.message).toMatch(/no printers were reported/)
  })

  it("keeps the status usable when the version lookup fails", async () => {
    const qz = installUsableQz()
    ;(qz as unknown as { api: { getVersion: () => Promise<string> } }).api = {
      getVersion: vi.fn().mockRejectedValue(new Error("nope")),
    }
    const { getQzConnectionStatus } = await importPrintLabel()

    const status = await getQzConnectionStatus()

    expect(status.status).toBe("connected")
    expect(status.version).toBeNull()
  })

  it("returns the reported version when QZ exposes one", async () => {
    const qz = installUsableQz()
    ;(qz as unknown as { api: { getVersion: () => Promise<string> } }).api = {
      getVersion: vi.fn().mockResolvedValue("2.2.4"),
    }
    const { getQzConnectionStatus } = await importPrintLabel()

    expect((await getQzConnectionStatus()).version).toBe("2.2.4")
  })
})

describe("connectQzAndGetPrinters", () => {
  it("returns just the printer list", async () => {
    const qz = installUsableQz()
    qz.printers.find.mockResolvedValue(["Zebra ZD410"])
    const { connectQzAndGetPrinters } = await importPrintLabel()

    expect(await connectQzAndGetPrinters()).toEqual(["Zebra ZD410"])
  })

  it("returns an empty list instead of throwing when QZ is unreachable", async () => {
    stubScriptLoading("error")
    const { connectQzAndGetPrinters } = await importPrintLabel()

    expect(await connectQzAndGetPrinters()).toEqual([])
  })
})

describe("printShippingLabel", () => {
  it("prints the PDF through QZ with the requested printer, copies and colour", async () => {
    const qz = installUsableQz()
    const { printShippingLabel } = await importPrintLabel()

    await printShippingLabel("https://labels.example/label.pdf", {
      printer: "Zebra ZD410",
      copies: 3,
      colorType: "grayscale",
    })

    expect(qz.websocket.connect).toHaveBeenCalledTimes(1)
    expect(qz.configs.create).toHaveBeenCalledWith("Zebra ZD410", { copies: 3, colorType: "grayscale" })
    expect(qz.print).toHaveBeenCalledWith({ printer: "Zebra ZD410" }, [
      { type: "pdf", data: "https://labels.example/label.pdf" },
    ])
    expect(openSpy).not.toHaveBeenCalled()
  })

  it("defaults to the system printer, one copy and colour", async () => {
    const qz = installUsableQz()
    const { printShippingLabel } = await importPrintLabel()

    await printShippingLabel("https://labels.example/label.pdf")

    expect(qz.configs.create).toHaveBeenCalledWith(null, { copies: 1, colorType: "color" })
  })

  it("opens the label in a new tab when QZ Tray is not installed", async () => {
    stubScriptLoading("error")
    const { printShippingLabel } = await importPrintLabel()

    await printShippingLabel("https://labels.example/label.pdf")

    expect(openSpy).toHaveBeenCalledWith("https://labels.example/label.pdf", "_blank", "noopener,noreferrer")
  })

  it("falls back to the browser when the print job itself fails", async () => {
    const qz = installUsableQz()
    qz.print.mockRejectedValue(new Error("Printer offline"))
    const { printShippingLabel } = await importPrintLabel()

    await printShippingLabel("https://labels.example/label.pdf")

    expect(openSpy).toHaveBeenCalledWith("https://labels.example/label.pdf", "_blank", "noopener,noreferrer")
  })

  it("falls back to the browser when the websocket cannot connect", async () => {
    const qz = installUsableQz()
    qz.websocket.isActive.mockReturnValue(false)
    qz.websocket.connect.mockRejectedValue(new Error("Connection refused"))
    const { printShippingLabel } = await importPrintLabel()

    await printShippingLabel("https://labels.example/label.pdf")

    expect(qz.print).not.toHaveBeenCalled()
    expect(openSpy).toHaveBeenCalledWith("https://labels.example/label.pdf", "_blank", "noopener,noreferrer")
  })

  // Y14 fix: the module used to open the QZ websocket and leave it open on both the success and
  // the failure path, with no `disconnect()` call anywhere in it. It now disconnects on every
  // path via a `finally` block.
  it("disconnects the websocket after a successful print", async () => {
    const qz = installUsableQz()
    const { printShippingLabel } = await importPrintLabel()

    await printShippingLabel("https://labels.example/label.pdf")

    expect(qz.websocket.disconnect).toHaveBeenCalledTimes(1)
  })

  it("disconnects the websocket even when the print job itself fails", async () => {
    const qz = installUsableQz()
    qz.print.mockRejectedValue(new Error("Printer offline"))
    const { printShippingLabel } = await importPrintLabel()

    await printShippingLabel("https://labels.example/label.pdf")

    expect(qz.websocket.disconnect).toHaveBeenCalledTimes(1)
  })

  it("does not blow up the print flow when disconnect itself fails", async () => {
    const qz = installUsableQz()
    qz.websocket.disconnect.mockRejectedValue(new Error("Disconnect failed"))
    const { printShippingLabel } = await importPrintLabel()

    await expect(printShippingLabel("https://labels.example/label.pdf")).resolves.toBeUndefined()

    expect(qz.websocket.disconnect).toHaveBeenCalledTimes(1)
  })
})
