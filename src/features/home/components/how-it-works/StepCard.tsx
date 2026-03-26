import { type LucideIcon, Search, ShoppingCart, Truck, UserCheck } from "lucide-react"

interface StepCardProps {
  step: number
  title: string
  description: string
  icon: string
}

const iconMap: Record<string, LucideIcon> = {
  "user-check": UserCheck,
  search: Search,
  "shopping-cart": ShoppingCart,
  truck: Truck,
}

const StepCard = ({ step, title, description, icon }: StepCardProps) => {
  const IconComponent = iconMap[icon]

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-6">
        {IconComponent && <IconComponent className="text-white text-2xl w-8 h-8" />}
      </div>
      <h3 className="text-xl font-semibold text-steel-blue mb-3">
        {step}. {title}
      </h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

export default StepCard
