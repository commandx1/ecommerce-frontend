"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"
import type { Line } from "react-chartjs-2"

const loadLineChart = () => import("./LineChart")

// Start fetching the chart chunk as soon as a chart-bearing page's JS runs, in parallel with the
// chart's data query, instead of waiting for the first render that needs it: the chunk is off the
// hydration path but normally ready before the data is.
if (typeof window !== "undefined") {
  void loadLineChart()
}

/**
 * `react-chartjs-2`'s `Line` with chart.js (~66 KB gzip) split out of the route's first-load JS.
 * `ssr: false` changes nothing visible: a chart is a <canvas> painted client-side anyway, and every
 * caller wraps it in a fixed-height box, so the empty `loading` state occupies the same space the
 * blank canvas did.
 */
const LazyLineChart = dynamic<ComponentProps<typeof Line>>(loadLineChart, { ssr: false, loading: () => null })

export default LazyLineChart
