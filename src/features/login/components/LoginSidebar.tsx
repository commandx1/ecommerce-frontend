import { Award, Percent, Shield, TrendingUp, Truck, type LucideIcon } from "lucide-react"

const BENEFITS: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Shield, label: "Verified professional network" },
  { icon: Percent, label: "Exclusive professional pricing" },
  { icon: Truck, label: "Priority shipping & support" },
  { icon: Award, label: "Access to certified suppliers" },
  { icon: TrendingUp, label: "Practice management tools" },
]

const STATS: Array<{ value: string; label: string }> = [
  { value: "10,000+", label: "Verified Dentists" },
  { value: "500+", label: "Certified Suppliers" },
  { value: "50,000+", label: "Products Available" },
  { value: "99.8%", label: "Satisfaction Rate" },
]

export default function LoginSidebar() {
  return (
    <div className="bg-linear-to-br from-steel-blue to-blue-800 p-12 flex flex-col justify-center">
      <div className="text-white mb-8">
        <h2 className="text-3xl font-bold mb-4">Welcome to the Professional Network</h2>
        <p className="text-blue-100 text-lg leading-relaxed mb-6">
          Connect with thousands of verified dental professionals and access exclusive pricing, certified suppliers,
          and industry-leading products.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {BENEFITS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center text-white">
            <div className="w-8 h-8 bg-pale-lime rounded-full flex items-center justify-center mr-4">
              <Icon className="text-steel-blue w-4 h-4" />
            </div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
        <h3 className="text-white text-lg font-semibold mb-4">Trusted by Professionals</h3>
        <div className="grid grid-cols-2 gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-pale-lime">{value}</div>
              <div className="text-sm text-blue-100">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
