"use client"

import { useNotificationSocket } from "../hooks/useNotificationSocket"

/**
 * Headless mount point for the notification socket.
 *
 * Rendering the hook in its own component keeps the socket's lifecycle tied to the authenticated
 * dashboard shell without re-rendering that shell on every store change: the subscriptions in
 * `useNotificationSocket` live here, not in the layout.
 */
export default function NotificationSocketBridge() {
  useNotificationSocket()
  return null
}
