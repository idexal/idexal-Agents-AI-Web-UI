/**
 * RTL-Aware UI Components for Idexal Agents.
 * Components that automatically adapt to text direction.
 */

import React from 'react'
import { useRTLState, useRTLStyles } from './RTLIntegration.ts'

/** RTL-aware Stack (horizontal/vertical) */
export interface RTLStackProps {
  children: React.ReactNode
  direction?: 'horizontal' | 'vertical'
  gap?: string | number
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between'
  className?: string
  style?: React.CSSProperties
}

export function RTLStack({
  children,
  direction = 'horizontal',
  gap = '8px',
  align = 'start',
  justify = 'start',
  className = '',
  style,
}: RTLStackProps) {
  const { isRTL } = useRTLState()

  const alignItems = align === 'start' ? 'flex-start'
    : align === 'end' ? 'flex-end'
    : align === 'center' ? 'center'
    : 'stretch'

  const justifyContent = justify === 'start' ? 'flex-start'
    : justify === 'end' ? 'flex-end'
    : justify === 'center' ? 'center'
    : 'space-between'

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: direction === 'horizontal'
          ? (isRTL ? 'row-reverse' : 'row')
          : 'column',
        gap: typeof gap === 'number' ? `${gap}px` : gap,
        alignItems,
        justifyContent,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** RTL-aware Box with start/end padding and margin */
export interface RTLBoxProps {
  children: React.ReactNode
  paddingStart?: string | number
  paddingEnd?: string | number
  marginStart?: string | number
  marginEnd?: string | number
  className?: string
  style?: React.CSSProperties
}

export function RTLBox({
  children,
  paddingStart,
  paddingEnd,
  marginStart,
  marginEnd,
  className = '',
  style,
}: RTLBoxProps) {
  const styles = useRTLStyles()

  return (
    <div
      className={className}
      style={{
        ...(paddingStart !== undefined ? styles.paddingStart(paddingStart) : {}),
        ...(paddingEnd !== undefined ? styles.paddingEnd(paddingEnd) : {}),
        ...(marginStart !== undefined ? styles.marginStart(marginStart) : {}),
        ...(marginEnd !== undefined ? styles.marginEnd(marginEnd) : {}),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** RTL-aware Text with alignment */
export interface RTLTextProps {
  children: React.ReactNode
  align?: 'start' | 'end' | 'center'
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  className?: string
  style?: React.CSSProperties
}

export function RTLText({
  children,
  align = 'start',
  as: Component = 'p',
  className = '',
  style,
}: RTLTextProps) {
  const { isRTL } = useRTLState()

  const textAlign = align === 'start'
    ? (isRTL ? 'right' : 'left')
    : align === 'end'
    ? (isRTL ? 'left' : 'right')
    : 'center'

  return (
    <Component
      className={className}
      style={{ textAlign, ...style }}
    >
      {children}
    </Component>
  )
}

/** RTL-aware Icon with text */
export interface RTLIconTextProps {
  icon: React.ReactNode
  children: React.ReactNode
  iconPosition?: 'start' | 'end'
  gap?: string | number
  className?: string
  style?: React.CSSProperties
}

export function RTLIconText({
  icon,
  children,
  iconPosition = 'start',
  gap = '8px',
  className = '',
  style,
}: RTLIconTextProps) {
  const { isRTL } = useRTLState()

  const showIconFirst = iconPosition === 'start' ? !isRTL : isRTL

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: typeof gap === 'number' ? `${gap}px` : gap,
        ...style,
      }}
    >
      {showIconFirst && <span className="icon">{icon}</span>}
      <span className="text">{children}</span>
      {!showIconFirst && <span className="icon">{icon}</span>}
    </span>
  )
}

/** RTL-aware Arrow that flips based on direction */
export interface RTLArrowProps {
  direction?: 'start' | 'end' | 'up' | 'down'
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function RTLArrow({
  direction = 'end',
  size = 16,
  className = '',
  style,
}: RTLArrowProps) {
  const { isRTL } = useRTLState()

  let symbol = ''

  if (direction === 'start') {
    symbol = isRTL ? '\u2192' : '\u2190'
  } else if (direction === 'end') {
    symbol = isRTL ? '\u2190' : '\u2192'
  } else if (direction === 'up') {
    symbol = '\u2191'
  } else {
    symbol = '\u2193'
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size,
        lineHeight: 1,
        transform: isRTL && (direction === 'start' || direction === 'end')
          ? 'scaleX(-1)'
          : undefined,
        ...style,
      }}
      aria-hidden="true"
    >
      {symbol}
    </span>
  )
}

/** RTL-aware Checkbox/Label layout */
export interface RTLCheckProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: React.ReactNode
  id?: string
  disabled?: boolean
  className?: string
}

export function RTLCheck({
  checked,
  onChange,
  label,
  id,
  disabled = false,
  className = '',
}: RTLCheckProps) {
  const { isRTL } = useRTLState()

  return (
    <label
      htmlFor={id}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        gap: '8px',
        flexDirection: isRTL ? 'row-reverse' : 'row',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
      <span>{label}</span>
    </label>
  )
}

/** RTL-aware Button group */
export interface RTLButtonGroupProps {
  children: React.ReactNode
  direction?: 'horizontal' | 'vertical'
  gap?: string | number
  className?: string
  style?: React.CSSProperties
}

export function RTLButtonGroup({
  children,
  direction = 'horizontal',
  gap = '8px',
  className = '',
  style,
}: RTLButtonGroupProps) {
  const { isRTL } = useRTLState()

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: direction === 'horizontal'
          ? (isRTL ? 'row-reverse' : 'row')
          : 'column',
        gap: typeof gap === 'number' ? `${gap}px` : gap,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default {
  RTLStack,
  RTLBox,
  RTLText,
  RTLIconText,
  RTLArrow,
  RTLCheck,
  RTLButtonGroup,
}
