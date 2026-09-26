import { Check, Heart, Info, Loader2, TriangleAlert, X } from "lucide-react"
import type React from "react"
import { toast } from "sonner"

type ToastType = "success" | "error" | "warning" | "info" | "love" | "loading"

/** Makes the whole toast body activate a callback (e.g. open the order it's about to). */
export interface ToastClickOptions {
  onClick: () => void
}

type ToastExtra = number | ToastClickOptions

type ToastFn = {
  (message: string, extra?: ToastExtra): void
  (title: string, message: string, extra?: ToastExtra): void
}

interface ToastProps {
  id: string | number
  type: ToastType
  title: string
  message: string
  duration?: number
  onClick?: () => void
}

const toastConfig = {
  success: {
    icon: Check,
    iconWrap: "bg-success/14 text-success",
    progress: "bg-success",
  },
  error: {
    icon: X,
    iconWrap: "bg-danger/14 text-danger",
    progress: "bg-danger",
  },
  warning: {
    icon: TriangleAlert,
    iconWrap: "bg-warning/14 text-warning",
    progress: "bg-warning",
  },
  info: {
    icon: Info,
    iconWrap: "bg-accent text-brand",
    progress: "bg-brand",
  },
  love: {
    icon: Heart,
    iconWrap: "bg-brand/12 text-brand",
    progress: "bg-brand",
  },
  loading: {
    icon: Loader2,
    iconWrap: "bg-brand-surface/14 text-brand",
    progress: "bg-brand-strong",
  },
}

const defaultTitles: Record<ToastType, string> = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
  love: "Love",
  loading: "Loading",
}

const isToastClickOptions = (value: unknown): value is ToastClickOptions =>
  typeof value === "object" && value !== null && typeof (value as ToastClickOptions).onClick === "function"

const resolveToastArgs = (
  type: ToastType,
  titleOrMessage: string,
  messageOrExtra?: string | ToastExtra,
  maybeExtra?: ToastExtra,
) => {
  let title = defaultTitles[type]
  let message = titleOrMessage
  let duration: number | undefined
  let onClick: (() => void) | undefined

  if (typeof messageOrExtra === "string") {
    title = titleOrMessage
    message = messageOrExtra
    if (typeof maybeExtra === "number") {
      duration = maybeExtra
    } else if (isToastClickOptions(maybeExtra)) {
      onClick = maybeExtra.onClick
    }
  } else if (typeof messageOrExtra === "number") {
    duration = messageOrExtra
  } else if (isToastClickOptions(messageOrExtra)) {
    onClick = messageOrExtra.onClick
  }

  return { title, message, duration, onClick }
}

const createToastHandler = (type: ToastType, defaultDuration: number): ToastFn => {
  return (titleOrMessage: string, messageOrExtra?: string | ToastExtra, maybeExtra?: ToastExtra) => {
    const { title, message, duration, onClick } = resolveToastArgs(type, titleOrMessage, messageOrExtra, maybeExtra)
    const finalDuration = duration ?? defaultDuration

    toast.custom(
      (id) => <Toast id={id} type={type} title={title} message={message} duration={finalDuration} onClick={onClick} />,
      { duration: finalDuration },
    )
  }
}

export function Toast({ id, type, title, message, duration = 4000, onClick }: ToastProps) {
  const config = toastConfig[type]
  const Icon = config.icon

  const body = (
    <>
      <div className="shrink-0">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.iconWrap}`}>
          <Icon
            className={type === "loading" ? "animate-spin" : ""}
            size={20}
            fill={type === "love" ? "currentColor" : "none"}
          />
        </div>
      </div>
      <div className="ml-4 flex-1">
        <h4 className="mb-1 text-sm font-bold text-text-primary">{title}</h4>
        <p className="text-xs leading-relaxed text-text-secondary">{message}</p>
      </div>
    </>
  )

  return (
    <div className="min-w-[320px] overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated/98 font-indie-flower shadow-panel backdrop-blur-xl pointer-events-auto">
      <div className="flex items-start p-4">
        {onClick ? (
          <button
            type="button"
            onClick={() => {
              onClick()
              toast.dismiss(id)
            }}
            className="flex flex-1 cursor-pointer items-start text-left"
          >
            {body}
          </button>
        ) : (
          <div className="flex flex-1 items-start">{body}</div>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            toast.dismiss(id)
          }}
          aria-label="Dismiss notification"
          className="ml-4 shrink-0 text-text-muted transition-colors hover:text-text-primary"
        >
          <X size={16} />
        </button>
      </div>
      {type !== "loading" && (
        <div className="h-1 bg-surface-muted">
          <div
            className={`h-full ${config.progress} toast-progress`}
            style={{ "--duration": `${duration}ms` } as React.CSSProperties}
          />
        </div>
      )}
    </div>
  )
}

export const showToast = {
  success: createToastHandler("success", 4000),
  error: createToastHandler("error", 4000),
  warning: createToastHandler("warning", 4000),
  info: createToastHandler("info", 4000),
  love: createToastHandler("love", 4000),
  loading: createToastHandler("loading", Infinity),
}
