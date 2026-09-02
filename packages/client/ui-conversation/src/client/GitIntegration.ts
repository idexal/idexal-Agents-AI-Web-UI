/**
 * Git Integration Engine for Idexal Agents.
 * Tracks git history, branches, diffs, blame, and provides
 * intelligent commit analysis and suggestions.
 */

/** Git commit */
export interface GitCommit {
  hash: string
  shortHash: string
  author: string
  email: string
  date: string
  message: string
  body: string
  files: GitFileChange[]
  stats: { additions: number; deletions: number; filesChanged: number }
}

/** Git file change */
export interface GitFileChange {
  path: string
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied'
  additions: number
  deletions: number
  oldPath?: string
}

/** Git branch */
export interface GitBranch {
  name: string
  isCurrent: boolean
  isRemote: boolean
  lastCommit: string
  ahead: number
  behind: number
  tracking?: string
}

/** Git diff */
export interface GitDiff {
  file: string
  oldContent: string
  newContent: string
  hunks: GitDiffHunk[]
  stats: { additions: number; deletions: number }
}

/** Git diff hunk */
export interface GitDiffHunk {
  startLine: number
  endLine: number
  lines: Array<{ type: 'add' | 'remove' | 'context'; content: string; lineNum?: number }>
}

/** Git blame line */
export interface GitBlameLine {
  lineNumber: number
  commit: string
  author: string
  date: string
  content: string
}

/** Commit suggestion */
export interface CommitSuggestion {
  type: 'type' | 'scope' | 'breaking' | 'description'
  suggestion: string
  confidence: number
  reason: string
}

/** Git status */
export interface GitStatus {
  currentBranch: string
  staged: GitFileChange[]
  unstaged: GitFileChange[]
  untracked: string[]
  ahead: number
  behind: number
  isClean: boolean
}

/** Git analysis */
export interface GitAnalysis {
  totalCommits: number
  totalAuthors: number
  activeBranches: number
  recentCommits: GitCommit[]
  topContributors: Array<{ name: string; commits: number; linesAdded: number; linesRemoved: number }>
  commitFrequency: Array<{ date: string; count: number }>
  averageCommitSize: number
  healthScore: number
}

/** Git config */
export interface GitIntegrationConfig {
  maxCommits: number
  analyzeBlame: boolean
  suggestCommits: boolean
}

/**
 * Git Integration Engine.
 */
export class GitIntegrationEngine {
  private commits: GitCommit[] = []
  private branches: GitBranch[] = []
  private listeners: Set<(event: GitEvent) => void> = new Set()

  constructor(_config: Partial<GitIntegrationConfig> = {}) {
    void _config
  }

  /**
   * Parse git log output.
   */
  parseGitLog(logOutput: string): GitCommit[] {
    const entries = logOutput.split('\n\n').filter(e => e.trim())
    this.commits = []

    for (const entry of entries) {
      const lines = entry.split('\n')
      const headerLine = lines[0] ?? ''
      const hashMatch = headerLine.match(/^([a-f0-9]{40})/)
      const authorMatch = headerLine.match(/Author:\s*(.+?)\s*<(.+?)>/)
      const dateMatch = headerLine.match(/Date:\s*(.+)/)
      const msgIdx = lines.findIndex(l => l.startsWith('    '))

      if (hashMatch?.[1] && authorMatch?.[1] && dateMatch?.[1]) {
        const message = msgIdx >= 0 ? lines.slice(msgIdx).join('\n').trim() : ''
        const hash = hashMatch[1]
        this.commits.push({
          hash,
          shortHash: hash.slice(0, 7),
          author: authorMatch[1],
          email: authorMatch[2] ?? '',
          date: dateMatch[1],
          message: message.split('\n')[0] ?? '',
          body: message,
          files: [],
          stats: { additions: 0, deletions: 0, filesChanged: 0 },
        })
      }
    }

    this.notifyListeners({ type: 'commits-parsed', commits: this.commits })
    return this.commits
  }

  /**
   * Analyze git history.
   */
  analyzeHistory(): GitAnalysis {
    const contributors = new Map<string, { name: string; commits: number; linesAdded: number; linesRemoved: number }>()
    const freqMap = new Map<string, number>()

    for (const commit of this.commits) {
      const existing = contributors.get(commit.author) ?? { name: commit.author, commits: 0, linesAdded: 0, linesRemoved: 0 }
      existing.commits++
      existing.linesAdded += commit.stats.additions
      existing.linesRemoved += commit.stats.deletions
      contributors.set(commit.author, existing)

      const dateKey = commit.date.slice(0, 10)
      freqMap.set(dateKey, (freqMap.get(dateKey) ?? 0) + 1)
    }

    const topContributors = Array.from(contributors.values())
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 10)

    const commitFrequency = Array.from(freqMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const avgSize = this.commits.length > 0
      ? this.commits.reduce((sum, c) => sum + c.stats.additions + c.stats.deletions, 0) / this.commits.length
      : 0

    // Health score
    let health = 100
    if (this.commits.length < 5) health -= 20
    if (topContributors.length === 1) health -= 10
    const avgCommitMsgLen = this.commits.reduce((s, c) => s + c.message.length, 0) / (this.commits.length || 1)
    if (avgCommitMsgLen < 10) health -= 15
    if (avgSize > 500) health -= 10

    return {
      totalCommits: this.commits.length,
      totalAuthors: contributors.size,
      activeBranches: this.branches.length,
      recentCommits: this.commits.slice(0, 10),
      topContributors,
      commitFrequency,
      averageCommitSize: Math.round(avgSize),
      healthScore: Math.max(0, health),
    }
  }

  /**
   * Suggest commit message for staged changes.
   */
  suggestCommitMessage(changes: GitFileChange[]): CommitSuggestion[] {
    const suggestions: CommitSuggestion[] = []

    const addedFiles = changes.filter(c => c.status === 'added')
    const modifiedFiles = changes.filter(c => c.status === 'modified')
    const deletedFiles = changes.filter(c => c.status === 'deleted')

    // Type suggestion
    if (addedFiles.length > 0 && modifiedFiles.length === 0 && deletedFiles.length === 0) {
      suggestions.push({ type: 'type', suggestion: 'feat', confidence: 0.9, reason: 'New files added' })
    } else if (deletedFiles.length > 0 && addedFiles.length === 0) {
      suggestions.push({ type: 'type', suggestion: 'refactor', confidence: 0.7, reason: 'Files deleted' })
    } else if (modifiedFiles.some(f => f.path.includes('test') || f.path.includes('spec'))) {
      suggestions.push({ type: 'type', suggestion: 'test', confidence: 0.85, reason: 'Test files modified' })
    } else if (modifiedFiles.some(f => f.path.includes('.md') || f.path.includes('doc'))) {
      suggestions.push({ type: 'type', suggestion: 'docs', confidence: 0.9, reason: 'Documentation files modified' })
    } else {
      suggestions.push({ type: 'type', suggestion: 'fix', confidence: 0.6, reason: 'Mixed changes detected' })
    }

    // Scope suggestion
    const dirs = new Set<string>()
    for (const change of changes) {
      const parts = change.path.split('/')
      if (parts.length > 1) dirs.add(parts[0] ?? '')
    }
    if (dirs.size === 1) {
      suggestions.push({ type: 'scope', suggestion: Array.from(dirs)[0] ?? '', confidence: 0.8, reason: 'All changes in same directory' })
    }

    // Breaking change detection
    if (deletedFiles.some(f => f.path.includes('export') || f.path.includes('index'))) {
      suggestions.push({ type: 'breaking', suggestion: '⚠️ Possible breaking change: export/index file deleted', confidence: 0.7, reason: 'Public API file deleted' })
    }

    // Description suggestion
    const totalAdd = changes.reduce((s, c) => s + c.additions, 0)
    const totalDel = changes.reduce((s, c) => s + c.deletions, 0)
    suggestions.push({
      type: 'description',
      suggestion: `${addedFiles.length} file(s) added, ${modifiedFiles.length} modified, ${deletedFiles.length} deleted (+${totalAdd}/-${totalDel})`,
      confidence: 1.0,
      reason: 'Summary of changes',
    })

    return suggestions
  }

  /**
   * Format a conventional commit message from suggestions.
   */
  formatConventionalCommit(suggestions: CommitSuggestion[]): string {
    const type = suggestions.find(s => s.type === 'type')?.suggestion ?? 'chore'
    const scope = suggestions.find(s => s.type === 'scope')?.suggestion
    const breaking = suggestions.find(s => s.type === 'breaking')
    const desc = suggestions.find(s => s.type === 'description')

    let msg = type
    if (scope) msg += `(${scope})`
    if (breaking) msg += '!'
    msg += ': '
    msg += desc?.suggestion ?? 'update'

    return msg
  }

  /**
   * Parse git diff output.
   */
  parseDiff(diffOutput: string): GitDiff[] {
    const files: GitDiff[] = []
    const fileSections = diffOutput.split(/^diff --git/m).filter(s => s.trim())

    for (const section of fileSections) {
      const pathMatch = section.match(/a\/(.+?)\s+b\/(.+)/)
      if (!pathMatch?.[1]) continue

      const file = pathMatch[2] ?? pathMatch[1]
      const hunks: GitDiffHunk[] = []
      let additions = 0, deletions = 0

      const hunkSections = section.split(/^@@/m).filter(s => s.trim())
      for (const hunk of hunkSections) {
        const rangeMatch = hunk.match(/-?\d+,?\d*\s+\+?\d+,?\d*/)
        if (!rangeMatch) continue

        const lines = hunk.split('\n').slice(1)
        const diffLines: GitDiffHunk['lines'] = []

        for (const line of lines) {
          if (line.startsWith('+')) { diffLines.push({ type: 'add', content: line.slice(1) }); additions++ }
          else if (line.startsWith('-')) { diffLines.push({ type: 'remove', content: line.slice(1) }); deletions++ }
          else if (line.startsWith(' ') || line.startsWith('\\')) { diffLines.push({ type: 'context', content: line.slice(1) }) }
        }

        hunks.push({ startLine: 0, endLine: diffLines.length, lines: diffLines })
      }

      files.push({ file, oldContent: '', newContent: '', hunks, stats: { additions, deletions } })
    }

    return files
  }

  subscribe(listener: (event: GitEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: GitEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Git event */
export interface GitEvent {
  type: 'commits-parsed' | 'analysis-complete' | 'status-changed'
  commits?: GitCommit[]
  analysis?: GitAnalysis
}

/** Singleton */
let instance: GitIntegrationEngine | null = null

export function getGitIntegrationEngine(config?: Partial<GitIntegrationConfig>): GitIntegrationEngine {
  if (!instance) instance = new GitIntegrationEngine(config)
  return instance
}

export function resetGitIntegrationEngine(): void { instance = null }
