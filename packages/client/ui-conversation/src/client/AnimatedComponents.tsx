/**
 * Animated Components for Idexal Agents.
 * Provides pre-built animated wrappers with micro-interactions.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getMicroInteractionsEngine, type HoverEffect } from './MicroInteractions'

/** Animation wrapper props */
export interface AnimatedProps {
  children: React.ReactNode
  animation?: string
  hover?: HoverEffect
  delay?: number
  duration?: number
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

/**
 * Animated wrapper component with entrance and hover animations.
 */
export function Animated({
  children,
  animation = 'fade-in',
  hover = 'lift',
  delay = 0,
  duration = 300,
  className = '',
  style,
  onClick,
}: AnimatedProps) {
  const ref = useRef<HTMLDivElement>(null)
  const engine = getMicroInteractionsEngine()

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    el.style.opacity = '0'
    el.style.animationDelay = `${delay}ms`
    el.style.animationDuration = `${duration}ms`

    const timer = setTimeout(() => {
      el.style.opacity = '1'
      engine.playAnimation(el, animation)
    }, 50)

    return () => clearTimeout(timer)
  }, [animation, delay, duration, engine])

  const hoverStyles = engine.getHoverStyles('default')

  return (
    <div
      ref={ref}
      className={`animated ${className}`}
      style={{
        ...style,
        opacity: style?.opacity ?? 0,
        animation: `${animation} ${duration}ms ease-out ${delay}ms both`,
        transition: hoverStyles.normal.transition as string,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        switch (hover) {
          case 'lift':
            el.style.transform = 'translateY(-4px)'
            el.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)'
            break
          case 'scale':
            el.style.transform = 'scale(1.02)'
            break
          case 'glow':
            el.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)'
            break
          case 'brighten':
            el.style.filter = 'brightness(1.05)'
            break
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.transform = ''
        el.style.boxShadow = ''
        el.style.filter = ''
      }}
    >
      {children}
    </div>
  )
}

/** Ripple button props */
export interface RippleButtonProps {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  color?: string
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

/**
 * Button with ripple effect on click.
 */
export function RippleButton({
  children,
  onClick,
  color = 'rgba(255, 255, 255, 0.3)',
  disabled = false,
  className = '',
  style,
}: RippleButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const engine = getMicroInteractionsEngine()

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled || !ref.current) return
    engine.createRipple(e, ref.current, color)
    onClick?.(e)
  }, [disabled, engine, color, onClick])

  return (
    <button
      ref={ref}
      className={`ripple-btn ${className}`}
      onClick={handleClick}
      disabled={disabled}
      style={{
        ...style,
        position: 'relative',
        overflow: 'hidden',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {children}
      <style>{`
        .ripple-btn:active:not(:disabled) { transform: scale(0.98); }
        .ripple-btn:hover:not(:disabled) { filter: brightness(1.05); }
      `}</style>
    </button>
  )
}

/** Tooltip props */
export interface TooltipProps {
  children: React.ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

/**
 * Tooltip with animated appearance.
 */
export function Tooltip({ children, content, position = 'top', delay = 200 }: TooltipProps) {
  const [show, setShow] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!show || !triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const offset = 8

    let style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10000,
      padding: '6px 12px',
      background: 'var(--text-primary, #111827)',
      color: 'var(--bg-primary, #ffffff)',
      borderRadius: '6px',
      fontSize: '12px',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      animation: 'tooltipFadeIn 0.15s ease-out',
    }

    switch (position) {
      case 'top':
        style = { ...style, bottom: rect.bottom + offset, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' }
        break
      case 'bottom':
        style = { ...style, top: rect.bottom + offset, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' }
        break
      case 'left':
        style = { ...style, right: rect.right + offset, top: rect.top + rect.height / 2, transform: 'translateY(-50%)' }
        break
      case 'right':
        style = { ...style, left: rect.right + offset, top: rect.top + rect.height / 2, transform: 'translateY(-50%)' }
        break
    }

    setTooltipStyle(style)
  }, [show, position])

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setTimeout(() => setShow(true), delay)}
      onMouseLeave={() => setShow(false)}
      style={{ display: 'inline-block' }}
    >
      {children}
      {show && (
        <div style={tooltipStyle} className="tooltip">
          {content}
        </div>
      )}
      <style>{`
        .tooltip { animation: tooltipFadeIn 0.15s ease-out; }
        @keyframes tooltipFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

/** Accordion props */
export interface AccordionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

/**
 * Accordion with smooth expand/collapse animation.
 */
export function Accordion({ title, children, defaultOpen = false, className = '' }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div className={`accordion ${isOpen ? 'open' : ''} ${className}`}>
      <button className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <span>{title}</span>
        <span className={`accordion-icon ${isOpen ? 'rotated' : ''}`}>{'>'}</span>
      </button>
      <div
        ref={contentRef}
        className="accordion-content"
        style={{
          maxHeight: isOpen ? `${contentRef.current?.scrollHeight ?? 0}px` : '0',
          opacity: isOpen ? 1 : 0,
        }}
      >
        {children}
      </div>
      <style>{`
        .accordion { border: 1px solid var(--border-primary, #e5e7eb); border-radius: 8px; overflow: hidden; }
        .accordion-header { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 12px 16px; background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 500; }
        .accordion-header:hover { background: var(--bg-hover, #f9fafb); }
        .accordion-icon { transition: transform 0.2s ease; font-size: 12px; color: var(--text-secondary, #6b7280); }
        .accordion-icon.rotated { transform: rotate(90deg); }
        .accordion-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease, opacity 0.2s ease; }
      `}</style>
    </div>
  )
}

/** Notification toast props */
export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

/**
 * Toast notification with slide-in animation.
 */
export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onClose?.(), 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons: Record<string, string> = {
    success: '\u2705',
    error: '\u274C',
    warning: '\u26A0\uFE0F',
    info: '\u2139\uFE0F',
  }

  const colors: Record<string, string> = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  }

  return (
    <div
      className={`toast ${visible ? 'visible' : 'hidden'} ${type}`}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        padding: '12px 20px',
        background: colors[type],
        color: 'white',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 10000,
        transform: visible ? 'translateY(0)' : 'translateY(100px)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <span>{icons[type]}</span>
      <span>{message}</span>
    </div>
  )
}

/** Loading spinner props */
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

/**
 * Animated loading spinner.
 */
export function Spinner({ size = 'md', color = 'var(--color-primary, #3b82f6)' }: SpinnerProps) {
  const sizes = { sm: 16, md: 24, lg: 32 }
  const s = sizes[size]

  return (
    <div
      style={{
        width: s,
        height: s,
        border: `2px solid ${color}30`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: `spin ${s * 20}ms linear infinite`,
      }}
    />
  )
}

/** Progress bar props */
export interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  showLabel?: boolean
  animated?: boolean
}

/**
 * Animated progress bar.
 */
export function ProgressBar({ value, max = 100, color, showLabel = false, animated = true }: ProgressBarProps) {
  const percentage = Math.min(100, (value / max) * 100)

  return (
    <div className="progress-bar-container">
      <div
        className="progress-bar-fill"
        style={{
          width: `${percentage}%`,
          background: color || 'var(--color-primary, #3b82f6)',
          transition: animated ? 'width 0.5s ease-out' : 'none',
        }}
      />
      {showLabel && <span className="progress-label">{Math.round(percentage)}%</span>}
      <style>{`
        .progress-bar-container { position: relative; height: 8px; background: var(--bg-secondary, #f3f4f6); border-radius: 4px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease-out; }
        .progress-label { position: absolute; right: 0; top: -20px; font-size: 12px; color: var(--text-secondary, #6b7280); }
      `}</style>
    </div>
  )
}

/** Badge props */
export interface BadgeProps {
  children: React.ReactNode
  color?: string
  pulse?: boolean
  className?: string
}

/**
 * Animated badge with optional pulse effect.
 */
export function Badge({ children, color = 'var(--color-primary, #3b82f6)', pulse = false, className = '' }: BadgeProps) {
  return (
    <span
      className={`badge ${pulse ? 'pulse' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        background: `${color}20`,
        color: color,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        position: 'relative',
      }}
    >
      {children}
      {pulse && (
        <span
          className="badge-pulse"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            border: `2px solid ${color}`,
            animation: 'badgePulse 2s ease-out infinite',
          }}
        />
      )}
      <style>{`
        @keyframes badgePulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </span>
  )
}

/** Skeleton loader props */
export interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
}

/**
 * Animated skeleton loader.
 */
export function Skeleton({ width = '100%', height = 20, borderRadius = '4px', className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--bg-secondary, #f3f4f6) 25%, var(--bg-hover, #e5e7eb) 50%, var(--bg-secondary, #f3f4f6) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s infinite',
      }}
    />
  )
}

export default {
  Animated,
  RippleButton,
  Tooltip,
  Accordion,
  Toast,
  Spinner,
  ProgressBar,
  Badge,
  Skeleton,
}
