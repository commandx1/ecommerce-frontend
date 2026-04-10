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
      <h1 className="mb-3 text-4xl font-bold text-brand">{title}</h1>
      <p className="text-lg text-text-secondary">{subtitle}</p>
    </div>
  )
}
