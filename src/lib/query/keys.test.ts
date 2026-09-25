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

// Phase 4 §2.1/K0: the role-neutral keys added for the buyer/shared account surfaces.
describe("queryKeys role-neutral additions (Phase 4 K0)", () => {
  const buyerOrderParams = {
    page: 0,
    size: 10,
    sortBy: "createdDate" as const,
    sortDir: "desc" as const,
    type: "ALL" as const,
    orderId: null,
  }

  it("orders.list(...) stays under orders.lists() which stays under orders.all", () => {
    const list = queryKeys.orders.list(buyerOrderParams)
    const lists = queryKeys.orders.lists()
    const all = queryKeys.orders.all

    expect(lists.slice(0, all.length)).toEqual([...all])
    expect(list.slice(0, lists.length)).toEqual([...lists])
  })

  it("orders.list(...) is distinct per param set (e.g. per tab/page/sort/orderId)", () => {
    expect(queryKeys.orders.list(buyerOrderParams)).not.toEqual(queryKeys.orders.list({ ...buyerOrderParams, page: 1 }))
    expect(queryKeys.orders.list(buyerOrderParams)).not.toEqual(
      queryKeys.orders.list({ ...buyerOrderParams, type: "DELIVERED" }),
    )
    expect(queryKeys.orders.list(buyerOrderParams)).not.toEqual(
      queryKeys.orders.list({ ...buyerOrderParams, orderId: "order-1" }),
    )
  })

  it("autoOrders.list() stays under autoOrders.all", () => {
    expect(queryKeys.autoOrders.list().slice(0, queryKeys.autoOrders.all.length)).toEqual([...queryKeys.autoOrders.all])
  })

  it("paymentMethods.cards() and .checkoutSavedCards() stay under paymentMethods.all but are distinct from each other", () => {
    const all = queryKeys.paymentMethods.all
    expect(queryKeys.paymentMethods.cards().slice(0, all.length)).toEqual([...all])
    expect(queryKeys.paymentMethods.checkoutSavedCards().slice(0, all.length)).toEqual([...all])
    expect(queryKeys.paymentMethods.cards()).not.toEqual(queryKeys.paymentMethods.checkoutSavedCards())
  })

  it("addresses.list() stays under addresses.all (unchanged key, now shared by more readers)", () => {
    expect(queryKeys.addresses.list().slice(0, queryKeys.addresses.all.length)).toEqual([...queryKeys.addresses.all])
  })

  it("company.me() stays under company.all", () => {
    expect(queryKeys.company.me().slice(0, queryKeys.company.all.length)).toEqual([...queryKeys.company.all])
  })

  it("licenses.list() stays under licenses.all", () => {
    expect(queryKeys.licenses.list().slice(0, queryKeys.licenses.all.length)).toEqual([...queryKeys.licenses.all])
  })

  it("vendors.directory(...) stays under vendors.all and is distinct per param set", () => {
    const params = { page: 0, size: 20, sort: null, minRating: null, search: "" }
    const directory = queryKeys.vendors.directory(params)
    expect(directory.slice(0, queryKeys.vendors.all.length)).toEqual([...queryKeys.vendors.all])
    expect(directory).not.toEqual(queryKeys.vendors.directory({ ...params, page: 1 }))
  })

  it("vendors.favorites.{ids,list} stay under vendors.favorites.all, which stays under vendors.all", () => {
    const all = queryKeys.vendors.all
    const favoritesAll = queryKeys.vendors.favorites.all
    expect(favoritesAll.slice(0, all.length)).toEqual([...all])
    expect(queryKeys.vendors.favorites.ids().slice(0, favoritesAll.length)).toEqual([...favoritesAll])
    expect(queryKeys.vendors.favorites.list().slice(0, favoritesAll.length)).toEqual([...favoritesAll])
    expect(queryKeys.vendors.favorites.ids()).not.toEqual(queryKeys.vendors.favorites.list())
  })

  it("favoriteProducts.list() stays under favoriteProducts.all", () => {
    expect(queryKeys.favoriteProducts.list().slice(0, queryKeys.favoriteProducts.all.length)).toEqual([
      ...queryKeys.favoriteProducts.all,
    ])
  })

  it("none of the new top-level keys collide with an existing role-neutral or vendor prefix", () => {
    const prefixes = [
      queryKeys.orders.all[0],
      queryKeys.autoOrders.all[0],
      queryKeys.company.all[0],
      queryKeys.licenses.all[0],
      queryKeys.vendors.all[0],
      queryKeys.favoriteProducts.all[0],
      queryKeys.addresses.all[0],
      queryKeys.paymentMethods.all[0],
      queryKeys.cart.all[0],
      queryKeys.vendor.all[0],
    ]
    expect(new Set(prefixes).size).toBe(prefixes.length)
  })
})
