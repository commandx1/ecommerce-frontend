export type ProductRequestMethod = "GET" | "PUT" | "DELETE"

export type ProductRouteContext = {
  params: Promise<{ id: string }>
}
