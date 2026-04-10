import SectionHeading from "@/components/layout/SectionHeading"
import { cn } from "@/lib/utils"

interface ShippingSectionHeadingProps {
  title: string
  description: string
  className?: string
}

export default function ShippingSectionHeading({ title, description, className }: ShippingSectionHeadingProps) {
  return (
    <SectionHeading
      title={title}
      description={description}
      className={cn("mb-8 items-center sm:mb-12 md:items-center md:justify-center", className)}
      titleClassName="mb-3 text-center text-2xl sm:mb-4 sm:text-3xl lg:text-4xl"
      descriptionClassName="mx-auto max-w-3xl text-center text-base sm:text-lg lg:text-xl"
    />
  )
}
