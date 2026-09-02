# 🖥️ Idexal Agents — Desktop Version Plan

> **Goal:** Convert Idexal Agents into a full-featured desktop application using Electron  
> **Target:** Windows, macOS, Linux  
> **Version:** 1.0.0  
> **Last Updated:** September 1, 2026

---

## 📋 Executive Summary

This document outlines the complete plan to convert Idexal Agents from a web application into a full desktop application using Electron. The desktop version will include all existing features plus native OS integrations, offline capabilities, and enhanced performance.

---

## 🎯 Objectives

| Objective | Priority | Timeline |
|-----------|----------|----------|
| Remove authentication restrictions | Critical | Week 1 |
| Create Electron shell | Critical | Weeks 1-2 |
| Native OS integrations | High | Weeks 2-4 |
| Offline-first architecture | High | Weeks 3-5 |
| Auto-update system | Medium | Weeks 4-6 |
| Native menu system | Medium | Weeks 5-7 |
| System tray integration | Medium | Weeks 6-8 |
| Performance optimization | High | Weeks 7-9 |
| Testing & QA | Critical | Weeks 8-10 |
| Release preparation | Critical | Weeks 9-11 |

---

## 🏗️ Architecture

### Current Architecture (Web)
```
┌─────────────────────────────────────────────┐
│                   Browser                   │
├─────────────────────────────────────────────┤
│  React UI  →  DSH Backend  →  DeepSeek API  │
└─────────────────────────────────────────────┘
```

### Target Architecture (Desktop)
```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Shell                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │  Main Process│  │Renderer     │  │  Preload Scripts    ││
│  │  (Node.js)   │  │(Chromium)   │  │  (Bridge)           ││
│  └─────────────┘  └─────────────┘  └─────────────────────┘│
│         │                │                    │             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │  Native APIs │  │  Web APIs   │  │  IPC Communication  ││
│  │  - File I/O  │  │  - IndexedDB│  │  - Events           ││
│  │  - Shell     │  │  - localStorage│ │  - Channels         ││
│  │  - Menu      │  │  - Web Workers│ │  - Methods          ││
│  │  - Tray      │  │  - WebSocket │  │                     ││
│  └─────────────┘  └─────────────┘  └─────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Phase 1: Authentication Fix (Week 1)

### Problem
The DSH web server requires `DEEPSEEK_API_KEY` for authentication, blocking unauthorized access.

### Solution Options

#### Option A: Local API Key Configuration
```typescript
// Allow users to set their own API key
const apiKey = await electron.dialog.showInputBox({
  title: 'API Key Required',
  label: 'Enter your DeepSeek API Key:',
  password: true,
})
```

#### Option B: Mock Backend for Offline Use
```typescript
// Create a mock backend that works without API key
const mockBackend = {
  generateCode: (prompt: string) => '/* Generated code */',
  analyzeCode: (code: string) => ({ score: 100 }),
}
```

#### Option C: Freemium Model
- Free tier: Limited features, no API key required
- Pro tier: Full features, requires API key
- Enterprise: Custom deployment

### Recommended: Option A + B Hybrid
- Default: Mock backend for offline use
- Optional: Real API key for full AI features

---

## 🔧 Phase 2: Electron Shell Setup (Weeks 1-2)

### Directory Structure
```
desktop/
├── electron/
│   ├── main.ts              # Main process entry
│   ├── preload.ts           # Preload script
│   ├── ipc-handlers.ts      # IPC handlers
│   ├── menu.ts              # Native menu
│   ├── tray.ts              # System tray
│   ├── updater.ts           # Auto-updater
│   ├── store.ts             # Local storage
│   └── windows.ts           # Window management
├── src/                     # React app (from web version)
├── assets/
│   ├── icons/               # App icons
│   └── tray/                # Tray icons
├── package.json
├── electron-builder.yml
└── tsconfig.json
```

### Package Dependencies
```json
{
  "dependencies": {
    "electron-store": "^8.0.0",
    "electron-updater": "^5.0.0",
    "electron-log": "^4.4.0"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0",
    "electron-reload": "^2.0.0",
    "@electron-forge/cli": "^6.0.0"
  }
}
```

### Main Process (`main.ts`)
```typescript
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0A1628',
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'))
  }
}

app.whenReady().then(createWindow)
```

### Preload Script (`preload.ts`)
```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
  
  // Dialog
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (content: string) => ipcRenderer.invoke('save-file-dialog', content),
  
  // Shell
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Window
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
})
```

---

## 🖱️ Phase 3: Native Integrations (Weeks 2-4)

### 3.1 Native File System
```typescript
// Read/write files directly
const content = await window.electronAPI.readFile('/path/to/file')
await window.electronAPI.writeFile('/path/to/file', newContent)

// Open file dialog
const filePath = await window.electronAPI.openFileDialog()
```

### 3.2 Native Menus
```typescript
// Application menu
const menu = Menu.buildFromTemplate([
  {
    label: 'File',
    submenu: [
      { label: 'New File', accelerator: 'CmdOrCtrl+N', click: () => {} },
      { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: () => {} },
      { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => {} },
      { type: 'separator' },
      { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
    ]
  },
  // ... more menus
])
```

### 3.3 System Tray
```typescript
// Create tray icon
const tray = new Tray(path.join(__dirname, 'assets', 'tray-icon.png'))
tray.setToolTip('Idexal Agents')

// Context menu
const contextMenu = Menu.buildFromTemplate([
  { label: 'Show', click: () => mainWindow?.show() },
  { label: 'Quit', click: () => app.quit() },
])
tray.setContextMenu(contextMenu)
```

### 3.4 Global Shortcuts
```typescript
// Register global shortcuts
globalShortcut.register('CommandOrControl+Shift+Space', () => {
  mainWindow?.show()
  mainWindow?.webContents.send('toggle-quick-panel')
})
```

---

## 💾 Phase 4: Offline-First Architecture (Weeks 3-5)

### 4.1 Local Database (SQLite)
```typescript
import Database from 'better-sqlite3'

const db = new Database('idexal-agents.db')

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT,
    created_at DATETIME,
    updated_at DATETIME
  )
  
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    role TEXT,
    content TEXT,
    created_at DATETIME,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  )
`)
```

### 4.2 IndexedDB for Browser Storage
```typescript
// Store conversations in IndexedDB
const db = await openDB('idexal-agents', 1, {
  upgrade(db) {
    db.createObjectStore('conversations', { keyPath: 'id' })
    db.createObjectStore('messages', { keyPath: 'id' })
    db.createObjectStore('settings', { keyPath: 'key' })
  }
})
```

### 4.3 Sync Engine
```typescript
class SyncEngine {
  private queue: SyncItem[] = []
  
  async sync() {
    if (!navigator.onLine) {
      // Queue for later
      this.queue.push(this.pendingChange)
      return
    }
    
    // Sync with server
    await this.syncToServer()
    await this.syncFromServer()
  }
}
```

---

## 🔄 Phase 5: Auto-Update System (Weeks 4-6)

### 5.1 Electron Updater
```typescript
import { autoUpdater } from 'electron-updater'

// Check for updates
autoUpdater.checkForUpdatesAndNotify()

// Handle update events
autoUpdater.on('update-available', () => {
  mainWindow?.webContents.send('update-available')
})

autoUpdater.on('download-progress', (progress) => {
  mainWindow?.webContents.send('update-progress', progress)
})

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})
```

### 5.2 Update Server
```yaml
# electron-builder.yml
publish:
  provider: github
  owner: idexal
  repo: agents
  releaseType: release
```

---

## 🎨 Phase 6: Enhanced UI Features (Weeks 5-7)

### 6.1 Custom Title Bar
```tsx
function TitleBar() {
  return (
    <div className="title-bar">
      <div className="title-bar-drag">
        <img src="/icon-16.png" alt="Idexal" />
        <span>Idexal Agents</span>
      </div>
      <div className="title-bar-controls">
        <button onClick={() => window.electronAPI.minimize()}>─</button>
        <button onClick={() => window.electronAPI.maximize()}>□</button>
        <button onClick={() => window.electronAPI.close()}>×</button>
      </div>
    </div>
  )
}
```

### 6.2 Native Notifications
```typescript
// Show native notifications
new Notification('Idexal Agents', {
  body: 'Task completed!',
  icon: path.join(__dirname, 'assets', 'icon.png'),
})
```

### 6.3 Drag & Drop Files
```typescript
// Handle file drops
document.addEventListener('drop', async (e) => {
  e.preventDefault()
  const files = Array.from(e.dataTransfer.files)
  
  for (const file of files) {
    const content = await file.text()
    await window.electronAPI.writeFile(file.path, content)
  }
})
```

---

## 📊 Phase 7: Performance Optimization (Weeks 7-9)

### 7.1 Memory Management
```typescript
// Monitor memory usage
const memUsage = process.memoryUsage()
console.log(`RSS: ${memUsage.rss / 1024 / 1024} MB`)
console.log(`Heap: ${memUsage.heapUsed / 1024 / 1024} MB`)
```

### 7.2 Lazy Loading
```typescript
// Lazy load heavy modules
const HeavyModule = React.lazy(() => import('./HeavyModule'))
```

### 7.3 Web Workers
```typescript
// Offload heavy computations
const worker = new Worker('worker.js')
worker.postMessage({ type: 'ANALYZE_CODE', code })
worker.onmessage = (e) => console.log(e.data)
```

---

## 🧪 Phase 8: Testing & QA (Weeks 8-10)

### 8.1 Unit Tests
```typescript
// Jest tests for main process
describe('Electron Main Process', () => {
  it('should create window', async () => {
    const win = await createWindow()
    expect(win).toBeDefined()
  })
})
```

### 8.2 E2E Tests
```typescript
// Playwright tests
test('should open file dialog', async () => {
  await page.click('[data-testid="open-file"]')
  expect(await page.waitForSelector('.file-dialog')).toBeTruthy()
})
```

### 8.3 Platform Testing
| Platform | Version | Status |
|----------|---------|--------|
| Windows  | 10/11   | TBD    |
| macOS    | 12+     | TBD    |
| Linux    | Ubuntu 22+ | TBD |

---

## 📦 Phase 9: Build & Distribution (Weeks 9-11)

### 9.1 Build Configuration
```yaml
# electron-builder.yml
appId: com.idexal.agents
productName: Idexal Agents
copyright: Copyright © 2026 Idexal

directories:
  output: release

files:
  - dist/**/*
  - assets/**/*
  - package.json

win:
  target: nsis
  icon: assets/icons/icon.ico
  
mac:
  target: dmg
  icon: assets/icons/icon.icns
  category: public.app-category.developer-tools
  
linux:
  target: AppImage
  icon: assets/icons/icon.png
  category: Development
```

### 9.2 NSIS Installer (Windows)
```yaml
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
```

### 9.3 Code Signing
```yaml
win:
  certificateFile: cert.pfx
  certificatePassword: ${CERT_PASSWORD}
  
mac:
  identity: "Developer ID Application: Idexal"
```

---

## 📅 Timeline Summary

```
Week 1:  ████████░░░░░░░░░░░░  Auth Fix + Project Setup
Week 2:  ████████████░░░░░░░░  Electron Shell + Main Process
Week 3:  ████████████████░░░░  Native File System + Menus
Week 4:  ████████████████████  System Tray + Global Shortcuts
Week 5:  ████████████████░░░░  Offline Storage + IndexedDB
Week 6:  ████████████████████  Auto-Update System
Week 7:  ████████████░░░░░░░░  Custom UI + Title Bar
Week 8:  ████████████████░░░░  Performance Optimization
Week 9:  ████████████████████  Testing & QA
Week 10: ████████████████████  Bug Fixes
Week 11: ████████████████████  Release Preparation
```

---

## 💰 Resource Requirements

| Resource | Quantity | Purpose |
|----------|----------|---------|
| Developer | 2-3 | Full-time development |
| Designer | 1 | UI/UX for desktop |
| QA Engineer | 1 | Testing & validation |
| DevOps | 0.5 | Build & deployment |

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Startup Time | <2s | Electron performance |
| Memory Usage | <200MB | Task Manager |
| Bundle Size | <150MB | Build output |
| Crash Rate | <0.1% | Sentry monitoring |
| User Satisfaction | >4.5/5 | Surveys |
| Download Rate | >10K/month | Analytics |

---

## 🚀 Release Plan

### v1.0.0-alpha (Week 8)
- Basic Electron shell
- File system access
- Offline storage

### v1.0.0-beta (Week 10)
- Auto-update system
- Native menus
- System tray

### v1.0.0-rc (Week 11)
- Performance optimization
- Bug fixes
- Documentation

### v1.0.0 (Week 12)
- Stable release
- Windows, macOS, Linux
- Auto-updates enabled

---

## 📚 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)
- [Electron Forge](https://www.electronforge.io/)
- [Better SQLite3](https://github.com/WiseLibs/better-sqlite3)

---

*This plan is a living document. It will be updated as development progresses.*
