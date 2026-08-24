interface RegisterFormIntroProps {
  title?: string
}

export default function RegisterFormIntro({ title = "Professional Registration" }: RegisterFormIntroProps) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-brand">{title}</h1>
    </div>
  )
}
