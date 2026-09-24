import { onlineManager, QueryClientProvider, useMutation } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { __setBrowserQueryClient, getQueryClient, makeQueryClient, shouldRetryQuery } from "./query-client"

const authHandled401 = () => Object.assign(new Error("Unauthorized"), { authHandled: true, response: { status: 401 } })
const statusError = (status: number) => ({ response: { status } })
const networkError = () => new Error("Network Error")

describe("shouldRetryQuery", () => {
  it("never retries an authHandled error (the interceptor already logged the user out)", () => {
    expect(shouldRetryQuery(0, authHandled401())).toBe(false)
  })

  it.each([400, 401, 403, 404, 409, 422])("never retries a %i response - the server already answered", (status) => {
    expect(shouldRetryQuery(0, statusError(status))).toBe(false)
  })

  it("retries a 500 exactly once", () => {
    expect(shouldRetryQuery(0, statusError(500))).toBe(true)
    expect(shouldRetryQuery(1, statusError(500))).toBe(false)
  })

  it("retries a network error (no status at all) exactly once", () => {
    expect(shouldRetryQuery(0, networkError())).toBe(true)
    expect(shouldRetryQuery(1, networkError())).toBe(false)
  })
})

describe("makeQueryClient", () => {
  it("wires shouldRetryQuery and the money-safe defaults into queries", () => {
    const client = makeQueryClient()
    const queries = client.getDefaultOptions().queries

    expect(queries?.retry).toBe(shouldRetryQuery)
    expect(queries?.staleTime).toBe(30_000)
    expect(queries?.gcTime).toBe(5 * 60_000)
    expect(queries?.refetchOnWindowFocus).toBe(false)
    expect(queries?.networkMode).toBe("always")
  })

  it("never retries mutations and keeps them on networkMode 'always'", () => {
    const client = makeQueryClient()
    const mutations = client.getDefaultOptions().mutations

    expect(mutations?.retry).toBe(false)
    expect(mutations?.networkMode).toBe("always")
  })

  it("returns a brand new client on every call", () => {
    expect(makeQueryClient()).not.toBe(makeQueryClient())
  })
})

describe("networkMode: 'always' - offline mutation behaviour", () => {
  afterEach(() => {
    onlineManager.setOnline(true)
  })

  it("runs a mutation immediately while offline instead of pausing it for reconnect", async () => {
    const client = makeQueryClient()
    const mutationFn = vi.fn(async (): Promise<string> => "ok")
    onlineManager.setOnline(false)

    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children)
    const { result } = renderHook(() => useMutation({ mutationFn }), { wrapper })

    result.current.mutate()

    await waitFor(() => expect(mutationFn).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // v5's default "online" networkMode would leave this mutation paused (isPaused: true)
    // until the browser comes back online; "always" must never pause it.
    expect(result.current.isPaused).toBe(false)
  })
})

describe("getQueryClient - browser singleton", () => {
  afterEach(() => {
    __setBrowserQueryClient(undefined)
  })

  it("returns the same instance across calls in the browser", () => {
    expect(getQueryClient()).toBe(getQueryClient())
  })

  it("lets __setBrowserQueryClient install a specific client as the singleton", () => {
    const injected = makeQueryClient()
    __setBrowserQueryClient(injected)

    expect(getQueryClient()).toBe(injected)
  })

  it("lazily creates a fresh client after __setBrowserQueryClient(undefined)", () => {
    const first = getQueryClient()
    __setBrowserQueryClient(undefined)
    const second = getQueryClient()

    expect(second).not.toBe(first)
  })
})

describe("getQueryClient - server path", () => {
  afterEach(() => {
    vi.doUnmock("@tanstack/react-query")
    vi.resetModules()
  })

  it("returns a fresh client per call when isServer is true, so one request can never share another's cache", async () => {
    vi.resetModules()
    vi.doMock("@tanstack/react-query", async () => {
      const actual = await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query")
      return { ...actual, isServer: true }
    })

    const serverModule = await import("./query-client")
    const a = serverModule.getQueryClient()
    const b = serverModule.getQueryClient()

    expect(a).not.toBe(b)
  })
})
