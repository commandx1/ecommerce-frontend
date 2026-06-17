"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/motion-tabs"
import { cn } from "@/lib/utils"

interface AnimatedTabsProps<T extends string> {
  value: T
  options: ReadonlyArray<{ label: string; value: T }>
  onValueChange: (value: T) => void
  className?: string
  disabled?: boolean
  listClassName?: string
  activeIndicatorClassName?: string
  triggerClassName?: string
}

export default function AnimatedTabs<T extends string>({
  value,
  options,
  onValueChange,
  className,
  disabled = false,
  listClassName,
  activeIndicatorClassName,
  triggerClassName,
}: AnimatedTabsProps<T>) {
  return (
    <div className={cn(disabled && "pointer-events-none select-none")}>
    <Tabs value={value} onValueChange={disabled ? undefined : onValueChange} className={className}>
      <TabsList
        className={cn("h-auto rounded-[.87rem] border border-border-soft bg-surface p-0.5", listClassName)}
        activeClassName={cn("bg-brand shadow-soft", activeIndicatorClassName)}
      >
        {options.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            disabled={disabled}
            className={cn(
              "h-8 px-3 text-xs font-semibold delay-100 transition-colors duration-300 ease-out",
              "data-[state=active]:text-primary-foreground",
              "text-text-secondary hover:text-text-primary",
              triggerClassName,
            )}
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
    </div>
  )
}
