import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Chip from '$components/display/Chip'
import Checkbox from '$components/forms/Checkbox'
import Slider from '$components/forms/Slider'
import ToggleSwitch from '$components/forms/ToggleSwitch'
import { renderedClasses, unresolvedClasses } from './helpers'

const noop = () => {}

const cases: [string, ReactElement][] = [
  ...(['default', 'tag'] as const).map(
    variant =>
      [`Chip ${variant}`, <Chip key={variant} label="x" variant={variant} onRemove={noop} />] as [
        string,
        ReactElement,
      ]
  ),
  ['Checkbox', <Checkbox label="Enabled" checked={false} onChange={noop} disabled />],
  ['Slider', <Slider min={0} max={2} value={1} onChange={noop} label="Rate" />],
  ['ToggleSwitch', <ToggleSwitch aria-label="Stream" checked onChange={noop} />],
]

describe('component classes resolve to generated or project CSS', () => {
  it.each(cases)('%s', async (_, element) => {
    const { container } = render(element)
    expect(await unresolvedClasses(renderedClasses(container))).toEqual([])
  })

  it('reports utilities Tailwind 3 drops', async () => {
    expect(
      await unresolvedClasses(['cursor-inherit', 'bg-aurora-300/10', 'knik-card', 'bg-surface/50'])
    ).toEqual(['cursor-inherit', 'bg-aurora-300/10'])
  })
})
