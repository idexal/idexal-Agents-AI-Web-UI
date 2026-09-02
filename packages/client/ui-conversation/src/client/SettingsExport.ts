/**
 * Settings Export/Import Engine for Idexal Agents.
 * Collects all user preferences from localStorage and supports
 * JSON export/import with versioning and validation.
 */

/** Known settings keys grouped by category */
export interface SettingsCategories {
  theme: Record<string, unknown>
  accessibility: Record<string, unknown>
  keyboardShortcuts: Record<string, unknown>
  locale: Record<string, unknown>
  conversation: Record<string, unknown>
  onboarding: Record<string, unknown>
  workspace: Record<string, unknown>
  trajectory: Record<string, unknown>
  custom: Record<string, unknown>
}

/** Export format version */
export const SETTINGS_EXPORT_VERSION = 1

/** Export file metadata */
export interface SettingsExportMeta {
  /** Export format version */
  version: number
  /** ISO timestamp of export */
  timestamp: string
  /** Application name */
  app: string
  /** Application version if available */
  appVersion?: string
  /** Total number of settings exported */
  totalSettings: number
  /** Categories included */
  categories: string[]
}

/** Full export payload */
export interface SettingsExportPayload {
  meta: SettingsExportMeta
  settings: SettingsCategories
}

/** Import result */
export interface SettingsImportResult {
  success: boolean
  /** Number of settings imported */
  imported: number
  /** Number of settings skipped (already identical) */
  skipped: number
  /** Any warnings during import */
  warnings: string[]
  /** Imported metadata */
  meta: SettingsExportMeta
}

/** Export result */
export interface SettingsExportResult {
  success: boolean
  /** JSON string of exported settings */
  json: string
  /** Export metadata */
  meta: SettingsExportMeta
  /** Number of settings exported */
  totalSettings: number
}

/** Settings key patterns by category */
const CATEGORY_PATTERNS: Record<keyof SettingsCategories, string[]> = {
  theme: ['idexal-theme', 'dsh.theme'],
  accessibility: ['idexal-a11y-preferences'],
  keyboardShortcuts: ['idexal-shortcuts'],
  locale: ['dsh.locale'],
  conversation: ['dsh.conversation.'],
  onboarding: ['idexal-wizard'],
  workspace: ['dsh.workspace.'],
  trajectory: ['dsh.trajectory.'],
  custom: [],
}

/** Keys to exclude from export (internal/transient) */
const EXCLUDED_KEYS = new Set([
  'dsh.sessions.current',
  'dsh-vitest-storage-probe',
])

/** Keys always included regardless of prefix match */
const INCLUDE_PREFIXES = ['idexal-', 'dsh.']

/**
 * Collect all settings from localStorage.
 */
export function collectSettings(): SettingsCategories {
  const categories: SettingsCategories = {
    theme: {},
    accessibility: {},
    keyboardShortcuts: {},
    locale: {},
    conversation: {},
    onboarding: {},
    workspace: {},
    trajectory: {},
    custom: {},
  }

  if (typeof localStorage === 'undefined') return categories

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || EXCLUDED_KEYS.has(key)) continue

    const value = localStorage.getItem(key)
    if (value === null) continue

    const parsed = parseValue(value)
    const category = categorizeKey(key)
    categories[category][key] = parsed
  }

  return categories
}

/**
 * Categorize a localStorage key.
 */
function categorizeKey(key: string): keyof SettingsCategories {
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (key === pattern || key.startsWith(pattern)) {
        return category as keyof SettingsCategories
      }
    }
  }
  return 'custom'
}

/**
 * Parse a stored value, preserving type information.
 */
function parseValue(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    // Return as string if not valid JSON
    return value
  }
}

/**
 * Count total settings across all categories.
 */
function countSettings(settings: SettingsCategories): number {
  let count = 0
  for (const category of Object.values(settings)) {
    count += Object.keys(category).length
  }
  return count
}

/**
 * Get list of categories that have settings.
 */
function getActiveCategories(settings: SettingsCategories): string[] {
  const active: string[] = []
  for (const [name, category] of Object.entries(settings)) {
    if (Object.keys(category).length > 0) {
      active.push(name)
    }
  }
  return active
}

/**
 * Export all settings to JSON.
 */
export function exportSettings(): SettingsExportResult {
  const settings = collectSettings()
  const totalSettings = countSettings(settings)
  const categories = getActiveCategories(settings)

  const meta: SettingsExportMeta = {
    version: SETTINGS_EXPORT_VERSION,
    timestamp: new Date().toISOString(),
    app: 'Idexal Agents',
    totalSettings,
    categories,
  }

  const payload: SettingsExportPayload = { meta, settings }
  const json = JSON.stringify(payload, null, 2)

  return {
    success: true,
    json,
    meta,
    totalSettings,
  }
}

/**
 * Import settings from a JSON string.
 */
export function importSettings(json: string): SettingsImportResult {
  const warnings: string[] = []
  let imported = 0
  let skipped = 0

  try {
    const payload: SettingsExportPayload = JSON.parse(json)

    // Validate structure
    if (!payload.meta || !payload.settings) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        warnings: ['Invalid export file: missing meta or settings'],
        meta: { version: 0, timestamp: '', app: '', totalSettings: 0, categories: [] },
      }
    }

    // Version check
    if (payload.meta.version > SETTINGS_EXPORT_VERSION) {
      warnings.push(
        `Export was created with a newer version (v${payload.meta.version}). Some settings may not be recognized.`
      )
    }

    // Source check
    if (payload.meta.app !== 'Idexal Agents') {
      warnings.push(
        `Export was created for "${payload.meta.app}". Settings may not be compatible.`
      )
    }

    // Apply settings
    if (typeof localStorage !== 'undefined') {
      for (const [, entries] of Object.entries(payload.settings)) {
        if (typeof entries !== 'object' || entries === null) continue

        for (const [key, value] of Object.entries(entries as Record<string, unknown>)) {
          if (EXCLUDED_KEYS.has(key)) continue

          const newValue = typeof value === 'string' ? value : JSON.stringify(value)
          const existingValue = localStorage.getItem(key)

          if (existingValue === newValue) {
            skipped++
            continue
          }

          try {
            localStorage.setItem(key, newValue)
            imported++
          } catch {
            warnings.push(`Failed to write setting: ${key}`)
          }
        }
      }
    }

    return {
      success: true,
      imported,
      skipped,
      warnings,
      meta: payload.meta,
    }
  } catch {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      warnings: ['Failed to parse export file. Ensure it is valid JSON.'],
      meta: { version: 0, timestamp: '', app: '', totalSettings: 0, categories: [] },
    }
  }
}

/**
 * Clear all settings (with optional category filter).
 */
export function clearSettings(category?: keyof SettingsCategories): number {
  if (typeof localStorage === 'undefined') return 0

  let cleared = 0
  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || EXCLUDED_KEYS.has(key)) continue

    if (category) {
      const keyCategory = categorizeKey(key)
      if (keyCategory !== category) continue
    }

    // Only clear Idexal/DSH settings
    const isOurs = INCLUDE_PREFIXES.some((p) => key.startsWith(p))
    if (!isOurs) continue

    keysToRemove.push(key)
  }

  for (const key of keysToRemove) {
    localStorage.removeItem(key)
    cleared++
  }

  return cleared
}

/**
 * Generate a filename for the export.
 */
export function getExportFilename(): string {
  const date = new Date()
  const dateStr = date.toISOString().split('T')[0] ?? ''
  const timeStr = (date.toTimeString().split(' ')[0] ?? '').replace(/:/g, '-')
  return `idexal-agents-settings-${dateStr}_${timeStr}.json`
}

/**
 * Trigger a download of the settings file.
 */
export function downloadSettings(result: SettingsExportResult): void {
  if (typeof document === 'undefined') return

  const blob = new Blob([result.json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = getExportFilename()
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Read a file as text (for file picker).
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Get a summary of settings to be exported.
 */
export function getSettingsSummary(): {
  total: number
  byCategory: Record<string, number>
  keys: string[]
} {
  const settings = collectSettings()
  const byCategory: Record<string, number> = {}
  const keys: string[] = []

  for (const [name, category] of Object.entries(settings)) {
    const count = Object.keys(category).length
    if (count > 0) {
      byCategory[name] = count
      keys.push(...Object.keys(category))
    }
  }

  return { total: keys.length, byCategory, keys }
}

/** Settings export translations */
export const SETTINGS_EXPORT_TRANSLATIONS = {
  en: {
    title: '📤 Export / Import Settings',
    exportTab: 'Export',
    importTab: 'Import',
    exportDesc: 'Download all your settings as a JSON file',
    importDesc: 'Import settings from a previously exported file',
    exportButton: 'Export Settings',
    importButton: 'Import Settings',
    chooseFile: 'Choose File',
    totalSettings: '{count} settings',
    byCategory: 'By Category',
    preview: 'Preview',
    importResult: 'Import Result',
    imported: '{count} settings imported',
    skipped: '{count} settings unchanged',
    warnings: 'Warnings',
    noSettings: 'No settings to export',
    confirmImport: 'This will overwrite your current settings. Continue?',
    confirmClear: 'This will reset all settings in this category. Continue?',
    clearAll: 'Reset All Settings',
    success: 'Settings exported successfully!',
    error: 'Failed to import settings',
    categories: {
      theme: '🎨 Theme',
      accessibility: '♿ Accessibility',
      keyboardShortcuts: '⌨️ Keyboard Shortcuts',
      locale: '🌍 Language & Locale',
      conversation: '💬 Conversation',
      onboarding: '🚀 Onboarding',
      workspace: '📁 Workspace',
      trajectory: '📊 Trajectory',
      custom: '🔧 Custom',
    },
  },
  ar: {
    title: '📤 تصدير / استيراد الإعدادات',
    exportTab: 'تصدير',
    importTab: 'استيراد',
    exportDesc: 'تحميل جميع إعداداتك كملف JSON',
    importDesc: 'استيراد الإعدادات من ملف مُصدَّر سابقاً',
    exportButton: 'تصدير الإعدادات',
    importButton: 'استيراد الإعدادات',
    chooseFile: 'اختر ملف',
    totalSettings: '{count} إعداد',
    byCategory: 'حسب الفئة',
    preview: 'معاينة',
    importResult: 'نتيجة الاستيراد',
    imported: 'تم استيراد {count} إعداد',
    skipped: '{count} إعداد لم يتغير',
    warnings: 'تحذيرات',
    noSettings: 'لا توجد إعدادات للتصدير',
    confirmImport: 'سيتم استبدال إعداداتك الحالية. هل تتابع؟',
    confirmClear: 'سيتم إعادة تعيين جميع الإعدادات في هذه الفئة. هل تتابع؟',
    clearAll: 'إعادة تعيين جميع الإعدادات',
    success: 'تم تصدير الإعدادات بنجاح!',
    error: 'فشل استيراد الإعدادات',
    categories: {
      theme: '🎨 المظهر',
      accessibility: '♿ إمكانية الوصول',
      keyboardShortcuts: '⌨️ اختصارات لوحة المفاتيح',
      locale: '🌍 اللغة والموقع',
      conversation: '💬 المحادثة',
      onboarding: '🚀 التعريف',
      workspace: '📁 مساحة العمل',
      trajectory: '📊 المسار',
      custom: '🔧 مخصص',
    },
  },
  zh: {
    title: '📤 导出/导入设置',
    exportTab: '导出',
    importTab: '导入',
    exportDesc: '将所有设置下载为JSON文件',
    importDesc: '从之前导出的文件导入设置',
    exportButton: '导出设置',
    importButton: '导入设置',
    chooseFile: '选择文件',
    totalSettings: '{count} 个设置',
    byCategory: '按类别',
    preview: '预览',
    importResult: '导入结果',
    imported: '已导入 {count} 个设置',
    skipped: '{count} 个设置未更改',
    warnings: '警告',
    noSettings: '没有可导出的设置',
    confirmImport: '这将覆盖您当前的设置。继续吗？',
    confirmClear: '这将重置此类别中的所有设置。继续吗？',
    clearAll: '重置所有设置',
    success: '设置导出成功！',
    error: '导入设置失败',
    categories: {
      theme: '🎨 主题',
      accessibility: '♿ 无障碍',
      keyboardShortcuts: '⌨️ 快捷键',
      locale: '🌍 语言和区域',
      conversation: '💬 对话',
      onboarding: '🚀 引导',
      workspace: '📁 工作区',
      trajectory: '📊 轨迹',
      custom: '🔧 自定义',
    },
  },
} as const

export type SettingsExportLanguage = keyof typeof SETTINGS_EXPORT_TRANSLATIONS
