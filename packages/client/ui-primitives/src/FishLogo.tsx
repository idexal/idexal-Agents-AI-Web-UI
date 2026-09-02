import type { IconProps } from './icons/props.ts'

/** Native viewBox of {@link FISH_LOGO_PATH} (width and height in user units). */
export const FISH_LOGO_VIEWBOX = { width: 48, height: 48 }

/** The Idexal icon path data, exported for consumers that compose their own svg. */
export const FISH_LOGO_PATH = 'M24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20S35 4 24 4z'

/**
 * Render the official Idexal logo mark using the official PNG.
 * @param props.size - width in px (default 24; height follows the 1:1 ratio).
 * @param props.className - extra class for layout placement.
 * @returns the logo image (aria-hidden; pair with the wordmark for accessibility).
 */
export function FishLogo({ size = 24, className }: IconProps) {
  return (
    <img
      src="/logo.png"
      width={size}
      height={size}
      className={className}
      alt="Idexal Agents"
      aria-hidden="true"
      style={{ objectFit: 'contain' }}
    />
  )
}
