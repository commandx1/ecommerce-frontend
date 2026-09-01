import { cn } from "@/lib/utils"

interface PageSectionContainerProps {
  as?: "div" | "section" | "main"
  id?: string
  className?: string
  containerClassName?: string
  children: React.ReactNode
}

export default function PageSectionContainer({
  as = "section",
  id,
  className,
  containerClassName,
  children,
}: PageSectionContainerProps) {
  const Component = as
  const isHero = className?.includes("hero-cinematic")

  return (
    <Component id={id} className={className}>
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8 xl:px-10", isHero ? "" : "app-container", containerClassName)}>
        {children}
      </div>
    </Component>
  )
}
