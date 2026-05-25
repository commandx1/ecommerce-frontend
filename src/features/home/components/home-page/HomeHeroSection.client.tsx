"use client"

import { ArrowRight, Building2, UserRound } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

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

const featureHighlights = [
  {
    title: "Uber Direct",
    detail: "Same-day local delivery",
    desktopPositionClass: "sm:top-[14%] sm:left-[3%] lg:left-[7%]",
  },
  {
    title: "Shippo",
    detail: "Multi-carrier shipping orchestration",
    desktopPositionClass: "sm:top-[15%] sm:right-[3%] lg:right-[7%]",
  },
  {
    title: "Trusted Vendors",
    detail: "Verified supplier reliability",
    desktopPositionClass: "sm:bottom-[12%] sm:left-[5%] lg:left-[11%]",
  },
  {
    title: "Easy Returns",
    detail: "Frictionless returns flow",
    desktopPositionClass: "sm:bottom-[11%] sm:right-[4%] lg:right-[10%]",
  },
] as const

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
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.24], [0, -70])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0.62])
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
      className="hero-cinematic relative isolate min-h-screen overflow-hidden p-0"
      containerClassName="relative z-20"
    >
      <div aria-hidden className="hero-cinematic-backdrop pointer-events-none absolute inset-0" />
      <div aria-hidden className="hero-cinematic-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="hero-cinematic-vignette pointer-events-none absolute inset-0" />

      <div aria-hidden className="hero-network-map pointer-events-none absolute inset-0">
        <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="hero-network-svg">
          {networkRoutes.map((route) => (
            <g key={route.id}>
              <path id={`hero-route-${route.id}`} d={route.path} className="hero-route-path" />
              <path
                d={route.path}
                className="hero-route-glow"
                style={{ animationDuration: `${route.duration}s`, animationDelay: `${route.delay}s` }}
              />
              <circle className="hero-route-packet" r="0.5">
                <animateMotion
                  dur={`${route.duration}s`}
                  begin={`${route.delay}s`}
                  repeatCount="indefinite"
                  rotate="auto"
                >
                  <mpath href={`#hero-route-${route.id}`} />
                </animateMotion>
              </circle>
            </g>
          ))}
        </svg>

        {networkNodes.map((node) => {
          const Icon = node.kind === "vendor" ? Building2 : UserRound

          return (
            <div
              key={node.id}
              className={`hero-city-node ${node.kind === "vendor" ? "hero-city-node-vendor" : "hero-city-node-dentist"}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{node.city}</span>
            </div>
          )
        })}
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.11 } } }}
        style={prefersReducedMotion ? undefined : { y: heroY, opacity: heroOpacity }}
        className="relative flex min-h-[calc(100vh-9rem)] flex-col pt-4"
      >
        <div className="mx-auto max-w-4xl text-center">
          <motion.span variants={revealVariants} className="section-kicker">
            Fulfillment Command Center
          </motion.span>

          <motion.h1
            variants={revealVariants}
            className="mt-6 font-display text-[clamp(2.35rem,6.2vw,5.35rem)] leading-[0.92] text-text-primary"
          >
            Same-day delivery, trusted vendors, and easy returns in one modern flow.
          </motion.h1>

          <motion.p
            variants={revealVariants}
            className="mx-auto mt-6 max-w-[62ch] text-base leading-relaxed text-text-secondary md:text-lg"
          >
            Uber Direct same-day lanes, Shippo-powered shipment orchestration, verified vendor quality, and return-first
            support come together in a high-velocity procurement experience.
          </motion.p>

          <motion.div variants={revealVariants} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 hover:bg-brand-strong"
            >
              Shop Products
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/suppliers"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong/70 bg-surface-elevated/88 px-6 py-3 text-sm font-semibold text-text-primary backdrop-blur transition-colors hover:border-brand/45 hover:text-brand"
            >
              Browse Suppliers
            </Link>
          </motion.div>
        </div>

        <div className="hero-stage relative z-10 mt-10 min-h-[22rem] flex-1 sm:mt-12 sm:min-h-[30rem] lg:min-h-[34rem]">
          <div aria-hidden className="hero-stage-halo absolute inset-x-[-12%] top-[14%] h-[66%]" />

          <motion.div
            variants={revealVariants}
            className="hero-product-shell absolute top-[54%] left-1/2 z-20 h-[11.5rem] w-[11.5rem] -translate-x-1/2 -translate-y-1/2 sm:h-[18rem] sm:w-[18rem] lg:h-[22rem] lg:w-[22rem]"
          >
            <div className="relative h-full w-full">
              <Image
                src="/home-hero.png"
                alt="DentyPro product network showcase"
                fill
                priority
                sizes="(min-width: 1024px) 420px, (min-width: 640px) 340px, 240px"
                className="hero-product-image object-contain"
              />
            </div>
          </motion.div>

          <div className="hidden sm:block">
            {featureHighlights.map((feature, index) => (
              <motion.article
                key={feature.title}
                variants={revealVariants}
                className={`hero-signal-node hero-signal-node-float-${(index % 4) + 1} absolute z-30 w-[13.8rem] rounded-2xl border border-border-soft/80 bg-surface-elevated/88 px-4 py-3 shadow-panel backdrop-blur ${feature.desktopPositionClass}`}
              >
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-text-muted">
                  {feature.title}
                </p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{feature.detail}</p>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.div variants={revealVariants} className="mt-6 grid gap-3 sm:hidden">
          {featureHighlights.map((feature) => (
            <article
              key={`mobile-${feature.title}`}
              className="rounded-2xl border border-border-soft/80 bg-surface-elevated/90 px-4 py-3 shadow-soft"
            >
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-text-muted">
                {feature.title}
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">{feature.detail}</p>
            </article>
          ))}
        </motion.div>
      </motion.div>
    </PageSectionContainer>
  )
}
