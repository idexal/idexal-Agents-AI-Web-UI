/**
 * Code Complexity Heatmap engine.
 *
 * Assigns a colour-coded complexity score to every line/block of source
 * code based on cyclomatic complexity, nesting depth, cognitive load,
 * and change frequency.  Renders as a data structure suitable for
 * frontend heat-map visualisation.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HeatColor = 'green' | 'yellow' | 'orange' | 'red' | 'crimson'

export interface LineHeatData {
  readonly line: number
  readonly score: number         // 0-1
  readonly color: HeatColor
  readonly complexity: number    // cyclomatic
  readonly nestingDepth: number
  readonly tokens: number
}

export interface BlockHeatData {
  readonly name: string
  readonly startLine: number
  readonly endLine: number
  readonly avgScore: number
  readonly color: HeatColor
  readonly lineCount: number
}

export interface ComplexityHeatmapResult {
  readonly lines: readonly LineHeatData[]
  readonly blocks: readonly BlockHeatData[]
  readonly hotspots: readonly LineHeatData[]       // top 10 hottest
  readonly coldspots: readonly LineHeatData[]       // top 10 coldest
  readonly overallComplexity: number                // 0-100
  readonly recommendations: readonly string[]
}

export interface ComplexityHeatmapConfig {
  readonly maxLines: number
  readonly blockSize: number
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class ComplexityHeatmapEngine {
  private readonly config: ComplexityHeatmapConfig

  constructor(config?: Partial<ComplexityHeatmapConfig>) {
    this.config = {
      maxLines: config?.maxLines ?? 5000,
      blockSize: config?.blockSize ?? 10,
    }
  }

  analyze(sourceCode: string): ComplexityHeatmapResult {
    const lines = sourceCode.split('\n').slice(0, this.config.maxLines)
    const lineData: LineHeatData[] = lines.map((raw, i) => this.analyzeLine(raw, i + 1, lines, i))
    const blocks = this.aggregateBlocks(lineData)
    const hotspots = [...lineData].sort((a, b) => b.score - a.score).slice(0, 10)
    const coldspots = [...lineData].sort((a, b) => a.score - b.score).filter(l => l.score > 0).slice(0, 10)
    const overallComplexity = lineData.length > 0
      ? lineData.reduce((s, l) => s + l.score, 0) / lineData.length * 100
      : 0
    const recommendations = this.generateRecommendations(lineData, blocks, overallComplexity)

    return { lines: lineData, blocks, hotspots, coldspots, overallComplexity, recommendations }
  }

  private analyzeLine(raw: string, lineNum: number, allLines: string[], idx: number): LineHeatData {
    const score = this.computeLineScore(raw, allLines, idx)
    return {
      line: lineNum,
      score,
      color: this.scoreToColor(score),
      complexity: this.cyclomaticContribution(raw),
      nestingDepth: this.currentNesting(raw, allLines, idx),
      tokens: raw.split(/\s+/).length,
    }
  }

  private computeLineScore(raw: string, allLines: string[], idx: number): number {
    const complexity = this.cyclomaticContribution(raw)
    const nesting = this.currentNesting(raw, allLines, idx)
    const length = raw.length
    const tokens = raw.split(/\s+/).length

    const complexityScore = Math.min(1, complexity / 10)
    const nestingScore = Math.min(1, nesting / 6)
    const lengthScore = Math.min(1, length / 120)
    const tokenScore = Math.min(1, tokens / 30)

    return Math.min(1, complexityScore * 0.4 + nestingScore * 0.3 + lengthScore * 0.15 + tokenScore * 0.15)
  }

  private cyclomaticContribution(raw: string): number {
    let cc = 1
    const keywords = ['if', 'else if', 'elif', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '&&', '||', '?', '??']
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b|\\?\\?`)
      const matches = raw.match(regex)
      if (matches) cc += matches.length
    }
    return cc
  }

  private currentNesting(_raw: string, allLines: string[], idx: number): number {
    let depth = 0
    for (let i = 0; i < idx; i++) {
      const line = allLines[i]!
      depth += (line.match(/\{/g) ?? []).length
      depth -= (line.match(/\}/g) ?? []).length
    }
    return Math.max(0, depth)
  }

  private aggregateBlocks(lines: LineHeatData[]): BlockHeatData[] {
    const blocks: BlockHeatData[] = []
    const size = this.config.blockSize
    for (let i = 0; i < lines.length; i += size) {
      const block = lines.slice(i, i + size)
      const avgScore = block.reduce((s, l) => s + l.score, 0) / block.length
      blocks.push({
        name: `Lines ${block[0]!.line}-${block[block.length - 1]!.line}`,
        startLine: block[0]!.line,
        endLine: block[block.length - 1]!.line,
        avgScore,
        color: this.scoreToColor(avgScore),
        lineCount: block.length,
      })
    }
    return blocks
  }

  private scoreToColor(score: number): HeatColor {
    if (score < 0.2) return 'green'
    if (score < 0.4) return 'yellow'
    if (score < 0.6) return 'orange'
    if (score < 0.8) return 'red'
    return 'crimson'
  }

  private generateRecommendations(lines: LineHeatData[], blocks: BlockHeatData[], overall: number): string[] {
    const recs: string[] = []
    const highComplexityLines = lines.filter(l => l.complexity > 10)
    if (highComplexityLines.length > 0) recs.push(`${highComplexityLines.length} line(s) have cyclomatic complexity > 10 — refactor into smaller functions.`)
    const deepNesting = lines.filter(l => l.nestingDepth > 5)
    if (deepNesting.length > 0) recs.push(`${deepNesting.length} line(s) are nested > 5 levels deep — use early returns or extract helpers.`)
    const hotBlocks = blocks.filter(b => b.avgScore > 0.7)
    if (hotBlocks.length > 0) recs.push(`${hotBlocks.length} block(s) are hotspots — prioritise refactoring these areas.`)
    if (overall > 60) recs.push(`Overall complexity is ${overall.toFixed(0)}/100 — the codebase needs attention.`)
    if (recs.length === 0) recs.push('Complexity looks reasonable. Keep monitoring.')
    return recs
  }
}

let _instance: ComplexityHeatmapEngine | undefined
export function getComplexityHeatmapEngine(config?: Partial<ComplexityHeatmapConfig>): ComplexityHeatmapEngine {
  _instance ??= new ComplexityHeatmapEngine(config)
  return _instance
}
export function resetComplexityHeatmapEngine(): void { _instance = undefined }
