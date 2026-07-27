import { Check, Headset, ShieldCheck } from "lucide-react"

const SECURITY_POINTS = [
  {
    title: "Email Verification",
    description: "We'll send a secure reset link to your registered email address.",
  },
  {
    title: "Time-Limited Access",
    description: "Reset links expire after 24 hours for maximum security.",
  },
  {
    title: "Account Protection",
    description: "Your data and order history remain fully protected.",
  },
]

export default function ForgotPasswordInfoPanel() {
  return (
    <div className="flex flex-col justify-center bg-linear-to-br from-brand-surface via-brand to-brand-strong p-6 text-inverse-foreground sm:p-8 lg:p-12 dark:from-surface dark:via-surface-elevated dark:to-surface-muted">
      <div className="mb-8">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-inverse-foreground/15">
          <ShieldCheck className="h-8 w-8 text-inverse-foreground" />
        </div>
        <h2 className="mb-4 text-4xl font-bold text-inverse-foreground">Secure Password Recovery</h2>
        <p className="text-lg leading-relaxed text-inverse-foreground/85">
          We take the security of your data seriously. Our password recovery process ensures only you can access your
          account.
        </p>
      </div>

      <div className="space-y-6">
        {SECURITY_POINTS.map((item) => (
          <div key={item.title} className="flex items-start space-x-4">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/25">
              <Check className="h-4 w-4 text-inverse-foreground" />
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-inverse-foreground">{item.title}</h3>
              <p className="text-sm text-inverse-foreground/85">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-inverse-foreground/10 p-6 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-inverse-foreground/15">
            <Headset className="h-6 w-6 text-inverse-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-inverse-foreground">Need Help?</h3>
            <p className="text-sm text-inverse-foreground/85">Contact our support team at support@dentypro.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
