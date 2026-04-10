import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  titleAs?: "h1" | "h2" | "h3"
  kicker?: React.ReactNode
  variant?: "editorial" | "technical"
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}

export default function SectionHeading({
  title,
  description,
  actions,
  titleAs = "h2",
  kicker,
  variant = "editorial",
  className,
  titleClassName,
  descriptionClassName,
}: SectionHeadingProps) {
  const TitleTag = titleAs

  return (
    <div className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-3xl">
        {kicker ? <div className="section-kicker mb-4">{kicker}</div> : null}
        <TitleTag
          className={cn(
            variant === "editorial" ? "text-4xl md:text-5xl" : "font-sans text-3xl md:text-[2rem] tracking-[-0.02em]",
            "font-semibold text-text-primary",
            titleClassName,
          )}
        >
          {title}
        </TitleTag>
        {description ? (
          <p
            className={cn(
              variant === "editorial"
                ? "mt-4 max-w-2xl text-base leading-7 text-text-secondary md:text-lg"
                : "mt-3 text-sm leading-6 text-text-secondary md:text-base",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
