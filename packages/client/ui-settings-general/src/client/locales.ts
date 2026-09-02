/** Shell chrome and General-nav dictionaries; feature rows own their copy. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'trigger': '设置',
  'title': '设置',
  'close': '关闭',
  'openDocument': '打开配置文件',
  'openDocument.error': '无法打开配置文件',
  'general.nav': '通用设置',
  'connection.error': '连接异常',
  'connection.retry': '立即重连',
  'connection.connecting': '连接中',
  'connection.connected': '连接成功',
  'connection.reconnect': '连接异常，点击立即重连',
  'connection.restart': '连接中，点击立即重连',
  'about.nav': '关于',
  'keyboard-shortcuts.nav': '键盘快捷键',
  'feature-controls.nav': '功能控制',
  'unified-dashboard.nav': '统一仪表板',
  'perf-quality-focus.nav': '性能·质量·专注',
  'accessible-themes.nav': '无障碍主题',
} satisfies Record<string, string>

/** The settings namespace key union. */
export type SettingsKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'trigger': 'Settings',
  'title': 'Settings',
  'close': 'Close',
  'openDocument': 'Open configuration file',
  'openDocument.error': 'Could not open configuration file',
  'general.nav': 'General',
  'connection.error': 'Disconnected',
  'connection.retry': 'Reconnect now',
  'connection.connecting': 'Connecting',
  'connection.connected': 'Connected',
  'connection.reconnect': 'Disconnected, reconnect now',
  'connection.restart': 'Connecting, restart now',
  'about.nav': 'About',
  'keyboard-shortcuts.nav': 'Keyboard Shortcuts',
  'feature-controls.nav': 'Feature Controls',
  'unified-dashboard.nav': 'Unified Dashboard',
  'perf-quality-focus.nav': 'Performance, Quality & Focus',
  'accessible-themes.nav': 'Accessible Themes',
} satisfies Record<SettingsKey, string>
