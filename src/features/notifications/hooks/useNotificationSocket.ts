"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { showToast } from "@/components/ui/Toast"
import {
  createNotificationSocket,
  resolveNotificationSocketUrl,
  resolveSockJsTransports,
} from "@/lib/realtime/stomp-client"
import { useAuthStore } from "@/stores/authStore"
import { notificationsKeys } from "../lib/notifications-keys"
import { isNotificationPushPayload } from "../lib/push-payload"

/**
 * Owns the lifecycle of the notification STOMP socket: one live socket per (authenticated,
 * access token) pair, torn down on logout, token rotation and unmount.
 *
 * Two details are load-bearing:
 *
 * 1. `getToken` reads the store imperatively instead of closing over `accessToken`. The socket
 *    re-reads it before *every* CONNECT (see `beforeConnect` in `stomp-client.ts`), so a token
 *    refreshed mid-reconnect is picked up without recreating the socket.
 * 2. `rejectedTokenRef` remembers the exact token the server refused. Without it, the effect
 *    would rebuild the socket on the next dependency change and hand the backend the same dead
 *    token again; `stomp-client` deliberately stays dead after an auth rejection, so the retry
 *    has to be gated here, on a genuinely new token.
 *
 * Deliberately free of `@/app/*` imports: both dashboard layouts mount it through
 * `NotificationSocketBridge`, and neither may leak into the feature module.
 */
export function useNotificationSocket(): void {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)
  const queryClient = useQueryClient()
  const rejectedTokenRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return
    }
    // The server already refused this exact token; wait for a new one.
    if (rejectedTokenRef.current === accessToken) {
      return
    }

    const socket = createNotificationSocket({
      url: resolveNotificationSocketUrl(),
      transports: resolveSockJsTransports(),
      getToken: () => useAuthStore.getState().accessToken,
      onMessage: (body) => {
        if (!isNotificationPushPayload(body)) {
          return
        }
        showToast.info(body.title, body.message)
        void queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
      },
      onAuthError: () => {
        rejectedTokenRef.current = accessToken
      },
    })

    socket.connect()

    return () => {
      void socket.disconnect()
    }
  }, [isAuthenticated, accessToken, queryClient])
}
