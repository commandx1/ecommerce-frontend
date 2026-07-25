"use client"

import useEmblaCarousel from "embla-carousel-react"
import { Building2, ChevronLeft, ChevronRight, UserRound } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useTheme } from "next-themes"
import { useCallback, useEffect, useState } from "react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"
import { ShineBorder } from "@/components/ui/shine-border"

const revealVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
}

const heroBanners = [
  {
    image: "/banner1.avif",
    mobileImage: "/banner1-mobile.avif",
    alt: "Essential dental supplies and instruments arranged on a modern clinic workspace",
  },
  {
    image: "/banner2.avif",
    mobileImage: "/banner2-mobile.avif",
    alt: "Modern dental procurement visual with shipment boxes and logistics flow",
  },
] as const

const featureHighlights = [
  {
    title: "Uber Direct",
    detail: "Same-day local delivery",
    desktopPositionClass: "top-[7%] left-[1.5%]",
    bgClassName: "bg-success/14",
    titleClassName: "text-success",
    shineColors: ["#16a34a", "#4ade80", "#bbf7d0"] as string[],
  },
  {
    title: "Shippo",
    detail: "Multi-carrier shipping orchestration",
    desktopPositionClass: "top-[7%] right-[1.5%]",
    bgClassName: "bg-brand/14",
    titleClassName: "text-brand",
    shineColors: ["#1d4ed8", "#60a5fa", "#bfdbfe"] as string[],
  },
  {
    title: "Trusted Vendors",
    detail: "Verified vendor reliability",
    desktopPositionClass: "bottom-[8%] left-[3%]",
    bgClassName: "bg-accent/55",
    titleClassName: "text-accent-foreground",
    shineColors: ["#65a30d", "#a3e635", "#d9f99d"] as string[],
  },
  {
    title: "Easy Returns",
    detail: "Frictionless returns flow",
    desktopPositionClass: "bottom-[8%] right-[3%]",
    bgClassName: "bg-warning/14",
    titleClassName: "text-warning",
    shineColors: ["#b45309", "#fbbf24", "#fde68a"] as string[],
  },
]

const networkNodes = [
  { id: "los-angeles", city: "Los Angeles", kind: "vendor", x: 14, y: 52 },
  { id: "chicago", city: "Chicago", kind: "vendor", x: 38, y: 30 },
  { id: "dallas", city: "Dallas", kind: "dentist", x: 41, y: 62 },
  { id: "seattle", city: "Seattle", kind: "dentist", x: 16, y: 18 },
  { id: "denver", city: "Denver", kind: "dentist", x: 28, y: 44 },
  { id: "atlanta", city: "Atlanta", kind: "dentist", x: 59, y: 60 },
  { id: "miami", city: "Miami", kind: "dentist", x: 70, y: 76 },
  { id: "new-york", city: "New York", kind: "dentist", x: 76, y: 35 },
  { id: "boston", city: "Boston", kind: "dentist", x: 83, y: 24 },
] as const

const shipmentRoutes = [
  { id: "r1", from: "los-angeles", to: "seattle", curve: -5.2, duration: 7.3, delay: 0.4 },
  { id: "r2", from: "los-angeles", to: "denver", curve: 6.1, duration: 8.2, delay: 1.1 },
  { id: "r3", from: "los-angeles", to: "dallas", curve: -4.3, duration: 8.9, delay: 2.4 },
  { id: "r4", from: "chicago", to: "new-york", curve: -3.2, duration: 7.4, delay: 0.8 },
  { id: "r5", from: "chicago", to: "atlanta", curve: 4.6, duration: 8.3, delay: 1.7 },
  { id: "r6", from: "chicago", to: "miami", curve: -6.8, duration: 9.4, delay: 2.8 },
  { id: "r7", from: "chicago", to: "boston", curve: 3.4, duration: 7.8, delay: 1.3 },
  { id: "r8", from: "los-angeles", to: "new-york", curve: 8.2, duration: 10.2, delay: 0.6 },
] as const

const getCurvedPath = (from: { x: number; y: number }, to: { x: number; y: number }, curveStrength: number): string => {
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy) || 1
  const normalX = -dy / length
  const normalY = dx / length
  const controlX = midX + normalX * curveStrength
  const controlY = midY + normalY * curveStrength
  return `M ${from.x},${from.y} Q ${controlX},${controlY} ${to.x},${to.y}`
}

export default function HomeHeroSectionClient() {
  const prefersReducedMotion = useReducedMotion()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.24], [0, -70])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0.62])
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" })
  const [selectedBannerIndex, setSelectedBannerIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const updateBannerControls = useCallback(() => {
    if (!emblaApi) return
    setSelectedBannerIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    updateBannerControls()
    emblaApi.on("select", updateBannerControls)
    emblaApi.on("reInit", updateBannerControls)

    return () => {
      emblaApi.off("select", updateBannerControls)
      emblaApi.off("reInit", updateBannerControls)
    }
  }, [emblaApi, updateBannerControls])

  const scrollPrevBanner = () => emblaApi?.scrollPrev()
  const scrollNextBanner = () => emblaApi?.scrollNext()
  const scrollToBanner = (index: number) => emblaApi?.scrollTo(index)

  const nodesById = new Map(networkNodes.map((node) => [node.id, node]))
  const networkRoutes = shipmentRoutes
    .map((route) => {
      const fromNode = nodesById.get(route.from)
      const toNode = nodesById.get(route.to)

      if (!fromNode || !toNode) {
        return null
      }

      return {
        ...route,
        path: getCurvedPath(fromNode, toNode, route.curve),
      }
    })
    .filter((route): route is NonNullable<typeof route> => route !== null)

  return (
    <PageSectionContainer
      as="section"
      className="hero-cinematic relative isolate h-auto overflow-hidden p-0 sm:h-[calc(100vh-8.75rem)]"
      containerClassName="relative z-20 h-full"
    >
      <BackgroundGradientAnimation
        gradientBackgroundStart={isDark ? "rgb(14, 21, 38)" : "rgb(237, 244, 253)"}
        gradientBackgroundEnd={isDark ? "rgb(20, 30, 52)" : "rgb(243, 249, 255)"}
        firstColor={isDark ? "50, 100, 180" : "100, 155, 210"}
        secondColor={isDark ? "80, 155, 210" : "140, 190, 225"}
        thirdColor={isDark ? "95, 195, 225" : "165, 210, 245"}
        fourthColor={isDark ? "148, 182, 75" : "168, 195, 148"}
        fifthColor={isDark ? "55, 110, 172" : "142, 172, 205"}
        pointerColor={isDark ? "75, 135, 200" : "108, 150, 200"}
        blendingValue={isDark ? "screen" : "soft-light"}
        size="75%"
        interactive={false}
        containerClassName="absolute inset-0 pointer-events-none will-change-transform"
      />
      <div aria-hidden className="hero-cinematic-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="hero-cinematic-vignette pointer-events-none absolute inset-0" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.11 } } }}
        style={prefersReducedMotion ? undefined : { y: heroY, opacity: heroOpacity }}
        className="relative flex h-full flex-col gap-4 py-4 sm:gap-5 sm:py-6 will-change-transform"
      >
        <motion.div
          variants={revealVariants}
          className="relative z-20 app-container"
        >
          <div className="relative overflow-hidden rounded-[1.6rem] border border-border-soft/75 bg-surface-elevated/92 shadow-panel backdrop-blur-xl sm:rounded-4xl">
            <div ref={emblaRef} className="overflow-hidden">
              <div className="flex">
                {heroBanners.map((banner, index) => (
                  <div key={banner.image} className="min-w-0 shrink-0 basis-full">
                    <article className="relative aspect-square w-full bg-surface-muted/60 sm:aspect-4/1">
                      <picture className="absolute inset-0 block h-full w-full">
                        <source media="(min-width: 640px)" srcSet={banner.image} />
                        <img
                          src={banner.mobileImage}
                          alt={banner.alt}
                          loading={index === 0 ? "eager" : "lazy"}
                          fetchPriority={index === 0 ? "high" : "auto"}
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </picture>
                    </article>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={scrollPrevBanner}
              disabled={!canScrollPrev}
              aria-label="Previous banner"
              className="absolute top-1/2 left-3 z-20 -translate-y-1/2 rounded-full border border-border-soft/80 bg-surface-elevated/90 p-2 text-text-primary shadow-soft backdrop-blur transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-45 sm:left-4"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={scrollNextBanner}
              disabled={!canScrollNext}
              aria-label="Next banner"
              className="absolute top-1/2 right-3 z-20 -translate-y-1/2 rounded-full border border-border-soft/80 bg-surface-elevated/90 p-2 text-text-primary shadow-soft backdrop-blur transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-45 sm:right-4"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-2 sm:bottom-4">
              {heroBanners.map((banner, index) => {
                const isActive = selectedBannerIndex === index

                return (
                  <button
                    key={`${banner.image}-dot`}
                    type="button"
                    onClick={() => scrollToBanner(index)}
                    aria-label={`Go to banner ${index + 1}`}
                    aria-current={isActive}
                    className={`h-2.5 rounded-full transition-all ${
                      isActive ? "w-8 bg-brand" : "w-2.5 bg-border-strong hover:bg-text-muted"
                    }`}
                  />
                )
              })}
            </div>
          </div>
        </motion.div>

        <div className="app-container hero-stage relative z-10 hidden w-full overflow-hidden sm:block sm:flex-1">
          <div
            aria-hidden
            className="hero-network-map pointer-events-none absolute inset-0 [contain:layout_style_paint]"
          >
            <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="hero-network-svg" style={{ willChange: 'transform' }}>
              {/* Route paths + traveling packets */}
              {networkRoutes.map((route) => (
                <g key={route.id}>
                  <path id={`hero-route-${route.id}`} d={route.path} className="hero-route-path" />
                  {/* Single traveling packet per route */}
                  <circle r="0.55" className="hero-route-packet">
                    <animateMotion dur={`${route.duration}s`} begin={`${route.delay}s`} repeatCount="indefinite" rotate="auto">
                      <mpath href={`#hero-route-${route.id}`} />
                    </animateMotion>
                  </circle>
                </g>
              ))}

              {/* Vendor hub: double pulse ring + center dot */}
              {networkNodes
                .filter((n) => n.kind === "vendor")
                .map((node, i) => (
                  <g key={`vendor-fx-${node.id}`}>
                    <circle cx={node.x} cy={node.y} r="0" className="hero-vendor-ring">
                      <animate attributeName="r" values="0.6;5.5" dur="3.5s" begin={`${i * 2}s`} repeatCount="indefinite" calcMode="spline" keySplines="0.2 0.8 0.4 1" keyTimes="0;1" />
                      <animate attributeName="opacity" values="0.6;0" dur="3.5s" begin={`${i * 2}s`} repeatCount="indefinite" />
                    </circle>
                    <circle cx={node.x} cy={node.y} r="0.48" className="hero-vendor-dot" />
                  </g>
                ))}

              {/* Dentist destination: arrival pulse ring + center dot */}
              {networkNodes
                .filter((n) => n.kind === "dentist")
                .map((node) => (
                  <g key={`dentist-fx-${node.id}`}>
                    <circle cx={node.x} cy={node.y} r="0.32" className="hero-dentist-dot" />
                  </g>
                ))}
            </svg>

            {networkNodes.map((node, index) => {
              const Icon = node.kind === "vendor" ? Building2 : UserRound

              return (
                <div
                  key={node.id}
                  className={`hero-city-node ${node.kind === "vendor" ? "hero-city-node-vendor" : "hero-city-node-dentist"}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%`, animationDelay: `${index * 0.07}s` }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{node.city}</span>
                </div>
              )
            })}
          </div>

          <div className="pointer-events-none absolute inset-0 z-30 hidden xl:block">
            {featureHighlights.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={revealVariants}
                className={`hero-signal-node hero-signal-node-float-${(index % 4) + 1} absolute ${feature.desktopPositionClass}`}
              >
                <ShineBorder
                  borderRadius={16}
                  borderWidth={1}
                  duration={10}
                  color={feature.shineColors}
                  className={`w-[13.2rem] px-4 py-3 shadow-panel backdrop-blur ${feature.bgClassName}`}
                >
                  <p className={`text-[0.64rem] font-semibold uppercase tracking-[0.16em] ${feature.titleClassName}`}>
                    {feature.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{feature.detail}</p>
                </ShineBorder>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </PageSectionContainer>
  )
}
