/**
 * Framework-free STOMP-over-SockJS client for in-app notifications.
 *
 * Deliberately free of React, stores and feature modules: the only way in is
 * `createNotificationSocket`, so the hook layer can own the lifecycle while this file owns the
 * protocol semantics (auth rejection, reconnect, import ordering).
 *
 * ## Why the loaders are dynamic
 *
 * `sockjs-client@1.6.1` touches the bare identifier `global` while the module body is evaluated
 * (`lib/location.js`, `lib/utils/browser-crypto.js`). In a browser bundle produced by Turbopack
 * there is no `global`, so a *static* import would throw `ReferenceError: global is not defined`
 * before a single line of this module runs. `ensureSockJsGlobalShim()` therefore has to execute
 * BEFORE the module is evaluated, which is only possible if sockjs-client is pulled in through
 * `import()` after the shim. Do not turn `loadSockJs` into a top-level import.
 *
 * ## Auth rejection vs. transport failure
 *
 * The backend rejects a missing/invalid/expired JWT by throwing while handling CONNECT. On the
 * wire that is an ERROR frame *before* CONNECTED, followed by the transport closing. stompjs
 * cannot tell that apart from a broker hiccup and would retry forever with the same dead token,
 * so we classify it here: an ERROR frame that arrives before the current activation saw CONNECTED
 * is an auth rejection -> stop reconnecting, tell the caller, and stay dead. Anything else
 * (socket close, ERROR after CONNECTED) is left to stompjs' own exponential backoff.
 */
import type { Client, IFrame, IMessage, StompConfig } from "@stomp/stompjs"

export const NOTIFICATIONS_QUEUE_DESTINATION = "/user/queue/notifications"

const DEFAULT_RECONNECT_DELAY_MS = 5_000
const DEFAULT_MAX_RECONNECT_DELAY_MS = 60_000
const HEARTBEAT_MS = 10_000
/**
 * Next rewrite -> backend `/ws`. A rewrite cannot proxy a WebSocket Upgrade, and Next's own
 * response compression (`compress: true`) gzips the proxied stream, so `xhr-streaming` frames sit
 * in the gzip buffer and never reach the browser (verified 13 Sep 2026: 40 bytes in 4 s via the
 * proxy vs. the full prelude direct). Long-polling completes each response, so it is the only
 * transport that works through the rewrite.
 */
const PROXY_WS_PATH = "/backend-ws"
const PROXY_TRANSPORTS = ["xhr-polling"]

type StompModule = typeof import("@stomp/stompjs")
type SockJsConstructor = typeof import("sockjs-client")
type SockJsModule = { default: SockJsConstructor }

export interface NotificationSocketOptions {
  /** Absolute URL of the SockJS endpoint; SockJS rejects relative URLs. */
  url: string
  /** `undefined` keeps the SockJS defaults (websocket first). */
  transports?: string[]
  getToken: () => string | null
  /** Receives the parsed JSON body; validating its shape is the caller's job. */
  onMessage: (body: unknown) => void
  onAuthError?: (reason: string) => void
  onConnected?: () => void
  destination?: string
  reconnectDelayMs?: number
  maxReconnectDelayMs?: number
  /** Test seam. */
  loadStomp?: () => Promise<StompModule>
  /** Test seam. */
  loadSockJs?: () => Promise<SockJsModule>
}

export interface NotificationSocket {
  connect(): void
  disconnect(): Promise<void>
  isActive(): boolean
}

/**
 * Gives sockjs-client the `global` it expects. Must run before sockjs-client is evaluated.
 * Idempotent, and never clobbers an existing `global` (Node, jsdom, a polyfill someone else set).
 */
export function ensureSockJsGlobalShim(): void {
  const scope = globalThis as typeof globalThis & { global?: unknown }
  if (typeof scope.global === "undefined") {
    scope.global = globalThis
  }
}

/**
 * `NEXT_PUBLIC_WS_URL` is inlined at build time, so it must be read as a full property access.
 * Falls back to the same-origin Next rewrite, which works without any extra deployment config.
 */
export function resolveNotificationSocketUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL
  if (configured) {
    return `${configured.replace(/\/+$/, "")}/ws`
  }
  return `${window.location.origin}${PROXY_WS_PATH}`
}

/** Only the rewrite path needs the xhr-only restriction; a direct backend URL can upgrade. */
export function resolveSockJsTransports(): string[] | undefined {
  return process.env.NEXT_PUBLIC_WS_URL ? undefined : [...PROXY_TRANSPORTS]
}

/** Turbopack/Vite wrap sockjs-client's CommonJS export in `default`; a raw CJS require would not. */
function resolveSockJsConstructor(mod: SockJsModule): SockJsConstructor {
  return typeof mod.default === "function" ? mod.default : (mod as unknown as SockJsConstructor)
}

export function createNotificationSocket(options: NotificationSocketOptions): NotificationSocket {
  const {
    url,
    transports,
    getToken,
    onMessage,
    onAuthError,
    onConnected,
    destination = NOTIFICATIONS_QUEUE_DESTINATION,
    reconnectDelayMs = DEFAULT_RECONNECT_DELAY_MS,
    maxReconnectDelayMs = DEFAULT_MAX_RECONNECT_DELAY_MS,
    loadStomp = () => import("@stomp/stompjs"),
    loadSockJs = () => import("sockjs-client"),
  } = options

  let client: Client | null = null
  /** A `connect()` is in flight (imports pending); keeps StrictMode's second mount a no-op. */
  let starting = false
  /** `disconnect()` was called; this instance is done for good. */
  let disposed = false
  /** The server refused our token; retrying with the same instance is pointless. */
  let authRejected = false
  /** Did the *current* activation reach CONNECTED? Reset on every (re)connect attempt. */
  let connectedThisActivation = false

  const buildConfig = (stomp: StompModule, SockJs: SockJsConstructor, token: string): StompConfig => ({
    webSocketFactory: () => new SockJs(url, null, transports ? { transports } : undefined),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: reconnectDelayMs,
    reconnectTimeMode: stomp.ReconnectionTimeMode.EXPONENTIAL,
    maxReconnectDelay: maxReconnectDelayMs,
    heartbeatIncoming: HEARTBEAT_MS,
    heartbeatOutgoing: HEARTBEAT_MS,
    // No logging anywhere in this module; stompjs debug output is chatty and carries the token.
    debug: () => undefined,

    // Runs before every CONNECT, including each reconnect attempt, so the token is always fresh.
    beforeConnect: (active: Client) => {
      connectedThisActivation = false
      const nextToken = getToken()
      if (!nextToken) {
        active.reconnectDelay = 0
        void active.deactivate()
        return
      }
      active.connectHeaders = { Authorization: `Bearer ${nextToken}` }
    },

    onConnect: () => {
      connectedThisActivation = true
      onConnected?.()
      client?.subscribe(destination, (message: IMessage) => {
        try {
          onMessage(JSON.parse(message.body))
        } catch {
          // Malformed payload: drop it rather than kill the subscription.
        }
      })
    },

    onStompError: (frame: IFrame) => {
      if (connectedThisActivation) {
        // Broker-side error on a live session: stompjs' backoff can handle the reconnect.
        return
      }
      authRejected = true
      if (client) {
        client.reconnectDelay = 0
        void client.deactivate()
      }
      onAuthError?.(frame?.headers?.message ?? "STOMP error")
    },

    // Transport died without an ERROR frame (backend down, 404 on /info, network drop).
    // stompjs already retries with exponential backoff, so there is nothing to do here.
    onWebSocketClose: () => undefined,
    onWebSocketError: () => undefined,
  })

  const start = async (): Promise<void> => {
    try {
      ensureSockJsGlobalShim()
      const [stomp, sockJsModule] = await Promise.all([loadStomp(), loadSockJs()])
      // StrictMode mounts, unmounts and remounts: the cleanup can land while the imports are
      // still pending. Creating a client now would leak a socket nobody can close.
      if (disposed) {
        return
      }
      const token = getToken()
      if (!token) {
        // Not signed in yet. Stay idle; a later connect() can try again.
        return
      }
      const created = new stomp.Client(buildConfig(stomp, resolveSockJsConstructor(sockJsModule), token))
      client = created
      created.activate()
    } catch {
      // Import or construction failed. There is no logging channel here, and retrying on a
      // broken bundle would spin, so the socket simply stays idle.
    } finally {
      starting = false
    }
  }

  return {
    connect(): void {
      if (disposed || authRejected || starting || client) {
        return
      }
      starting = true
      void start()
    },

    disconnect(): Promise<void> {
      disposed = true
      if (!client) {
        return Promise.resolve()
      }
      client.reconnectDelay = 0
      return client.deactivate()
    },

    isActive(): boolean {
      return client?.active === true
    },
  }
}
