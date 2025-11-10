import { ArrowRight, Book, GraduationCap, Headphones, type LucideIcon, TrendingUp } from "lucide-react"

interface ResourceCardProps {
  icon: string
  title: string
  description: string
  buttonText: string
}

const iconMap: Record<string, LucideIcon> = {
  book: Book,
  headphones: Headphones,
  "graduation-cap": GraduationCap,
  "trending-up": TrendingUp,
}

const ResourceCard = ({ icon, title, description, buttonText }: ResourceCardProps) => {
  const IconComponent = iconMap[icon]

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
      <div className="w-12 h-12 bg-pale-lime rounded-lg flex items-center justify-center mb-4">
        {IconComponent && <IconComponent className="text-steel-blue text-xl w-6 h-6" />}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-blue-100 text-sm mb-4">{description}</p>
      <button type="button" className="text-pale-lime hover:underline text-sm font-medium flex items-center">
        {buttonText}
        <ArrowRight className="ml-1 w-4 h-4" />
      </button>
    </div>
  )
}

export default ResourceCard
