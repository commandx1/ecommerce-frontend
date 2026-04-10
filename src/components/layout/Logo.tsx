import Image from "next/image"

const Logo = () => {
  return (
    <div className="relative flex size-11 items-center justify-center overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft dark:bg-surface-muted">
      <div className="mesh-panel absolute inset-0 opacity-80 dark:opacity-5" />
      <Image src="/DentyProLogo.png" alt="DentyPro Logo" width={28} height={28} className="relative z-10" />
    </div>
  )
}

export default Logo
