import Image from "next/image"
import HeroBadge from "@/features/home/components/HeroBadge"

export default function HeroVisual() {
  return (
    <div className="relative">
      <div className="h-96 overflow-hidden rounded-2xl shadow-2xl">
        <Image
          src="/heroSectionChair.png"
          alt="modern dental office with advanced equipment, professional dentist working, clean white environment, high-tech dental chair and tools"
          className="w-full h-full object-cover"
          width={500}
          height={500}
          priority
        />
      </div>
      <HeroBadge />
    </div>
  )
}
