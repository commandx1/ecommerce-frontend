import { describe, expect, it } from "vitest"
import { queryKeys } from "./keys"

describe("queryKeys.vendor", () => {
  const vendorKeyEntries: Array<[string, readonly unknown[]]> = [
    ["overview.all", queryKeys.vendor.overview.all],
    ["overview.revenueSummary(30)", queryKeys.vendor.overview.revenueSummary(30)],
    ["overview.reviewSummary()", queryKeys.vendor.overview.reviewSummary()],
    ["overview.periodicRevenue({})", queryKeys.vendor.overview.periodicRevenue({})],
    [
      "overview.topSelling(...)",
      queryKeys.vendor.overview.topSelling({ page: 0, size: 4, daysFromNow: 30, sortDir: "desc" }),
    ],
    ["overview.stockSummary(...)", queryKeys.vendor.overview.stockSummary({ page: 0, size: 3 })],
    ["overview.geo({})", queryKeys.vendor.overview.geo({})],
    ["products.all", queryKeys.vendor.products.all],
    ["products.lists()", queryKeys.vendor.products.lists()],
    [
      "products.list(...)",
      queryKeys.vendor.products.list({
        view: "active",
        type: "TOTAL",
        page: 0,
        size: 10,
        sortBy: null,
        sortDir: null,
        search: "",
        howManySoldDay: null,
        userProductId: null,
        brand: null,
      }),
    ],
    ["products.stats()", queryKeys.vendor.products.stats()],
    ["products.brands()", queryKeys.vendor.products.brands()],
    ["products.detail('abc')", queryKeys.vendor.products.detail("abc")],
    ["documents.all", queryKeys.vendor.documents.all],
    ["documents.list(0)", queryKeys.vendor.documents.list(0)],
    ["documents.products('doc-1')", queryKeys.vendor.documents.products("doc-1")],
    ["orders.all", queryKeys.vendor.orders.all],
    [
      "orders.list(...)",
      queryKeys.vendor.orders.list({
        page: 0,
        size: 10,
        sortBy: null,
        sortDir: null,
        type: "ALL",
        orderId: null,
      }),
    ],
    ["questions.all", queryKeys.vendor.questions.all],
    ["questions.list(...)", queryKeys.vendor.questions.list({ page: 0, size: 10, filter: "all" })],
    ["questions.counts()", queryKeys.vendor.questions.counts()],
    ["reviews.all", queryKeys.vendor.reviews.all],
    ["reviews.dashboard()", queryKeys.vendor.reviews.dashboard()],
  ]

  it.each(vendorKeyEntries)("%s starts with the shared ['vendor'] prefix", (_label, key) => {
    expect(key[0]).toBe("vendor")
  })

  it("products.lists/list/stats/brands/detail all prefix under products.all", () => {
    const prefix = queryKeys.vendor.products.all
    expect(queryKeys.vendor.products.lists().slice(0, prefix.length)).toEqual([...prefix])
    expect(
      queryKeys.vendor.products
        .list({
          view: "review",
          approved: "ALL",
          sortBy: "createdDate",
          sortDir: "desc",
          page: 0,
          size: 100,
        })
        .slice(0, prefix.length),
    ).toEqual([...prefix])
    expect(queryKeys.vendor.products.stats().slice(0, prefix.length)).toEqual([...prefix])
    expect(queryKeys.vendor.products.brands().slice(0, prefix.length)).toEqual([...prefix])
    expect(queryKeys.vendor.products.detail("id-1").slice(0, prefix.length)).toEqual([...prefix])
  })

  it("products.list stays under products.lists() (list scope) so a bulk invalidation of lists() covers every param variant", () => {
    const listsPrefix = queryKeys.vendor.products.lists()
    const specificList = queryKeys.vendor.products.list({
      view: "active",
      type: "ACTIVE",
      page: 0,
      size: 10,
      sortBy: null,
      sortDir: null,
      search: "",
      howManySoldDay: null,
      userProductId: null,
      brand: null,
    })
    expect(specificList.slice(0, listsPrefix.length)).toEqual([...listsPrefix])
  })

  it("normalizes overview.periodicRevenue so omitted and explicit-undefined params produce the same key", () => {
    expect(queryKeys.vendor.overview.periodicRevenue({})).toEqual(
      queryKeys.vendor.overview.periodicRevenue({ months: undefined, year: undefined }),
    )
    expect(queryKeys.vendor.overview.periodicRevenue({ months: 6 })).not.toEqual(
      queryKeys.vendor.overview.periodicRevenue({}),
    )
  })

  it("normalizes overview.geo so omitted and explicit-undefined daysFromNow produce the same key", () => {
    expect(queryKeys.vendor.overview.geo({})).toEqual(queryKeys.vendor.overview.geo({ daysFromNow: undefined }))
    expect(queryKeys.vendor.overview.geo({ daysFromNow: 30 })).not.toEqual(queryKeys.vendor.overview.geo({}))
  })

  it("documents.list(page) is distinct per page and documents.all is the shared invalidation prefix", () => {
    expect(queryKeys.vendor.documents.list(0)).not.toEqual(queryKeys.vendor.documents.list(1))
    expect(queryKeys.vendor.documents.list(0).slice(0, queryKeys.vendor.documents.all.length)).toEqual([
      ...queryKeys.vendor.documents.all,
    ])
  })
})
