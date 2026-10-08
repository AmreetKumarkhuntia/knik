import { Component } from 'react'
import FullScreenError from '$components/feedback/FullScreenError'
import type { ErrorBoundaryProps, ErrorBoundaryState } from '$types/sections/feedback'

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
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      )
    }
    return this.props.children
  }
}
