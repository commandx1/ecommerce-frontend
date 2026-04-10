"use client"

import { ArrowRight } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

const revealVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.75,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
}

export default function HomeHeroSectionClient() {
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.28], [0, -90])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0.56])

  return (
    <PageSectionContainer
      as="section"
      className="relative overflow-hidden pt-14 pb-14 sm:pt-18 lg:min-h-[42rem] lg:pt-22"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 lg:left-[44%]">
        <Image
          src="/herosection.png"
          alt=""
          fill
          priority
          className="object-contain object-right opacity-75 lg:opacity-100"
        />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.12 } },
        }}
        className="relative z-10 lg:max-w-[54%]"
        style={prefersReducedMotion ? undefined : { y: heroY, opacity: heroOpacity }}
      >
        <motion.h1
          variants={revealVariants}
          className="mt-6 max-w-[16ch] font-display text-[clamp(2.5rem,6.8vw,5.5rem)] leading-[0.92] text-text-primary"
        >
          Discover, compare, and restock in one commerce flow.
        </motion.h1>
        <motion.p
          variants={revealVariants}
          className="mt-6 max-w-[54ch] text-base leading-relaxed text-text-secondary md:text-lg"
        >
          DentyPro combines a deep product catalog, trusted supplier storefronts, and fast checkout pathways for modern
          clinics. Find what you need, validate quality, and place high-confidence orders quickly.
        </motion.p>

        <motion.div variants={revealVariants} className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/products"
            className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 hover:bg-brand-strong"
          >
            Shop Products
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/suppliers"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong/70 bg-surface-elevated/90 px-6 py-3 text-sm font-semibold text-text-primary backdrop-blur transition-colors hover:border-brand/45 hover:text-brand"
          >
            Browse Suppliers
          </Link>
        </motion.div>
      </motion.div>
    </PageSectionContainer>
  )
}
