/**
 * Code Heatmap Engine for Idexal Agents.
 * Generates visual heatmaps of code complexity, change frequency,
 * risk levels, and maintenance priorities.
 */

/** Heatmap metric type */
export type HeatmapMetric = 'complexity' | 'churn' | 'risk' | 'coverage' | 'age' | 'size'

/** Heat intensity 0-1 */
export type HeatIntensity = number

/** Heat color */
export type HeatColor = 'cold' | 'cool' | 'warm' | 'hot' | 'burning'

/** Line heat data */
export interface LineHeat {
  lineNumber: number
  /** Source code line */
  code: string
  /** Heat intensity 0-1 */
  intensity: HeatIntensity
  /** Computed heat color */
  color: HeatColor
  /** Raw metric value */
  value: number
  /** Issues at this line */
  issues: string[]
}

/** Block heat (function/class-level) */
export interface BlockHeat {
  /** Block name */
  name: string
  /** Start line */
  startLine: number
  /** End line */
  endLine: number
  /** Average intensity */
  intensity: HeatIntensity
  /** Color */
  color: HeatColor
  /** Lines in block */
  lines: LineHeat[]
  /** Block type */
  blockType: 'function' | 'class' | 'loop' | 'condition' | 'comment' | 'blank'
}

/** Heatmap result */
export interface HeatmapResult {
  /** File path */
  file: string
  /** Total lines */
  totalLines: number
  /** Lines analyzed */
  analyzedLines: number
  /** Per-line heat */
  lines: LineHeat[]
  /** Block-level heat */
  blocks: BlockHeat[]
  /** Overall heat score 0-100 */
  overallHeat: number
  /** Hottest lines (top 10) */
  hotspots: LineHeat[]
  /** Cold lines (bottom 10) */
  coldspots: LineHeat[]
  /** Summary stats */
  stats: {
    avgIntensity: number
    maxIntensity: number
    minIntensity: number
    hotLines: number
    coldLines: number
  }
}

/** Heatmap config */
export interface HeatmapConfig {
  metric: HeatmapMetric
  /** Weight factors for combined metrics */
  weights: {
    complexity: number
    nesting: number
    lineLength: number
    todoCount: number
    blankRatio: number
  }
  /** Thresholds for color bands */
  thresholds: {
    cold: number
    cool: number
    warm: number
    hot: number
  }
}

const DEFAULT_HEATMAP_CONFIG: HeatmapConfig = {
  metric: 'complexity',
  weights: { complexity: 0.35, nesting: 0.25, lineLength: 0.15, todoCount: 0.15, blankRatio: 0.1 },
  thresholds: { cold: 0.2, cool: 0.4, warm: 0.6, hot: 0.8 },
}

function intensityToColor(intensity: number, thresholds: HeatmapConfig['thresholds']): HeatColor {
  if (intensity < thresholds.cold) return 'cold'
  if (intensity < thresholds.cool) return 'cool'
  if (intensity < thresholds.warm) return 'warm'
  if (intensity < thresholds.hot) return 'hot'
  return 'burning'
}

const HEAT_COLORS: Record<HeatColor, string> = {
  cold: '#22c55e',
  cool: '#3b82f6',
  warm: '#f59e0b',
  hot: '#f97316',
  burning: '#ef4444',
}

export function getHeatColorHex(color: HeatColor): string {
  return HEAT_COLORS[color] ?? '#6b7280'
}

/**
 * Code Heatmap Engine.
 */
export class CodeHeatmapEngine {
  private config: HeatmapConfig
  private listeners: Set<(event: HeatmapEvent) => void> = new Set()

  constructor(config: Partial<HeatmapConfig> = {}) {
    this.config = { ...DEFAULT_HEATMAP_CONFIG, ...config }
  }

  /**
   * Generate heatmap for source code.
   */
  generate(code: string, filename: string): HeatmapResult {
    const lines = code.split('\n')
    const lineHeats: LineHeat[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      const intensity = this.calculateLineIntensity(line, i, lines)
      const color = intensityToColor(intensity, this.config.thresholds)
      const issues = this.detectLineIssues(line)

      lineHeats.push({
        lineNumber: i + 1,
        code: line,
        intensity,
        color,
        value: intensity * 100,
        issues,
      })
    }

    // Detect blocks
    const blocks = this.detectBlocks(lines, lineHeats)

    // Calculate stats
    const intensities = lineHeats.map(l => l.intensity)
    const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length
    const maxIntensity = Math.max(...intensities, 0)
    const minIntensity = Math.min(...intensities, 0)
    const hotLines = lineHeats.filter(l => l.intensity >= this.config.thresholds.hot).length
    const coldLines = lineHeats.filter(l => l.intensity < this.config.thresholds.cold).length

    // Hotspots and coldspots
    const sorted = [...lineHeats].sort((a, b) => b.intensity - a.intensity)
    const hotspots = sorted.slice(0, 10).filter(h => h.intensity > 0)
    const coldspots = sorted.slice(-10).filter(h => h.code.trim().length > 0)

    const overallHeat = Math.round(avgIntensity * 100)

    const result: HeatmapResult = {
      file: filename,
      totalLines: lines.length,
      analyzedLines: lines.filter(l => l.trim().length > 0).length,
      lines: lineHeats,
      blocks,
      overallHeat,
      hotspots,
      coldspots,
      stats: { avgIntensity, maxIntensity, minIntensity, hotLines, coldLines },
    }

    this.notifyListeners({ type: 'heatmap-generated', result })
    return result
  }

  /**
   * Generate a text-based heatmap visualization.
   */
  toTextVisualization(result: HeatmapResult): string {
    const lines: string[] = []
    lines.push(`🔥 Heatmap: ${result.file}`)
    lines.push(`   Overall Heat: ${'█'.repeat(Math.round(result.overallHeat / 5))}${'░'.repeat(20 - Math.round(result.overallHeat / 5))} ${result.overallHeat}%`)
    lines.push('')

    for (const line of result.lines) {
      const bar = '█'.repeat(Math.round(line.intensity * 20))
      const pad = '░'.repeat(20 - Math.round(line.intensity * 20))
      const marker = line.issues.length > 0 ? ' ⚠️' : ''
      lines.push(`  ${String(line.lineNumber).padStart(4)} │${bar}${pad}│ ${line.code.trim().slice(0, 50)}${marker}`)
    }

    return lines.join('\n')
  }

  private calculateLineIntensity(line: string, lineIdx: number, allLines: string[]): number {
    const w = this.config.weights

    // Complexity factor
    let complexity = 0
    if (/\b(if|else|for|while|switch|case|catch|&&|\|\||\?)\b/.test(line)) complexity = 1
    if (/\b(function|=>|class)\b/.test(line)) complexity = 0.8

    // Nesting factor
    let nesting = 0
    for (let i = 0; i <= lineIdx; i++) {
      const prev = allLines[i] ?? ''
      for (const ch of prev) {
        if (ch === '{') nesting++
        if (ch === '}') nesting--
      }
    }
    const nestingNorm = Math.min(1, Math.max(0, nesting / 8))

    // Line length factor
    const lineLengthNorm = Math.min(1, line.length / 120)

    // TODO count
    const todoNorm = (line.match(/TODO|FIXME|HACK|XXX/g) ?? []).length > 0 ? 1 : 0

    // Blank ratio (surrounding context)
    let blankCount = 0
    for (let i = Math.max(0, lineIdx - 3); i <= Math.min(allLines.length - 1, lineIdx + 3); i++) {
      if ((allLines[i] ?? '').trim().length === 0) blankCount++
    }
    const blankNorm = blankCount / 7

    return Math.min(1, Math.max(0,
      complexity * w.complexity +
      nestingNorm * w.nesting +
      lineLengthNorm * w.lineLength +
      todoNorm * w.todoCount +
      blankNorm * w.blankRatio
    ))
  }

  private detectLineIssues(line: string): string[] {
    const issues: string[] = []
    if (/==(?!=)/.test(line)) issues.push('Loose equality')
    if (/\bvar\b/.test(line)) issues.push('var declaration')
    if (/innerHTML\s*=/.test(line)) issues.push('XSS risk')
    if (/\beval\s*\(/.test(line)) issues.push('eval() usage')
    if (/console\.(log|warn|error)/.test(line)) issues.push('Console statement')
    if (line.length > 120) issues.push('Long line')
    if (/TODO|FIXME|HACK/.test(line)) issues.push('Unresolved comment')
    return issues
  }

  private detectBlocks(lines: string[], lineHeats: LineHeat[]): BlockHeat[] {
    const blocks: BlockHeat[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i] ?? ''

      // Function detection
      const funcMatch = line.match(/(?:function\s+\w+|(?:const|let)\s+\w+\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>))/)
      if (funcMatch) {
        const startLine = i
        let depth = 0, endLine = i
        for (let j = i; j < lines.length; j++) {
          for (const ch of lines[j] ?? '') {
            if (ch === '{') depth++
            if (ch === '}') depth--
          }
          if (depth <= 0 && j > i) { endLine = j; break }
        }
        const blockLines = lineHeats.slice(startLine, endLine + 1)
        const avgIntensity = blockLines.reduce((s, l) => s + l.intensity, 0) / (blockLines.length || 1)
        blocks.push({
          name: funcMatch[0]?.slice(0, 40) ?? 'function',
          startLine: startLine + 1, endLine: endLine + 1,
          intensity: avgIntensity,
          color: intensityToColor(avgIntensity, this.config.thresholds),
          lines: blockLines, blockType: 'function',
        })
        i = endLine + 1
        continue
      }

      // Loop detection
      if (/\b(for|while|do)\b/.test(line)) {
        const startLine = i
        let depth = 0, endLine = i
        for (let j = i; j < Math.min(lines.length, i + 50); j++) {
          for (const ch of lines[j] ?? '') {
            if (ch === '{') depth++
            if (ch === '}') depth--
          }
          if (depth <= 0 && j > i) { endLine = j; break }
        }
        const blockLines = lineHeats.slice(startLine, endLine + 1)
        const avgIntensity = blockLines.reduce((s, l) => s + l.intensity, 0) / (blockLines.length || 1)
        blocks.push({
          name: `loop L${startLine + 1}`,
          startLine: startLine + 1, endLine: endLine + 1,
          intensity: avgIntensity,
          color: intensityToColor(avgIntensity, this.config.thresholds),
          lines: blockLines, blockType: 'loop',
        })
        i = endLine + 1
        continue
      }

      i++
    }

    return blocks
  }

  subscribe(listener: (event: HeatmapEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: HeatmapEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Heatmap event */
export interface HeatmapEvent {
  type: 'heatmap-generated'
  result?: HeatmapResult
}

/** Singleton */
let instance: CodeHeatmapEngine | null = null

export function getCodeHeatmapEngine(config?: Partial<HeatmapConfig>): CodeHeatmapEngine {
  if (!instance) instance = new CodeHeatmapEngine(config)
  return instance
}

export function resetCodeHeatmapEngine(): void { instance = null }
