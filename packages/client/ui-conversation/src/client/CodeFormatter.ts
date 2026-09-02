/**
 * Code Snippet Formatter Engine for Idexal Agents.
 * Format, beautify, minify, and transform code with
 * configurable rules and language-specific patterns.
 */

/** Formatting language */
export type FormatLanguage = 'typescript' | 'javascript' | 'html' | 'css' | 'json' | 'markdown'

/** Format style */
export type FormatStyle = 'prettier' | 'standard' | 'airbnb' | 'custom'

/** Format result */
export interface FormatResult {
  id: string
  original: string
  formatted: string
  language: FormatLanguage
  style: FormatStyle
  changes: number
  linesChanged: number
  timestamp: number
}

/** Format config */
export interface CodeFormatterConfig {
  defaultStyle: FormatStyle
  tabWidth: number
  useTabs: boolean
  semicolons: boolean
  singleQuotes: boolean
  trailingComma: boolean
  printWidth: number
}

/**
 * Code Snippet Formatter Engine.
 */
export class CodeFormatterEngine {
  private config: CodeFormatterConfig
  private listeners: Set<(event: FormatterEvent) => void> = new Set()

  constructor(config: Partial<CodeFormatterConfig> = {}) {
    this.config = {
      defaultStyle: config.defaultStyle ?? 'prettier',
      tabWidth: config.tabWidth ?? 2,
      useTabs: config.useTabs ?? false,
      semicolons: config.semicolons ?? true,
      singleQuotes: config.singleQuotes ?? true,
      trailingComma: config.trailingComma ?? true,
      printWidth: config.printWidth ?? 80,
    }
  }

  /**
   * Format code.
   */
  format(code: string, language: FormatLanguage, style?: FormatStyle): FormatResult {
    const fmtStyle = style ?? this.config.defaultStyle
    let formatted = code

    // Apply language-specific formatting
    switch (language) {
      case 'typescript':
      case 'javascript':
        formatted = this.formatJS(code)
        break
      case 'html':
        formatted = this.formatHTML(code)
        break
      case 'css':
        formatted = this.formatCSS(code)
        break
      case 'json':
        formatted = this.formatJSON(code)
        break
      case 'markdown':
        formatted = this.formatMarkdown(code)
        break
    }

    // Apply style-specific rules
    if (fmtStyle === 'prettier') {
      formatted = this.applyPrettierRules(formatted, language)
    }

    // Calculate changes
    const originalLines = code.split('\n')
    const formattedLines = formatted.split('\n')
    let changes = 0
    let linesChanged = 0
    const maxLines = Math.max(originalLines.length, formattedLines.length)

    for (let i = 0; i < maxLines; i++) {
      if ((originalLines[i] ?? '') !== (formattedLines[i] ?? '')) {
        linesChanged++
        changes += Math.abs((originalLines[i] ?? '').length - (formattedLines[i] ?? '').length)
      }
    }

    const result: FormatResult = {
      id: `fmt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      original: code,
      formatted,
      language,
      style: fmtStyle,
      changes,
      linesChanged,
      timestamp: Date.now(),
    }

    this.notifyListeners({ type: 'code-formatted', result })
    return result
  }

  /**
   * Minify code.
   */
  minify(code: string, language: FormatLanguage): string {
    if (language === 'json') {
      try {
        return JSON.stringify(JSON.parse(code))
      } catch { /* ignore */ }
    }

    if (language === 'css') {
      return code
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,])\s*/g, '$1')
        .trim()
    }

    // Generic minification
    return code
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,=+\-<>!&|])\s*/g, '$1')
      .trim()
  }

  /**
   * Beautify code (opposite of minify).
   */
  beautify(code: string, language: FormatLanguage): string {
    return this.format(code, language).formatted
  }

  /**
   * Convert between quote styles.
   */
  convertQuotes(code: string, toSingle: boolean): string {
    if (toSingle) {
      return code.replace(/"/g, "'").replace(/\\'/g, '"').replace(/'([^']*)'/g, "'$1'")
    }
    return code.replace(/'/g, '"').replace(/"([^"]*)"/g, '"$1"')
  }

  /**
   * Sort imports.
   */
  sortImports(code: string): string {
    const lines = code.split('\n')
    const imports: string[] = []
    const nonImports: string[] = []

    for (const line of lines) {
      if (line.trim().startsWith('import ') || line.trim().startsWith('from ')) {
        imports.push(line)
      } else {
        nonImports.push(line)
      }
    }

    // Sort imports: external first, then internal
    const external = imports.filter(i => !i.includes('./') && !i.includes('../'))
    const internal = imports.filter(i => i.includes('./') || i.includes('../'))

    external.sort()
    internal.sort()

    return [...external, ...internal, '', ...nonImports].join('\n')
  }

  private formatJS(code: string): string {
    let formatted = code

    // Fix indentation
    const lines = formatted.split('\n')
    let indent = 0
    const formattedLines: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        formattedLines.push('')
        continue
      }

      // Decrease indent for closing braces
      if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
        indent = Math.max(0, indent - 1)
      }

      formattedLines.push(this.config.useTabs
        ? '\t'.repeat(indent) + trimmed
        : ' '.repeat(indent * this.config.tabWidth) + trimmed
      )

      // Increase indent for opening braces
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
        indent++
      }
    }

    formatted = formattedLines.join('\n')

    // Fix spacing around operators
    formatted = formatted.replace(/([^=!<>])=(?!=)/g, '$1 = ')
    formatted = formatted.replace(/([^ !<>])=(?!=)/g, '$1 = ')

    return formatted
  }

  private formatHTML(code: string): string {
    let formatted = code
    let indent = 0
    const lines = formatted.split('\n')
    const formattedLines: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        formattedLines.push('')
        continue
      }

      if (trimmed.startsWith('</')) {
        indent = Math.max(0, indent - 1)
      }

      formattedLines.push(' '.repeat(indent * this.config.tabWidth) + trimmed)

      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
        indent++
      }
    }

    return formattedLines.join('\n')
  }

  private formatCSS(code: string): string {
    let formatted = code
    let indent = 0
    const lines = formatted.split('\n')
    const formattedLines: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        formattedLines.push('')
        continue
      }

      if (trimmed === '}') {
        indent = Math.max(0, indent - 1)
      }

      formattedLines.push(' '.repeat(indent * this.config.tabWidth) + trimmed)

      if (trimmed.endsWith('{')) {
        indent++
      }
    }

    return formattedLines.join('\n')
  }

  private formatJSON(code: string): string {
    try {
      const parsed = JSON.parse(code)
      return JSON.stringify(parsed, null, this.config.tabWidth)
    } catch {
      return code
    }
  }

  private formatMarkdown(code: string): string {
    return code
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^(#{1,6})\s+/gm, '$1 ')
      .replace(/\*\*\s+/g, '**')
      .replace(/\s+\*\*/g, '**')
  }

  private applyPrettierRules(code: string, _language: FormatLanguage): string {
    let formatted = code

    // Semicolons
    if (!this.config.semicolons) {
      formatted = formatted.replace(/;$/gm, '')
    }

    // Single quotes
    if (this.config.singleQuotes) {
      formatted = formatted.replace(/"/g, "'")
    }

    // Trailing commas
    if (!this.config.trailingComma) {
      formatted = formatted.replace(/,(\s*[}\]])/g, '$1')
    }

    return formatted
  }

  subscribe(listener: (event: FormatterEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: FormatterEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Formatter event */
export interface FormatterEvent {
  type: 'code-formatted'
  result?: FormatResult
}

/** Singleton */
let instance: CodeFormatterEngine | null = null

export function getCodeFormatterEngine(config?: Partial<CodeFormatterConfig>): CodeFormatterEngine {
  if (!instance) instance = new CodeFormatterEngine(config)
  return instance
}

export function resetCodeFormatterEngine(): void { instance = null }
