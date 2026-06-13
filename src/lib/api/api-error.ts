export type ApiErrorShape = { message?: string; error?: string }

export async function readApiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await response.json()
    if (data && typeof data === "object") {
      const obj = data as ApiErrorShape

      if (typeof obj.message === "string" && obj.message.trim()) return obj.message

      if (typeof obj.error === "string" && obj.error.trim()) {
        // Some endpoints return nested JSON inside "error" string
        if (obj.error.startsWith("{")) {
          try {
            const nested = JSON.parse(obj.error) as ApiErrorShape
            if (typeof nested.message === "string" && nested.message.trim()) return nested.message
            if (typeof nested.error === "string" && nested.error.trim()) return nested.error
          } catch {
            // ignore nested parse
          }
        }
        return obj.error
      }
    }
  } catch {
    // ignore non-json responses
  }

  return fallback
}
