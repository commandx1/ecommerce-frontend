import { ArrowRight } from "lucide-react"
import Image from "next/image"

interface PromotionalBannerCardProps {
  title: string
  description: string
  buttonText: string
  buttonBg: string
  buttonTextColor: string
  gradient: string
  textColor: string
  descriptionColor: string
  image: string
  alt: string
}

const PromotionalBannerCard = ({
  title,
  description,
  buttonText,
  buttonBg,
  buttonTextColor,
  gradient,
  textColor,
  descriptionColor,
  image,
  alt,
}: PromotionalBannerCardProps) => {
  return (
    <div className={`bg-gradient-to-r ${gradient} rounded-2xl overflow-hidden shadow-xl`}>
      <div className="flex items-center h-64">
        <div className={`flex-1 p-8 ${textColor}`}>
          <h3 className={`text-3xl font-bold mb-4 ${textColor}`}>{title}</h3>
          <p className={`${descriptionColor} mb-6 leading-relaxed`}>{description}</p>
          <button
            type="button"
            className={`${buttonBg} ${buttonTextColor} px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors flex items-center`}
          >
            {buttonText}
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
        <div className="w-64 h-full overflow-hidden">
          <Image className="w-full h-full object-cover" src={image} alt={alt} width={256} height={256} />
        </div>
      </div>
    </div>
  )
}

export default PromotionalBannerCard
