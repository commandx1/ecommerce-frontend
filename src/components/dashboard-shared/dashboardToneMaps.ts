export const STATUS_TONE_CLASS_MAP = {
  success: "bg-success/14 text-success border-success/15",
  info: "bg-brand/14 text-brand-strong border-brand/15",
  warning: "bg-warning/14 text-warning-strong border-warning/15",
  danger: "bg-danger/12 text-danger-strong border-danger/15",
  neutral: "bg-(--glass-tile) text-text-secondary border-border-soft",
} as const

export const DOT_TONE_CLASS_MAP = {
  success: "bg-success",
  info: "bg-brand",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-text-muted",
} as const

export const RING_TONE_CLASS_MAP = {
  success: "bg-success/10 border-success/15",
  info: "bg-brand/10 border-brand/15",
  warning: "bg-warning/10 border-warning/15",
  danger: "bg-danger/10 border-danger/15",
  neutral: "bg-(--glass-tile) border-border-soft",
} as const
