import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui'

interface ErrorBoundaryProps {
  children: ReactNode
  /** custom compact fallback; receives a reset callback */
  fallback?: (reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

function DefaultFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div
      role="alert"
      className="flex min-h-[50vh] w-full items-center justify-center px-4"
    >
      <div className="card max-w-md p-6 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-danger/10 text-danger">
          <TriangleAlert className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-lg font-extrabold text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The page hit an unexpected error. Your progress is saved locally — reloading is safe.
        </p>
        <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 font-mono text-[11px] text-ink-faint">
          {error.message || 'Unknown error'}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={onReset} size="sm">
            <RefreshCw className="size-3.5" /> Try again
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </div>
    </div>
  )
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[typesense] render error:', error, info.componentStack)
  }

  private reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (error) {
      return this.props.fallback ? this.props.fallback(this.reset) : <DefaultFallback error={error} onReset={this.reset} />
    }
    return this.props.children
  }
}
