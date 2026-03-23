import { Check, Heart, Info, Loader2, TriangleAlert, X } from "lucide-react"
import type React from "react"
import { toast } from "sonner"

type ToastType = "success" | "error" | "warning" | "info" | "love" | "loading"
type ToastFn = {
  (message: string, duration?: number): void
  (title: string, message: string, duration?: number): void
}

interface ToastProps {
  id: string | number
  type: ToastType
  title: string
  message: string
  duration?: number
}

const toastConfig = {
  success: {
    icon: Check,
    color: "from-green-500 to-emerald-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  error: {
    icon: X,
    color: "from-red-500 to-rose-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  warning: {
    icon: TriangleAlert,
    color: "from-amber-500 to-yellow-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  info: {
    icon: Info,
    color: "from-blue-500 to-cyan-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  love: {
    icon: Heart,
    color: "from-rose-500 to-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
  },
  loading: {
    icon: Loader2,
    color: "from-purple-500 to-indigo-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
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

const resolveToastArgs = (
  type: ToastType,
  titleOrMessage: string,
  messageOrDuration?: string | number,
  maybeDuration?: number,
) => {
  let title = defaultTitles[type]
  let message = titleOrMessage
  let duration = maybeDuration

  if (typeof messageOrDuration === "string") {
    title = titleOrMessage
    message = messageOrDuration
  } else if (typeof messageOrDuration === "number") {
    duration = messageOrDuration
  }

  return { title, message, duration }
}

const createToastHandler = (type: ToastType, defaultDuration: number): ToastFn => {
  return (titleOrMessage: string, messageOrDuration?: string | number, maybeDuration?: number) => {
    const { title, message, duration } = resolveToastArgs(type, titleOrMessage, messageOrDuration, maybeDuration)
    const finalDuration = duration ?? defaultDuration

    toast.custom((id) => <Toast id={id} type={type} title={title} message={message} duration={finalDuration} />, {
      duration: finalDuration,
    })
  }
}

export function Toast({ id, type, title, message, duration = 4000 }: ToastProps) {
  const config = toastConfig[type]
  const Icon = config.icon

  return (
    <div
      className={`bg-white rounded-2xl shadow-2xl border-2 ${config.border} overflow-hidden min-w-[320px] pointer-events-auto font-indie-flower`}
    >
      <div className="flex items-start p-4">
        <div className="shrink-0">
          <div
            className={`w-10 h-10 bg-linear-to-br ${config.color} rounded-full flex items-center justify-center shadow-lg`}
          >
            <Icon
              className={`text-white ${type === "loading" ? "animate-spin" : ""}`}
              size={20}
              fill={type === "love" ? "white" : "none"}
            />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4>
          <p className="text-gray-600 text-xs leading-relaxed">{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(id)}
          className="shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      {type !== "loading" && (
        <div className={`h-1 ${config.bg}`}>
          <div
            className={`h-full bg-linear-to-r ${config.color} toast-progress`}
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
