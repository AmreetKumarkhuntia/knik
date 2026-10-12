import { Component } from 'react'
import FullScreenError from '$components/feedback/FullScreenError'
import type { ErrorBoundaryProps, ErrorBoundaryState } from '$types/sections/feedback'

// React.lazy caches a rejected import, so after a failed chunk load only a reload can retry it.
const CHUNK_LOAD_ERROR =
  /dynamically imported module|Importing a module script failed|ChunkLoadError/i

export default class ErrorBoundaryWidget extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <FullScreenError
          layout="screen"
          message={this.state.error?.message || 'An unexpected error occurred'}
          onRetry={() =>
            CHUNK_LOAD_ERROR.test(this.state.error?.message ?? '')
              ? window.location.reload()
              : this.setState({ hasError: false, error: null })
          }
        />
      )
    }
    return this.props.children
  }
}
