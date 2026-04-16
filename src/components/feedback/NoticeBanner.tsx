import NotificationCard, {
  type NotificationCardProps,
  type NotificationTone,
} from "@/components/feedback/NotificationCard"

type NoticeTone = NotificationTone

interface NoticeBannerProps {
  tone?: NoticeTone
  title?: NotificationCardProps["title"]
  description?: NotificationCardProps["description"]
  icon?: NotificationCardProps["icon"]
  className?: NotificationCardProps["className"]
  children?: NotificationCardProps["children"]
}

export default function NoticeBanner({
  tone = "info",
  title,
  description,
  icon,
  className,
  children,
}: NoticeBannerProps) {
  return (
    <NotificationCard tone={tone} title={title} description={description} icon={icon} className={className}>
      {children}
    </NotificationCard>
  )
}
