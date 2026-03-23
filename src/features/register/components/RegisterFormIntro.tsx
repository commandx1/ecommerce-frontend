interface RegisterFormIntroProps {
  title?: string
  subtitle?: string
}

export default function RegisterFormIntro({
  title = "Professional Registration",
  subtitle = "Please provide your information to create your account",
}: RegisterFormIntroProps) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-steel-blue mb-3">{title}</h1>
      <p className="text-gray-600 text-lg">{subtitle}</p>
    </div>
  )
}
