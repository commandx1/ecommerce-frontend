"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useAuthStore } from "@/stores/authStore"
import {
  geoDistributionOptions,
  periodicRevenueOptions,
  recentOrdersOptions,
  revenueSummaryOptions,
  reviewSummaryOptions,
  stockSummaryOptions,
  topSellingOptions,
} from "../api/overview-queries"
import { buildMetricCards, type MetricCard } from "../lib/build-metric-cards"
import { buildGrowthMarkets } from "../lib/growth-markets"
import { buildRevenueChartSeries } from "../lib/revenue-chart-series"
import { buildStockStatusRows, normalizeCriticalStockAlerts } from "../lib/stock-status-rows"

function useVendorQueryEnabled(): boolean {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)
  return Boolean(isAuthenticated && accessToken)
}

export type MetricsRange = 7 | 30 | 90

export function useVendorMetricsQuery() {
  const enabled = useVendorQueryEnabled()
  const [range, setRange] = useState<MetricsRange>(30)

  const revenueQuery = useQuery(revenueSummaryOptions(range, enabled))
  const reviewQuery = useQuery(reviewSummaryOptions(enabled))

  const isLoading = (revenueQuery.isPending || reviewQuery.isPending) && enabled
  const fetchError = revenueQuery.isError || reviewQuery.isError
  const metrics: MetricCard[] =
    !isLoading && !fetchError && revenueQuery.data && reviewQuery.data
      ? buildMetricCards(revenueQuery.data, reviewQuery.data, range)
      : []

  const refetch = () => {
    void revenueQuery.refetch()
    void reviewQuery.refetch()
  }

  return { range, setRange, isLoading, fetchError, metrics, refetch }
}

export type RevenueRange = 6 | 12 | "all"

export function useRevenueChartQuery() {
  const enabled = useVendorQueryEnabled()
  const [range, setRange] = useState<RevenueRange>(12)

  const query = useQuery(periodicRevenueOptions(range === "all" ? {} : { months: range }, enabled))
  const { labels, values } = buildRevenueChartSeries(query.data?.periods)

  return {
    range,
    setRange,
    isLoading: query.isPending && enabled,
    fetchError: query.isError,
    labels,
    values,
    refetch: () => void query.refetch(),
  }
}

export function useInventoryStatusQuery() {
  const enabled = useVendorQueryEnabled()
  const query = useQuery(stockSummaryOptions({ page: 0, size: 3 }, enabled))

  return {
    isLoading: query.isPending && enabled,
    fetchError: query.isError,
    statusRows: buildStockStatusRows(query.data),
    criticalAlerts: normalizeCriticalStockAlerts(query.data),
    refetch: () => void query.refetch(),
  }
}

export function useTopSellingProductsQuery() {
  const enabled = useVendorQueryEnabled()
  const query = useQuery(topSellingOptions({ page: 0, size: 4, daysFromNow: 30, sortDir: "desc" }, enabled))

  return {
    isLoading: query.isPending && enabled,
    fetchError: query.isError,
    products: Array.isArray(query.data?.content) ? query.data.content : [],
    refetch: () => void query.refetch(),
  }
}

export type GeoRange = 7 | 30 | 90 | "all"

export function useGeographicDistributionQuery() {
  const enabled = useVendorQueryEnabled()
  const [range, setRange] = useState<GeoRange>(30)

  const query = useQuery(geoDistributionOptions(range === "all" ? {} : { daysFromNow: range }, enabled))
  const cities = Array.isArray(query.data?.cities) ? query.data.cities : []

  return {
    range,
    setRange,
    isLoading: query.isPending && enabled,
    fetchError: query.isError,
    cities,
    growthMarkets: buildGrowthMarkets(query.data?.cities),
    refetch: () => void query.refetch(),
  }
}

export function useRecentOrdersQuery() {
  const enabled = useVendorQueryEnabled()
  const query = useQuery(recentOrdersOptions(enabled))

  return {
    isLoading: query.isPending && enabled,
    fetchError: query.isError,
    orders: Array.isArray(query.data?.orders) ? query.data.orders : [],
    refetch: () => void query.refetch(),
  }
}
