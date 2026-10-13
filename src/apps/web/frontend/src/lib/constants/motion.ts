/** Shared framer-motion curves; CSS uses the matching --ease-out and --ease-spring tokens. */
export const MOTION_EASE_OUT = [0.22, 1, 0.36, 1] as const
export const MOTION_EASE_SPRING = [0.34, 1.4, 0.64, 1] as const

/** Shared framer timings in seconds. */
export const MOTION_DURATION = {
  fast: 0.12,
  base: 0.2,
  fold: 0.3,
  turn: 0.35,
  slow: 0.45,
  pill: 0.5,
  page: 0.55,
} as const
