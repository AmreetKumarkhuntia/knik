import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NodeContent } from '$components/graph'

function renderFunction(params: unknown) {
  return render(
    <NodeContent renderer="function" data={{ function_name: 'demo.prepare', params }} />
  )
}

describe('function node parameter count', () => {
  it('counts the keys of a parameter object', () => {
    renderFunction({ sample: true, limit: 5 })
    expect(screen.getByText('2 parameters')).toBeInTheDocument()
  })

  it('counts parsed keys while the builder holds params as JSON text', () => {
    renderFunction('{"sample": true}')
    expect(screen.getByText('1 parameter')).toBeInTheDocument()
  })

  it.each(['{"sample": tr', '[1, 2, 3]', '"text"'])(
    'hides the count for text that is not a JSON object: %s',
    params => {
      renderFunction(params)
      expect(screen.getByText('demo.prepare')).toBeInTheDocument()
      expect(screen.queryByText(/parameter/)).not.toBeInTheDocument()
    }
  )
})
