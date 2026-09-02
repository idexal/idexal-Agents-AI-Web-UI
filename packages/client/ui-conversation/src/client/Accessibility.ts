/**
 * Accessibility Engine for Idexal Agents.
 * Provides ARIA utilities, keyboard navigation, screen reader support,
 * focus management, and WCAG 2.1 compliance helpers.
 */

/** Color contrast level */
export type ContrastLevel = 'AA' | 'AAA'

/** Screen reader mode */
export type ScreenReaderMode = 'auto' | 'on' | 'off'

/** Focus strategy */
export type FocusStrategy = 'tab' | 'arrow' | 'roving' | 'automatic'

/** Accessibility preference categories */
export type PreferenceCategory =
  | 'reduced-motion'
  | 'high-contrast'
  | 'large-text'
  | 'screen-reader'
  | 'keyboard-only'
  | 'color-blind'
  | 'focus-visible'

/** ARIA live region politeness */
export type LiveRegionPoliteness = 'off' | 'polite' | 'assertive' | 'rude'

/** Landmark types */
export type LandmarkType =
  | 'banner'
  | 'navigation'
  | 'main'
  | 'complementary'
  | 'contentinfo'
  | 'form'
  | 'region'
  | 'search'

/** Role types for common widgets */
export type WidgetRole =
  | 'button'
  | 'checkbox'
  | 'dialog'
  | 'gridcell'
  | 'link'
  | 'log'
  | 'marquee'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'option'
  | 'progressbar'
  | 'radio'
  | 'scrollbar'
  | 'searchbox'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'switch'
  | 'tab'
  | 'tabpanel'
  | 'textbox'
  | 'timer'
  | 'tooltip'
  | 'treeitem'

/** ARIA attribute builder entry */
export interface AriaAttributes {
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-live'?: LiveRegionPoliteness
  'aria-atomic'?: boolean
  'aria-busy'?: boolean
  'aria-controls'?: string
  'aria-current'?: string | boolean
  'aria-disabled'?: boolean
  'aria-expanded'?: boolean
  'aria-haspopup'?: string | boolean
  'aria-hidden'?: boolean
  'aria-invalid'?: boolean | 'grammar' | 'spelling'
  'aria-modal'?: boolean
  'aria-orientation'?: 'horizontal' | 'vertical' | 'undefined'
  'aria-placeholder'?: string
  'aria-pressed'?: boolean | 'mixed'
  'aria-readonly'?: boolean
  'aria-required'?: boolean
  'aria-selected'?: boolean
  'aria-sort'?: 'ascending' | 'descending' | 'none' | 'other'
  'aria-valuemax'?: number
  'aria-valuemin'?: number
  'aria-valuenow'?: number
  'aria-valuetext'?: string
  'aria-checked'?: boolean | 'mixed'
  'aria-autocomplete'?: 'inline' | 'list' | 'none' | 'both'
  'aria-activedescendant'?: string
  role?: string
  tabIndex?: number
}

/** Accessibility preferences */
export interface AccessibilityPreferences {
  /** Reduced motion preference */
  reducedMotion: boolean
  /** High contrast mode */
  highContrast: boolean
  /** Large text mode */
  largeText: boolean
  /** Screen reader mode */
  screenReader: ScreenReaderMode
  /** Keyboard-only navigation */
  keyboardOnly: boolean
  /** Color blind friendly mode */
  colorBlindFriendly: boolean
  /** Show focus indicators */
  focusVisible: boolean
  /** Announce page changes */
  announcePageChanges: boolean
  /** Announce status updates */
  announceStatusUpdates: boolean
  /** Auto-focus first element on page load */
  autoFocusOnLoad: boolean
  /** Trap focus in modals */
  trapFocusInModals: boolean
  /** Enable skip navigation links */
  skipNavigation: boolean
  /** Font size multiplier (1 = normal) */
  fontSizeMultiplier: number
  /** Line height multiplier (1 = normal) */
  lineHeightMultiplier: number
  /** Letter spacing multiplier (1 = normal) */
  letterSpacingMultiplier: number
}

/** Focus trap configuration */
export interface FocusTrapConfig {
  /** Element to trap focus within */
  container: HTMLElement
  /** Whether to auto-focus first focusable element */
  autoFocus: boolean
  /** Element to return focus to when trap is released */
  returnFocusTo: HTMLElement | null
  /** Callback when escape is pressed */
  onEscape: (() => void) | null
  /** Whether focus should wrap around */
  wrapFocus: boolean
  /** Selector for focusable elements */
  focusableSelector: string
}

/** Keyboard shortcut definition */
export interface KeyboardShortcutDef {
  /** Unique identifier */
  id: string
  /** Display name */
  name: string
  /** Description */
  description: string
  /** Key combination */
  keys: string[]
  /** Whether the shortcut is enabled */
  enabled: boolean
  /** Whether to prevent default */
  preventDefault: boolean
  /** Whether to stop propagation */
  stopPropagation: boolean
  /** Action to perform */
  action: () => void
  /** Category for grouping */
  category: string
}

/** Announce message configuration */
export interface AnnounceMessage {
  /** Message text */
  message: string
  /** Politeness level */
  politeness: LiveRegionPoliteness
  /** Timeout in ms (0 = no timeout) */
  timeout: number
  /** Unique id for deduplication */
  id?: string
}

/** Accessibility audit result */
export interface AccessibilityAuditResult {
  /** Rule id */
  rule: string
  /** Severity */
  severity: 'error' | 'warning' | 'info'
  /** Description */
  description: string
  /** Element that failed */
  element: HTMLElement | null
  /** Fix suggestion */
  fix: string
}

/** Accessibility state */
export interface AccessibilityState {
  preferences: AccessibilityPreferences
  activeShortcuts: KeyboardShortcutDef[]
  focusTrapActive: boolean
  liveRegionCount: number
  announcements: AnnounceMessage[]
}

/** Default preferences */
export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  screenReader: 'auto',
  keyboardOnly: false,
  colorBlindFriendly: false,
  focusVisible: true,
  announcePageChanges: true,
  announceStatusUpdates: true,
  autoFocusOnLoad: false,
  trapFocusInModals: true,
  skipNavigation: true,
  fontSizeMultiplier: 1,
  lineHeightMultiplier: 1,
  letterSpacingMultiplier: 1,
}

/** Default focusable selector */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ')

/** Accessibility translations */
export const A11Y_TRANSLATIONS = {
  en: {
    skipToContent: 'Skip to main content',
    skipToNavigation: 'Skip to navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    openDialog: 'Open dialog',
    closeDialog: 'Close dialog',
    previousItem: 'Previous item',
    nextItem: 'Next item',
    expand: 'Expand',
    collapse: 'Collapse',
    loading: 'Loading',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    required: 'Required',
    optional: 'Optional',
    selected: 'Selected',
    notSelected: 'Not selected',
    checked: 'Checked',
    notChecked: 'Not checked',
    expanded: 'Expanded',
    collapsed: 'Collapsed',
    pressed: 'Pressed',
    notPressed: 'Not pressed',
    sortAscending: 'Sorted ascending',
    sortDescending: 'Sorted descending',
    noResults: 'No results found',
    pageChanged: 'Page changed',
    itemAdded: 'Item added',
    itemRemoved: 'Item removed',
    actionCompleted: 'Action completed',
    formSubmitted: 'Form submitted',
    validationError: 'Validation error',
    charactersRemaining: '{count} characters remaining',
    leavePage: 'Leave page with unsaved changes?',
    audioDescriptionOn: 'Audio descriptions on',
    audioDescriptionOff: 'Audio descriptions off',
    captionsOn: 'Captions on',
    captionsOff: 'Captions off',
  },
  ar: {
    skipToContent: 'انتقل إلى المحتوى الرئيسي',
    skipToNavigation: 'انتقل إلى التنقل',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    openDialog: 'فتح مربع حوار',
    closeDialog: 'إغلاق مربع حوار',
    previousItem: 'العنصر السابق',
    nextItem: 'العنصر التالي',
    expand: 'توسيع',
    collapse: 'طي',
    loading: 'جاري التحميل',
    error: 'خطأ',
    success: 'نجاح',
    warning: 'تحذير',
    required: 'مطلوب',
    optional: 'اختياري',
    selected: 'محدد',
    notSelected: 'غير محدد',
    checked: 'محدد',
    notChecked: 'غير محدد',
    expanded: 'موسّع',
    collapsed: 'مضمّر',
    pressed: 'مضغوط',
    notPressed: 'غير مضغوط',
    sortAscending: 'ترتيب تصاعدي',
    sortDescending: 'ترتيب تنازلي',
    noResults: 'لم يتم العثور على نتائج',
    pageChanged: 'تم تغيير الصفحة',
    itemAdded: 'تمت إضافة العنصر',
    itemRemoved: 'تم حذف العنصر',
    actionCompleted: 'تمت العملية',
    formSubmitted: 'تم إرسال النموذج',
    validationError: 'خطأ في التحقق',
    charactersRemaining: '{count} حرف متبقي',
    leavePage: 'هل تريد مغادرة الصفحة بدون حفظ التغييرات؟',
    audioDescriptionOn: 'الوصف الصوتي مفعّل',
    audioDescriptionOff: 'الوصف الصوتي معطّل',
    captionsOn: 'الترجمة مفعّلة',
    captionsOff: 'الترجمة معطّلة',
  },
  zh: {
    skipToContent: '跳转到主要内容',
    skipToNavigation: '跳转到导航',
    openMenu: '打开菜单',
    closeMenu: '关闭菜单',
    openDialog: '打开对话框',
    closeDialog: '关闭对话框',
    previousItem: '上一项',
    nextItem: '下一项',
    expand: '展开',
    collapse: '折叠',
    loading: '加载中',
    error: '错误',
    success: '成功',
    warning: '警告',
    required: '必填',
    optional: '可选',
    selected: '已选择',
    notSelected: '未选择',
    checked: '已勾选',
    notChecked: '未勾选',
    expanded: '已展开',
    collapsed: '已折叠',
    pressed: '已按下',
    notPressed: '未按下',
    sortAscending: '升序排列',
    sortDescending: '降序排列',
    noResults: '未找到结果',
    pageChanged: '页面已更改',
    itemAdded: '项目已添加',
    itemRemoved: '项目已移除',
    actionCompleted: '操作已完成',
    formSubmitted: '表单已提交',
    validationError: '验证错误',
    charactersRemaining: '剩余 {count} 个字符',
    leavePage: '离开页面将丢失未保存的更改？',
    audioDescriptionOn: '音频描述已开启',
    audioDescriptionOff: '音频描述已关闭',
    captionsOn: '字幕已开启',
    captionsOff: '字幕已关闭',
  },
} as const

/**
 * Accessibility Engine class.
 */
export class AccessibilityEngine {
  private preferences: AccessibilityPreferences
  private shortcuts: Map<string, KeyboardShortcutDef> = new Map()
  private focusTrap: FocusTrapConfig | null = null
  private liveRegions: HTMLElement[] = []
  private announcements: AnnounceMessage[] = []
  private listeners: Set<(state: AccessibilityState) => void> = new Set()
  private language: keyof typeof A11Y_TRANSLATIONS = 'en'
  private skipNavElements: HTMLElement[] = []
  private previousFocusElement: HTMLElement | null = null

  constructor(config?: { language?: keyof typeof A11Y_TRANSLATIONS }) {
    this.language = config?.language ?? 'en'
    this.preferences = { ...DEFAULT_PREFERENCES }
    this.loadPreferences()
    this.detectSystemPreferences()
  }

  // ─── Preference Management ────────────────────────────

  /**
   * Get current accessibility preferences.
   */
  getPreferences(): Readonly<AccessibilityPreferences> {
    return this.preferences
  }

  /**
   * Update a single preference.
   */
  setPreference<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ): void {
    this.preferences[key] = value
    this.savePreferences()
    this.applyPreferences()
    this.notifyListeners()
  }

  /**
   * Update multiple preferences at once.
   */
  setPreferences(partial: Partial<AccessibilityPreferences>): void {
    Object.assign(this.preferences, partial)
    this.savePreferences()
    this.applyPreferences()
    this.notifyListeners()
  }

  /**
   * Reset preferences to defaults.
   */
  resetPreferences(): void {
    this.preferences = { ...DEFAULT_PREFERENCES }
    this.savePreferences()
    this.applyPreferences()
    this.notifyListeners()
  }

  /**
   * Detect system preferences from media queries.
   */
  detectSystemPreferences(): void {
    if (typeof window === 'undefined') return

    // Reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.preferences.reducedMotion = motionQuery.matches
    motionQuery.addEventListener('change', (e) => {
      this.preferences.reducedMotion = e.matches
      this.savePreferences()
      this.applyPreferences()
      this.notifyListeners()
    })

    // High contrast
    const contrastQuery = window.matchMedia('(prefers-contrast: more)')
    this.preferences.highContrast = contrastQuery.matches
    contrastQuery.addEventListener('change', (e) => {
      this.preferences.highContrast = e.matches
      this.savePreferences()
      this.applyPreferences()
      this.notifyListeners()
    })

    // Forced colors (Windows high contrast mode)
    const forcedColorsQuery = window.matchMedia('(forced-colors: active)')
    if (forcedColorsQuery.matches) {
      this.preferences.highContrast = true
    }
  }

  // ─── ARIA Attribute Helpers ───────────────────────────

  /**
   * Build ARIA attributes for a widget.
   */
  buildAriaAttributes(config: {
    role?: string
    label?: string
    labelledBy?: string
    describedBy?: string
    live?: LiveRegionPoliteness
    expanded?: boolean
    selected?: boolean
    checked?: boolean | 'mixed'
    disabled?: boolean
    required?: boolean
    invalid?: boolean
    readOnly?: boolean
    current?: string | boolean
    hasPopup?: string | boolean
    controls?: string
    valuemin?: number
    valuemax?: number
    valuenow?: number
    valuetext?: string
    sort?: string
    orientation?: string
    modal?: boolean
    hidden?: boolean
    busy?: boolean
    atomic?: boolean
  }): AriaAttributes {
    const attrs: AriaAttributes = {}
    if (config.role) attrs.role = config.role
    if (config.label) attrs['aria-label'] = config.label
    if (config.labelledBy) attrs['aria-labelledby'] = config.labelledBy
    if (config.describedBy) attrs['aria-describedby'] = config.describedBy
    if (config.live) attrs['aria-live'] = config.live
    if (config.expanded !== undefined) attrs['aria-expanded'] = config.expanded
    if (config.selected !== undefined) attrs['aria-selected'] = config.selected
    if (config.checked !== undefined) attrs['aria-checked'] = config.checked
    if (config.disabled !== undefined) attrs['aria-disabled'] = config.disabled
    if (config.required !== undefined) attrs['aria-required'] = config.required
    if (config.invalid !== undefined) attrs['aria-invalid'] = config.invalid
    if (config.readOnly !== undefined) attrs['aria-readonly'] = config.readOnly
    if (config.current !== undefined) attrs['aria-current'] = config.current
    if (config.hasPopup !== undefined) attrs['aria-haspopup'] = config.hasPopup
    if (config.controls) attrs['aria-controls'] = config.controls
    if (config.valuemin !== undefined) attrs['aria-valuemin'] = config.valuemin
    if (config.valuemax !== undefined) attrs['aria-valuemax'] = config.valuemax
    if (config.valuenow !== undefined) attrs['aria-valuenow'] = config.valuenow
    if (config.valuetext) attrs['aria-valuetext'] = config.valuetext
    if (config.sort) attrs['aria-sort'] = config.sort as 'ascending' | 'descending' | 'none' | 'other'
    if (config.orientation) attrs['aria-orientation'] = config.orientation as 'horizontal' | 'vertical' | 'undefined'
    if (config.modal !== undefined) attrs['aria-modal'] = config.modal
    if (config.hidden !== undefined) attrs['aria-hidden'] = config.hidden
    if (config.busy !== undefined) attrs['aria-busy'] = config.busy
    if (config.atomic !== undefined) attrs['aria-atomic'] = config.atomic
    return attrs
  }

  /**
   * Create a live region element for announcements.
   */
  createLiveRegion(
    politeness: LiveRegionPoliteness = 'polite',
    id?: string
  ): HTMLElement {
    if (typeof document === 'undefined') {
      return null as unknown as HTMLElement
    }

    const region = document.createElement('div')
    region.setAttribute('role', 'status')
    region.setAttribute('aria-live', politeness)
    region.setAttribute('aria-atomic', 'true')
    region.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `
    if (id) region.id = id

    document.body.appendChild(region)
    this.liveRegions.push(region)
    return region
  }

  /**
   * Announce a message to screen readers.
   */
  announce(message: AnnounceMessage): void {
    if (typeof document === 'undefined') return
    if (!this.preferences.announceStatusUpdates && message.politeness === 'polite') return

    this.announcements.push(message)

    // Deduplicate by id
    if (message.id) {
      this.announcements = this.announcements.filter(
        (a) => a.id !== message.id || a === message
      )
    }

    // Find or create appropriate live region
    let region = this.liveRegions.find(
      (r) => r.getAttribute('aria-live') === message.politeness
    )
    if (!region) {
      region = this.createLiveRegion(message.politeness)
    }

    // Clear and set message
    if (region) {
      region.textContent = ''
      requestAnimationFrame(() => {
        if (region) region.textContent = message.message
      })
    }

    // Auto-clear
    if (message.timeout > 0) {
      setTimeout(() => {
        if (region && region.textContent === message.message) {
          region.textContent = ''
        }
      }, message.timeout)
    }

    this.notifyListeners()
  }

  /**
   * Get translations for current language.
   */
  getTranslations(): typeof A11Y_TRANSLATIONS['en'] {
    return A11Y_TRANSLATIONS[this.language] as typeof A11Y_TRANSLATIONS['en']
  }

  // ─── Keyboard Navigation ──────────────────────────────

  /**
   * Register a keyboard shortcut.
   */
  registerShortcut(shortcut: KeyboardShortcutDef): void {
    this.shortcuts.set(shortcut.id, shortcut)
    this.notifyListeners()
  }

  /**
   * Unregister a keyboard shortcut.
   */
  unregisterShortcut(id: string): void {
    this.shortcuts.delete(id)
    this.notifyListeners()
  }

  /**
   * Enable or disable a keyboard shortcut.
   */
  setShortcutEnabled(id: string, enabled: boolean): void {
    const shortcut = this.shortcuts.get(id)
    if (shortcut) {
      shortcut.enabled = enabled
      this.notifyListeners()
    }
  }

  /**
   * Get all registered shortcuts.
   */
  getShortcuts(): KeyboardShortcutDef[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * Handle keyboard events for registered shortcuts.
   */
  handleKeyboardEvent(event: KeyboardEvent): boolean {
    const key = this.getEventKey(event)

    for (const shortcut of this.shortcuts.values()) {
      if (!shortcut.enabled) continue

      const matches = shortcut.keys.length === 1
        ? shortcut.keys[0] === key
        : this.matchesKeyCombo(event, shortcut.keys)

      if (matches) {
        if (shortcut.preventDefault) event.preventDefault()
        if (shortcut.stopPropagation) event.stopPropagation()
        shortcut.action()
        return true
      }
    }

    return false
  }

  /**
   * Get a string representation of a keyboard event.
   */
  getEventKey(event: KeyboardEvent): string {
    const parts: string[] = []
    if (event.ctrlKey || event.metaKey) parts.push('Mod')
    if (event.altKey) parts.push('Alt')
    if (event.shiftKey) parts.push('Shift')
    parts.push(event.key)
    return parts.join('+')
  }

  /**
   * Check if event matches a key combo.
   */
  private matchesKeyCombo(event: KeyboardEvent, keys: string[]): boolean {
    if (keys.length === 1) return this.getEventKey(event) === keys[0]

    const required = new Set(keys.map((k) => k.toLowerCase()))
    const modifiers = new Set<string>()
    if (event.ctrlKey || event.metaKey) modifiers.add('mod')
    if (event.altKey) modifiers.add('alt')
    if (event.shiftKey) modifiers.add('shift')

    const allModifiersMatch =
      required.has('mod') === modifiers.has('mod') &&
      required.has('alt') === modifiers.has('alt') &&
      required.has('shift') === modifiers.has('shift')

    const mainKey = keys.find(
      (k) => !['mod', 'alt', 'shift'].includes(k.toLowerCase())
    )
    const eventMainKey = event.key.toLowerCase()

    return allModifiersMatch && mainKey?.toLowerCase() === eventMainKey
  }

  // ─── Focus Management ─────────────────────────────────

  /**
   * Get all focusable elements within a container.
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    return Array.from(elements).filter(
      (el) => !el.hasAttribute('disabled') && el.tabIndex >= 0
    )
  }

  /**
   * Move focus to the next focusable element.
   */
  focusNext(container: HTMLElement, current?: HTMLElement): HTMLElement | null {
    const elements = this.getFocusableElements(container)
    if (elements.length === 0) return null

    const currentIndex = current
      ? elements.indexOf(current)
      : -1
    const nextIndex = (currentIndex + 1) % elements.length

    elements[nextIndex]?.focus()
    return elements[nextIndex] ?? null
  }

  /**
   * Move focus to the previous focusable element.
   */
  focusPrevious(container: HTMLElement, current?: HTMLElement): HTMLElement | null {
    const elements = this.getFocusableElements(container)
    if (elements.length === 0) return null

    const currentIndex = current
      ? elements.indexOf(current)
      : elements.length
    const prevIndex = (currentIndex - 1 + elements.length) % elements.length

    elements[prevIndex]?.focus()
    return elements[prevIndex] ?? null
  }

  /**
   * Focus the first focusable element in a container.
   */
  focusFirst(container: HTMLElement): HTMLElement | null {
    const elements = this.getFocusableElements(container)
    elements[0]?.focus()
    return elements[0] ?? null
  }

  /**
   * Focus the last focusable element in a container.
   */
  focusLast(container: HTMLElement): HTMLElement | null {
    const elements = this.getFocusableElements(container)
    const last = elements[elements.length - 1]
    last?.focus()
    return last ?? null
  }

  /**
   * Trap focus within a container (for modals, dialogs).
   */
  trapFocus(config: FocusTrapConfig): () => void {
    this.previousFocusElement = document.activeElement as HTMLElement
    this.focusTrap = config

    if (config.autoFocus) {
      this.focusFirst(config.container)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const elements = this.getFocusableElements(config.container)
        if (elements.length === 0) return

        const first = elements[0]
        const last = elements[elements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            if (config.wrapFocus) {
              last?.focus()
            } else {
              config.returnFocusTo?.focus()
            }
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            if (config.wrapFocus) {
              first?.focus()
            } else {
              config.returnFocusTo?.focus()
            }
          }
        }
      }

      if (e.key === 'Escape' && config.onEscape) {
        config.onEscape()
      }
    }

    config.container.addEventListener('keydown', handleKeyDown)

    // Return cleanup function
    return () => {
      config.container.removeEventListener('keydown', handleKeyDown)
      this.focusTrap = null
      this.previousFocusElement?.focus()
    }
  }

  /**
   * Release current focus trap.
   */
  releaseFocus(): void {
    this.previousFocusElement?.focus()
    this.previousFocusElement = null
    this.focusTrap = null
  }

  /**
   * Save current focus and restore later.
   */
  saveFocus(): HTMLElement | null {
    this.previousFocusElement = document.activeElement as HTMLElement
    return this.previousFocusElement
  }

  /**
   * Restore previously saved focus.
   */
  restoreFocus(): void {
    this.previousFocusElement?.focus()
    this.previousFocusElement = null
  }

  // ─── Skip Navigation ──────────────────────────────────

  /**
   * Create skip navigation links.
   */
  createSkipNavigation(targets: { id: string; label: string }[]): HTMLElement[] {
    const t = this.getTranslations()
    const links: HTMLElement[] = []

    if (typeof document === 'undefined') return links

    const nav = document.createElement('nav')
    nav.setAttribute('aria-label', 'Skip navigation')
    nav.className = 'skip-navigation'
    nav.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      z-index: 99999;
      display: flex;
      gap: 8px;
      padding: 8px;
      background: #1a1a1a;
      color: white;
      transform: translateY(-100%);
      transition: transform 0.2s;
    `

    for (const target of targets) {
      const link = document.createElement('a')
      link.href = `#${target.id}`
      link.textContent = target.label || t.skipToContent
      link.className = 'skip-link'
      link.style.cssText = `
        padding: 8px 16px;
        background: #4a90d9;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-weight: 500;
      `
      link.addEventListener('click', () => {
        const targetEl = document.getElementById(target.id)
        if (targetEl) {
          targetEl.tabIndex = -1
          targetEl.focus()
        }
      })
      nav.appendChild(link)
      links.push(link)
    }

    // Show skip nav on Tab
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        nav.style.transform = 'translateY(0)'
      }
    })

    // Hide on blur
    document.addEventListener('focusout', () => {
      if (!nav.contains(document.activeElement as Node)) {
        nav.style.transform = 'translateY(-100%)'
      }
    })

    document.body.prepend(nav)
    this.skipNavElements = links
    return links
  }

  /**
   * Remove skip navigation links.
   */
  removeSkipNavigation(): void {
    for (const link of this.skipNavElements) {
      link.parentElement?.removeChild(link)
    }
    this.skipNavElements = []
  }

  // ─── Color Contrast ───────────────────────────────────

  /**
   * Calculate relative luminance of a color.
   */
  getRelativeLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex)
    if (!rgb) return 0

    const mapped = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    )
    const r = mapped[0]!
    const g = mapped[1]!
    const b = mapped[2]!

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  /**
   * Calculate contrast ratio between two colors.
   */
  getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getRelativeLuminance(color1)
    const l2 = this.getRelativeLuminance(color2)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  /**
   * Check if color pair meets WCAG contrast requirements.
   */
  meetsContrastRequirement(
    color1: string,
    color2: string,
    level: ContrastLevel = 'AA',
    isLargeText = false
  ): boolean {
    const ratio = this.getContrastRatio(color1, color2)

    if (level === 'AAA') {
      return isLargeText ? ratio >= 4.5 : ratio >= 7
    }
    // AA
    return isLargeText ? ratio >= 3 : ratio >= 4.5
  }

  /**
   * Get suggested color for contrast compliance.
   */
  suggestContrastColor(
    foreground: string,
    background: string,
    level: ContrastLevel = 'AA'
  ): string {
    if (this.meetsContrastRequirement(foreground, background, level)) {
      return foreground
    }

    // Try darkening or lightening foreground
    const fgRgb = this.hexToRgb(foreground)
    if (!fgRgb) return '#000000'

    const bgLum = this.getRelativeLuminance(background)

    // If background is light, darken foreground
    if (bgLum > 0.5) {
      for (let factor = 0.9; factor >= 0; factor -= 0.1) {
        const darker = this.rgbToHex(
          Math.round(fgRgb.r * factor),
          Math.round(fgRgb.g * factor),
          Math.round(fgRgb.b * factor)
        )
        if (this.meetsContrastRequirement(darker, background, level)) {
          return darker
        }
      }
      return '#000000'
    }

    // If background is dark, lighten foreground
    for (let factor = 1.1; factor <= 3; factor += 0.1) {
      const lighter = this.rgbToHex(
        Math.min(255, Math.round(fgRgb.r * factor)),
        Math.min(255, Math.round(fgRgb.g * factor)),
        Math.min(255, Math.round(fgRgb.b * factor))
      )
      if (this.meetsContrastRequirement(lighter, background, level)) {
        return lighter
      }
    }
    return '#FFFFFF'
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    if (!match) return null
    return {
      r: parseInt(match[1]!, 16),
      g: parseInt(match[2]!, 16),
      b: parseInt(match[3]!, 16),
    }
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
  }

  // ─── Accessibility Audit ──────────────────────────────

  /**
   * Run accessibility audit on an element and its descendants.
   */
  auditElement(root: HTMLElement): AccessibilityAuditResult[] {
    const results: AccessibilityAuditResult[] = []

    // Check images for alt text
    const images = root.querySelectorAll('img')
    images.forEach((img) => {
      if (!img.hasAttribute('alt')) {
        results.push({
          rule: 'img-alt',
          severity: 'error',
          description: 'Image is missing alt attribute',
          element: img,
          fix: 'Add alt attribute with descriptive text, or alt="" for decorative images',
        })
      }
    })

    // Check buttons for accessible names
    const buttons = root.querySelectorAll('button')
    buttons.forEach((btn) => {
      if (
        !btn.textContent?.trim() &&
        !btn.getAttribute('aria-label') &&
        !btn.getAttribute('aria-labelledby')
      ) {
        results.push({
          rule: 'button-name',
          severity: 'error',
          description: 'Button has no accessible name',
          element: btn,
          fix: 'Add text content, aria-label, or aria-labelledby',
        })
      }
    })

    // Check form inputs for labels
    const inputs = root.querySelectorAll('input, select, textarea')
    inputs.forEach((input) => {
      if (
        input.getAttribute('type') === 'hidden' ||
        input.getAttribute('type') === 'submit' ||
        input.getAttribute('type') === 'button'
      ) {
        return
      }

      const hasLabel =
        input.getAttribute('aria-label') ||
        input.getAttribute('aria-labelledby') ||
        input.id && root.querySelector(`label[for="${input.id}"]`)

      if (!hasLabel) {
        results.push({
          rule: 'input-label',
          severity: 'error',
          description: 'Form input has no associated label',
          element: input as HTMLElement,
          fix: 'Add a label element, aria-label, or aria-labelledby',
        })
      }
    })

    // Check heading hierarchy
    const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let previousLevel = 0
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName[1]!)
      if (previousLevel > 0 && level > previousLevel + 1) {
        results.push({
          rule: 'heading-order',
          severity: 'warning',
          description: `Heading level skipped from h${previousLevel} to h${level}`,
          element: heading as HTMLElement,
          fix: `Use h${previousLevel + 1} instead of h${level}`,
        })
      }
      previousLevel = level
    })

    // Check links for accessible names
    const links = root.querySelectorAll('a')
    links.forEach((link) => {
      if (
        !link.textContent?.trim() &&
        !link.getAttribute('aria-label') &&
        !link.querySelector('img[alt]')
      ) {
        results.push({
          rule: 'link-name',
          severity: 'warning',
          description: 'Link has no accessible name',
          element: link as HTMLElement,
          fix: 'Add text content or aria-label',
        })
      }
    })

    // Check ARIA roles
    const ariaElements = root.querySelectorAll('[role]')
    ariaElements.forEach((el) => {
      const role = el.getAttribute('role')
      const requiredProps = this.getRequiredAriaProps(role!)
      for (const prop of requiredProps) {
        if (!el.hasAttribute(prop)) {
          results.push({
            rule: 'aria-required-props',
            severity: 'error',
            description: `Element with role="${role}" is missing required property: ${prop}`,
            element: el as HTMLElement,
            fix: `Add the ${prop} attribute`,
          })
        }
      }
    })

    // Check color contrast (simplified)
    const textElements = root.querySelectorAll('p, span, a, h1, h2, h3, h4, h5, h6, label, button')
    textElements.forEach((el) => {
      const computed = window.getComputedStyle(el)
      const color = computed.color
      const bg = computed.backgroundColor

      if (color && bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        const colorHex = this.cssColorToHex(color)
        const bgHex = this.cssColorToHex(bg)

        if (colorHex && bgHex) {
          const ratio = this.getContrastRatio(colorHex, bgHex)
          const isLarge = parseInt(computed.fontSize) >= 18 ||
            (parseInt(computed.fontSize) >= 14 && computed.fontWeight === 'bold')

          if (ratio < (isLarge ? 3 : 4.5)) {
            results.push({
              rule: 'color-contrast',
              severity: 'warning',
              description: `Insufficient color contrast ratio: ${ratio.toFixed(2)}:1`,
              element: el as HTMLElement,
              fix: 'Increase contrast between text and background colors',
            })
          }
        }
      }
    })

    // Check tabindex values
    const tabindexElements = root.querySelectorAll('[tabindex]')
    tabindexElements.forEach((el) => {
      const value = parseInt(el.getAttribute('tabindex') || '0')
      if (value > 0) {
        results.push({
          rule: 'tabindex',
          severity: 'warning',
          description: 'Positive tabindex can cause unexpected focus order',
          element: el as HTMLElement,
          fix: 'Use tabindex="0" or "-1" and manage focus order programmatically',
        })
      }
    })

    return results
  }

  private getRequiredAriaProps(role: string): string[] {
    const requirements: Record<string, string[]> = {
      checkbox: ['aria-checked'],
      combobox: ['aria-expanded'],
      heading: ['aria-level'],
      meter: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
      progressbar: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
      radio: ['aria-checked'],
      scrollbox: ['aria-orientation'],
      slider: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
      spinbutton: ['aria-valuemin', 'aria-valuemax'],
      switch: ['aria-checked'],
      tab: ['aria-selected'],
    }
    return requirements[role] || []
  }

  private cssColorToHex(cssColor: string): string | null {
    const match = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (!match) return null
    return this.rgbToHex(parseInt(match[1]!), parseInt(match[2]!), parseInt(match[3]!))
  }

  // ─── Preference Persistence ───────────────────────────

  private loadPreferences(): void {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('idexal-a11y-preferences')
      if (stored) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) }
      }
    } catch {
      // Ignore parse errors
    }
  }

  private savePreferences(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('idexal-a11y-preferences', JSON.stringify(this.preferences))
    } catch {
      // Ignore storage errors
    }
  }

  private applyPreferences(): void {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    // Reduced motion
    if (this.preferences.reducedMotion) {
      root.style.setProperty('--a11y-animation-duration', '0s')
    } else {
      root.style.removeProperty('--a11y-animation-duration')
    }

    // High contrast
    root.classList.toggle('a11y-high-contrast', this.preferences.highContrast)

    // Large text
    root.classList.toggle('a11y-large-text', this.preferences.largeText)
    if (this.preferences.fontSizeMultiplier !== 1) {
      root.style.setProperty('--a11y-font-scale', String(this.preferences.fontSizeMultiplier))
    } else {
      root.style.removeProperty('--a11y-font-scale')
    }

    // Focus visible
    root.classList.toggle('a11y-focus-visible', this.preferences.focusVisible)

    // Keyboard only
    root.classList.toggle('a11y-keyboard-only', this.preferences.keyboardOnly)

    // Color blind
    root.classList.toggle('a11y-color-blind', this.preferences.colorBlindFriendly)

    // Line height
    if (this.preferences.lineHeightMultiplier !== 1) {
      root.style.setProperty('--a11y-line-height', String(this.preferences.lineHeightMultiplier))
    } else {
      root.style.removeProperty('--a11y-line-height')
    }

    // Letter spacing
    if (this.preferences.letterSpacingMultiplier !== 1) {
      root.style.setProperty('--a11y-letter-spacing', String(this.preferences.letterSpacingMultiplier))
    } else {
      root.style.removeProperty('--a11y-letter-spacing')
    }
  }

  // ─── Subscription ─────────────────────────────────────

  /**
   * Subscribe to state changes.
   */
  subscribe(listener: (state: AccessibilityState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Get current state.
   */
  getState(): AccessibilityState {
    return {
      preferences: this.preferences,
      activeShortcuts: this.getShortcuts().filter((s) => s.enabled),
      focusTrapActive: this.focusTrap !== null,
      liveRegionCount: this.liveRegions.length,
      announcements: [...this.announcements],
    }
  }

  /**
   * Set language.
   */
  setLanguage(lang: keyof typeof A11Y_TRANSLATIONS): void {
    this.language = lang
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    // Remove live regions
    for (const region of this.liveRegions) {
      region.parentElement?.removeChild(region)
    }
    this.liveRegions = []

    // Remove skip navigation
    this.removeSkipNavigation()

    // Release focus trap
    this.releaseFocus()

    // Clear shortcuts
    this.shortcuts.clear()
    this.listeners.clear()
    this.announcements = []
  }

  private notifyListeners(): void {
    const state = this.getState()
    for (const listener of this.listeners) {
      try {
        listener(state)
      } catch (error) {
        console.error('Accessibility listener error:', error)
      }
    }
  }
}

/**
 * Singleton instance.
 */
let instance: AccessibilityEngine | null = null

export function getAccessibilityEngine(
  config?: { language?: keyof typeof A11Y_TRANSLATIONS }
): AccessibilityEngine {
  if (!instance) {
    instance = new AccessibilityEngine(config)
  }
  return instance
}

export function resetAccessibilityEngine(): void {
  instance?.destroy()
  instance = null
}

/**
 * Format a key combination for display.
 */
export function formatKeyCombo(keys: string[]): string {
  return keys
    .map((key) => {
      switch (key.toLowerCase()) {
        case 'mod':
        case 'ctrl':
          return navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'
        case 'alt':
          return navigator.platform.includes('Mac') ? '⌥' : 'Alt'
        case 'shift':
          return navigator.platform.includes('Mac') ? '⇧' : 'Shift'
        case 'enter':
          return '↵'
        case 'escape':
          return 'Esc'
        case ' ':
          return 'Space'
        default:
          return key.length === 1 ? key.toUpperCase() : key
      }
    })
    .join(navigator.platform.includes('Mac') ? '' : '+')
}
