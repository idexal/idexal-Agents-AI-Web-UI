/**
 * Project Templates Engine for Idexal Agents.
 * Pre-built project templates with scaffolding, dependency management,
 * and customizable configurations.
 */

/** Template framework */
export type TemplateFramework = 'react' | 'vue' | 'svelte' | 'node' | 'express' | 'next' | 'nuxt' | 'vanilla'

/** Template language */
export type TemplateLanguage = 'typescript' | 'javascript' | 'python'

/** Template category */
export type TemplateCategory = 'web' | 'api' | 'cli' | 'library' | 'mobile' | 'fullstack'

/** Template file */
export interface TemplateFile {
  path: string
  content: string
  /** Is this file optional? */
  optional: boolean
  /** Variables to interpolate */
  variables: string[]
  /** Condition for including this file */
  condition?: string
}

/** Template dependency */
export interface TemplateDependency {
  name: string
  version: string
  type: 'production' | 'dev' | 'peer'
}

/** Template configuration */
export interface TemplateConfig {
  name: string
  description: string
  framework: TemplateFramework
  language: TemplateLanguage
  category: TemplateCategory
  /** Template files */
  files: TemplateFile[]
  /** Dependencies */
  dependencies: TemplateDependency[]
  /** Scripts to add to package.json */
  scripts: Record<string, string>
  /** Features included */
  features: string[]
  /** Preview image URL */
  preview?: string
  /** Author */
  author: string
  /** Version */
  version: string
  /** Tags */
  tags: string[]
}

/** Project creation request */
export interface ProjectRequest {
  name: string
  templateId: string
  directory: string
  variables?: Record<string, string>
  includeOptional?: boolean
}

/** Project creation result */
export interface ProjectResult {
  id: string
  name: string
  path: string
  filesCreated: string[]
  dependencies: string[]
  commands: string[]
  timestamp: number
}

const BUILTIN_TEMPLATES: TemplateConfig[] = [
  {
    name: 'React TypeScript',
    description: 'Modern React app with TypeScript, Vite, and ESLint',
    framework: 'react', language: 'typescript', category: 'web',
    author: 'Idexal', version: '1.0.0',
    tags: ['react', 'typescript', 'vite', 'modern'],
    features: ['TypeScript', 'Vite', 'ESLint', 'Hot Reload', 'CSS Modules'],
    scripts: { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' },
    dependencies: [
      { name: 'react', version: '^18.2.0', type: 'production' },
      { name: 'react-dom', version: '^18.2.0', type: 'production' },
      { name: 'typescript', version: '^5.0.0', type: 'dev' },
      { name: '@types/react', version: '^18.2.0', type: 'dev' },
      { name: 'vite', version: '^5.0.0', type: 'dev' },
    ],
    files: [
      { path: 'src/App.tsx', content: 'export function App() {\n  return <div>Hello {{name}}</div>\n}', optional: false, variables: ['name'] },
      { path: 'src/main.tsx', content: 'import { createRoot } from \'react-dom/client\'\nimport { App } from \'./App\'\n\ncreateRoot(document.getElementById(\'root\')!).render(<App />)', optional: false, variables: [] },
      { path: 'src/index.css', content: 'body { margin: 0; font-family: system-ui; }', optional: false, variables: [] },
      { path: 'index.html', content: '<!DOCTYPE html>\n<html>\n<head><title>{{name}}</title></head>\n<body><div id="root"></div></body>\n</html>', optional: false, variables: ['name'] },
      { path: 'tsconfig.json', content: '{ "compilerOptions": { "target": "ES2020", "strict": true } }', optional: false, variables: [] },
      { path: 'vite.config.ts', content: 'import { defineConfig } from \'vite\'\nimport react from \'@vitejs/plugin-react\'\n\nexport default defineConfig({ plugins: [react()] })', optional: false, variables: [] },
      { path: '.env.example', content: '# Environment variables\nPORT=3000', optional: true, variables: [] },
    ],
  },
  {
    name: 'Node.js API',
    description: 'Express.js REST API with TypeScript',
    framework: 'node', language: 'typescript', category: 'api',
    author: 'Idexal', version: '1.0.0',
    tags: ['node', 'express', 'api', 'rest'],
    features: ['TypeScript', 'Express', 'CORS', 'Helmet', 'Logging'],
    scripts: { dev: 'tsx watch src/index.ts', build: 'tsc', start: 'node dist/index.js' },
    dependencies: [
      { name: 'express', version: '^4.18.0', type: 'production' },
      { name: 'cors', version: '^2.8.5', type: 'production' },
      { name: 'helmet', version: '^7.0.0', type: 'production' },
      { name: 'typescript', version: '^5.0.0', type: 'dev' },
      { name: '@types/express', version: '^4.17.0', type: 'dev' },
      { name: 'tsx', version: '^4.0.0', type: 'dev' },
    ],
    files: [
      { path: 'src/index.ts', content: 'import express from \'express\'\nimport cors from \'cors\'\nimport helmet from \'helmet\'\n\nconst app = express()\napp.use(cors())\napp.use(helmet())\napp.use(express.json())\n\napp.get(\'/health\', (req, res) => res.json({ status: \'ok\' }))\n\napp.listen(process.env.PORT ?? 3000)', optional: false, variables: [] },
      { path: 'src/routes.ts', content: 'import { Router } from \'express\'\nexport const router = Router()', optional: false, variables: [] },
      { path: 'tsconfig.json', content: '{ "compilerOptions": { "target": "ES2020", "module": "commonjs", "strict": true, "outDir": "dist" } }', optional: false, variables: [] },
    ],
  },
  {
    name: 'Vue TypeScript',
    description: 'Vue 3 app with TypeScript and Vite',
    framework: 'vue', language: 'typescript', category: 'web',
    author: 'Idexal', version: '1.0.0',
    tags: ['vue', 'typescript', 'vite'],
    features: ['TypeScript', 'Vite', 'Vue 3 Composition API'],
    scripts: { dev: 'vite', build: 'vue-tsc && vite build' },
    dependencies: [
      { name: 'vue', version: '^3.3.0', type: 'production' },
      { name: 'typescript', version: '^5.0.0', type: 'dev' },
      { name: 'vite', version: '^5.0.0', type: 'dev' },
      { name: '@vitejs/plugin-vue', version: '^4.0.0', type: 'dev' },
    ],
    files: [
      { path: 'src/App.vue', content: '<template>\n  <div>Hello {{name}}</div>\n</template>\n\n<script setup lang="ts">\nconst name = \'{{name}}\'\n</script>', optional: false, variables: ['name'] },
      { path: 'src/main.ts', content: 'import { createApp } from \'vue\'\nimport App from \'./App.vue\'\n\ncreateApp(App).mount(\'#app\')', optional: false, variables: [] },
    ],
  },
  {
    name: 'CLI Tool',
    description: 'Command-line tool with Commander.js',
    framework: 'node', language: 'typescript', category: 'cli',
    author: 'Idexal', version: '1.0.0',
    tags: ['cli', 'commander', 'terminal'],
    features: ['TypeScript', 'Commander.js', 'Inquirer', 'Chalk'],
    scripts: { dev: 'tsx src/index.ts', build: 'tsc', start: 'node dist/index.js' },
    dependencies: [
      { name: 'commander', version: '^11.0.0', type: 'production' },
      { name: 'chalk', version: '^5.0.0', type: 'production' },
      { name: 'inquirer', version: '^9.0.0', type: 'production' },
      { name: 'typescript', version: '^5.0.0', type: 'dev' },
    ],
    files: [
      { path: 'src/index.ts', content: 'import { Command } from \'commander\'\nimport chalk from \'chalk\'\n\nconst program = new Command()\nprogram.name(\'{{name}}\').description(\'{{description}}\').version(\'1.0.0\')\n\nprogram.parse()', optional: false, variables: ['name', 'description'] },
    ],
  },
  {
    name: 'React Native',
    description: 'Cross-platform mobile app with React Native',
    framework: 'react', language: 'typescript', category: 'mobile',
    author: 'Idexal', version: '1.0.0',
    tags: ['react-native', 'mobile', 'ios', 'android'],
    features: ['TypeScript', 'Expo', 'React Navigation'],
    scripts: { dev: 'expo start', android: 'expo run:android', ios: 'expo run:ios' },
    dependencies: [
      { name: 'react-native', version: '^0.72.0', type: 'production' },
      { name: 'expo', version: '^49.0.0', type: 'production' },
      { name: 'typescript', version: '^5.0.0', type: 'dev' },
    ],
    files: [
      { path: 'App.tsx', content: 'import { View, Text } from \'react-native\'\n\nexport default function App() {\n  return <View><Text>Hello {{name}}</Text></View>\n}', optional: false, variables: ['name'] },
    ],
  },
]

/**
 * Project Templates Engine.
 */
export class ProjectTemplatesEngine {
  private templates: Map<string, TemplateConfig> = new Map()
  private listeners: Set<(event: TemplateEvent) => void> = new Set()

  constructor() {
    // Register built-in templates
    for (const template of BUILTIN_TEMPLATES) {
      const id = this.templateId(template)
      this.templates.set(id, template)
    }
  }

  /**
   * Get all templates.
   */
  getAll(): TemplateConfig[] {
    return Array.from(this.templates.values())
  }

  /**
   * Get template by ID.
   */
  get(id: string): TemplateConfig | undefined {
    return this.templates.get(id)
  }

  /**
   * Get templates by category.
   */
  getByCategory(category: TemplateCategory): TemplateConfig[] {
    return this.getAll().filter(t => t.category === category)
  }

  /**
   * Get templates by framework.
   */
  getByFramework(framework: TemplateFramework): TemplateConfig[] {
    return this.getAll().filter(t => t.framework === framework)
  }

  /**
   * Search templates.
   */
  search(query: string): TemplateConfig[] {
    const q = query.toLowerCase()
    return this.getAll().filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.includes(q))
    )
  }

  /**
   * Register a custom template.
   */
  register(id: string, template: TemplateConfig): void {
    this.templates.set(id, template)
    this.notifyListeners({ type: 'template-registered', template })
  }

  /**
   * Generate project files from template.
   */
  generate(request: ProjectRequest): ProjectResult {
    const template = this.templates.get(request.templateId)
    if (!template) throw new Error(`Template not found: ${request.templateId}`)

    const variables = {
      name: request.name,
      description: template.description,
      ...request.variables,
    }

    const filesCreated: string[] = []
    const resolvedFiles: TemplateFile[] = []

    for (const file of template.files) {
      if (file.optional && !request.includeOptional) continue

      let content = file.content
      for (const [key, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
      }

      resolvedFiles.push({ ...file, content })
      filesCreated.push(`${request.directory}/${file.path}`)
    }

    const deps = template.dependencies.map(d => `${d.name}@${d.version}`)
    const commands = [
      'npm install',
      ...Object.entries(template.scripts).map(([k, v]) => `npm run ${k} — ${v}`),
    ]

    const result: ProjectResult = {
      id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: request.name,
      path: request.directory,
      filesCreated,
      dependencies: deps,
      commands,
      timestamp: Date.now(),
    }

    this.notifyListeners({ type: 'project-generated', result })
    return result
  }

  private templateId(template: TemplateConfig): string {
    return `${template.framework}-${template.language}-${template.name.toLowerCase().replace(/\s+/g, '-')}`
  }

  subscribe(listener: (event: TemplateEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: TemplateEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Template event */
export interface TemplateEvent {
  type: 'template-registered' | 'project-generated'
  template?: TemplateConfig
  result?: ProjectResult
}

/** Singleton */
let instance: ProjectTemplatesEngine | null = null

export function getProjectTemplatesEngine(): ProjectTemplatesEngine {
  if (!instance) instance = new ProjectTemplatesEngine()
  return instance
}

export function resetProjectTemplatesEngine(): void { instance = null }
