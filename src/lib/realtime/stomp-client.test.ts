/**
 * Unit tests for the notification socket wrapper.
 *
 * The STOMP `Client` is replaced through the `loadStomp` seam by a fake that mirrors the parts of
 * the real class this wrapper touches: the constructor config is copied onto the instance (the
 * real client does the same via `configure`), so assertions read `instance.reconnectDelay` /
 * `instance.connectHeaders` exactly like production code mutates them. The handlers stay on the
 * captured config and are fired explicitly by the `fire*` helpers.
 *
 * The module namespace of the real `@stomp/stompjs` is spread into the fake module so the enums
 * (`ReconnectionTimeMode`) are the real ones and only `Client` is swapped.
 */

import type { Client, IFrame, IMessage, StompConfig } from "@stomp/stompjs"
import * as realStomp from "@stomp/stompjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  createNotificationSocket,
  ensureSockJsGlobalShim,
  NOTIFICATIONS_QUEUE_DESTINATION,
  type NotificationSocketOptions,
  resolveNotificationSocketUrl,
  resolveSockJsTransports,
} from "./stomp-client"

/* ------------------------------------------------------------------ *
 * Fakes
 * ------------------------------------------------------------------ */

/** `frameCallbackType` is a union of a 0-arg and a 1-arg signature; narrow it so it is callable. */
type CapturedConfig = StompConfig & {
  onConnect?: (frame: IFrame) => void
  onStompError?: (frame: IFrame) => void
  onWebSocketClose?: (event: unknown) => void
}

const frame = (command: string, headers: Record<string, string> = {}): IFrame =>
  ({ command, headers, body: "", isBinaryBody: false, binaryBody: new Uint8Array() }) as IFrame

class FakeStompClient {
  static instances: FakeStompClient[] = []

  readonly conf: CapturedConfig
  connectHeaders: Record<string, string>
  reconnectDelay: number
  active = false
  connected = false
  readonly subscriptions: Array<{ destination: string; callback: (message: IMessage) => void }> = []

  activate = vi.fn((): void => {
    this.active = true
  })
  deactivate = vi.fn((): Promise<void> => {
    this.active = false
    this.connected = false
    return Promise.resolve()
  })
  subscribe = vi.fn((destination: string, callback: (message: IMessage) => void) => {
    this.subscriptions.push({ destination, callback })
    return { id: `sub-${this.subscriptions.length}`, unsubscribe: vi.fn() }
  })

  constructor(conf: CapturedConfig = {}) {
    this.conf = conf
    this.connectHeaders = { ...((conf.connectHeaders ?? {}) as Record<string, string>) }
    this.reconnectDelay = conf.reconnectDelay ?? 0
    FakeStompClient.instances.push(this)
  }

  fireBeforeConnect(): void {
    void this.conf.beforeConnect?.(this as unknown as Client)
  }
  fireConnect(): void {
    this.connected = true
    this.conf.onConnect?.(frame("CONNECTED"))
  }
  fireStompError(message?: string): void {
    this.conf.onStompError?.(frame("ERROR", message === undefined ? {} : { message }))
  }
  fireWebSocketClose(): void {
    this.connected = false
    this.conf.onWebSocketClose?.({ code: 1006, reason: "" })
  }
  deliver(body: string): void {
    for (const subscription of this.subscriptions) {
      subscription.callback({ body } as IMessage)
    }
  }
  openSocket(): unknown {
    return this.conf.webSocketFactory?.()
  }
}

const sockJsCalls: Array<{ url: string; options: unknown }> = []

class FakeSockJs {
  url: string
  readyState = 0
  binaryType = ""
  onopen: ((event?: unknown) => void) | null = null
  onclose: ((event?: unknown) => void) | null = null
  onerror: ((event?: unknown) => void) | null = null
  onmessage: ((event?: unknown) => void) | null = null

  constructor(url: string, _reserved?: unknown, options?: unknown) {
    this.url = url
    sockJsCalls.push({ url, options })
  }
  send(): void {}
  close(): void {
    this.readyState = 3
    this.onclose?.({ code: 1000 })
  }
}

type SockJsCtor = typeof import("sockjs-client")

const loadStomp = () => Promise.resolve({ ...realStomp, Client: FakeStompClient as unknown as typeof realStomp.Client })
const loadSockJs = () => Promise.resolve({ default: FakeSockJs as unknown as SockJsCtor })

/** One macrotask turn drains every already-resolved promise chain inside `connect()`. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

const makeSocket = (overrides: Partial<NotificationSocketOptions> = {}) =>
  createNotificationSocket({
    url: "https://example.test/backend-ws",
    transports: ["xhr-streaming", "xhr-polling"],
    getToken: () => "jwt-1",
    onMessage: vi.fn(),
    loadStomp,
    loadSockJs,
    ...overrides,
  })

const lastClient = (): FakeStompClient => {
  const instance = FakeStompClient.instances.at(-1)
  if (!instance) {
    throw new Error("no STOMP client was created")
  }
  return instance
}

beforeEach(() => {
  FakeStompClient.instances.length = 0
  sockJsCalls.length = 0
})

afterEach(() => {
  vi.unstubAllEnvs()
})

/* ------------------------------------------------------------------ *
 * URL / transport / shim helpers
 * ------------------------------------------------------------------ */

describe("resolveNotificationSocketUrl", () => {
  it("falls back to the same-origin Next rewrite when NEXT_PUBLIC_WS_URL is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_WS_URL", "")

    const url = resolveNotificationSocketUrl()

    expect(url).toBe(`${window.location.origin}/backend-ws`)
    expect(url.startsWith("http")).toBe(true)
  })

  it("uses NEXT_PUBLIC_WS_URL with the backend /ws path", () => {
    vi.stubEnv("NEXT_PUBLIC_WS_URL", "https://api.example.test")

    expect(resolveNotificationSocketUrl()).toBe("https://api.example.test/ws")
  })

  it("trims trailing slashes before appending /ws", () => {
    vi.stubEnv("NEXT_PUBLIC_WS_URL", "https://api.example.test///")

    expect(resolveNotificationSocketUrl()).toBe("https://api.example.test/ws")
  })
})

describe("resolveSockJsTransports", () => {
  it("restricts to xhr transports on the rewrite path (a rewrite cannot proxy an Upgrade)", () => {
    vi.stubEnv("NEXT_PUBLIC_WS_URL", "")

    expect(resolveSockJsTransports()).toEqual(["xhr-polling"])
  })

  it("keeps the SockJS defaults when a direct backend URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_WS_URL", "https://api.example.test")

    expect(resolveSockJsTransports()).toBeUndefined()
  })
})

describe("ensureSockJsGlobalShim", () => {
  it("defines `global` when it is missing", () => {
    const scope = globalThis as unknown as { global?: unknown }
    const original = scope.global
    // The shim branches on `typeof global === "undefined"`, so the property has to be gone.
    delete scope.global

    ensureSockJsGlobalShim()

    expect(scope.global).toBe(globalThis)
    scope.global = original
  })

  it("leaves an existing `global` alone", () => {
    const scope = globalThis as unknown as { global?: unknown }
    const original = scope.global
    const sentinel = { marker: "existing" }
    scope.global = sentinel

    ensureSockJsGlobalShim()

    expect(scope.global).toBe(sentinel)
    scope.global = original
  })
})

/* ------------------------------------------------------------------ *
 * Connection setup
 * ------------------------------------------------------------------ */

describe("createNotificationSocket - connect", () => {
  it("sends the bearer token as a native CONNECT header", async () => {
    makeSocket({ getToken: () => "jwt-abc" }).connect()
    await settle()

    const client = lastClient()
    expect(client.conf.connectHeaders).toEqual({ Authorization: "Bearer jwt-abc" })
    expect(client.connectHeaders.Authorization).toBe("Bearer jwt-abc")
    expect(client.activate).toHaveBeenCalledTimes(1)
    expect(client.conf.reconnectDelay).toBe(5_000)
    expect(client.conf.maxReconnectDelay).toBe(60_000)
    expect(client.conf.reconnectTimeMode).toBe(realStomp.ReconnectionTimeMode.EXPONENTIAL)
    expect(client.conf.heartbeatIncoming).toBe(10_000)
    expect(client.conf.heartbeatOutgoing).toBe(10_000)
  })

  it("builds SockJS with the given url and the requested transports", async () => {
    makeSocket({ url: "https://example.test/backend-ws", transports: ["xhr-polling"] }).connect()
    await settle()
    lastClient().openSocket()

    expect(sockJsCalls).toEqual([{ url: "https://example.test/backend-ws", options: { transports: ["xhr-polling"] } }])
  })

  it("passes no SockJS options when transports are omitted", async () => {
    makeSocket({ url: "https://api.example.test/ws", transports: undefined }).connect()
    await settle()
    lastClient().openSocket()

    expect(sockJsCalls).toEqual([{ url: "https://api.example.test/ws", options: undefined }])
  })

  it("tolerates a sockjs module that exposes the constructor without a `default` wrapper", async () => {
    makeSocket({
      loadSockJs: () => Promise.resolve(FakeSockJs as unknown as { default: SockJsCtor }),
    }).connect()
    await settle()
    lastClient().openSocket()

    expect(sockJsCalls).toHaveLength(1)
  })

  it("never activates while getToken() returns null", async () => {
    const socket = makeSocket({ getToken: () => null })

    socket.connect()
    await settle()

    expect(FakeStompClient.instances).toHaveLength(0)
    expect(socket.isActive()).toBe(false)
  })

  it("creates a single client when connect() is called twice (StrictMode double mount)", async () => {
    const socket = makeSocket()

    socket.connect()
    socket.connect()
    await settle()
    socket.connect()
    await settle()

    expect(FakeStompClient.instances).toHaveLength(1)
    expect(lastClient().activate).toHaveBeenCalledTimes(1)
  })

  it("reports isActive() from the underlying client", async () => {
    const socket = makeSocket()
    expect(socket.isActive()).toBe(false)

    socket.connect()
    await settle()
    expect(socket.isActive()).toBe(true)

    await socket.disconnect()
    expect(socket.isActive()).toBe(false)
  })
})

/* ------------------------------------------------------------------ *
 * Messages
 * ------------------------------------------------------------------ */

describe("createNotificationSocket - messages", () => {
  it("subscribes to the user queue and hands parsed JSON to onMessage", async () => {
    const onMessage = vi.fn()
    const onConnected = vi.fn()
    makeSocket({ onMessage, onConnected }).connect()
    await settle()

    const client = lastClient()
    client.fireConnect()

    expect(onConnected).toHaveBeenCalledTimes(1)
    expect(client.subscribe).toHaveBeenCalledTimes(1)
    expect(client.subscriptions[0]!.destination).toBe(NOTIFICATIONS_QUEUE_DESTINATION)
    expect(NOTIFICATIONS_QUEUE_DESTINATION).toBe("/user/queue/notifications")

    client.deliver('{"id":7,"title":"New order"}')
    expect(onMessage).toHaveBeenCalledWith({ id: 7, title: "New order" })
  })

  it("honours a custom destination", async () => {
    makeSocket({ destination: "/topic/broadcast" }).connect()
    await settle()

    const client = lastClient()
    client.fireConnect()

    expect(client.subscriptions[0]!.destination).toBe("/topic/broadcast")
  })

  it("ignores a malformed payload instead of throwing", async () => {
    const onMessage = vi.fn()
    makeSocket({ onMessage }).connect()
    await settle()

    const client = lastClient()
    client.fireConnect()

    expect(() => client.deliver("not json")).not.toThrow()
    expect(onMessage).not.toHaveBeenCalled()
  })
})

/* ------------------------------------------------------------------ *
 * Auth rejection vs. transport failure
 * ------------------------------------------------------------------ */

describe("createNotificationSocket - auth rejection", () => {
  it("treats an ERROR frame before CONNECTED as an auth rejection and stops reconnecting", async () => {
    const onAuthError = vi.fn()
    const socket = makeSocket({ onAuthError })
    socket.connect()
    await settle()

    const client = lastClient()
    client.fireStompError("Invalid JWT token")
    client.fireWebSocketClose()

    expect(client.reconnectDelay).toBe(0)
    expect(client.deactivate).toHaveBeenCalledTimes(1)
    expect(onAuthError).toHaveBeenCalledWith("Invalid JWT token")

    // The instance is dead: reconnecting with the same rejected token would spin.
    socket.connect()
    await settle()
    expect(FakeStompClient.instances).toHaveLength(1)
  })

  it("falls back to a generic reason when the ERROR frame carries no message header", async () => {
    const onAuthError = vi.fn()
    makeSocket({ onAuthError }).connect()
    await settle()

    lastClient().fireStompError()

    expect(onAuthError).toHaveBeenCalledWith("STOMP error")
  })

  it("leaves reconnection to stompjs for an ERROR frame after CONNECTED", async () => {
    const onAuthError = vi.fn()
    makeSocket({ onAuthError }).connect()
    await settle()

    const client = lastClient()
    client.fireConnect()
    client.fireStompError("queue does not exist")

    expect(onAuthError).not.toHaveBeenCalled()
    expect(client.deactivate).not.toHaveBeenCalled()
    expect(client.reconnectDelay).toBe(5_000)
  })

  it("does not deactivate when the socket closes without an ERROR frame", async () => {
    const onAuthError = vi.fn()
    makeSocket({ onAuthError }).connect()
    await settle()

    const client = lastClient()
    client.fireConnect()
    client.fireWebSocketClose()

    expect(client.deactivate).not.toHaveBeenCalled()
    expect(onAuthError).not.toHaveBeenCalled()
    expect(client.reconnectDelay).toBe(5_000)
  })

  it("classifies an ERROR on a later reconnect attempt as an auth rejection too", async () => {
    const onAuthError = vi.fn()
    makeSocket({ onAuthError }).connect()
    await settle()

    const client = lastClient()
    // First activation succeeds, then the transport drops and stompjs backs off and retries.
    client.fireConnect()
    client.fireWebSocketClose()
    client.fireBeforeConnect()
    // The token expired while we were away: the retry CONNECT is refused.
    client.fireStompError("Token expired")

    expect(onAuthError).toHaveBeenCalledWith("Token expired")
    expect(client.deactivate).toHaveBeenCalledTimes(1)
    expect(client.reconnectDelay).toBe(0)
  })
})

/* ------------------------------------------------------------------ *
 * beforeConnect token refresh
 * ------------------------------------------------------------------ */

describe("createNotificationSocket - beforeConnect", () => {
  it("re-reads the token on every reconnect attempt", async () => {
    let token: string | null = "jwt-old"
    makeSocket({ getToken: () => token }).connect()
    await settle()

    const client = lastClient()
    expect(client.connectHeaders.Authorization).toBe("Bearer jwt-old")

    token = "jwt-new"
    client.fireBeforeConnect()

    expect(client.connectHeaders.Authorization).toBe("Bearer jwt-new")
    expect(client.deactivate).not.toHaveBeenCalled()
  })

  it("stops the reconnect loop when the token disappears (logout)", async () => {
    let token: string | null = "jwt-old"
    makeSocket({ getToken: () => token }).connect()
    await settle()

    const client = lastClient()
    token = null
    client.fireBeforeConnect()

    expect(client.reconnectDelay).toBe(0)
    expect(client.deactivate).toHaveBeenCalledTimes(1)
    expect(client.connectHeaders.Authorization).toBe("Bearer jwt-old")
  })
})

/* ------------------------------------------------------------------ *
 * Teardown
 * ------------------------------------------------------------------ */

describe("createNotificationSocket - disconnect", () => {
  it("never activates when disconnect() lands before the dynamic imports resolve", async () => {
    const socket = makeSocket()

    socket.connect()
    await socket.disconnect()
    await settle()

    expect(FakeStompClient.instances).toHaveLength(0)
    expect(socket.isActive()).toBe(false)
  })

  it("kills the reconnect loop and deactivates", async () => {
    const socket = makeSocket()
    socket.connect()
    await settle()

    await socket.disconnect()

    const client = lastClient()
    expect(client.reconnectDelay).toBe(0)
    expect(client.deactivate).toHaveBeenCalled()
  })

  it("is safe to call twice and keeps connect() a no-op afterwards", async () => {
    const socket = makeSocket()
    socket.connect()
    await settle()

    await socket.disconnect()
    await expect(socket.disconnect()).resolves.toBeUndefined()

    socket.connect()
    await settle()
    expect(FakeStompClient.instances).toHaveLength(1)
  })
})

/* ------------------------------------------------------------------ *
 * Contract check against the real stompjs Client
 * ------------------------------------------------------------------ */

describe("createNotificationSocket - real @stomp/stompjs Client", () => {
  it("accepts our config object and calls the webSocketFactory on activate()", async () => {
    const sockets: FakeSockJs[] = []
    class TrackedSockJs extends FakeSockJs {
      constructor(url: string, reserved?: unknown, options?: unknown) {
        super(url, reserved, options)
        sockets.push(this)
      }
    }

    const socket = createNotificationSocket({
      url: "https://example.test/backend-ws",
      transports: ["xhr-polling"],
      getToken: () => "jwt-real",
      onMessage: vi.fn(),
      // Default loadStomp: the real Client class.
      loadSockJs: () => Promise.resolve({ default: TrackedSockJs as unknown as SockJsCtor }),
    })

    socket.connect()
    await vi.waitFor(() => expect(sockets).toHaveLength(1))

    expect(sockets[0]!.url).toBe("https://example.test/backend-ws")
    expect(sockJsCalls.at(-1)?.options).toEqual({ transports: ["xhr-polling"] })
    expect(socket.isActive()).toBe(true)

    await socket.disconnect()
    expect(socket.isActive()).toBe(false)
  })
})
