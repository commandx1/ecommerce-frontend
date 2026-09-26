"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { showToast } from "@/components/ui/Toast"
import { parseOrderIdParam } from "@/lib/api/orders"
import {
  createNotificationSocket,
  resolveNotificationSocketUrl,
  resolveSockJsTransports,
} from "@/lib/realtime/stomp-client"
import { useAuthStore } from "@/stores/authStore"
import { notificationsKeys } from "../lib/notifications-keys"
import { getOrderInvalidationKeys, isOrderRelatedPush } from "../lib/order-invalidation"
import { isNotificationPushPayload } from "../lib/push-payload"
import { getDashboardRole, resolveNotificationHref } from "../lib/resolve-notification-href"
import { useMarkNotificationRead } from "./useNotificationMutations"

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
 * 3. `latestRef` (role, `router.push`, mark-as-read) is read imperatively inside `onMessage` for
 *    the same reason as `getToken`: none of the three belong in the effect's dependency array,
 *    since a role/router/mutation-identity change must not tear down and reconnect the socket.
 *
 * Deliberately free of `@/app/*` imports: both dashboard layouts mount it through
 * `NotificationSocketBridge`, and neither may leak into the feature module.
 */
export function useNotificationSocket(): void {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)
  const role = useAuthStore((state) => getDashboardRole(state.user?.roleName))
  const queryClient = useQueryClient()
  const router = useRouter()
  const markNotificationRead = useMarkNotificationRead()
  const rejectedTokenRef = useRef<string | null>(null)

  const latestRef = useRef({ role, push: router.push, markAsRead: markNotificationRead.mutate })
  latestRef.current = { role, push: router.push, markAsRead: markNotificationRead.mutate }

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
        // Only order-related pushes get a "go to the order" click, exactly like the menu item:
        // without a resolvable orderId the toast stays informational, same as before.
        const orderId = parseOrderIdParam(body.orderId)
        if (orderId) {
          showToast.info(body.title, body.message, {
            onClick: () => {
              const { role: currentRole, push, markAsRead } = latestRef.current
              markAsRead(body.notificationId)
              push(resolveNotificationHref(body, currentRole))
            },
          })
        } else {
          showToast.info(body.title, body.message)
        }
        void queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
        if (isOrderRelatedPush({ type: body.type, orderId })) {
          for (const queryKey of getOrderInvalidationKeys(latestRef.current.role)) {
            void queryClient.invalidateQueries({ queryKey })
          }
        }
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
