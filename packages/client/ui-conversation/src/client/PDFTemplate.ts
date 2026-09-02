/**
 * PDF Template System for Idexal Agents.
 * Provides customizable templates for PDF exports.
 */

/** Template variable types */
export type TemplateVariable = 
  | { type: 'text'; default: string }
  | { type: 'color'; default: string }
  | { type: 'number'; default: number; min?: number; max?: number }
  | { type: 'boolean'; default: boolean }
  | { type: 'select'; options: string[]; default: string }

/** PDF Template */
export interface PDFTemplate {
  /** Template ID */
  id: string
  /** Template name */
  name: string
  /** Template description */
  description: string
  /** Template author */
  author: string
  /** Template version */
  version: string
  /** Template category */
  category: 'professional' | 'minimal' | 'colorful' | 'academic' | 'custom'
  /** Template variables (for customization) */
  variables: Record<string, TemplateVariable>
  /** CSS styles */
  styles: string
  /** HTML header template */
  header: string
  /** HTML footer template */
  footer: string
  /** HTML message template */
  messageTemplate: string
  /** Page size */
  pageSize: 'a4' | 'letter' | 'legal'
  /** Orientation */
  orientation: 'portrait' | 'landscape'
  /** Margins in mm */
  margins: { top: number; right: number; bottom: number; left: number }
}

/** Template preset values */
export type TemplatePresets = Record<string, unknown>

/** Default variables for all templates */
export const DEFAULT_TEMPLATE_VARIABLES: Record<string, TemplateVariable> = {
  primaryColor: { type: 'color', default: '#3b82f6' },
  secondaryColor: { type: 'color', default: '#6b7280' },
  backgroundColor: { type: 'color', default: '#ffffff' },
  textColor: { type: 'color', default: '#1f2937' },
  fontFamily: { type: 'select', options: ['system-ui', 'Georgia', 'Arial', 'Courier New'], default: 'system-ui' },
  fontSize: { type: 'number', default: 14, min: 10, max: 20 },
  lineHeight: { type: 'number', default: 1.6, min: 1.0, max: 2.5 },
  showHeader: { type: 'boolean', default: true },
  showFooter: { type: 'boolean', default: true },
  showTimestamps: { type: 'boolean', default: true },
  showAvatars: { type: 'boolean', default: true },
  borderRadius: { type: 'number', default: 8, min: 0, max: 20 },
}

/**
 * Professional Template.
 */
export const PROFESSIONAL_TEMPLATE: PDFTemplate = {
  id: 'professional',
  name: 'Professional',
  description: 'Clean, professional template for business use',
  author: 'Idexal Agents',
  version: '1.0.0',
  category: 'professional',
  variables: DEFAULT_TEMPLATE_VARIABLES,
  pageSize: 'a4',
  orientation: 'portrait',
  margins: { top: 25, right: 20, bottom: 25, left: 20 },
  styles: `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--font-family); font-size: var(--font-size)px; line-height: var(--line-height); color: var(--text-color); background: var(--background-color); }
    .container { max-width: 100%; padding: 20px; }
    .header { border-bottom: 2px solid var(--primary-color); padding-bottom: 20px; margin-bottom: 24px; }
    .title { font-size: 24px; font-weight: 700; color: var(--text-color); margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: var(--secondary-color); }
    .metadata { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: var(--border-radius)px; padding: 16px; margin-bottom: 24px; }
    .metadata-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .metadata-item { display: flex; flex-direction: column; }
    .metadata-label { font-size: 12px; font-weight: 500; color: var(--secondary-color); text-transform: uppercase; margin-bottom: 4px; }
    .metadata-value { font-size: 14px; color: var(--text-color); }
    .messages-section { margin-top: 24px; }
    .messages-section h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: var(--text-color); }
    .messages-list { display: flex; flex-direction: column; gap: 16px; }
    .message { border: 1px solid #e5e7eb; border-radius: var(--border-radius)px; padding: 16px; page-break-inside: avoid; }
    .message-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; }
    .message-role { font-weight: 600; font-size: 14px; }
    .message-time { font-size: 12px; color: var(--secondary-color); }
    .message-content { font-size: var(--font-size)px; color: #374151; white-space: pre-wrap; word-wrap: break-word; }
    .message-user { border-left: 3px solid var(--primary-color); background: color-mix(in srgb, var(--primary-color) 5%, white); }
    .message-user .message-role { color: var(--primary-color); }
    .message-assistant { border-left: 3px solid #10b981; background: #ecfdf5; }
    .message-assistant .message-role { color: #059669; }
    .message-system { border-left: 3px solid #f59e0b; background: #fffbeb; }
    .message-system .message-role { color: #d97706; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
    @media print { body { font-size: 12pt; } .container { padding: 0; } .message { break-inside: avoid; } }
  `,
  header: `
    <header class="header">
      <div class="header-content">
        <h1 class="title">{{title}}</h1>
        <div class="subtitle">Conversation Export</div>
      </div>
    </header>
  `,
  footer: `
    <footer class="footer">
      <div class="footer-content">
        <span>Generated by Idexal Agents</span>
        <span>Exported at {{exportDate}}</span>
      </div>
    </footer>
  `,
  messageTemplate: `
    <div class="message message-{{role}}" id="msg-{{index}}">
      {{#if showHeader}}
      <div class="message-header">
        <span class="message-role">{{roleLabel}}</span>
        {{#if showTimestamps}}
        <span class="message-time">{{timestamp}}</span>
        {{/if}}
      </div>
      {{/if}}
      <div class="message-content">{{content}}</div>
    </div>
  `,
}

/**
 * Minimal Template.
 */
export const MINIMAL_TEMPLATE: PDFTemplate = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean, minimal template with no decorations',
  author: 'Idexal Agents',
  version: '1.0.0',
  category: 'minimal',
  variables: DEFAULT_TEMPLATE_VARIABLES,
  pageSize: 'a4',
  orientation: 'portrait',
  margins: { top: 30, right: 25, bottom: 30, left: 25 },
  styles: `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--font-family); font-size: var(--font-size)px; line-height: var(--line-height); color: var(--text-color); background: var(--background-color); }
    .container { max-width: 100%; padding: 20px; }
    .header { margin-bottom: 32px; }
    .title { font-size: 28px; font-weight: 300; color: var(--text-color); margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: var(--secondary-color); }
    .metadata { margin-bottom: 32px; font-size: 13px; color: var(--secondary-color); }
    .messages-section { margin-top: 24px; }
    .messages-list { display: flex; flex-direction: column; gap: 24px; }
    .message { page-break-inside: avoid; }
    .message-header { margin-bottom: 8px; }
    .message-role { font-weight: 500; font-size: 13px; color: var(--secondary-color); }
    .message-time { font-size: 12px; color: #9ca3af; margin-left: 8px; }
    .message-content { font-size: var(--font-size)px; color: var(--text-color); white-space: pre-wrap; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
    @media print { body { font-size: 12pt; } .container { padding: 0; } }
  `,
  header: `
    <header class="header">
      <h1 class="title">{{title}}</h1>
      <div class="subtitle">Exported on {{exportDate}}</div>
    </header>
  `,
  footer: `
    <footer class="footer">
      <span>Idexal Agents</span>
    </footer>
  `,
  messageTemplate: `
    <div class="message" id="msg-{{index}}">
      <div class="message-header">
        <span class="message-role">{{roleLabel}}</span>
        <span class="message-time">{{timestamp}}</span>
      </div>
      <div class="message-content">{{content}}</div>
    </div>
  `,
}

/**
 * Colorful Template.
 */
export const COLORFUL_TEMPLATE: PDFTemplate = {
  id: 'colorful',
  name: 'Colorful',
  description: 'Vibrant, colorful template with gradients',
  author: 'Idexal Agents',
  version: '1.0.0',
  category: 'colorful',
  variables: {
    ...DEFAULT_TEMPLATE_VARIABLES,
    primaryColor: { type: 'color', default: '#8b5cf6' },
    secondaryColor: { type: 'color', default: '#ec4899' },
  },
  pageSize: 'a4',
  orientation: 'portrait',
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
  styles: `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--font-family); font-size: var(--font-size)px; line-height: var(--line-height); color: var(--text-color); background: var(--background-color); }
    .container { max-width: 100%; padding: 20px; }
    .header { background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; padding: 24px; border-radius: var(--border-radius)px; margin-bottom: 24px; }
    .title { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { font-size: 14px; opacity: 0.9; }
    .metadata { background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: var(--border-radius)px; padding: 16px; margin-bottom: 24px; }
    .metadata-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .metadata-item { display: flex; flex-direction: column; }
    .metadata-label { font-size: 12px; font-weight: 500; color: var(--secondary-color); text-transform: uppercase; margin-bottom: 4px; }
    .metadata-value { font-size: 14px; color: var(--text-color); }
    .messages-section { margin-top: 24px; }
    .messages-section h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: var(--text-color); }
    .messages-list { display: flex; flex-direction: column; gap: 16px; }
    .message { border-radius: var(--border-radius)px; padding: 16px; page-break-inside: avoid; }
    .message-user { background: linear-gradient(135deg, #dbeafe, #e0e7ff); border-left: 4px solid var(--primary-color); }
    .message-user .message-role { color: var(--primary-color); }
    .message-assistant { background: linear-gradient(135deg, #d1fae5, #dcfce7); border-left: 4px solid #10b981; }
    .message-assistant .message-role { color: #059669; }
    .message-system { background: linear-gradient(135deg, #fef3c7, #fef9c3); border-left: 4px solid #f59e0b; }
    .message-system .message-role { color: #d97706; }
    .message-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .message-role { font-weight: 600; font-size: 14px; }
    .message-time { font-size: 12px; color: var(--secondary-color); }
    .message-content { font-size: var(--font-size)px; color: var(--text-color); white-space: pre-wrap; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #e2e8f0; text-align: center; font-size: 12px; color: #9ca3af; }
    @media print { body { font-size: 12pt; } .container { padding: 0; } .message { break-inside: avoid; } }
  `,
  header: `
    <header class="header">
      <h1 class="title">{{title}}</h1>
      <div class="subtitle">Exported on {{exportDate}}</div>
    </header>
  `,
  footer: `
    <footer class="footer">
      <span>✨ Generated by Idexal Agents</span>
    </footer>
  `,
  messageTemplate: `
    <div class="message message-{{role}}" id="msg-{{index}}">
      <div class="message-header">
        <span class="message-role">{{roleLabel}}</span>
        <span class="message-time">{{timestamp}}</span>
      </div>
      <div class="message-content">{{content}}</div>
    </div>
  `,
}

/**
 * Academic Template.
 */
export const ACADEMIC_TEMPLATE: PDFTemplate = {
  id: 'academic',
  name: 'Academic',
  description: 'Formal academic template with citations style',
  author: 'Idexal Agents',
  version: '1.0.0',
  category: 'academic',
  variables: DEFAULT_TEMPLATE_VARIABLES,
  pageSize: 'a4',
  orientation: 'portrait',
  margins: { top: 30, right: 30, bottom: 30, left: 30 },
  styles: `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; font-size: var(--font-size)px; line-height: var(--line-height); color: var(--text-color); background: var(--background-color); }
    .container { max-width: 100%; padding: 20px; }
    .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid #000; }
    .title { font-size: 22px; font-weight: 700; color: var(--text-color); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    .subtitle { font-size: 14px; color: var(--secondary-color); font-style: italic; }
    .metadata { background: #f8f8f8; border: 1px solid #ddd; padding: 16px; margin-bottom: 24px; font-size: 13px; }
    .metadata-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .metadata-item { display: flex; flex-direction: column; }
    .metadata-label { font-weight: 600; margin-bottom: 2px; }
    .metadata-value { color: #333; }
    .messages-section { margin-top: 24px; }
    .messages-section h2 { font-size: 16px; font-weight: 700; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #000; padding-bottom: 8px; }
    .messages-list { display: flex; flex-direction: column; gap: 20px; }
    .message { page-break-inside: avoid; padding: 12px 0; border-bottom: 1px dotted #ccc; }
    .message-header { margin-bottom: 8px; }
    .message-role { font-weight: 700; font-style: italic; }
    .message-time { font-size: 12px; color: #666; margin-left: 8px; }
    .message-content { font-size: var(--font-size)px; color: var(--text-color); text-align: justify; white-space: pre-wrap; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #000; text-align: center; font-size: 11px; color: #666; font-style: italic; }
    @media print { body { font-size: 12pt; } .container { padding: 0; } }
  `,
  header: `
    <header class="header">
      <h1 class="title">{{title}}</h1>
      <div class="subtitle">A Conversation Record</div>
    </header>
  `,
  footer: `
    <footer class="footer">
      <span>Recorded on {{exportDate}} | Idexal Agents</span>
    </footer>
  `,
  messageTemplate: `
    <div class="message" id="msg-{{index}}">
      <div class="message-header">
        <span class="message-role">{{roleLabel}}</span>
        <span class="message-time">{{timestamp}}</span>
      </div>
      <div class="message-content">{{content}}</div>
    </div>
  `,
}

/** All built-in templates */
export const BUILTIN_TEMPLATES: PDFTemplate[] = [
  PROFESSIONAL_TEMPLATE,
  MINIMAL_TEMPLATE,
  COLORFUL_TEMPLATE,
  ACADEMIC_TEMPLATE,
]

/**
 * Get template by ID.
 */
export function getTemplate(templateId: string): PDFTemplate | undefined {
  return BUILTIN_TEMPLATES.find(t => t.id === templateId)
}

/**
 * Get all templates.
 */
export function getAllTemplates(): PDFTemplate[] {
  return [...BUILTIN_TEMPLATES]
}

/**
 * Get templates by category.
 */
export function getTemplatesByCategory(category: PDFTemplate['category']): PDFTemplate[] {
  return BUILTIN_TEMPLATES.filter(t => t.category === category)
}

/**
 * Render template with variables.
 */
export function renderTemplate(
  template: PDFTemplate,
  variables: Record<string, unknown>,
  data: {
    title: string
    messages: Array<{
      role: string
      content: string
      timestamp: Date
    }>
  }
): string {
  // Merge default variables with provided variables
  const vars: Record<string, unknown> = {}
  for (const [key, def] of Object.entries(template.variables)) {
    vars[key] = variables[key] ?? def.default
  }

  // Generate CSS variables
  const cssVars = Object.entries(vars)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `--${cssKey}: ${value}${typeof value === 'number' && !key.includes('Color') && !key.includes('color') ? (key.includes('Radius') || key.includes('radius') ? 'px' : '') : ''}`
    })
    .join('; ')

  // Generate messages HTML
  const messagesHtml = data.messages.map((msg, index) => {
    const roleLabel = msg.role === 'user' ? '👤 You' : 
                      msg.role === 'assistant' ? '🤖 Assistant' : '⚙️ System'

    return template.messageTemplate
      .replace(/\{\{index\}\}/g, String(index))
      .replace(/\{\{role\}\}/g, msg.role)
      .replace(/\{\{roleLabel\}\}/g, roleLabel)
      .replace(/\{\{content\}\}/g, escapeHtml(msg.content))
      .replace(/\{\{timestamp\}\}/g, msg.timestamp.toLocaleString())
      .replace(/\{\{#if showTimestamps\}\}[\s\S]*?\{\{\/if\}\}/g, vars.showTimestamps ? '' : '')
      .replace(/\{\{#if showHeader\}\}[\s\S]*?\{\{\/if\}\}/g, vars.showHeader ? '' : '')
  }).join('\n')

  // Generate full HTML
  const headerHtml = template.header
    .replace(/\{\{title\}\}/g, data.title)
    .replace(/\{\{exportDate\}\}/g, new Date().toLocaleString())

  const footerHtml = template.footer
    .replace(/\{\{exportDate\}\}/g, new Date().toLocaleString())

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)}</title>
  <style>
    :root { ${cssVars} }
    ${template.styles}
  </style>
</head>
<body>
  <div class="container">
    ${headerHtml}
    <div class="messages-section">
      <div class="messages-list">
        ${messagesHtml}
      </div>
    </div>
    ${footerHtml}
  </div>
</body>
</html>
  `
}

/**
 * Escape HTML.
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
