import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  titleAs?: "h1" | "h2" | "h3"
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}

export default function SectionHeading({
  title,
  description,
  actions,
  titleAs = "h2",
  className,
  titleClassName,
  descriptionClassName,
}: SectionHeadingProps) {
  const TitleTag = titleAs

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <TitleTag className={cn("text-3xl font-bold text-steel-blue", titleClassName)}>{title}</TitleTag>
        {description ? <p className={cn("text-gray-600 mt-2", descriptionClassName)}>{description}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
