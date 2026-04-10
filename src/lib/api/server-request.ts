export async function serverRequest(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, init)
}
