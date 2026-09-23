const readThemeVar = (name: string, fallback: string) => {
  if (typeof window === "undefined") {
    return fallback
  }

  const value = getComputedStyle(document.body).getPropertyValue(name).trim()
  return value || fallback
}

export const getVendorChartPalette = () => {
  return {
    brand: readThemeVar("--brand", "#3E6C88"),
    brandStrong: readThemeVar("--brand-strong", "#2B4F67"),
    success: readThemeVar("--success", "#4FA97A"),
    warning: readThemeVar("--warning", "#D9A34A"),
    danger: readThemeVar("--danger", "#D65D4A"),
    textPrimary: readThemeVar("--text-primary", "#27374A"),
    textSecondary: readThemeVar("--text-secondary", "#5B6675"),
    borderSoft: readThemeVar("--border-soft", "#DCE2EA"),
    surfaceMuted: readThemeVar("--surface-muted", "#EEF2F7"),
    surfaceElevated: readThemeVar("--surface-elevated", "#FFFFFF"),
  }
}

export type VendorChartPalette = ReturnType<typeof getVendorChartPalette>

/** Shared chart.js options for dashboard line charts: glass tooltip, hairline y grid, no x grid. */
export const getVendorChartOptions = (palette: VendorChartPalette) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: palette.surfaceElevated,
      borderColor: palette.borderSoft,
      borderWidth: 1,
      titleColor: palette.textPrimary,
      bodyColor: palette.textSecondary,
      padding: 12,
      cornerRadius: 12,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: palette.textSecondary },
    },
    y: {
      grid: { color: palette.borderSoft },
      border: { display: false },
      ticks: { color: palette.textSecondary },
    },
  },
  elements: {
    line: { tension: 0.35, borderWidth: 2.5 },
    point: { radius: 3, hoverRadius: 6, borderWidth: 2 },
  },
})
