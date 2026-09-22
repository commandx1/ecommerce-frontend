import UiBreadcrumb from "@/components/ui/breadcrumb"

const items = [{ label: "Home", href: "/" }, { label: "Support Center" }]

export default function HelpCenterBreadcrumb() {
  return <UiBreadcrumb items={items} className="bg-surface" />
}
