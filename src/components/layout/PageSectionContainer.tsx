import { cn } from "@/lib/utils"

interface PageSectionContainerProps {
  as?: "div" | "section" | "main"
  className?: string
  containerClassName?: string
  children: React.ReactNode
}

export default function PageSectionContainer({
  as = "section",
  className,
  containerClassName,
  children,
}: PageSectionContainerProps) {
  const Component = as

  return (
    <Component className={className}>
      <div className={cn("app-container mx-auto px-4 sm:px-6 lg:px-8 xl:px-10", containerClassName)}>{children}</div>
    </Component>
  )
}
