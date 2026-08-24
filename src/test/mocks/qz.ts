import { vi } from "vitest"

export interface QzMock {
  websocket: {
    connect: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
    isActive: ReturnType<typeof vi.fn>
  }
  printers: {
    find: ReturnType<typeof vi.fn>
    getDefault: ReturnType<typeof vi.fn>
  }
  configs: { create: ReturnType<typeof vi.fn> }
  print: ReturnType<typeof vi.fn>
  security: {
    setCertificatePromise: ReturnType<typeof vi.fn>
    setSignaturePromise: ReturnType<typeof vi.fn>
    setSignatureAlgorithm: ReturnType<typeof vi.fn>
  }
  api?: { setPromiseType: ReturnType<typeof vi.fn>; setSha256Type: ReturnType<typeof vi.fn> }
}

export const createQzMock = (): QzMock => {
  let active = false
  return {
    websocket: {
      connect: vi.fn(() => {
        active = true
        return Promise.resolve()
      }),
      disconnect: vi.fn(() => {
        active = false
        return Promise.resolve()
      }),
      isActive: vi.fn(() => active),
    },
    printers: {
      find: vi.fn().mockResolvedValue(["Zebra ZD410", "PDF Printer"]),
      getDefault: vi.fn().mockResolvedValue("Zebra ZD410"),
    },
    configs: { create: vi.fn((printer: string) => ({ printer })) },
    print: vi.fn().mockResolvedValue(undefined),
    security: {
      setCertificatePromise: vi.fn(),
      setSignaturePromise: vi.fn(),
      setSignatureAlgorithm: vi.fn(),
    },
    api: { setPromiseType: vi.fn(), setSha256Type: vi.fn() },
  }
}

/** Installs `window.qz` and returns the mock so the test can assert on it. */
export const installQzMock = (qz: QzMock = createQzMock()): QzMock => {
  ;(window as unknown as { qz?: QzMock }).qz = qz
  return qz
}

/** Models "QZ Tray is not installed" — `window.qz` stays undefined. */
export const removeQzMock = (): void => {
  ;(window as unknown as { qz?: QzMock }).qz = undefined
}

export const getQzMock = (): QzMock | undefined => (window as unknown as { qz?: QzMock }).qz
