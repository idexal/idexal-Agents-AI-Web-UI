/**
 * Idexal Agents Desktop — Electron Main Process
 *
 * Provides native desktop capabilities: file system access, system tray,
 * menu bar, auto-updater hooks, and secure IPC bridge to the renderer.
 */

import { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage } from 'electron'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { existsSync } from 'node:fs'


// ---------------------------------------------------------------------------
// Window state
// ---------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const isDev = !app.isPackaged
const DEV_URL = 'http://127.0.0.1:3080'
const PROD_PATH = path.join(__dirname, '..', '..', 'web', 'dist', 'index.html')

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Idexal Agents',
    icon: path.join(__dirname, '..', '..', 'web', 'public', 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#0F172A',
    show: false,
  })

  // Graceful show after ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the web app
  if (isDev) {
    mainWindow.loadURL(DEV_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(PROD_PATH)
  }

  // Close behavior: hide to tray on macOS, quit elsewhere
  mainWindow.on('close', (e: Electron.Event) => {
    if (process.platform === 'darwin') {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ---------------------------------------------------------------------------
// System tray
// ---------------------------------------------------------------------------

function createTray(): void {
  const iconPath = path.join(__dirname, '..', '..', 'web', 'public', 'icon.png')
  if (!existsSync(iconPath)) return

  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  tray = new Tray(icon)
  tray.setToolTip('Idexal Agents')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Idexal Agents', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => mainWindow?.show())
}

// ---------------------------------------------------------------------------
// IPC Handlers — File System
// ---------------------------------------------------------------------------

function registerFileSystemHandlers(): void {
  // Read file
  ipcMain.handle('fs:read-file', async (_event: Electron.IpcMainInvokeEvent, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return { success: true, content }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Write file
  ipcMain.handle('fs:write-file', async (_event: Electron.IpcMainInvokeEvent, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8')
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Read directory
  ipcMain.handle('fs:read-dir', async (_event: Electron.IpcMainInvokeEvent, dirPath: string) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const items = entries.map(entry => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
      }))
      return { success: true, items }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Check if path exists
  ipcMain.handle('fs:exists', async (_event: Electron.IpcMainInvokeEvent, filePath: string) => {
    try {
      await fs.access(filePath)
      return { success: true, exists: true }
    } catch {
      return { success: true, exists: false }
    }
  })

  // Create directory
  ipcMain.handle('fs:mkdir', async (_event: Electron.IpcMainInvokeEvent, dirPath: string) => {
    try {
      await fs.mkdir(dirPath, { recursive: true })
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Delete file
  ipcMain.handle('fs:delete', async (_event: Electron.IpcMainInvokeEvent, filePath: string) => {
    try {
      const stat = await fs.stat(filePath)
      if (stat.isDirectory()) {
        await fs.rm(filePath, { recursive: true })
      } else {
        await fs.unlink(filePath)
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Get file stats
  ipcMain.handle('fs:stat', async (_event: Electron.IpcMainInvokeEvent, filePath: string) => {
    try {
      const stat = await fs.stat(filePath)
      return {
        success: true,
        stat: {
          size: stat.size,
          isDirectory: stat.isDirectory(),
          isFile: stat.isFile(),
          modified: stat.mtime.toISOString(),
          created: stat.birthtime.toISOString(),
        },
      }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Rename/move file
  ipcMain.handle('fs:rename', async (_event: Electron.IpcMainInvokeEvent, oldPath: string, newPath: string) => {
    try {
      await fs.rename(oldPath, newPath)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })
}

// ---------------------------------------------------------------------------
// IPC Handlers — Dialogs
// ---------------------------------------------------------------------------

function registerDialogHandlers(): void {
  // Open file dialog
  ipcMain.handle('dialog:open-file', async (_event: Electron.IpcMainInvokeEvent, options?: Electron.OpenDialogOptions) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      ...options,
    })
    return { canceled: result.canceled, filePaths: result.filePaths }
  })

  // Open folder dialog
  ipcMain.handle('dialog:open-folder', async (_event: Electron.IpcMainInvokeEvent) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    })
    return { canceled: result.canceled, filePaths: result.filePaths }
  })

  // Save file dialog
  ipcMain.handle('dialog:save-file', async (_event: Electron.IpcMainInvokeEvent, options?: Electron.SaveDialogOptions) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'Markdown', extensions: ['md'] },
      ],
      ...options,
    })
    return { canceled: result.canceled, filePath: result.filePath }
  })
}

// ---------------------------------------------------------------------------
// IPC Handlers — App Info
// ---------------------------------------------------------------------------

function registerAppInfoHandlers(): void {
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    arch: process.arch,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome,
    isPackaged: app.isPackaged,
  }))

  ipcMain.handle('app:quit', () => {
    app.quit()
  })

  ipcMain.handle('app:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('app:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.handle('app:toggle-fullscreen', () => {
    mainWindow?.setFullScreen(!mainWindow.isFullScreen())
  })
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    registerFileSystemHandlers()
    registerDialogHandlers()
    registerAppInfoHandlers()
    createWindow()
    createTray()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      } else {
        mainWindow?.show()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
