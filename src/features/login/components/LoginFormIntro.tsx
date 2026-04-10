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
      <h1 className="mb-3 text-4xl font-bold text-text-primary">{title}</h1>
      <p className="text-lg text-text-secondary">{subtitle}</p>
    </div>
  )
}
