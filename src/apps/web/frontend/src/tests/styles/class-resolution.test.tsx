import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Chip from '$components/display/Chip'
import Checkbox from '$components/forms/Checkbox'
import Slider from '$components/forms/Slider'
import ToggleSwitch from '$components/forms/ToggleSwitch'
import Accordion from '$components/surfaces/Accordion'
import BarChart from '$components/charts/BarChart'
import MetricCard from '$components/charts/MetricCard'
import StatStrip from '$components/charts/StatStrip'
import { STYLE_CONFIG } from '$constants/config'
import { renderedClasses, unresolvedClasses } from './helpers'

const noop = () => {}
const bars = [{ v: 1 }, { v: 3 }]

const cases: [string, ReactElement][] = [
  ...(['default', 'tag', 'voice', 'lang', 'team', 'input', 'kbd'] as const).map(
    variant =>
      [`Chip ${variant}`, <Chip key={variant} label="x" variant={variant} onRemove={noop} />] as [
        string,
        ReactElement,
      ]
  ),
  ['Checkbox', <Checkbox label="Enabled" checked={false} onChange={noop} disabled />],
  ['Slider', <Slider min={0} max={2} value={1} onChange={noop} label="Rate" />],
  ['ToggleSwitch', <ToggleSwitch aria-label="Stream" checked onChange={noop} />],
  [
    'Accordion',
    <Accordion items={[{ id: 'a', title: 'Title', content: 'Body' }]} defaultOpen={['a']} />,
  ],
  ['BarChart', <BarChart data={bars} xKey="x" yKey="v" />],
  ['BarChart horizontal', <BarChart data={bars} xKey="x" yKey="v" horizontal />],
  ['StatStrip', <StatStrip stats={[{ label: 'Runs', value: 3 }]} />],
  ['MetricCard', <MetricCard icon="bolt" label="Runs" value={3} />],
  ['MetricCard loading', <MetricCard icon="bolt" label="Runs" value={3} loading />],
]

describe('component classes resolve to generated or project CSS', () => {
  it.each(cases)('%s', async (_, element) => {
    const { container } = render(element)
    expect(await unresolvedClasses(renderedClasses(container))).toEqual([])
  })

  it('STYLE_CONFIG card variants', async () => {
    const classes = Object.values(STYLE_CONFIG.cardVariants).flatMap(value => value.split(' '))
    expect(await unresolvedClasses(classes)).toEqual([])
  })

  it('reports utilities Tailwind 3 drops', async () => {
    expect(
      await unresolvedClasses(['cursor-inherit', 'bg-aurora-300/10', 'knik-card', 'bg-surface/50'])
    ).toEqual(['cursor-inherit', 'bg-aurora-300/10'])
  })
})
