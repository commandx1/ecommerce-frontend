"use client"

import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight, type LucideIcon, RotateCcw, ShieldCheck } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
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

interface WordmarkLogo {
  src: string
  /** Natural pixel size of the file. */
  size: [width: number, height: number]
  /** Box of the actual wordmark inside the file (x, y, width, height) - these assets ship with wide transparent padding. */
  crop: [x: number, y: number, width: number, height: number]
  displayHeight: number
}

/** Brand wordmark cropped to its ink via CSS, so the shared asset in /public stays untouched. Black art on transparent → forced white in dark theme. */
function BrandWordmark({ title, logo }: { title: string; logo: WordmarkLogo }) {
  const [naturalWidth, naturalHeight] = logo.size
  const [x, y, width, height] = logo.crop

  return (
    <span
      className="relative block shrink-0 overflow-hidden"
      style={{ height: logo.displayHeight, aspectRatio: `${width} / ${height}` }}
    >
      <Image
        src={logo.src}
        alt={title}
        width={naturalWidth}
        height={naturalHeight}
        sizes="160px"
        // Items start off-screen inside the scrolling track; lazy loading would make them pop in mid-scroll.
        loading="eager"
        className="absolute h-auto max-w-none dark:brightness-0 dark:invert"
        style={{
          width: `${(naturalWidth / width) * 100}%`,
          left: `${(-x / width) * 100}%`,
          top: `${(-y / height) * 100}%`,
        }}
      />
    </span>
  )
}

type FeatureHighlight = { title: string; detail: string } & (
  | { logo: WordmarkLogo }
  | { Icon: LucideIcon; titleClassName: string }
)

const featureHighlights: FeatureHighlight[] = [
  {
    title: "Uber Direct",
    detail: "Same-day local delivery",
    logo: { src: "/uber-direct.webp", size: [2000, 706], crop: [236, 232, 1513, 245], displayHeight: 17 },
  },
  {
    title: "Shippo",
    detail: "Multi-carrier shipping orchestration",
    logo: { src: "/shippo-logo.png", size: [1485, 449], crop: [0, 0, 1485, 449], displayHeight: 22 },
  },
  {
    title: "Trusted Vendors",
    detail: "Verified vendor reliability",
    Icon: ShieldCheck,
    titleClassName: "text-accent-foreground",
  },
  {
    title: "Easy Returns",
    detail: "Frictionless returns flow",
    Icon: RotateCcw,
    titleClassName: "text-warning-strong",
  },
  {
    title: "Stripe",
    detail: "Secure card payments",
    logo: { src: "/stripe-logo.png", size: [1600, 1200], crop: [184, 342, 1231, 513], displayHeight: 22 },
  },
]

export default function HomeHeroSectionClient() {
  const prefersReducedMotion = useReducedMotion()
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

  return (
    <PageSectionContainer
      as="section"
      className="hero-cinematic relative isolate overflow-hidden p-0"
      containerClassName="relative z-20"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.11 } } }}
        style={prefersReducedMotion ? undefined : { y: heroY, opacity: heroOpacity }}
        className="relative flex flex-col gap-4 py-4 sm:gap-5 sm:py-6 will-change-transform"
      >
        <motion.div variants={revealVariants} className="relative z-20 app-container">
          <div className="hero-marquee py-1">
            <div className="hero-marquee-viewport overflow-hidden">
              <div className="hero-marquee-track flex w-max">
                {[false, true].map((isClone) => (
                  <ul
                    key={String(isClone)}
                    aria-hidden={isClone || undefined}
                    className="hero-marquee-list flex shrink-0 items-center"
                  >
                    {featureHighlights.map((feature) => (
                      <li key={feature.title} className="flex items-center gap-2.5 whitespace-nowrap px-6">
                        {"logo" in feature ? (
                          <BrandWordmark title={feature.title} logo={feature.logo} />
                        ) : (
                          <>
                            <feature.Icon aria-hidden className={`h-4 w-4 shrink-0 ${feature.titleClassName}`} />
                            <span
                              className={`text-xs font-semibold uppercase tracking-[0.16em] ${feature.titleClassName}`}
                            >
                              {feature.title}
                            </span>
                          </>
                        )}
                        <span className="text-sm text-text-secondary">{feature.detail}</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={revealVariants} className="relative z-20 app-container">
          <div className="relative overflow-hidden rounded-[1.6rem] border border-border-soft/75 bg-surface-elevated/92 backdrop-blur-xl sm:rounded-4xl">
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
      </motion.div>
    </PageSectionContainer>
  )
}
