/**
 * Settings persistence service for the Electron main process.
 * Stores ObjectBuilderSettings and WindowState as JSON files
 * in the app's userData directory.
 *
 * Ported from legacy SettingsManager (OTML .otcfg files) and
 * ObjectBuilderSettings (SharedObject-like persistence).
 *
 * Legacy flow:
 *   SettingsManager.loadSettings() -> OTML parse from .otcfg
 *   SettingsManager.saveSettings() -> OTML serialize to .otcfg
 *
 * Electron flow:
 *   loadSettings() -> JSON parse from settings.json
 *   saveSettings() -> JSON serialize to settings.json
 */

import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { ObjectBuilderSettings, WindowState } from '../../shared/settings'
import { createObjectBuilderSettings, createDefaultWindowState } from '../../shared/settings'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let settings: ObjectBuilderSettings = createObjectBuilderSettings()
let windowState: WindowState = createDefaultWindowState()
let settingsLoaded = false
let windowStateLoaded = false

// ---------------------------------------------------------------------------
// File paths
// ---------------------------------------------------------------------------

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function getWindowStatePath(): string {
  return join(app.getPath('userData'), 'window-state.json')
}

// ---------------------------------------------------------------------------
// Settings API
// ---------------------------------------------------------------------------

/**
 * Loads settings from disk. Safe to call multiple times - only loads once.
 * Returns the loaded settings.
 */
export async function loadSettings(): Promise<ObjectBuilderSettings> {
  if (settingsLoaded) return { ...settings }

  try {
    const filePath = getSettingsPath()
    const content = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content) as Partial<ObjectBuilderSettings>

    // Merge with defaults to handle missing keys from older versions
    const defaults = createObjectBuilderSettings()
    settings = { ...defaults }
    for (const key of Object.keys(defaults) as (keyof ObjectBuilderSettings)[]) {
      if (key in parsed && parsed[key] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(settings as any)[key] = parsed[key]
      }
    }
  } catch {
    // File doesn't exist or is invalid - use defaults
    settings = createObjectBuilderSettings()
  }

  settingsLoaded = true
  return { ...settings }
}

/**
 * Saves current settings to disk.
 */
export async function saveSettings(newSettings?: ObjectBuilderSettings): Promise<void> {
  if (newSettings) {
    settings = { ...newSettings }
  }

  const filePath = getSettingsPath()
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(settings, null, 2), 'utf-8')
}

/**
 * Returns current settings (in-memory copy).
 */
export function getSettings(): ObjectBuilderSettings {
  return { ...settings }
}

/**
 * Gets a single setting value by key.
 */
export function getSetting<K extends keyof ObjectBuilderSettings>(
  key: K
): ObjectBuilderSettings[K] {
  return settings[key]
}

/**
 * Sets a single setting value and auto-saves.
 */
export async function setSetting<K extends keyof ObjectBuilderSettings>(
  key: K,
  value: ObjectBuilderSettings[K]
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(settings as any)[key] = value
  await saveSettings()
}

/**
 * Resets all settings to defaults and saves.
 */
export async function resetSettings(): Promise<ObjectBuilderSettings> {
  settings = createObjectBuilderSettings()
  await saveSettings()
  return { ...settings }
}

// ---------------------------------------------------------------------------
// Window State API
// ---------------------------------------------------------------------------

/**
 * Loads window state from disk. Safe to call multiple times - only loads once.
 */
export async function loadWindowState(): Promise<WindowState> {
  if (windowStateLoaded) return { ...windowState }

  try {
    const filePath = getWindowStatePath()
    const content = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content) as Partial<WindowState>

    const defaults = createDefaultWindowState()
    windowState = {
      x: typeof parsed.x === 'number' ? parsed.x : defaults.x,
      y: typeof parsed.y === 'number' ? parsed.y : defaults.y,
      width: typeof parsed.width === 'number' && parsed.width > 0 ? parsed.width : defaults.width,
      height:
        typeof parsed.height === 'number' && parsed.height > 0 ? parsed.height : defaults.height,
      maximized: typeof parsed.maximized === 'boolean' ? parsed.maximized : defaults.maximized
    }
  } catch {
    windowState = createDefaultWindowState()
  }

  windowStateLoaded = true
  return { ...windowState }
}

/**
 * Saves window state to disk.
 */
export async function saveWindowState(state: WindowState): Promise<void> {
  windowState = { ...state }
  const filePath = getWindowStatePath()
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(windowState, null, 2), 'utf-8')
}

/**
 * Returns current window state (in-memory).
 */
export function getWindowState(): WindowState {
  return { ...windowState }
}

// ---------------------------------------------------------------------------
// Reset (for testing)
// ---------------------------------------------------------------------------

export function resetSettingsService(): void {
  settings = createObjectBuilderSettings()
  windowState = createDefaultWindowState()
  settingsLoaded = false
  windowStateLoaded = false
}
