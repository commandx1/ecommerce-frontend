"use client"

import { type HTMLMotionProps, motion, type Transition } from "motion/react"
import * as React from "react"
import { MotionHighlight, MotionHighlightItem } from "@/components/ui/motion-highlight"
import { cn } from "@/lib/utils"

type TabsContextType<T extends string> = {
  // Undefined until an uncontrolled Tabs picks its first tab (see the registerTrigger/useEffect
  // fallback below) or a controlled Tabs is given a value; consumers already tolerate this.
  activeValue: T | undefined
  handleValueChange: (value: T) => void
  registerTrigger: (value: T, node: HTMLElement | null) => void
}

// The provider is generic over the active tab value's type, but a single React context can only
// hold one concrete instantiation. `string` is the widest valid choice (T extends string); callers
// narrow back to their own T via the `as unknown as TabsContextType<T>` cast below.
const TabsContext = React.createContext<TabsContextType<string> | undefined>(undefined)

function useTabs<T extends string = string>(): TabsContextType<T> {
  const context = React.useContext(TabsContext)

  if (!context) {
    throw new Error("useTabs must be used within a TabsProvider")
  }

  return context as unknown as TabsContextType<T>
}

type BaseTabsProps = React.ComponentProps<"div"> & {
  children: React.ReactNode
}

type UnControlledTabsProps<T extends string = string> = BaseTabsProps & {
  defaultValue?: T
  value?: never
  onValueChange?: never
}

type ControlledTabsProps<T extends string = string> = BaseTabsProps & {
  value: T
  onValueChange?: (value: T) => void
  defaultValue?: never
}

type TabsProps<T extends string = string> = UnControlledTabsProps<T> | ControlledTabsProps<T>

function Tabs<T extends string = string>({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps<T>) {
  const [activeValue, setActiveValue] = React.useState<T | undefined>(defaultValue ?? undefined)
  const triggersRef = React.useRef(new Map<string, HTMLElement>())
  const initialSet = React.useRef(false)
  const isControlled = value !== undefined

  React.useEffect(() => {
    if (!isControlled && activeValue === undefined && triggersRef.current.size > 0 && !initialSet.current) {
      const firstTab = Array.from(triggersRef.current.keys())[0]

      setActiveValue(firstTab as T)
      initialSet.current = true
    }
  }, [activeValue, isControlled])

  const registerTrigger = (value: string, node: HTMLElement | null) => {
    if (node) {
      triggersRef.current.set(value, node)

      if (!isControlled && activeValue === undefined && !initialSet.current) {
        setActiveValue(value as T)
        initialSet.current = true
      }
    } else {
      triggersRef.current.delete(value)
    }
  }

  const handleValueChange = (val: T) => {
    if (!isControlled) setActiveValue(val)
    else onValueChange?.(val)
  }

  return (
    <TabsContext.Provider
      value={
        {
          activeValue: value ?? activeValue,
          handleValueChange,
          registerTrigger,
          // Mirrors the read-side cast in useTabs: the context is generic over T, but the context
          // object itself is fixed at `string`.
        } as unknown as TabsContextType<string>
      }
    >
      <div data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

type TabsListProps = React.ComponentProps<"div"> & {
  children: React.ReactNode
  activeClassName?: string
  transition?: Transition
}

function TabsList({
  children,
  className,
  activeClassName,
  transition = {
    type: "spring",
    stiffness: 200,
    damping: 25,
  },
  ...props
}: TabsListProps) {
  const { activeValue } = useTabs()

  return (
    <MotionHighlight
      controlledItems
      className={cn("bg-background rounded-sm shadow-sm", activeClassName)}
      value={activeValue}
      transition={transition}
    >
      <div
        role="tablist"
        data-slot="tabs-list"
        className={cn(
          "bg-muted text-muted-foreground inline-flex h-10 w-fit items-center justify-center rounded-lg p-1",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </MotionHighlight>
  )
}

type TabsTriggerProps = HTMLMotionProps<"button"> & {
  value: string
  children: React.ReactNode
}

function TabsTrigger({ ref, value, children, className, ...props }: TabsTriggerProps) {
  const { activeValue, handleValueChange, registerTrigger } = useTabs()

  const localRef = React.useRef<HTMLButtonElement | null>(null)

  React.useImperativeHandle(ref as React.Ref<HTMLButtonElement>, () => localRef.current as HTMLButtonElement)

  React.useEffect(() => {
    registerTrigger(value, localRef.current)

    return () => registerTrigger(value, null)
  }, [value, registerTrigger])

  return (
    <MotionHighlightItem value={value} className="size-full">
      <motion.button
        ref={localRef}
        data-slot="tabs-trigger"
        role="tab"
        onClick={() => handleValueChange(value)}
        data-state={activeValue === value ? "active" : "inactive"}
        className={cn(
          "ring-offset-background focus-visible:ring-ring data-[state=active]:text-foreground z-1 inline-flex size-full cursor-pointer items-center justify-center rounded-sm px-2 py-1 text-sm font-medium whitespace-nowrap transition-transform focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </motion.button>
    </MotionHighlightItem>
  )
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  useTabs,
  type TabsContextType,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
}
