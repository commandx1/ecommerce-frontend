"use client"

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"
import { Line } from "react-chartjs-2"

// Union of what the vendor line charts use. Registration is global, and `Filler` only acts on
// datasets that set `fill`, so charts that don't are unaffected.
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

/** Only ever loaded through `LazyLineChart`, so chart.js stays out of the route's first-load JS. */
export default Line
