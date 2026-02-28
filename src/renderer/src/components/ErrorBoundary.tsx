/**
 * React Error Boundary component.
 *
 * Catches unhandled errors in the React component tree and displays
 * a fallback UI instead of crashing the entire application.
 * Logs errors to the persistent log file via IPC.
 *
 * Must be a class component because React does not support error
 * boundaries with hooks (getDerivedStateFromError, componentDidCatch).
 */

import React from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const stack = errorInfo.componentStack
      ? `${error.stack || ''}\n\nComponent stack:${errorInfo.componentStack}`
      : error.stack

    // Write to persistent log file
    if (window.api?.log) {
      window.api.log.write('error', `React Error Boundary caught: ${error.message}\n${stack || ''}`)
    }
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null })
  }

  handleOpenLog = (): void => {
    if (window.api?.log) {
      window.api.log.openFile()
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '2rem',
            backgroundColor: 'var(--color-bg-primary, #1e1e1e)',
            color: 'var(--color-text-primary, #cccccc)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              textAlign: 'center'
            }}
          >
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: 'var(--color-error, #f14c4c)'
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
                color: 'var(--color-text-secondary, #858585)'
              }}
            >
              An unexpected error occurred. You can try reloading the application or check the log
              file for details.
            </p>
            {this.state.error && (
              <pre
                style={{
                  textAlign: 'left',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--color-bg-secondary, #252526)',
                  border: '1px solid var(--color-border, #3c3c3c)',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: '200px',
                  marginBottom: '1.5rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: 'var(--color-error, #f14c4c)'
                }}
              >
                {this.state.error.message}
                {this.state.error.stack && `\n\n${this.state.error.stack}`}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'var(--color-accent, #007acc)',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  letterSpacing: '0.025em'
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleOpenLog}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '9999px',
                  border: '1px solid var(--color-border, #3c3c3c)',
                  backgroundColor: 'var(--color-bg-tertiary, #2d2d2d)',
                  color: 'var(--color-text-primary, #cccccc)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  letterSpacing: '0.025em'
                }}
              >
                Open Log File
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
