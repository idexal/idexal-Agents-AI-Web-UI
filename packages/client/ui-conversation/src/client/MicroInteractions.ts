/**
 * MicroInteractions Engine for Idexal Agents.
 * Provides animated micro-interactions, hover effects, and transitions for all UI components.
 */

/** Animation preset types */
export type AnimationPreset =
  | 'fade-in'
  | 'fade-out'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale-up'
  | 'scale-down'
  | 'bounce'
  | 'pulse'
  | 'shake'
  | 'spin'
  | 'wiggle'
  | 'flip'
  | 'rubber-band'
  | 'jello'
  | 'heart-beat'
  | 'swing'
  | 'tada'
  | 'wobble'

/** Hover effect types */
export type HoverEffect =
  | 'none'
  | 'lift'
  | 'glow'
  | 'scale'
  | 'brighten'
  | 'shadow'
  | 'border'
  | 'underline'
  | 'background'
  | 'rotate'
  | 'pulse'
  | 'shake'

/** Transition timing functions */
export type EasingFunction =
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'linear'
  | 'bounce'
  | 'elastic'
  | 'back'

/** Animation configuration */
export interface AnimationConfig {
  /** Duration in milliseconds */
  duration: number
  /** Easing function */
  easing: EasingFunction
  /** Delay before animation starts (ms) */
  delay: number
  /** Number of iterations */
  iterations: number
  /** Animation direction */
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  /** Fill mode */
  fillMode: 'none' | 'forwards' | 'backwards' | 'both'
}

/** Hover configuration */
export interface HoverConfig {
  /** Effect type */
  effect: HoverEffect
  /** Transition duration (ms) */
  duration: number
  /** Scale factor for scale effects */
  scale: number
  /** Shadow for lift/shadow effects */
  shadow: string
  /** Glow color */
  glowColor: string
  /** Border color on hover */
  borderColor: string
  /** Background color on hover */
  backgroundColor: string
}

/** Interaction event types */
export type InteractionEventType =
  | 'hover-start'
  | 'hover-end'
  | 'click'
  | 'double-click'
  | 'focus'
  | 'blur'
  | 'press'
  | 'release'
  | 'swipe'
  | 'drag-start'
  | 'drag-end'

/** Interaction event */
export interface InteractionEvent {
  type: InteractionEventType
  elementId: string
  timestamp: Date
  data: Record<string, unknown>
}

/** Micro-interactions configuration */
export interface MicroInteractionsConfig {
  /** Enable animations */
  enabled: boolean
  /** Respect reduced motion preference */
  respectReducedMotion: boolean
  /** Global animation duration multiplier */
  durationMultiplier: number
  /** Default hover effect */
  defaultHoverEffect: HoverEffect
  /** Default animation preset */
  defaultAnimation: AnimationPreset
  /** Enable ripple effect on click */
  enableRipple: boolean
  /** Ripple color */
  rippleColor: string
  /** Enable scroll animations */
  enableScrollAnimations: boolean
  /** Scroll animation threshold */
  scrollThreshold: number
}

/**
 * MicroInteractions Engine.
 */
export class MicroInteractionsEngine {
  private config: MicroInteractionsConfig
  private animations: Map<string, AnimationConfig> = new Map()
  private hovers: Map<string, HoverConfig> = new Map()
  private eventListeners = new Set<(event: InteractionEvent) => void>()
  private activeAnimations: Map<string, Animation> = new Map()

  constructor(config: Partial<MicroInteractionsConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      respectReducedMotion: config.respectReducedMotion ?? true,
      durationMultiplier: config.durationMultiplier ?? 1,
      defaultHoverEffect: config.defaultHoverEffect ?? 'lift',
      defaultAnimation: config.defaultAnimation ?? 'fade-in',
      enableRipple: config.enableRipple ?? true,
      rippleColor: config.rippleColor ?? 'rgba(255, 255, 255, 0.3)',
      enableScrollAnimations: config.enableScrollAnimations ?? true,
      scrollThreshold: config.scrollThreshold ?? 0.1,
    }

    this.registerDefaultAnimations()
    this.registerDefaultHovers()
  }

  // === Animation Management ===

  /** Register a custom animation */
  registerAnimation(name: string, config: AnimationConfig): void {
    this.animations.set(name, config)
  }

  /** Get animation config */
  getAnimation(name: string): AnimationConfig | undefined {
    return this.animations.get(name)
  }

  /** Play an animation on an element */
  playAnimation(element: HTMLElement, animationName: string): Promise<void> {
    if (!this.config.enabled) return Promise.resolve()
    if (this.config.respectReducedMotion && this.prefersReducedMotion()) return Promise.resolve()

    const animation = this.animations.get(animationName)
    if (!animation) return Promise.resolve()

    return new Promise((resolve) => {
      const keyframes = this.getKeyframes(animationName)
      if (!keyframes) {
        resolve()
        return
      }

      const adjustedDuration = animation.duration * this.config.durationMultiplier

      const anim = element.animate(keyframes, {
        duration: adjustedDuration,
        easing: this.getEasingValue(animation.easing),
        delay: animation.delay,
        iterations: animation.iterations,
        direction: animation.direction,
        fill: animation.fillMode,
      })

      this.activeAnimations.set(element.id, anim)

      anim.onfinish = () => {
        this.activeAnimations.delete(element.id)
        resolve()
      }
    })
  }

  /** Stop animation on an element */
  stopAnimation(elementId: string): void {
    const anim = this.activeAnimations.get(elementId)
    if (anim) {
      anim.cancel()
      this.activeAnimations.delete(elementId)
    }
  }

  /** Stop all animations */
  stopAllAnimations(): void {
    for (const [, anim] of this.activeAnimations) {
      anim.cancel()
    }
    this.activeAnimations.clear()
  }

  // === Hover Management ===

  /** Register a hover effect for an element */
  registerHover(elementId: string, config: HoverConfig): void {
    this.hovers.set(elementId, config)
  }

  /** Get hover styles for an element */
  getHoverStyles(elementId: string): { normal: React.CSSProperties; hover: React.CSSProperties } {
    const config = this.hovers.get(elementId) ?? this.getDefaultHoverConfig()
    return this.generateHoverStyles(config)
  }

  /** Generate hover style objects */
  private generateHoverStyles(config: HoverConfig): { normal: React.CSSProperties; hover: React.CSSProperties } {
    const duration = `${config.duration * this.config.durationMultiplier}ms`
    const transition = `all ${duration} cubic-bezier(0.4, 0, 0.2, 1)`

    const normal: React.CSSProperties = {
      transition,
      cursor: 'pointer',
    }

    const hover: React.CSSProperties = {}

    switch (config.effect) {
      case 'lift':
        hover.transform = `translateY(-${config.scale * 4}px)`
        hover.boxShadow = config.shadow || '0 10px 25px rgba(0, 0, 0, 0.15)'
        break
      case 'glow':
        hover.boxShadow = `0 0 ${config.scale * 20}px ${config.glowColor || 'rgba(59, 130, 246, 0.5)'}`
        break
      case 'scale':
        hover.transform = `scale(${1 + config.scale * 0.05})`
        break
      case 'brighten':
        hover.filter = 'brightness(1.1)'
        break
      case 'shadow':
        hover.boxShadow = config.shadow || '0 8px 24px rgba(0, 0, 0, 0.2)'
        break
      case 'border':
        hover.borderColor = config.borderColor || 'var(--color-primary, #3b82f6)'
        break
      case 'underline':
        hover.textDecoration = 'underline'
        hover.textUnderlineOffset = '4px'
        break
      case 'background':
        hover.backgroundColor = config.backgroundColor || 'var(--bg-hover, #f3f4f6)'
        break
      case 'rotate':
        hover.transform = `rotate(${config.scale}deg)`
        break
      case 'pulse':
        hover.animation = `pulse ${duration} infinite`
        break
      case 'shake':
        hover.animation = `shake ${duration} ease-in-out`
        break
    }

    return { normal, hover }
  }

  // === Ripple Effect ===

  /** Create a ripple effect on click */
  createRipple(event: React.MouseEvent, element: HTMLElement, color?: string): void {
    if (!this.config.enableRipple) return

    const rect = element.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const size = Math.max(rect.width, rect.height) * 2

    const ripple = document.createElement('span')
    ripple.className = 'micro-ripple'
    ripple.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      margin-left: -${size / 2}px;
      margin-top: -${size / 2}px;
      background: ${color || this.config.rippleColor};
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-expand 0.6s linear;
      pointer-events: none;
    `

    element.style.position = element.style.position || 'relative'
    element.style.overflow = 'hidden'
    element.appendChild(ripple)

    setTimeout(() => ripple.remove(), 600)
  }

  // === CSS Generation ===

  /** Generate CSS for animations */
  generateAnimationCSS(): string {
    return `
      @keyframes ripple-expand {
        to { transform: scale(1); opacity: 0; }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes slideInUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes slideInDown {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes slideInLeft {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideInRight {
        from { transform: translateX(20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes wiggle {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-5deg); }
        75% { transform: rotate(5deg); }
      }
      @keyframes heartBeat {
        0%, 100% { transform: scale(1); }
        25% { transform: scale(1.1); }
        50% { transform: scale(1); }
        75% { transform: scale(1.1); }
      }
      .animate-fade-in { animation: fadeIn ${this.config.durationMultiplier * 300}ms ease-out; }
      .animate-slide-up { animation: slideInUp ${this.config.durationMultiplier * 300}ms ease-out; }
      .animate-slide-down { animation: slideInDown ${this.config.durationMultiplier * 300}ms ease-out; }
      .animate-scale-in { animation: scaleIn ${this.config.durationMultiplier * 200}ms ease-out; }
      .animate-bounce { animation: bounce ${this.config.durationMultiplier * 500}ms ease-in-out infinite; }
      .animate-pulse { animation: pulse ${this.config.durationMultiplier * 2000}ms ease-in-out infinite; }
      .animate-spin { animation: spin ${this.config.durationMultiplier * 1000}ms linear infinite; }
      .animate-wiggle { animation: wiggle ${this.config.durationMultiplier * 500}ms ease-in-out; }
    `
  }

  // === Utility Methods ===

  /** Get keyframes for an animation */
  private getKeyframes(name: string): Keyframe[] | undefined {
    const keyframeMap: Record<string, Keyframe[]> = {
      'fade-in': [{ opacity: 0 }, { opacity: 1 }],
      'fade-out': [{ opacity: 1 }, { opacity: 0 }],
      'slide-up': [{ transform: 'translateY(20px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
      'slide-down': [{ transform: 'translateY(-20px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
      'slide-left': [{ transform: 'translateX(-20px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }],
      'slide-right': [{ transform: 'translateX(20px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }],
      'scale-up': [{ transform: 'scale(0.9)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      'scale-down': [{ transform: 'scale(1.1)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      'bounce': [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-10px)' },
        { transform: 'translateY(0)' },
      ],
      'pulse': [
        { transform: 'scale(1)' },
        { transform: 'scale(1.05)' },
        { transform: 'scale(1)' },
      ],
      'shake': [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(0)' },
      ],
      'spin': [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      'wiggle': [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-5deg)' },
        { transform: 'rotate(5deg)' },
        { transform: 'rotate(0deg)' },
      ],
    }
    return keyframeMap[name]
  }

  /** Get easing value */
  private getEasingValue(easing: EasingFunction): string {
    const easingMap: Record<EasingFunction, string> = {
      'ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
      'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      'linear': 'linear',
      'bounce': 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
      'elastic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      'back': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    }
    return easingMap[easing]
  }

  /** Check if user prefers reduced motion */
  private prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /** Register default animations */
  private registerDefaultAnimations(): void {
    const defaults: [string, AnimationConfig][] = [
      ['fade-in', { duration: 300, easing: 'ease-out', delay: 0, iterations: 1, direction: 'normal', fillMode: 'both' }],
      ['slide-up', { duration: 300, easing: 'ease-out', delay: 0, iterations: 1, direction: 'normal', fillMode: 'both' }],
      ['scale-up', { duration: 200, easing: 'ease-out', delay: 0, iterations: 1, direction: 'normal', fillMode: 'both' }],
    ]
    for (const [name, config] of defaults) {
      this.animations.set(name, config)
    }
  }

  /** Register default hover effects */
  private registerDefaultHovers(): void {
    this.hovers.set('default', {
      effect: 'lift',
      duration: 200,
      scale: 1,
      shadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      glowColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'var(--color-primary, #3b82f6)',
      backgroundColor: 'var(--bg-hover, #f3f4f6)',
    })
  }

  /** Get default hover config */
  private getDefaultHoverConfig(): HoverConfig {
    return this.hovers.get('default') ?? {
      effect: 'lift',
      duration: 200,
      scale: 1,
      shadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      glowColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: '#3b82f6',
      backgroundColor: '#f3f4f6',
    }
  }

  /** Destroy the engine */
  destroy(): void {
    this.stopAllAnimations()
    this.animations.clear()
    this.hovers.clear()
    this.eventListeners.clear()
  }
}

/** Singleton instance */
let instance: MicroInteractionsEngine | null = null

/** Get or create singleton */
export function getMicroInteractionsEngine(config?: Partial<MicroInteractionsConfig>): MicroInteractionsEngine {
  if (!instance) {
    instance = new MicroInteractionsEngine(config)
  }
  return instance
}

/** Reset singleton */
export function resetMicroInteractionsEngine(): void {
  instance?.destroy()
  instance = null
}

export default MicroInteractionsEngine
