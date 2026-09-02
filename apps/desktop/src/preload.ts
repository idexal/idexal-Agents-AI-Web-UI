/**
 * Idexal Agents Desktop — Preload Script
 *
 * Exposes a secure, typed IPC bridge from the main process to the renderer
 * via contextBridge. The renderer accesses the desktop API through
 * `window.idexal.desktop.*`.
 */

import { contextBridge, ipcRenderer } from 'electron'

// ---------------------------------------------------------------------------
// Desktop API — exposed to renderer
// ---------------------------------------------------------------------------

const desktopAPI = {
  // File System operations
  fs: {
    readFile: (filePath: string): Promise<{ success: boolean; content?: string; error?: string }> =>
      ipcRenderer.invoke('fs:read-file', filePath),

    writeFile: (filePath: string, content: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('fs:write-file', filePath, content),

    readDir: (dirPath: string): Promise<{
      success: boolean
      items?: Array<{ name: string; isDirectory: boolean; isFile: boolean }>
      error?: string
    }> => ipcRenderer.invoke('fs:read-dir', dirPath),

    exists: (filePath: string): Promise<{ success: boolean; exists: boolean }> =>
      ipcRenderer.invoke('fs:exists', filePath),

    mkdir: (dirPath: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('fs:mkdir', dirPath),

    delete: (filePath: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('fs:delete', filePath),

    stat: (filePath: string): Promise<{
      success: boolean
      stat?: {
        size: number
        isDirectory: boolean
        isFile: boolean
        modified: string
        created: string
      }
      error?: string
    }> => ipcRenderer.invoke('fs:stat', filePath),

    rename: (oldPath: string, newPath: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('fs:rename', oldPath, newPath),
  },

  // Dialog operations
  dialog: {
    openFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }): Promise<{
      canceled: boolean
      filePaths: string[]
    }> => ipcRenderer.invoke('dialog:open-file', options),

    openFolder: (): Promise<{
      canceled: boolean
      filePaths: string[]
    }> => ipcRenderer.invoke('dialog:open-folder'),

    saveFile: (options?: { defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }): Promise<{
      canceled: boolean
      filePath?: string
    }> => ipcRenderer.invoke('dialog:save-file', options),
  },

  // App info and controls
  app: {
    getInfo: (): Promise<{
      version: string
      name: string
      platform: string
      arch: string
      electronVersion: string
      nodeVersion: string
      chromeVersion: string
      isPackaged: boolean
    }> => ipcRenderer.invoke('app:info'),

    quit: (): Promise<void> => ipcRenderer.invoke('app:quit'),
    minimize: (): Promise<void> => ipcRenderer.invoke('app:minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('app:maximize'),
    toggleFullscreen: (): Promise<void> => ipcRenderer.invoke('app:toggle-fullscreen'),
  },

  // Platform info
  platform: process.platform,
  isElectron: true,
}

// ---------------------------------------------------------------------------
// Expose to renderer
// ---------------------------------------------------------------------------

contextBridge.exposeInMainWorld('idexal', {
  desktop: desktopAPI,
})

// Also expose a global flag for the renderer to detect Electron
contextBridge.exposeInMainWorld('isElectron', true)
