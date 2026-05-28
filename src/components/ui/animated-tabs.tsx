"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/motion-tabs"
import { cn } from "@/lib/utils"

interface AnimatedTabsProps<T extends string> {
  value: T
  options: ReadonlyArray<{ label: string; value: T }>
  onValueChange: (value: T) => void
  className?: string
  listClassName?: string
  activeIndicatorClassName?: string
  triggerClassName?: string
}

export default function AnimatedTabs<T extends string>({
  value,
  options,
  onValueChange,
  className,
  listClassName,
  activeIndicatorClassName,
  triggerClassName,
}: AnimatedTabsProps<T>) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={className}>
      <TabsList
        className={cn("h-auto rounded-xl border border-border-soft bg-surface p-1", listClassName)}
        activeClassName={cn("bg-brand shadow-soft", activeIndicatorClassName)}
      >
        {options.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            className={cn(
              "h-8 rounded-lg px-3 text-xs font-semibold delay-100 transition-colors duration-300 ease-out",
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
  )
}
