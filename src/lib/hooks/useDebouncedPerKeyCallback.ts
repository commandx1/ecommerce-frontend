"use client"

import { useCallback, useEffect, useRef } from "react"

interface DebouncedPerKeyContext<TKey extends string> {
  key: TKey
  isLatest: () => boolean
}

interface UseDebouncedPerKeyCallbackOptions<TKey extends string, TPayload> {
  delayMs: number
  callback: (payload: TPayload, context: DebouncedPerKeyContext<TKey>) => void | Promise<void>
}

interface UseDebouncedPerKeyCallbackResult<TKey extends string, TPayload> {
  schedule: (key: TKey, payload: TPayload) => void
  cancel: (key: TKey) => void
  cancelAll: () => void
}

export function useDebouncedPerKeyCallback<TKey extends string, TPayload>({
  delayMs,
  callback,
}: UseDebouncedPerKeyCallbackOptions<TKey, TPayload>): UseDebouncedPerKeyCallbackResult<TKey, TPayload> {
  const callbackRef = useRef(callback)
  const timersRef = useRef<Map<TKey, ReturnType<typeof setTimeout>>>(new Map())
  const versionsRef = useRef<Map<TKey, number>>(new Map())

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const cancel = useCallback((key: TKey) => {
    const timeoutId = timersRef.current.get(key)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timersRef.current.delete(key)
    }
  }, [])

  const cancelAll = useCallback(() => {
    for (const timeoutId of timersRef.current.values()) {
      clearTimeout(timeoutId)
    }
    timersRef.current.clear()
  }, [])

  useEffect(() => {
    return () => {
      for (const timeoutId of timersRef.current.values()) {
        clearTimeout(timeoutId)
      }
      timersRef.current.clear()
    }
  }, [])

  const schedule = useCallback(
    (key: TKey, payload: TPayload) => {
      const existingTimeout = timersRef.current.get(key)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      const version = (versionsRef.current.get(key) ?? 0) + 1
      versionsRef.current.set(key, version)

      const timeoutId = setTimeout(() => {
        timersRef.current.delete(key)
        void callbackRef.current(payload, {
          key,
          isLatest: () => versionsRef.current.get(key) === version,
        })
      }, delayMs)

      timersRef.current.set(key, timeoutId)
    },
    [delayMs],
  )

  return {
    schedule,
    cancel,
    cancelAll,
  }
}
