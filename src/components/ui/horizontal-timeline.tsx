"use client"

import { Steps } from "@ark-ui/react/steps"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type HorizontalTimelineStepState = "done" | "active" | "pending" | "error"

export interface HorizontalTimelineStep {
  label: string
  date?: string | null
  state: HorizontalTimelineStepState
  sublabel?: string | null
  extra?: React.ReactNode
}

interface HorizontalTimelineProps {
  steps: HorizontalTimelineStep[]
  className?: string
  orientation?: "horizontal" | "vertical"
}

function StepIndicator({ state }: { state: HorizontalTimelineStepState }) {
  const base = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold"

  if (state === "done") {
    return (
      <div className={cn(base, "border-brand bg-brand text-white")}>
        <Check className="h-3.5 w-3.5" />
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className={cn(base, "border-danger bg-danger text-white")}>
        <X className="h-3.5 w-3.5" />
      </div>
    )
  }

  if (state === "active") {
    return (
      <div className={cn(base, "border-brand bg-brand/15 text-brand")}>
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
      </div>
    )
  }

  return <div className={cn(base, "border-border-strong bg-surface-muted text-text-muted")} />
}

function stepLabelClass(state: HorizontalTimelineStepState): string {
  if (state === "done") return "text-brand"
  if (state === "error") return "text-danger"
  if (state === "active") return "text-brand"
  return "text-text-muted"
}

function separatorClass(state: HorizontalTimelineStepState): string {
  if (state === "done") return "bg-brand"
  if (state === "error") return "bg-danger"
  return "bg-border-soft"
}

export function HorizontalTimeline({ steps, className, orientation = "horizontal" }: HorizontalTimelineProps) {
  if (orientation === "vertical") {
    return (
      <Steps.Root count={steps.length} step={steps.length} className={cn("w-full", className)}>
        <Steps.List className="flex w-full flex-col">
          {steps.map((step, index) => (
            <Steps.Item key={`${step.label}-${index}`} index={index} className="relative flex items-start gap-3">
              <div className="flex flex-col items-center">
                <StepIndicator state={step.state} />
                {index < steps.length - 1 ? (
                  <div className={cn("my-1 w-0.5 flex-1 min-h-6", separatorClass(step.state))} />
                ) : null}
              </div>
              <div className="flex flex-col gap-0.5 pb-6 pt-0.5">
                <p className={cn("text-sm font-semibold leading-tight", stepLabelClass(step.state))}>{step.label}</p>
                {step.date && step.date !== "-" ? (
                  <p className="text-xs text-text-muted leading-tight">{step.date}</p>
                ) : null}
                {step.sublabel ? (
                  <p className={cn("text-xs font-medium leading-tight", stepLabelClass(step.state))}>{step.sublabel}</p>
                ) : null}
                {step.extra ?? null}
              </div>
            </Steps.Item>
          ))}
        </Steps.List>
      </Steps.Root>
    )
  }

  return (
    <Steps.Root count={steps.length} step={steps.length} className={cn("w-full", className)}>
      <Steps.List className="flex w-full items-start">
        {steps.map((step, index) => (
          <Steps.Item
            key={`${step.label}-${index}`}
            index={index}
            className="relative flex not-last:flex-1 items-start"
          >
            <div className="flex flex-col items-center gap-1.5">
              <StepIndicator state={step.state} />
              <p className={cn("text-center text-[11px] font-semibold leading-tight", stepLabelClass(step.state))}>
                {step.label}
              </p>
              {step.date && step.date !== "-" ? (
                <p className="text-center text-[10px] text-text-muted leading-tight">{step.date}</p>
              ) : null}
              {step.sublabel ? (
                <p className={cn("text-center text-[10px] font-medium leading-tight", stepLabelClass(step.state))}>
                  {step.sublabel}
                </p>
              ) : null}
              {step.extra ?? null}
            </div>
            {index < steps.length - 1 ? (
              <div className={cn("mt-3.5 h-0.5 flex-1 mx-1.5 shrink", separatorClass(step.state))} />
            ) : null}
          </Steps.Item>
        ))}
      </Steps.List>
    </Steps.Root>
  )
}
