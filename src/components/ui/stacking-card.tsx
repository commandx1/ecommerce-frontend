"use client"

import { useTransform,motion,useScroll,type MotionValue } from "motion/react"
import { useRef } from "react"
import { cn } from "@/lib/utils"

export interface StackingCardData {
  title: string
  description: string
  imageUrl?: string
  color: string
  href?: string
}

interface CardProps {
  i: number
  data: StackingCardData
  progress: MotionValue<number>
  range: [number,number]
  targetScale: number
  renderContent?: (data: StackingCardData) => React.ReactNode
  cardHeight?: string
  stickyTop?: string
}

export function StackingCard({ i,data,progress,range,targetScale,renderContent,cardHeight = "calc(100vh - 8rem)",stickyTop = "0px" }: CardProps) {
  const container = useRef(null)
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end","start start"],
  })

  const imageScale = useTransform(scrollYProgress,[0,1],[1.3,1])
  const scale = useTransform(progress,range,[1,targetScale])

  return (
    <div
      ref={container}
      style={{ height: cardHeight, top: stickyTop }}
      className="flex items-center justify-center sticky"
    >
      <motion.div
        style={{
          backgroundColor: data.color,
          scale,
          top: `calc(-5vh + ${i * 25}px)`,
        }}
        className="relative -top-[10%] flex h-[450px] w-[85%] max-w-5xl flex-col rounded-2xl p-8 origin-top md:w-[75%] md:p-10"
      >
        {renderContent ? (
          renderContent(data)
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-center">{data.title}</h2>
            <div className="mt-5 flex h-full gap-8">
              <div className="w-[40%] relative top-[10%]">
                <p className="text-sm leading-relaxed">{data.description}</p>
                {data.href && (
                  <a
                    href={data.href}
                    className="mt-3 inline-flex items-center gap-2 text-sm underline"
                  >
                    See more
                    <svg width="18" height="10" viewBox="0 0 22 12" fill="none">
                      <path
                        d="M21.5303 6.53033C21.8232 6.23744 21.8232 5.76256 21.5303 5.46967L16.7574 0.696699C16.4645 0.403806 15.9896 0.403806 15.6967 0.696699C15.4038 0.989592 15.4038 1.46447 15.6967 1.75736L19.9393 6L15.6967 10.2426C15.4038 10.5355 15.4038 11.0104 15.6967 11.3033C15.9896 11.5962 16.4645 11.5962 16.7574 11.3033L21.5303 6.53033ZM0 6.75L21 6.75V5.25L0 5.25L0 6.75Z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                )}
              </div>
              <div className="relative h-full w-[60%] overflow-hidden rounded-xl">
                <motion.div className="h-full w-full" style={{ scale: imageScale }}>
                  <img
                    src={data.imageUrl}
                    alt={data.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </motion.div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

interface StackingCardsProps {
  items: StackingCardData[]
  className?: string
  renderContent?: (data: StackingCardData) => React.ReactNode
  cardHeight?: string
  stickyTop?: string
}

export function StackingCards({ items,className,renderContent,cardHeight,stickyTop }: StackingCardsProps) {
  const container = useRef(null)
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start","end end"],
  })

  return (
    <div ref={container} className={cn("relative",className)}>
      {items.map((item,i) => {
        const targetScale = 1 - (items.length - i) * 0.05
        return (
          <StackingCard
            key={i}
            i={i}
            data={item}
            progress={scrollYProgress}
            range={[i * (1 / items.length),1]}
            targetScale={targetScale}
            renderContent={renderContent}
            cardHeight={cardHeight}
            stickyTop={stickyTop}
          />
        )
      })}
    </div>
  )
}
