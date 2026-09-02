/**
 * PDF Template Selector for Idexal Agents.
 * Interface for selecting and customizing PDF templates.
 */

import React, { useState } from 'react'
import type { PDFTemplate, TemplatePresets } from './PDFTemplate.ts'
import { BUILTIN_TEMPLATES, getTemplate } from './PDFTemplate.ts'

/** Labels */
const TEMPLATE_LABELS = {
  en: {
    title: 'PDF Template',
    selectTemplate: 'Select Template',
    customize: 'Customize',
    preview: 'Preview',
    apply: 'Apply Template',
    cancel: 'Cancel',
    templates: 'Templates',
    categories: {
      professional: 'Professional',
      minimal: 'Minimal',
      colorful: 'Colorful',
      academic: 'Academic',
      custom: 'Custom',
    },
    variables: {
      primaryColor: 'Primary Color',
      secondaryColor: 'Secondary Color',
      backgroundColor: 'Background Color',
      textColor: 'Text Color',
      fontFamily: 'Font Family',
      fontSize: 'Font Size',
      lineHeight: 'Line Height',
      showHeader: 'Show Header',
      showFooter: 'Show Footer',
      showTimestamps: 'Show Timestamps',
      showAvatars: 'Show Avatars',
      borderRadius: 'Border Radius',
    },
  },
  ar: {
    title: 'قالب PDF',
    selectTemplate: 'اختر القالب',
    customize: 'تخصيص',
    preview: 'معاينة',
    apply: 'تطبيق القالب',
    cancel: 'إلغاء',
    templates: 'القوالب',
    categories: {
      professional: 'احترافي',
      minimal: 'بسيط',
      colorful: 'ملون',
      academic: 'أكاديمي',
      custom: 'مخصص',
    },
    variables: {
      primaryColor: 'اللون الأساسي',
      secondaryColor: 'اللون الثانوي',
      backgroundColor: 'لون الخلفية',
      textColor: 'لون النص',
      fontFamily: 'نوع الخط',
      fontSize: 'حجم الخط',
      lineHeight: 'ارتفاع السطر',
      showHeader: 'إظهار الترويسة',
      showFooter: 'إظهار التذييل',
      showTimestamps: 'إظهار الأوقات',
      showAvatars: 'إظهار الصور الرمزية',
      borderRadius: 'نصف قطر الزوايا',
    },
  },
  zh: {
    title: 'PDF 模板',
    selectTemplate: '选择模板',
    customize: '自定义',
    preview: '预览',
    apply: '应用模板',
    cancel: '取消',
    templates: '模板',
    categories: {
      professional: '专业',
      minimal: '简约',
      colorful: '多彩',
      academic: '学术',
      custom: '自定义',
    },
    variables: {
      primaryColor: '主色调',
      secondaryColor: '辅助色',
      backgroundColor: '背景色',
      textColor: '文字颜色',
      fontFamily: '字体',
      fontSize: '字号',
      lineHeight: '行高',
      showHeader: '显示页眉',
      showFooter: '显示页脚',
      showTimestamps: '显示时间戳',
      showAvatars: '显示头像',
      borderRadius: '圆角半径',
    },
  },
}

export interface PDFTemplateSelectorProps {
  /** Currently selected template ID */
  selectedTemplateId?: string
  /** Language */
  language?: 'en' | 'ar' | 'zh'
  /** Callback when template is selected */
  onSelect?: (template: PDFTemplate, variables: TemplatePresets) => void
  /** Callback when cancelled */
  onCancel?: () => void
}

/**
 * PDF Template Selector Component.
 */
export function PDFTemplateSelector({
  selectedTemplateId = 'professional',
  language = 'en',
  onSelect,
  onCancel,
}: PDFTemplateSelectorProps) {
  const labels = TEMPLATE_LABELS[language] ?? TEMPLATE_LABELS.en
  const isRTL = language === 'ar'

  const [selectedId, setSelectedId] = useState(selectedTemplateId)
  const [variables, setVariables] = useState<TemplatePresets>({})
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const selectedTemplate = getTemplate(selectedId) ?? BUILTIN_TEMPLATES[0]!

  const categories = ['all', 'professional', 'minimal', 'colorful', 'academic'] as const

  const filteredTemplates = activeCategory === 'all' 
    ? BUILTIN_TEMPLATES 
    : BUILTIN_TEMPLATES.filter(t => t.category === activeCategory)

  const handleVariableChange = (key: string, value: unknown) => {
    setVariables(prev => ({ ...prev, [key]: value }))
  }

  const handleApply = () => {
    onSelect?.(selectedTemplate, variables)
  }

  const containerStyle: React.CSSProperties = {
    background: 'var(--color-bg-primary, #ffffff)',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '700px',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
    direction: isRTL ? 'rtl' : 'ltr',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '20px',
    color: 'var(--color-text-primary, #1f2937)',
  }

  const sectionStyle: React.CSSProperties = {
    marginBottom: '24px',
  }

  const categoryButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    background: isActive ? 'var(--color-primary, #3b82f6)' : 'var(--color-bg-secondary, #f3f4f6)',
    color: isActive ? '#ffffff' : 'var(--color-text-primary, #374151)',
    transition: 'all 0.2s',
  })

  const templateCardStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '16px',
    border: `2px solid ${isSelected ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
    borderRadius: '8px',
    cursor: 'pointer',
    background: isSelected ? 'var(--color-primary-light, #dbeafe)' : 'var(--color-bg-primary, #ffffff)',
    transition: 'all 0.2s',
  })

  const variableInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-border, #d1d5db)',
    fontSize: '14px',
    background: 'var(--color-bg-primary, #fff)',
    color: 'var(--color-text-primary, #1f2937)',
  }

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  }

  const buttonStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  }

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>{labels.title}</h2>

      {/* Category Filter */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              style={categoryButtonStyle(activeCategory === cat)}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? labels.templates : labels.categories[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div style={sectionStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              style={templateCardStyle(selectedId === template.id)}
              onClick={() => setSelectedId(template.id)}
            >
              <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-primary, #111827)' }}>
                {template.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>
                {template.description}
              </div>
              <div style={{ 
                marginTop: '8px', 
                padding: '4px 8px', 
                background: 'var(--color-bg-secondary, #f3f4f6)', 
                borderRadius: '4px', 
                fontSize: '11px',
                display: 'inline-block',
              }}>
                {labels.categories[template.category] ?? template.category}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variable Customization */}
      {selectedTemplate && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text-primary, #111827)' }}>
            {labels.customize}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {/* Color Variables */}
            {Object.entries(selectedTemplate.variables).filter(([_, def]) => def.type === 'color').map(([key, def]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--color-text-secondary, #6b7280)' }}>
                  {labels.variables[key as keyof typeof labels.variables] ?? key}
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={String(variables[key] ?? def.default)}
                    onChange={(e) => handleVariableChange(key, e.target.value)}
                    style={{ width: '40px', height: '32px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={String(variables[key] ?? def.default)}
                    onChange={(e) => handleVariableChange(key, e.target.value)}
                    style={{ ...variableInputStyle, flex: 1 }}
                  />
                </div>
              </div>
            ))}

            {/* Number Variables */}
            {(Object.entries(selectedTemplate.variables).filter(([_, def]) => def.type === 'number') as Array<[string, { type: 'number'; default: number; min?: number; max?: number }]>).map(([key, def]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--color-text-secondary, #6b7280)' }}>
                  {labels.variables[key as keyof typeof labels.variables] ?? key}
                </label>
                <input
                  type="number"
                  value={String(variables[key] ?? def.default)}
                  min={def.min}
                  max={def.max}
                  step={key.includes('line') ? 0.1 : 1}
                  onChange={(e) => handleVariableChange(key, Number(e.target.value))}
                  style={variableInputStyle}
                />
              </div>
            ))}

            {/* Select Variables */}
            {(Object.entries(selectedTemplate.variables).filter(([_, def]) => def.type === 'select') as Array<[string, { type: 'select'; options: string[]; default: string }]>).map(([key, def]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--color-text-secondary, #6b7280)' }}>
                  {labels.variables[key as keyof typeof labels.variables] ?? key}
                </label>
                <select
                  value={String(variables[key] ?? def.default)}
                  onChange={(e) => handleVariableChange(key, e.target.value)}
                  style={variableInputStyle}
                >
                  {def.options.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}

            {/* Boolean Variables */}
            {Object.entries(selectedTemplate.variables).filter(([_, def]) => def.type === 'boolean').map(([key, def]) => (
              <div key={key}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-secondary, #6b7280)' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(variables[key] ?? def.default)}
                    onChange={(e) => handleVariableChange(key, e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  {labels.variables[key as keyof typeof labels.variables] ?? key}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={buttonRowStyle}>
        {onCancel && (
          <button
            style={{
              ...buttonStyle,
              background: 'var(--color-bg-secondary, #f3f4f6)',
              color: 'var(--color-text-primary, #374151)',
            }}
            onClick={onCancel}
          >
            {labels.cancel}
          </button>
        )}
        <button
          style={{
            ...buttonStyle,
            background: 'var(--color-primary, #2563eb)',
            color: '#ffffff',
          }}
          onClick={handleApply}
        >
          {labels.apply}
        </button>
      </div>
    </div>
  )
}
