import { revalidateCategoryCounts } from "./revalidate-category-counts"

/**
 * Client-side fire-and-forget wrapper around the `revalidateCategoryCounts` server action.
 *
 * Calling a "use server" action from the client returns a promise for the WHOLE round trip - the
 * network request that carries the call to the server, not just the code that runs once it gets
 * there. The action itself already swallows every error that happens once it starts running (see
 * its own try/catch), but a request that never arrives at all (offline, a dropped connection, a
 * proxy hiccup) rejects that outer promise before any of that runs. Every caller here used
 * `void revalidateCategoryCounts()` to keep the purge fire-and-forget, so a network failure had
 * nowhere to go and surfaced as an unhandled promise rejection in the browser console - this is
 * the one place that catches it instead, so a vendor's already-succeeded save/delete/import is
 * never affected by it either way.
 */
export function requestCategoryCountsPurge(): void {
  revalidateCategoryCounts().catch((error: unknown) => {
    console.warn("Category counts purge request failed; counts may be stale until the next periodic refresh.", error)
  })
}
