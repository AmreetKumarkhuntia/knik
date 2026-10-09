import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { StoresProvider } from '$stores'
import { useFeedbackStore } from '$stores/feedback'
import Toast from '$components/feedback/Toast'
import ToastWidget from '$widgets/feedback/ToastWidget'
import type { ToastType } from '$types/components'

function Notify({ message, type }: { message: string; type: ToastType }) {
  const addToast = useFeedbackStore(state => state.addToast)
  return <button onClick={() => addToast(message, type)}>Notify {message}</button>
}

function renderToasts() {
  const view = render(
    <StoresProvider source={{}}>
      <Notify message="Saved" type="success" />
      <Notify message="Failed" type="error" />
      <ToastWidget />
    </StoresProvider>
  )
  const region = view.container.querySelector('[aria-live="polite"]')
  if (!(region instanceof HTMLElement)) throw new Error('Toast live region is missing')
  return region
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Toast', () => {
  it('renders Material Symbols glyphs hidden from assistive tech', () => {
    const view = render(<Toast message="Saved" type="success" onClose={() => {}} />)
    expect(view.container.querySelector('svg')).toBeNull()
    expect(screen.getByText('check_circle')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button')).toHaveAccessibleName('Dismiss notification')
  })
})

describe('ToastWidget', () => {
  it('keeps a polite and an assertive live region mounted and routes toasts by severity', () => {
    const region = renderToasts()
    const notifications = screen.getByRole('region', { name: 'Notifications' })
    const assertive = notifications.querySelector('[aria-live="assertive"]')
    expect(region).toBeEmptyDOMElement()
    expect(assertive).toBeEmptyDOMElement()
    fireEvent.click(screen.getByRole('button', { name: 'Notify Saved' }))
    expect(region).toHaveTextContent('Saved')
    expect(region).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Notify Failed' }))
    expect(assertive).toHaveTextContent('Failed')
    expect(region).not.toHaveTextContent('Failed')
    expect(
      notifications.querySelectorAll(
        '[aria-live] :is([aria-live], [role="alert"], [role="status"])'
      )
    ).toHaveLength(0)
  })

  it('pauses auto-dismiss while the toast is hovered or focused', () => {
    vi.useFakeTimers()
    const region = renderToasts()
    fireEvent.click(screen.getByRole('button', { name: 'Notify Saved' }))
    const toast = region.firstElementChild
    if (!toast) throw new Error('Toast was not inserted')

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    fireEvent.mouseEnter(toast)
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(region).toHaveTextContent('Saved')
    fireEvent.mouseLeave(toast)
    act(() => {
      vi.advanceTimersByTime(2999)
    })
    expect(region).toHaveTextContent('Saved')

    act(() => screen.getByRole('button', { name: 'Dismiss notification' }).focus())
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(region).toHaveTextContent('Saved')
    act(() => screen.getByRole('button', { name: 'Notify Saved' }).focus())
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(region).toBeEmptyDOMElement()
  })
})
