interface LoginFormIntroProps {
  title?: string
  subtitle?: string
}

export default function LoginFormIntro({
  title = "Sign In",
  subtitle = "Sign in to your account",
}: LoginFormIntroProps) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-steel-blue mb-3">{title}</h1>
      <p className="text-gray-600 text-lg">{subtitle}</p>
    </div>
  )
}
