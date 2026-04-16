const readThemeVar = (name: string, fallback: string) => {
  if (typeof window === "undefined") {
    return fallback
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
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
  }
}
