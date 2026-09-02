/**
 * Animated Transitions System for Idexal Agents.
 * Provides smooth, physics-based animations for all UI transitions
 * with configurable intensity and performance optimization.
 */

/** Animation type */
export type AnimationType =
  | 'fade'
  | 'slide'
  | 'scale'
  | 'rotate'
  | 'bounce'
  | 'spring'
  | 'elastic'
  | 'back'
  | 'flip'
  | 'blur'

/** Animation direction */
export type AnimationDirection = 'up' | 'down' | 'left' | 'right' | 'none'

/** Easing function type */
export type EasingFunction = (t: number) => number

/** Animation keyframe */
export interface AnimationKeyframe {
  /** Time offset (0-1) */
  offset: number
  /** Transform properties */
  transform?: {
    translateX?: number | string
    translateY?: number | string
    scale?: number
    rotate?: number
    rotateX?: number
    rotateY?: number
  }
  /** Opacity */
  opacity?: number
  /** Other CSS properties */
  properties?: Record<string, string | number>
}

/** Animation configuration */
export interface AnimatedTransitionConfig {
  /** Animation type */
  type: AnimationType
  /** Direction */
  direction: AnimationDirection
  /** Duration in ms */
  duration: number
  /** Delay in ms */
  delay: number
  /** Easing function */
  easing: EasingFunction
  /** Spring physics */
  spring?: {
    stiffness: number
    damping: number
    mass: number
  }
  /** Stagger children */
  stagger?: number
  /** Viewport-based trigger */
  viewport?: {
    threshold: number
    once: boolean
  }
}

/** Animation state */
export interface AnimationState {
  /** Is playing */
  isPlaying: boolean
  /** Current progress (0-1) */
  progress: number
  /** Current value */
  currentValue: number
  /** Target value */
  targetValue: number
  /** Velocity */
  velocity: number
}

/** Transition group */
export interface TransitionGroup {
  /** Group ID */
  id: string
  /** Animations in group */
  animations: TransitionAnimationConfig[]
  /** Stagger delay between items */
  staggerDelay: number
  /** Total duration */
  totalDuration: number
}

/** Animation config for single element */
export interface TransitionAnimationConfig {
  /** Element selector or ref */
  element: string
  /** Animation type */
  type: AnimationType
  /** Duration in ms */
  duration: number
  /** Delay in ms */
  delay: number
  /** Direction */
  direction: AnimationDirection
}

/**
 * Animated Transitions Engine.
 */
export class AnimatedTransitionsEngine {
  private listeners: Set<(event: AnimationEvent) => void> = new Set()
  private intensity: number = 1.0

  constructor() {
    this.setupReducedMotion()
  }

  private setupReducedMotion(): void {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      this.intensity = 0.1
    }
    mq.addEventListener('change', (e) => {
      this.intensity = e.matches ? 0.1 : 1.0
    })
  }

  /**
   * Set animation intensity.
   */
  setIntensity(value: number): void {
    this.intensity = Math.max(0, Math.min(1, value))
  }

  /**
   * Get easing functions.
   */
  static easings = {
    linear: (t: number) => t,
    easeInQuad: (t: number) => t * t,
    easeOutQuad: (t: number) => t * (2 - t),
    easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t: number) => t * t * t,
    easeOutCubic: (t: number) => (--t) * t * t + 1,
    easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeOutBack: (t: number) => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) },
    easeOutElastic: (t: number) => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
    easeOutBounce: (t: number) => {
      const n1 = 7.5625; const d1 = 2.75
      if (t < 1 / d1) return n1 * t * t
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    },
  }

  /**
   * Generate keyframes for animation type.
   */
  generateKeyframes(config: AnimatedTransitionConfig): AnimationKeyframe[] {
    const { type, direction } = config

    switch (type) {
      case 'fade':
        return [
          { offset: 0, opacity: 0 },
          { offset: 1, opacity: 1 },
        ]
      case 'slide':
        return this.getSlideKeyframes(direction)
      case 'scale':
        return [
          { offset: 0, transform: { scale: 0.8 }, opacity: 0 },
          { offset: 1, transform: { scale: 1 }, opacity: 1 },
        ]
      case 'bounce':
        return [
          { offset: 0, transform: { translateY: -30 }, opacity: 0 },
          { offset: 0.5, transform: { translateY: 5 } },
          { offset: 0.75, transform: { translateY: -2 } },
          { offset: 1, transform: { translateY: 0 }, opacity: 1 },
        ]
      case 'spring':
        return [
          { offset: 0, transform: { scale: 0.5 }, opacity: 0 },
          { offset: 1, transform: { scale: 1 }, opacity: 1 },
        ]
      case 'flip':
        return [
          { offset: 0, transform: { rotateY: 90 }, opacity: 0 },
          { offset: 1, transform: { rotateY: 0 }, opacity: 1 },
        ]
      default:
        return [
          { offset: 0, opacity: 0 },
          { offset: 1, opacity: 1 },
        ]
    }
  }

  private getSlideKeyframes(direction: AnimationDirection): AnimationKeyframe[] {
    switch (direction) {
      case 'up':
        return [
          { offset: 0, transform: { translateY: 20 }, opacity: 0 },
          { offset: 1, transform: { translateY: 0 }, opacity: 1 },
        ]
      case 'down':
        return [
          { offset: 0, transform: { translateY: -20 }, opacity: 0 },
          { offset: 1, transform: { translateY: 0 }, opacity: 1 },
        ]
      case 'left':
        return [
          { offset: 0, transform: { translateX: 20 }, opacity: 0 },
          { offset: 1, transform: { translateX: 0 }, opacity: 1 },
        ]
      case 'right':
        return [
          { offset: 0, transform: { translateX: -20 }, opacity: 0 },
          { offset: 1, transform: { translateX: 0 }, opacity: 1 },
        ]
      default:
        return [
          { offset: 0, opacity: 0 },
          { offset: 1, opacity: 1 },
        ]
    }
  }

  /**
   * Calculate spring physics value.
   */
  spring(
    t: number,
    config: { stiffness: number; damping: number; mass: number } = { stiffness: 100, damping: 10, mass: 1 }
  ): number {
    const { stiffness, damping, mass } = config
    const omega = Math.sqrt(stiffness / mass)
    const zeta = damping / (2 * Math.sqrt(stiffness * mass))

    if (zeta < 1) {
      const omegaD = omega * Math.sqrt(1 - zeta * zeta)
      return 1 - Math.exp(-zeta * omega * t) * (
        Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t)
      )
    }
    return 1 - (1 + omega * t) * Math.exp(-omega * t)
  }

  /**
   * Animate a property value.
   */
  animate(
    from: number,
    to: number,
    config: AnimatedTransitionConfig,
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ): () => void {
    const startTime = performance.now()
    const duration = config.duration * this.intensity
    const delay = config.delay * this.intensity
    let cancelled = false

    const tick = (now: number) => {
      if (cancelled) return

      const elapsed = now - startTime - delay
      if (elapsed < 0) {
        requestAnimationFrame(tick)
        return
      }

      let t = Math.min(elapsed / duration, 1)
      t = config.easing(t)

      if (config.type === 'spring' && config.spring) {
        t = this.spring(elapsed / duration, config.spring)
      }

      const value = from + (to - from) * t
      onUpdate(value)

      if (t < 1) {
        requestAnimationFrame(tick)
      } else {
        onComplete?.()
      }
    }

    requestAnimationFrame(tick)

    return () => { cancelled = true }
  }

  /**
   * Create stagger animation for multiple elements.
   */
  stagger(
    elements: number,
    config: AnimatedTransitionConfig,
    onElementUpdate: (index: number, value: number) => void,
    onComplete?: () => void
  ): () => void {
    const staggerDelay = config.stagger ?? 50
    const cancellations: (() => void)[] = []
    let completed = 0

    for (let i = 0; i < elements; i++) {
      const cancel = this.animate(
        0, 1,
        { ...config, delay: config.delay + i * staggerDelay },
        (value) => onElementUpdate(i, value),
        () => {
          completed++
          if (completed === elements) onComplete?.()
        }
      )
      cancellations.push(cancel)
    }

    return () => cancellations.forEach(c => c())
  }

  /**
   * Generate CSS transition string.
   */
  toCSSTransition(config: AnimatedTransitionConfig): string {
    const props = ['opacity', 'transform']
    return props.map(p => `${p} ${config.duration}ms ${config.easing.toString()} ${config.delay}ms`).join(', ')
  }

  /**
   * Generate CSS animation keyframes as string.
   */
  toCSSKeyframes(name: string, config: AnimatedTransitionConfig): string {
    const keyframes = this.generateKeyframes(config)
    const frames = keyframes.map(kf => {
      const transforms: string[] = []
      if (kf.transform) {
        if (kf.transform.translateX) transforms.push(`translateX(${kf.transform.translateX}px)`)
        if (kf.transform.translateY) transforms.push(`translateY(${kf.transform.translateY}px)`)
        if (kf.transform.scale) transforms.push(`scale(${kf.transform.scale})`)
        if (kf.transform.rotate) transforms.push(`rotate(${kf.transform.rotate}deg)`)
      }
      const rules: string[] = []
      if (transforms.length) rules.push(`transform: ${transforms.join(' ')}`)
      if (kf.opacity !== undefined) rules.push(`opacity: ${kf.opacity}`)
      return `  ${(kf.offset * 100).toFixed(0)}% { ${rules.join('; ')} }`
    })

    return `@keyframes ${name} {\n${frames.join('\n')}\n}`
  }

  /**
   * Create a transition group.
   */
  createGroup(
    groupId: string,
    animations: TransitionAnimationConfig[],
    staggerDelay: number = 50
  ): TransitionGroup {
    const totalDuration = animations.reduce(
      (max, a) => Math.max(max, a.delay + a.duration),
      0
    ) + (animations.length - 1) * staggerDelay

    const group: TransitionGroup = {
      id: groupId,
      animations,
      staggerDelay,
      totalDuration,
    }

    return group
  }

  /**
   * Generate predefined transition presets.
   */
  static presets: Record<string, AnimatedTransitionConfig> = {
    fadeIn: {
      type: 'fade',
      direction: 'none',
      duration: 300,
      delay: 0,
      easing: AnimatedTransitionsEngine.easings.easeOutCubic,
    },
    slideUp: {
      type: 'slide',
      direction: 'up',
      duration: 400,
      delay: 0,
      easing: AnimatedTransitionsEngine.easings.easeOutCubic,
    },
    slideDown: {
      type: 'slide',
      direction: 'down',
      duration: 400,
      delay: 0,
      easing: AnimatedTransitionsEngine.easings.easeOutCubic,
    },
    scaleIn: {
      type: 'scale',
      direction: 'none',
      duration: 300,
      delay: 0,
      easing: AnimatedTransitionsEngine.easings.easeOutBack,
    },
    bounceIn: {
      type: 'bounce',
      direction: 'none',
      duration: 500,
      delay: 0,
      easing: AnimatedTransitionsEngine.easings.linear,
    },
    springIn: {
      type: 'spring',
      direction: 'none',
      duration: 600,
      delay: 0,
      easing: AnimatedTransitionsEngine.easings.linear,
      spring: { stiffness: 100, damping: 10, mass: 1 },
    },
    flipIn: {
      type: 'flip',
      direction: 'none',
      duration: 500,
      delay: 0,
      easing: AnimatedTransitionsEngine.easings.easeOutCubic,
    },
  }

  /**
   * Subscribe to animation events.
   */
  subscribe(listener: (event: AnimationEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
}

/** Animation event */
export interface AnimationEvent {
  type: 'start' | 'update' | 'complete'
  animationId: string
  progress: number
  value: number
}

/** Singleton instance */
let instance: AnimatedTransitionsEngine | null = null

export function getAnimatedTransitionsEngine(): AnimatedTransitionsEngine {
  if (!instance) {
    instance = new AnimatedTransitionsEngine()
  }
  return instance
}

export function resetAnimatedTransitionsEngine(): void {
  instance = null
}
