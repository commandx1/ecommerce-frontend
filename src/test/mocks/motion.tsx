import { createElement, forwardRef, type ReactNode } from "react"
import { vi } from "vitest"

/** Props framer-motion owns; forwarding them to a DOM node triggers React unknown-prop warnings. */
const MOTION_ONLY_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "variants",
  "transition",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileDrag",
  "whileInView",
  "viewport",
  "layout",
  "layoutId",
  "layoutScroll",
  "layoutDependency",
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
  "onAnimationStart",
  "onAnimationComplete",
  "onUpdate",
  "onDragStart",
  "onDragEnd",
  "onDrag",
  "onHoverStart",
  "onHoverEnd",
  "onTapStart",
  "onTapCancel",
  "onTap",
  "onViewportEnter",
  "onViewportLeave",
  "custom",
  "style3d",
  "transformTemplate",
])

const stripMotionProps = (props: Record<string, unknown>): Record<string, unknown> => {
  const next: Record<string, unknown> = {}
  for (const key of Object.keys(props)) {
    if (!MOTION_ONLY_PROPS.has(key)) {
      next[key] = props[key]
    }
  }
  return next
}

const createMotionComponent = (tag: string) =>
  forwardRef<HTMLElement, Record<string, unknown>>((props, ref) =>
    createElement(tag, { ...stripMotionProps(props), ref }),
  )

/** `motion.div`, `motion.span`, ... resolve lazily through a Proxy so every tag is supported. */
export const motionProxy = new Proxy({} as Record<string, ReturnType<typeof createMotionComponent>>, {
  get: (target, key: string) => {
    if (!target[key]) {
      target[key] = createMotionComponent(key)
    }
    return target[key]
  },
})

export const AnimatePresence = ({ children }: { children?: ReactNode }) => <>{children}</>

export const MotionConfig = ({ children }: { children?: ReactNode }) => <>{children}</>

const motionValue = (initial: number) => ({
  get: () => initial,
  set: vi.fn(),
  on: vi.fn(() => () => undefined),
  onChange: vi.fn(() => () => undefined),
  destroy: vi.fn(),
  current: initial,
})

export const motionMock = () => ({
  motion: motionProxy,
  m: motionProxy,
  AnimatePresence,
  MotionConfig,
  LayoutGroup: MotionConfig,
  LazyMotion: MotionConfig,
  domAnimation: {},
  domMax: {},
  useReducedMotion: () => true,
  useScroll: () => ({
    scrollX: motionValue(0),
    scrollY: motionValue(0),
    scrollXProgress: motionValue(0),
    scrollYProgress: motionValue(0),
  }),
  useTransform: () => motionValue(0),
  useSpring: () => motionValue(0),
  useMotionValue: (initial = 0) => motionValue(initial),
  useMotionValueEvent: () => undefined,
  useMotionTemplate: () => motionValue(0),
  useInView: () => true,
  useAnimate: () => [{ current: null }, vi.fn()],
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn(), set: vi.fn() }),
  animate: vi.fn(),
  stagger: vi.fn(() => 0),
})

/** `lenis` (and its React binding) touch rAF + scroll APIs jsdom does not implement. */
export const lenisMock = () => {
  class Lenis {
    raf = vi.fn()
    scrollTo = vi.fn()
    on = vi.fn()
    off = vi.fn()
    start = vi.fn()
    stop = vi.fn()
    resize = vi.fn()
    destroy = vi.fn()
  }
  return { __esModule: true, default: Lenis, Lenis }
}
