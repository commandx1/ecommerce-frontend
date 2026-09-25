export default function ActionIconButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-soft text-text-muted transition-colors hover:text-brand"
    >
      {icon}
    </button>
  )
}
