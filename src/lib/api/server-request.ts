const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8081"

export async function serverRequest(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, init)
}
