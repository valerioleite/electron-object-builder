/**
 * Auto-updater service for the main process.
 * Uses electron-updater to check for, download, and install updates from GitHub Releases.
 *
 * Ported from legacy ApplicationUpdaterUI (Adobe AIR) to electron-updater.
 */

import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import { writeLog, writeError } from './logger-service'

/** Update status sent to the renderer */
export interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  version?: string
  progress?: number
  error?: string
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let _initialized = false

// ---------------------------------------------------------------------------
// Internal: send update status to all renderer windows
// ---------------------------------------------------------------------------

function sendUpdateStatus(status: UpdateStatus): void {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send('updater:status', status)
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize the auto-updater with event listeners.
 * Should be called once during app startup.
 * In development mode, auto-check is disabled (no published releases to check).
 */
export function initUpdater(): void {
  if (_initialized) return
  _initialized = true

  // Disable auto-download — let the user decide
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    writeLog('info', 'Checking for updates...')
    sendUpdateStatus({ status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    writeLog('info', `Update available: v${info.version}`)
    sendUpdateStatus({ status: 'available', version: info.version })
  })

  autoUpdater.on('update-not-available', (info) => {
    writeLog('info', `No updates available (current: v${info.version})`)
    sendUpdateStatus({ status: 'not-available', version: info.version })
  })

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus({ status: 'downloading', progress: Math.round(progress.percent) })
  })

  autoUpdater.on('update-downloaded', (info) => {
    writeLog('info', `Update downloaded: v${info.version}`)
    sendUpdateStatus({ status: 'downloaded', version: info.version })
  })

  autoUpdater.on('error', (error) => {
    const message = error?.message || String(error)
    writeError(`Auto-updater error: ${message}`)
    sendUpdateStatus({ status: 'error', error: message })
  })
}

/**
 * Check for available updates.
 * Triggered by Help > Check for Updates menu action.
 */
export function checkForUpdates(): void {
  autoUpdater.checkForUpdates().catch((err) => {
    const message = err instanceof Error ? err.message : String(err)
    writeError(`Failed to check for updates: ${message}`)
    sendUpdateStatus({ status: 'error', error: message })
  })
}

/**
 * Download the available update.
 * Called after the renderer confirms the user wants to download.
 */
export function downloadUpdate(): void {
  autoUpdater.downloadUpdate().catch((err) => {
    const message = err instanceof Error ? err.message : String(err)
    writeError(`Failed to download update: ${message}`)
    sendUpdateStatus({ status: 'error', error: message })
  })
}

/**
 * Quit and install the downloaded update.
 * Called after the renderer confirms the user wants to install.
 */
export function quitAndInstall(): void {
  autoUpdater.quitAndInstall()
}

/**
 * Reset the updater service (for testing).
 */
export function resetUpdaterService(): void {
  _initialized = false
}
