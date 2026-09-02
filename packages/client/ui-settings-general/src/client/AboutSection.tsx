/**
 * About section for Idexal Agents settings.
 * Displays information about the platform and its founder.
 */

import { useState, useEffect, useCallback } from 'react'
import css from './GeneralSection.module.css'

type Language = 'en' | 'ar' | 'zh'

interface ChangelogEntry {
  version: string
  date: string
  type: 'major' | 'minor' | 'patch' | 'alpha' | 'beta'
  changes: { category: string; items: string[] }[]
}

interface AboutContent {
  title: string
  subtitle: string
  mission: string
  missionDescription: string
  leadership: string
  founder: string
  founderRole: string
  founderBio: string
  founderBioDetail: string
  values: string
  value1Title: string
  value1Desc: string
  value2Title: string
  value2Desc: string
  value3Title: string
  value3Desc: string
  contact: string
  website: string
  email: string
  github: string
  platform: string
  platformDesc: string
  version: string
  license: string
  copyright: string
  poweredBy: string
  appearance: string
  darkMode: string
  lightMode: string
  systemMode: string
  darkModeDesc: string
  lightModeDesc: string
  systemModeDesc: string
  changelog: string
  viewAll: string
  viewLess: string
  released: string
}

const translations: Record<Language, AboutContent> = {
  en: {
    title: 'About Idexal Agents',
    subtitle: 'AI-powered IDE for every developer',
    mission: 'Our Mission',
    missionDescription: 'Idexal Agents is an open-source, AI-powered IDE that competes with the best proprietary solutions — accessible to every developer on every platform. We believe in making world-class developer tools accessible to everyone.',
    leadership: 'Leadership',
    founder: 'Zakariae Lahbabi',
    founderRole: 'Founder, CEO & Lead Developer',
    founderBio: 'The Vision Behind Idexal',
    founderBioDetail: 'Passionate about building world-class developer tools. Zakariae founded Idexal with the mission of creating an open-source, AI-powered IDE that competes with the best proprietary solutions — accessible to every developer on every platform.',
    values: 'Our Values',
    value1Title: 'Open Source',
    value1Desc: 'We believe in transparency and community-driven development. Our code is open for everyone to inspect, contribute to, and build upon.',
    value2Title: 'Accessibility',
    value2Desc: 'World-class tools should be available to every developer, regardless of their platform or background.',
    value3Title: 'Innovation',
    value3Desc: 'We constantly push the boundaries of what\'s possible with AI-powered development tools.',
    contact: 'Contact',
    website: 'Website',
    email: 'Email',
    github: 'GitHub',
    platform: 'Platform',
    platformDesc: 'Idexal Agents - Open-source AI-powered IDE',
    version: 'Version',
    license: 'License',
    copyright: '© 2026 Idexal. All rights reserved.',
    poweredBy: 'Built with ❤️ by Idexal',
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    systemMode: 'System',
    darkModeDesc: 'Easy on the eyes for low-light environments',
    lightModeDesc: 'Clean and bright interface',
    systemModeDesc: 'Automatically match your OS setting',
    changelog: 'Version History',
    viewAll: 'View All Versions',
    viewLess: 'Show Less',
    released: 'Released',
  },
  ar: {
    title: 'عن Idexal Agents',
    subtitle: 'بيئة تطوير ذكاء اصطناعي مفتوحة المصدر لكل مطور',
    mission: 'مهمتنا',
    missionDescription: 'Idexal Agents هو بيئة تطوير مفتوحة المصدر ومدعومة بالذكاء الاصطناعي ت competes مع أفضل الحلول المملوكة — متاحة لكل مطور على كل منصة. نحن نؤمن بجعل أدوات التطوير العالمية متاحة للجميع.',
    leadership: 'القيادة',
    founder: 'Zakariae Lahbabi',
    founderRole: 'المؤسس، الرئيس التنفيذي والرئيس المطور',
    founderBio: 'الرؤية وراء Idexal',
    founderBioDetail: 'شغوف ببناء أدوات تطوير عالمية المستوى. أسس Zakariae Idexal بهدف إنشاء بيئة تطوير مفتوحة المصدر ومدعومة بالذكاء الاصطناعي ت competes مع أفضل الحلول المملوكة — متاحة لكل مطور على كل منصة.',
    values: 'قيمنا',
    value1Title: 'مفتوح المصدر',
    value1Desc: 'نؤمن بالشفافية والتطوير المدفوع بالمجتمع. كودنا مفتوح للجميع لل Peek والمساهمة والبناء عليه.',
    value2Title: 'إمكانية الوصول',
    value2Desc: 'الأدوات العالمية يجب أن تكون متاحة لكل مطور، بغض النظر عن منصته أو خلفيته.',
    value3Title: 'الابتكار',
    value3Desc: 'ندفع باستمرار حدود ما هو ممكن مع أدوات التطوير المدعومة بالذكاء الاصطناعي.',
    contact: 'التواصل',
    website: 'الموقع الإلكتروني',
    email: 'البريد الإلكتروني',
    github: 'GitHub',
    platform: 'المنصة',
    platformDesc: 'Idexal Agents - بيئة تطوير ذكاء اصطناعي مفتوحة المصدر',
    version: 'الإصدار',
    license: 'الرخصة',
    copyright: '© 2026 Idexal. جميع الحقوق محفوظة.',
    poweredBy: 'صنع بـ ❤️ بواسطة Idexal',
    appearance: 'المظهر',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    systemMode: 'النظام',
    darkModeDesc: 'مريح للعينين في بيئات الإضاءة المنخفضة',
    lightModeDesc: 'واجهة نظيفة ومضيئة',
    systemModeDesc: 'مطابقة تلقائي لإعدادات نظام التشغيل',
    changelog: 'سجل الإصدارات',
    viewAll: 'عرض جميع الإصدارات',
    viewLess: 'عرض أقل',
    released: 'صادر',
  },
  zh: {
    title: '关于 Idexal Agents',
    subtitle: '面向每位开发者的开源 AI 驱动 IDE',
    mission: '我们的使命',
    missionDescription: 'Idexal Agents 是一个开源的 AI 驱动的 IDE，与最好的专有解决方案竞争——让每个开发者在每个平台上都能使用。我们致力于让世界级的开发工具对每个人都可用。',
    leadership: '领导团队',
    founder: 'Zakariae Lahbabi',
    founderRole: '创始人、CEO 首席开发',
    founderBio: 'Idexal 背后的愿景',
    founderBioDetail: '热衷于构建世界级的开发工具。Zakariae 创立了 Idexal，使命是创建一个开源的 AI 驱动的 IDE，与最好的专有解决方案竞争——让每个开发者在每个平台上都能使用。',
    values: '我们的价值观',
    value1Title: '开源',
    value1Desc: '我们相信透明度和社区驱动的开发。我们的代码对每个人开放，可以检查、贡献和构建。',
    value2Title: '可访问性',
    value2Desc: '世界级工具应该对每位开发者可用，无论其平台或背景如何。',
    value3Title: '创新',
    value3Desc: '我们不断推动 AI 驱动开发工具的可能性边界。',
    contact: '联系我们',
    website: '网站',
    email: '电子邮件',
    github: 'GitHub',
    platform: '平台',
    platformDesc: 'Idexal Agents - 开源 AI 驱动的 IDE',
    version: '版本',
    license: '许可证',
    copyright: '© 2026 Idexal. 保留所有权利。',
    poweredBy: '由 Idexal 用心打造 ❤️',
    appearance: '外观',
    darkMode: '深色模式',
    lightMode: '浅色模式',
    systemMode: '系统',
    darkModeDesc: '低光环境下对眼睛更友好',
    lightModeDesc: '干净明亮的界面',
    systemModeDesc: '自动匹配操作系统设置',
    changelog: '版本历史',
    viewAll: '查看所有版本',
    viewLess: '收起',
    released: '发布于',
  },
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.3.8',
    date: '2026-09-02',
    type: 'alpha',
    changes: [
      { category: '🎨 Accessible Themes', items: ['High contrast light/dark themes (WCAG AAA)', 'Protanopia-safe colors (red-blind)', 'Deuteranopia-safe colors (green-blind)', 'Tritanopia-safe colors (blue-blind)', 'Combined high contrast + color-blind themes', 'Live contrast ratio preview with AA/AAA checks', 'Theme CSS export for custom integration', 'Auto-detect system accessibility preferences'] },
      { category: '♿ ARIA Accessibility', items: ['ARIA labels on TaskBoardUI, OnboardingWizardUI, GanttChart', 'Role attributes for dialogs, toolbars, grids, tabs', 'Screen reader live regions for dynamic content', 'Keyboard navigation improvements'] },
      { category: '🔄 Settings Sync', items: ['Cross-tab settings sync via BroadcastChannel', 'localStorage fallback for older browsers', 'Tab presence tracking with heartbeat', 'Conflict-free last-write-wins per key'] },
    ],
  },
  {
    version: '0.3.7',
    date: '2026-09-02',
    type: 'alpha',
    changes: [
      { category: '📚 Auto Documentation', items: ['Changelog generation from structured entries', 'Dependency documentation with categorization', 'Project README generator with features and install steps'] },
      { category: '🐛 Predictive Bug Detection', items: ['Complexity-based bug prediction from metrics', 'Comprehensive bug report with risk score and markdown export', 'Recommendations engine based on bug patterns'] },
      { category: '🔒 Security Scanner', items: ['Dependency vulnerability scanning with CVE database', 'SBOM (Software Bill of Materials) generation', 'Security report with risk grade and remediation steps'] },
    ],
  },
  {
    version: '0.3.5',
    date: '2026-09-02',
    type: 'alpha',
    changes: [
      { category: '📊 Performance, Quality & Focus Dashboard', items: ['Unified dashboard combining 3 views into one', 'Performance tab: 8 metrics with target tracking and progress bars', 'Quality tab: 8 quality dimensions with grades A-F and overall score ring', 'Focus tab: heatmap, session list, classification breakdown', 'Time range selector (Today / This Week / This Month)', 'Streak tracking and deep focus metrics', 'Real-time quality score ring visualization'] },
    ],
  },
  {
    version: '0.3.4',
    date: '2026-09-02',
    type: 'alpha',
    changes: [
      { category: '📈 Developer Analytics', items: ['Comprehensive productivity tracking with scoring', 'Flow state detection with quality classification', 'Coding pattern analysis (peak hours, AI acceptance, TDD)', 'Language breakdown with time distribution', 'Hourly productivity heatmap data', 'Weekly trend comparison', 'Export to JSON, Markdown, and CSV', 'localStorage persistence for offline analytics'] },
    ],
  },
  {
    version: '0.3.3',
    date: '2026-09-02',
    type: 'alpha',
    changes: [
      { category: '🔄 Real-time Sync', items: ['WebSocket-powered cross-device synchronization', 'Operational Transform for concurrent edits', 'Device registry with heartbeat and presence tracking', 'Vector clock causal ordering for conflict detection', 'Auto-reconnect with exponential backoff', 'Batched operation flush for performance', 'Conflict detection and manual/auto resolution', 'Real-time presence: active view, cursor, typing indicators', 'Full sync protocol: handshake, ops, snapshots, heartbeats'] },
    ],
  },
  {
    version: '0.3.2',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '📊 Unified Dashboard', items: ['Single view combining all 68 AI engines', 'Category tabs with 19 filter categories', 'Aggregate metrics: total engines, active count, success rate, latency', 'Enable All / Disable All batch controls', 'Search across all engines by name or description', 'Toggle individual engines on/off with live status', 'Detailed engine view with version, requests, success rate, latency'] },
    ],
  },
  {
    version: '0.3.1',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '🔧 Intelligent Refactoring', items: ['Extract-class detection for related functions', 'Extract-interface from function parameters', 'Dependency injection opportunity detection', 'Guard clause and nesting depth analysis', 'applyAll() for batch refactoring', 'getSummary() with impact estimates'] },
      { category: '📦 Smart Import Optimization', items: ['Bundle size impact analysis with KB estimates', 'Dynamic import recommendations for large modules', 'Tree-shaking optimization suggestions', 'Dependency graph builder with cycle detection', 'Fan-in/fan-out analysis and orphan detection', 'Bundle-specific recommendations'] },
      { category: '📊 Code Metrics Dashboard', items: ['Trend analysis with snapshot comparison', 'Technical debt estimation in hours', 'Export to JSON, CSV, and summary formats', 'Debt ratio calculation and grading', 'Per-metric trend direction tracking', 'Historical improvement/degradation analysis'] },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '🖥️ Desktop App', items: ['Native Electron shell with file system access', 'Secure IPC bridge via contextBridge', 'System tray integration with macOS hide-to-tray', 'Native dialogs for file open/save/folder selection', 'Single instance lock and window state management', 'App info: Electron, Node.js, Chrome versions'] },
    ],
  },
  {
    version: '0.2.9',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '⚙️ Feature Controls', items: ['Comprehensive Feature Controls settings page', 'Enable/disable any of 80+ AI engines and platform features', 'Category filtering, search, and batch operations (Enable All / Disable All)', 'Auto-persist to localStorage with language support (EN/AR/ZH)', 'Detailed feature info with expandable config panels'] },
    ],
  },
  {
    version: '0.2.8',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '🛡️ Security Auditor', items: ['AI-Powered Security Auditor with OWASP Top 10 detection', 'CVSS scoring, CWE tracking, and remediation plans', '18 built-in detection rules for injection, XSS, secrets, crypto'] },
      { category: '🗄️ Schema Analyzer', items: ['Smart Database Schema Analyzer with DDL parsing', 'Relationship detection, N+1 risk analysis, anti-pattern detection', 'Missing indexes, foreign keys, and timestamp warnings'] },
      { category: '📈 Regression Detector', items: ['Performance Regression Detector with snapshot comparison', 'Trend analysis, severity classification, and auto-recommendations', 'Build time, bundle size, render latency, and memory tracking'] },
      { category: '🔒 Vulnerability Scanner', items: ['Dependency Vulnerability Scanner with npm audit-style detection', 'Known CVE database, patch/minor/major fix classification', 'Risk scoring and upgrade recommendations'] },
      { category: '🧪 Coverage Optimizer', items: ['Test Coverage Optimizer with bang-per-buck prioritisation', 'Auto-generate test stubs for untested functions', 'Quick-win identification and complexity-based ranking'] },
    ],
  },
  {
    version: '0.2.7',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '🔍 Code Smell Detector', items: ['AI Code Smell Detector with 10+ smell types', 'Long methods, deep nesting, magic numbers, duplicate code detection', 'Severity-ranked suggestions with auto-fix confidence'] },
      { category: '🧪 API Tester', items: ['Smart API Tester for REST/GraphQL endpoint testing', 'Auto-generate tests from endpoint specs', 'Assertion engine with response code and latency checks'] },
      { category: '📊 Log Analyzer', items: ['Real-time Log Analyzer with pattern detection', 'Error spikes, stack traces, repeated errors, memory warnings', 'Log level breakdown and source tracking'] },
      { category: '🎨 Complexity Heatmap', items: ['Code Complexity Heatmap with visual scoring', 'Line-level and block-level complexity analysis', 'Hotspot/coldspot detection with recommendations'] },
      { category: '🔔 Notification Manager', items: ['Smart Notification Manager with prioritization and grouping', 'Quiet hours, rate limiting, snooze, and multi-channel delivery', 'Category and priority filtering with stats'] },
    ],
  },
  {
    version: '0.2.6',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '⚙️ Workflow Automation', items: ['AI Workflow Automation engine with CI/CD pipeline generation', 'Task scheduling, retry, rollback, and parallel step support', 'Built-in Node, Python, and generic CI templates'] },
      { category: '🏗️ Architecture Analyzer', items: ['Code Architecture Analyzer with clean/hexagonal/layered pattern detection', 'Dependency violation detection with severity levels', 'Circular dependency detection and maintainability scoring'] },
      { category: '📈 Productivity Tracker', items: ['Developer Productivity Tracker with session recording', 'Focus time ratio, peak hours, and activity breakdown', 'Daily metrics, trends, and actionable insights'] },
      { category: '🔍 Error Analytics', items: ['Advanced Error Analytics with clustering and pattern detection', 'Error categorization, severity assessment, and trend analysis', 'Root cause recommendations and MTTR estimation'] },
      { category: '⚡ Smart Completion v2', items: ['Smart Code Completion v2 with ML-style scoring', 'Cross-file suggestions, usage tracking, and fuzzy matching', 'Built-in snippets for TypeScript, Python, Rust, and Go'] },
    ],
  },
  {
    version: '0.2.5',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '📝 Doc Writer', items: ['AI Documentation Writer for README, API docs, changelog', 'Multi-language support (EN/AR/ZH)', 'Inline documentation generation', 'Markdown output with badges'] },
      { category: '📦 Dependency Manager', items: ['Smart Dependency Manager with security scanning', 'Vulnerability detection and fix suggestions', 'Health score calculation', 'Update and security fix commands'] },
      { category: '✨ Code Formatter', items: ['Code Snippet Formatter with multiple styles', 'Prettier-compatible formatting', 'Import sorting and quote conversion', 'Minify and beautify capabilities'] },
      { category: '📊 Project Dashboard', items: ['Project Dashboard with metrics and health', 'Activity tracking and widget system', 'Code quality and test coverage indicators', 'Real-time project overview'] },
      { category: '⚡ Quick Actions', items: ['20+ keyboard shortcuts', 'Command palette with search', 'Custom key bindings', 'Context-aware action filtering'] },
    ],
  },
  {
    version: '0.2.4',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '🤖 Code Review Bot', items: ['Automated code review with 15 built-in rules', 'Multi-category checking (security, performance, style)', 'Auto-fix capability for common issues', 'Score and grade system'] },
      { category: '🧪 Testing Framework', items: ['Test generation from source code', 'Edge case and error case detection', 'Coverage analysis', 'Multi-framework support (Jest, Vitest, Pytest)'] },
      { category: '📋 Migration Planner', items: ['Pre-built migration templates (React 18, TypeScript Strict, Node 20)', 'Step-by-step migration with risk assessment', 'Rollback strategies', 'Dependency tracking between steps'] },
      { category: '🔍 Advanced Search', items: ['Multi-mode search (text, regex, semantic, symbol)', 'Fuzzy matching with relevance scoring', 'Search suggestions and history', 'Context-aware results'] },
    ],
  },
  {
    version: '0.2.3',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '🤖 Code Generation', items: ['AI Code Generation from natural language', '7 built-in templates (React, Vue, Node, CLI, Python)', 'Style options (concise, verbose, documented, minimal)', 'Template variable interpolation'] },
      { category: '🛡️ Error Recovery', items: ['Smart Error Recovery with pattern matching', '11 error patterns with auto-fix suggestions', 'Root cause analysis and recovery strategies', 'Error history and statistics tracking'] },
      { category: '📚 Pattern Library', items: ['12 design patterns (Creational, Structural, Behavioral)', 'Concurrency and error handling patterns', 'Pattern recommendations based on context', 'Search with relevance scoring'] },
      { category: '📊 Advanced Analytics', items: ['Code quality analysis with 7 metrics', 'Project health reports with grades', 'Developer productivity tracking', 'Metric recording and aggregation'] },
    ],
  },
  {
    version: '0.2.2',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '💬 Review Chat', items: ['Interactive AI code review conversations', 'Thread-based discussions with suggestions', 'Auto-detect code smells and generate responses', 'Accept/dismiss suggestions with tracking'] },
      { category: '🔧 Smart Refactoring', items: ['10 refactoring patterns (extract, inline, rename)', '10 code smell detectors', 'Safety and impact scoring', 'Batch apply with auto-apply threshold'] },
      { category: '📋 Snippet Manager', items: ['Save and organize code snippets', 'Full-text search with relevance scoring', 'Collections and favorites', 'Export/import as JSON'] },
      { category: '🏗️ Project Templates', items: ['5 built-in templates (React, Vue, Node, CLI, React Native)', 'Template variable interpolation', 'Dependency and script generation', 'Custom template registration'] },
    ],
  },
  {
    version: '0.2.1',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '🌐 Code Translation', items: ['AI Code Translator between TypeScript and Python', '25+ translation rules with priority system', 'Auto language detection', 'Line-by-line mapping with warnings'] },
      { category: '👥 Real-time Collaboration', items: ['WebSocket-based collaboration engine', 'Operational Transform for conflict resolution', 'Cursor and selection sharing', 'Real-time chat with message history'] },
      { category: '🧩 Plugin System', items: ['Dynamic plugin loading and lifecycle management', 'Dependency resolution and permission system', 'Event-driven plugin communication', 'Plugin commands and custom UI panels'] },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '📚 Documentation', items: ['API Documentation Generator with multi-format output', 'Auto-extraction of functions, interfaces, and classes', 'OpenAPI spec generation', 'Multi-language doc support (EN/AR/ZH)'] },
      { category: '🔄 Migration', items: ['Code Migration Assistant for framework upgrades', 'React 16→18 migration rules (class-to-hooks, refs, lifecycle)', 'TypeScript strict mode migration', 'Automated code transformations with confidence scores'] },
      { category: '⚡ Profiling', items: ['Real-time Performance Profiler', 'FPS, memory, render, and interaction monitoring', 'Automatic bottleneck detection', 'Performance reports with recommendations'] },
      { category: '👥 Team Analytics', items: ['Developer productivity tracking', 'Code health assessment', 'Collaboration pattern detection', 'Sprint report generation'] },
    ],
  },
  {
    version: '0.1.9',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '🔗 Dependency Analysis', items: ['Smart Dependency Graph visualization', 'Circular dependency detection', 'Module clustering and cohesion analysis', 'Orphan and hub node detection'] },
      { category: '🔥 Code Heatmap', items: ['Visual code complexity heatmap', 'Block-level heat analysis', 'Hotspot and coldspot detection', 'Multi-metric heat scoring'] },
      { category: '📦 Git Integration', items: ['Git history parsing and analysis', 'Conventional commit suggestions', 'Diff parsing with hunk detection', 'Contributor statistics and health score'] },
      { category: '🐛 Smart Debugger', items: ['Error pattern recognition and categorization', 'Stack trace parsing with frame analysis', 'Intelligent fix suggestions with confidence', 'Debug session management'] },
    ],
  },
  {
    version: '0.1.8',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '📊 Dashboard', items: ['Unified Developer Dashboard combining all engines', 'Code Review UI with visual scoring and issue cards', 'Notifications Center with grouping and preferences', 'Real-time analysis with severity filtering'] },
      { category: '🎨 UI Components', items: ['Interactive code review with score visualization', 'Notification preferences with quiet hours', 'Type-based filtering with counts', 'Confidence scores for each issue'] },
    ],
  },
  {
    version: '0.1.7',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '🔍 Code Review', items: ['Intelligent Code Review engine with pattern detection', 'Correctness, performance, security, maintainability checks', 'Best practice enforcement and readability analysis', 'Custom review rules with regex patterns'] },
      { category: '🔔 Smart Notifications', items: ['Context-aware notification system with priority levels', 'Notification batching and grouping', 'Quiet hours and user preference management', 'Multi-type notifications (info, success, warning, error, task, reminder)'] },
      { category: '💡 AI Explanation', items: ['AI-Powered Code Explanation engine', 'Multi-level detail (beginner to expert)', 'Multilingual support (English, Arabic, Chinese)', 'Complexity analysis with time/space estimates'] },
    ],
  },
  {
    version: '0.1.6',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '🔍 Search Intelligence', items: ['Context-Aware Search with intent detection', 'Semantic code analysis', 'Related file discovery', 'Search suggestions from history'] },
      { category: '🧪 Test Automation', items: ['Automated Test Generation', 'Edge case detection', 'Boundary value testing', 'Error handling tests'] },
      { category: '⚡ Performance', items: ['Performance Prediction engine', 'Memory leak detection', 'Blocking operation detection', 'Unoptimized render detection'] },
    ],
  },
  {
    version: '0.1.5',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '🧠 AI Intelligence', items: ['Intelligent Code Refactoring with pattern detection and auto-apply', 'Smart Import Optimization with unused/duplicate/barrel detection', 'Code Metrics Dashboard with comprehensive analysis'] },
      { category: '🔬 Code Analysis', items: ['Cyclomatic and cognitive complexity metrics', 'Halstead volume calculation', 'Maintainability index scoring', 'Code smell detection'] },
      { category: '📦 Import Management', items: ['Unused import detection with auto-fix', 'Duplicate import merging', 'Barrel import warnings', 'Import ordering optimization'] },
    ],
  },
  {
    version: '0.1.4',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '🤖 AI Intelligence', items: ['Auto-Generated Documentation system', 'Predictive Bug Detection with confidence scores', 'Security Vulnerability Scanner with CVSS scoring'] },
      { category: '🧠 AI Intelligence', items: ['Smart Code Completion with Context Awareness', 'Code Quality Scoring with real-time analysis', 'Performance Dashboard with FPS/Memory monitoring', 'Focus Mode for distraction-free coding'] },
    ],
  },
  {
    version: '0.1.3',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '🧠 AI Intelligence', items: ['Smart Code Completion with Context Awareness', 'Code Quality Scoring with real-time analysis', 'Performance Dashboard with FPS/Memory monitoring', 'Focus Mode for distraction-free coding'] },
      { category: '♿ Accessibility', items: ['Accessibility panel with WCAG compliance', 'ARIA labels for all interactive components', 'Screen reader optimization'] },
    ],
  },
  {
    version: '0.1.2',
    date: '2026-09-01',
    type: 'alpha',
    changes: [
      { category: '✨ New Features', items: ['Advanced search with text, date, and participant filters', 'Real-time search indexing', 'Search result highlighting', 'Conversation export to PDF, Markdown, and JSON', 'Batch export for multiple conversations', 'PDF templates with custom styling', 'Conversation forking for editable copies', 'AI-powered smart suggestions', 'Onboarding wizard for new users', 'Command palette with keyboard shortcuts', 'Keyboard shortcuts customization'] },
      { category: '🎨 UI/UX', items: ['Comprehensive dark mode with system preference detection', 'RTL layout support for Arabic', 'Accessibility panel with WCAG compliance', 'ARIA labels for all interactive components', 'Animated micro-interactions and hover effects', 'Drag-and-drop task board', 'Gantt chart with task dependencies'] },
      { category: '🌐 Internationalization', items: ['Full Arabic language support', 'Chinese language support', 'Multi-language onboarding'] },
      { category: '♿ Accessibility', items: ['Screen reader optimization', 'Keyboard navigation', 'Focus management', 'High contrast mode', 'Reduced motion support'] },
    ],
  },
  {
    version: '0.1.1',
    date: '2026-08-15',
    type: 'alpha',
    changes: [
      { category: '✨ New Features', items: ['Task board with Kanban view', 'Real-time collaboration', 'Offline mode with sync', 'Settings export/import'] },
      { category: '🎨 UI/UX', items: ['Modern card-based design', 'Responsive layout', 'Loading skeletons'] },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-08-01',
    type: 'alpha',
    changes: [
      { category: '🚀 Initial Release', items: ['Core conversation UI', 'Basic settings page', 'Theme support', 'Locale detection'] },
    ],
  },
]

export interface AboutSectionProps {
  /** Locale language */
  locale?: Language
}

type Theme = 'light' | 'dark' | 'system'

export function AboutSection({ locale = 'en' }: AboutSectionProps) {
  const [language, setLanguage] = useState<Language>(locale)
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('idexal-theme') as Theme) || 'system'
    }
    return 'system'
  })
  const [isSystemDark, setIsSystemDark] = useState(false)

  const [showAllVersions, setShowAllVersions] = useState(false)

  const t = translations[language]
  const isRTL = language === 'ar'
  const visibleChangelog = showAllVersions ? CHANGELOG : CHANGELOG.slice(0, 2)

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsSystemDark(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches)
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Apply theme to document
  const applyTheme = useCallback((resolved: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.documentElement.classList.toggle('light', resolved === 'light')
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', resolved === 'dark' ? '#0A1628' : '#ffffff')
    }
  }, [])

  useEffect(() => {
    const resolved = theme === 'system' ? (isSystemDark ? 'dark' : 'light') : theme
    applyTheme(resolved)
    localStorage.setItem('idexal-theme', theme)
  }, [theme, isSystemDark, applyTheme])

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  return (
    <div className={css.aboutSection} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Language Selector */}
      <div className={css.languageSelector}>
        <button
          className={language === 'en' ? css.activeLang : ''}
          onClick={() => setLanguage('en')}
        >
          English
        </button>
        <button
          className={language === 'ar' ? css.activeLang : ''}
          onClick={() => setLanguage('ar')}
        >
          العربية
        </button>
        <button
          className={language === 'zh' ? css.activeLang : ''}
          onClick={() => setLanguage('zh')}
        >
          中文
        </button>
      </div>

      {/* Dark Mode Toggle */}
      <div className={css.themeSection}>
        <h2 className={css.themeSectionTitle}>{t.appearance}</h2>
        <div className={css.themeOptions}>
          <button
            className={`${css.themeOption} ${theme === 'light' ? css.themeActive : ''}`}
            onClick={() => handleThemeChange('light')}
            aria-label={t.lightMode}
          >
            <span className={css.themeIcon}>☀️</span>
            <div className={css.themeInfo}>
              <span className={css.themeLabel}>{t.lightMode}</span>
              <span className={css.themeDesc}>{t.lightModeDesc}</span>
            </div>
          </button>

          <button
            className={`${css.themeOption} ${theme === 'dark' ? css.themeActive : ''}`}
            onClick={() => handleThemeChange('dark')}
            aria-label={t.darkMode}
          >
            <span className={css.themeIcon}>🌙</span>
            <div className={css.themeInfo}>
              <span className={css.themeLabel}>{t.darkMode}</span>
              <span className={css.themeDesc}>{t.darkModeDesc}</span>
            </div>
          </button>

          <button
            className={`${css.themeOption} ${theme === 'system' ? css.themeActive : ''}`}
            onClick={() => handleThemeChange('system')}
            aria-label={t.systemMode}
          >
            <span className={css.themeIcon}>💻</span>
            <div className={css.themeInfo}>
              <span className={css.themeLabel}>{t.systemMode}</span>
              <span className={css.themeDesc}>{t.systemModeDesc}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className={css.aboutHeader}>
        <img src="/icon.png" width={100} height={100} alt="Idexal" style={{ objectFit: 'contain' }} />
        <h1 className={css.aboutTitle}>{t.title}</h1>
        <p className={css.aboutSubtitle}>{t.subtitle}</p>
      </div>

      {/* Mission */}
      <div className={css.aboutSection}>
        <h2 className={css.sectionTitle}>{t.mission}</h2>
        <p className={css.sectionDescription}>{t.missionDescription}</p>
      </div>

      {/* Leadership */}
      <div className={css.aboutSection}>
        <h2 className={css.sectionTitle}>{t.leadership}</h2>
        <div className={css.founderCard}>
          <div className={css.founderAvatar}>
            <span className={css.initials}>ZL</span>
          </div>
          <div className={css.founderInfo}>
            <h3 className={css.founderName}>{t.founder}</h3>
            <p className={css.founderRole}>{t.founderRole}</p>
            <p className={css.founderBioTitle}>{t.founderBio}</p>
            <p className={css.founderBio}>{t.founderBioDetail}</p>
            <div className={css.contactLinks}>
              <a href="https://zakariaelahbabi.com" target="_blank" rel="noopener noreferrer">
                🌐 zakariaelahbabi.com
              </a>
              <a href="mailto:info@zakariaelahbabi.com">
                ✉️ info@zakariaelahbabi.com
              </a>
              <a href="https://github.com/idexal" target="_blank" rel="noopener noreferrer">
                ⚡ GitHub @idexal
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className={css.aboutSection}>
        <h2 className={css.sectionTitle}>{t.values}</h2>
        <div className={css.valuesGrid}>
          <div className={css.valueCard}>
            <h3>{t.value1Title}</h3>
            <p>{t.value1Desc}</p>
          </div>
          <div className={css.valueCard}>
            <h3>{t.value2Title}</h3>
            <p>{t.value2Desc}</p>
          </div>
          <div className={css.valueCard}>
            <h3>{t.value3Title}</h3>
            <p>{t.value3Desc}</p>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className={css.aboutSection}>
        <h2 className={css.sectionTitle}>{t.contact}</h2>
        <div className={css.contactGrid}>
          <a href="https://agents.idexal.com" className={css.contactItem} target="_blank" rel="noopener noreferrer">
            <span className={css.contactIcon}>🌐</span>
            <span className={css.contactLabel}>{t.website}</span>
            <span className={css.contactValue}>agents.idexal.com</span>
          </a>
          <a href="mailto:agents@idexal.com" className={css.contactItem}>
            <span className={css.contactIcon}>✉️</span>
            <span className={css.contactLabel}>{t.email}</span>
            <span className={css.contactValue}>agents@idexal.com</span>
          </a>
          <a href="https://github.com/idexal" className={css.contactItem} target="_blank" rel="noopener noreferrer">
            <span className={css.contactIcon}>⚡</span>
            <span className={css.contactLabel}>{t.github}</span>
            <span className={css.contactValue}>@idexal</span>
          </a>
        </div>
      </div>

      {/* Platform Info */}
      <div className={css.aboutSection}>
        <h2 className={css.sectionTitle}>{t.platform}</h2>
        <p className={css.sectionDescription}>{t.platformDesc}</p>
        <div className={css.infoGrid}>
          <div className={css.infoItem}>
            <span className={css.infoLabel}>{t.version}:</span>
            <span className={css.infoValue}>0.3.6-alpha</span>
          </div>
          <div className={css.infoItem}>
            <span className={css.infoLabel}>{t.license}:</span>
            <span className={css.infoValue}>MIT</span>
          </div>
        </div>
      </div>

      {/* Changelog */}
      <div className={css.aboutSection}>
        <h2 className={css.sectionTitle}>{t.changelog}</h2>
        <div className={css.changelogTimeline}>
          {visibleChangelog.map((entry) => (
            <div key={entry.version} className={css.changelogEntry}>
              <div className={css.changelogHeader}>
                <span className={`${css.versionBadge} ${css[`badge${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}`] ?? ''}`}>
                  v{entry.version}
                </span>
                <span className={css.changelogDate}>{t.released} {entry.date}</span>
              </div>
              <div className={css.changelogChanges}>
                {entry.changes.map((change) => (
                  <div key={change.category} className={css.changeGroup}>
                    <h4 className={css.changeCategory}>{change.category}</h4>
                    <ul className={css.changeList}>
                      {change.items.map((item) => (
                        <li key={item} className={css.changeItem}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {CHANGELOG.length > 2 && (
          <button
            className={css.changelogToggle}
            onClick={() => setShowAllVersions(!showAllVersions)}
          >
            {showAllVersions ? t.viewLess : t.viewAll}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className={css.aboutFooter}>
        <p>{t.copyright}</p>
        <p className={css.poweredBy}>{t.poweredBy}</p>
      </div>
    </div>
  )
}

export default AboutSection
