import type { IconProps } from './icons/props.ts'

/** Display options for the official brand wordmark. */
export interface BrandWordmarkProps extends IconProps {
  /** Whether to include the leading Idexal mark; defaults to true. */
  includeMark?: boolean | undefined
}

/**
 * Render the full Idexal Agents wordmark using the official PNG logo.
 * @param props.size - height in px (default 24; width follows the selected artwork).
 * @param props.className - extra class for layout placement.
 * @param props.includeMark - whether to include the leading Idexal mark.
 * @returns the wordmark element (aria-hidden decorative brand art).
 */
export function BrandWordmark({ size = 24, className, includeMark = true }: BrandWordmarkProps) {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        height: size,
      }}
      aria-hidden="true"
    >
      {includeMark && (
        <img
          src="/icon.png"
          height={size}
          width={size}
          alt=""
          style={{ objectFit: 'contain' }}
        />
      )}
      <span
        style={{
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          fontSize: size * 0.75,
          fontWeight: 700,
          color: 'currentColor',
          letterSpacing: '-0.02em',
        }}
      >
        Idexal
      </span>
      <span
        style={{
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          fontSize: size * 0.55,
          fontWeight: 500,
          color: 'currentColor',
          opacity: 0.7,
          letterSpacing: '0.02em',
        }}
      >
        Agents
      </span>
    </div>
  )
}
