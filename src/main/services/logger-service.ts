/**
 * Persistent logger service for the main process.
 *
 * Writes log entries to a persistent file in the Electron userData directory.
 * Provides session start/end markers, log levels, and file rotation.
 * Ported from legacy nail/logging/Log.as + LogFileTarget.as.
 *
 * Log file location: {userData}/objectbuilder.log
 */

import { app } from 'electron'
import { join } from 'path'
import { appendFileSync, writeFileSync, existsSync, statSync, readFileSync } from 'fs'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOG_FILE_NAME = 'objectbuilder.log'
const MAX_LOG_FILE_SIZE = 5 * 1024 * 1024 // 5 MB max before rotation

type LogLevel = 'info' | 'warning' | 'error'

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let _logFilePath: string | null = null
let _initialized = false

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLogFilePath(): string {
  if (!_logFilePath) {
    _logFilePath = join(app.getPath('userData'), LOG_FILE_NAME)
  }
  return _logFilePath
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

function levelTag(level: LogLevel): string {
  switch (level) {
    case 'info':
      return 'INFO'
    case 'warning':
      return 'WARN'
    case 'error':
      return 'ERROR'
  }
}

function formatEntry(level: LogLevel, message: string): string {
  return `[${formatTimestamp()}] [${levelTag(level)}] ${message}\n`
}

// ---------------------------------------------------------------------------
// File rotation
// ---------------------------------------------------------------------------

/**
 * Rotate the log file if it exceeds MAX_LOG_FILE_SIZE.
 * Keeps the last half of the file to preserve recent logs.
 */
function rotateIfNeeded(): void {
  const filePath = getLogFilePath()
  try {
    if (!existsSync(filePath)) return
    const stats = statSync(filePath)
    if (stats.size <= MAX_LOG_FILE_SIZE) return

    // Keep the last half of the file
    const content = readFileSync(filePath, 'utf-8')
    const halfIndex = Math.floor(content.length / 2)
    const nextNewline = content.indexOf('\n', halfIndex)
    const trimmed =
      nextNewline >= 0
        ? `--- Log rotated at ${formatTimestamp()} ---\n${content.substring(nextNewline + 1)}`
        : content
    writeFileSync(filePath, trimmed, 'utf-8')
  } catch {
    // Ignore rotation errors
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize the logger and write session start marker.
 * Called once during app startup.
 */
export function initLogger(): void {
  if (_initialized) return
  _initialized = true

  rotateIfNeeded()

  const appVersion = app.getVersion()
  const startMarker = `\n=== Object Builder v${appVersion} started at ${formatTimestamp()} ===\n`

  try {
    appendFileSync(getLogFilePath(), startMarker, 'utf-8')
  } catch {
    // Cannot write to log file - continue silently
  }
}

/**
 * Write session end marker.
 * Called during app shutdown.
 */
export function closeLogger(): void {
  if (!_initialized) return

  const endMarker = `=== Application closed at ${formatTimestamp()} ===\n`

  try {
    appendFileSync(getLogFilePath(), endMarker, 'utf-8')
  } catch {
    // Ignore
  }
}

/**
 * Write a log entry to the persistent log file.
 */
export function writeLog(level: LogLevel, message: string): void {
  if (!_initialized) {
    initLogger()
  }

  try {
    appendFileSync(getLogFilePath(), formatEntry(level, message), 'utf-8')
  } catch {
    // Cannot write to log file
  }
}

/**
 * Write an error with optional stack trace to the persistent log file.
 */
export function writeError(message: string, stack?: string): void {
  const fullMessage = stack ? `${message}\n${stack}` : message
  writeLog('error', fullMessage)
}

/**
 * Get the path to the persistent log file.
 */
export function getLogPath(): string {
  return getLogFilePath()
}

/**
 * Clear the persistent log file.
 */
export function clearLogFile(): void {
  try {
    writeFileSync(getLogFilePath(), '', 'utf-8')
  } catch {
    // Ignore
  }
}

/**
 * Reset logger state (for testing).
 */
export function resetLoggerService(): void {
  _logFilePath = null
  _initialized = false
}
