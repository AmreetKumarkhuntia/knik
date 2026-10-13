import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ModelPicker from '$components/chat/ModelPicker'
import Avatar from '$components/display/Avatar'
import Badge from '$components/display/Badge'
import Chip from '$components/display/Chip'
import EmptyState from '$components/display/EmptyState'
import Kbd from '$components/display/Kbd'
import SectionHeader from '$components/display/SectionHeader'
import StatusBadge from '$components/display/StatusBadge'
import Table from '$components/display/Table'
import Checkbox from '$components/forms/Checkbox'
import Slider from '$components/forms/Slider'
import ToggleSwitch from '$components/forms/ToggleSwitch'
import Radio from '$components/forms/Radio'
import NavLink from '$components/navigation/NavLink'
import Pagination from '$components/navigation/Pagination'
import Tabs from '$components/navigation/Tabs'
import Banner from '$components/surfaces/Banner'
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
  ['Avatar accent', <Avatar initials="AK" color="accent" />],
  ['Avatar surface', <Avatar initials="AK" />],
  ['Badge default', <Badge>Paused</Badge>],
  ['Badge success', <Badge variant="success">Active</Badge>],
  ['StatusBadge running', <StatusBadge status="running" />],
  ['Kbd', <Kbd>K</Kbd>],
  ['EmptyState', <EmptyState title="Nothing" description="Try again" action="Retry" />],
  ['SectionHeader page', <SectionHeader title="Settings" subtitle="Preferences" />],
  ['SectionHeader section', <SectionHeader level="section" title="Recent" />],
  [
    'Table',
    <Table
      stickyHeader
      columns={[{ key: 'name', label: 'Name' }]}
      data={[{ id: 'a', name: 'Alpha' }]}
      getRowKey={row => row.id}
    />,
  ],
  ['Pagination', <Pagination currentPage={5} totalPages={9} onPageChange={noop} />],
  [
    'NavLink account',
    <MemoryRouter>
      <NavLink variant="account" href="/settings" label="Ada" icon={null} active />
    </MemoryRouter>,
  ],
  ['Banner', <Banner variant="warning">Heads up</Banner>],
  ['Checkbox', <Checkbox label="Enabled" checked={false} onChange={noop} disabled />],
  ['Slider', <Slider min={0} max={2} value={1} onChange={noop} />],
  ['ToggleSwitch', <ToggleSwitch aria-label="Stream" checked onChange={noop} />],
  ...(['standard', 'card', 'chip', 'segmented'] as const).map(
    presentation =>
      [
        `Radio ${presentation}`,
        <Radio
          key={presentation}
          name={presentation}
          presentation={presentation}
          value="a"
          onChange={noop}
          options={[
            { value: 'a', label: 'A', monoLabel: 'a' },
            { value: 'b', label: 'B' },
          ]}
        />,
      ] as [string, ReactElement]
  ),
  ...(
    [
      ['underline', 'horizontal'],
      ['pills', 'horizontal'],
      ['pills', 'vertical'],
    ] as const
  ).map(
    ([variant, orientation]) =>
      [
        `Tabs ${variant} ${orientation}`,
        <Tabs
          key={variant + orientation}
          variant={variant}
          orientation={orientation}
          active="a"
          onChange={noop}
          tabs={[
            { id: 'a', label: 'A', icon: 'tune' },
            { id: 'b', label: 'B' },
          ]}
        />,
      ] as [string, ReactElement]
  ),
]

describe('component classes resolve to generated or project CSS', () => {
  it.each(cases)('%s', async (_, element) => {
    const { container } = render(element)
    expect(await unresolvedClasses(renderedClasses(container))).toEqual([])
  })

  it('ModelPicker open', async () => {
    const { container } = render(
      <ModelPicker
        model="a"
        models={[{ id: 'a', label: 'Alpha', vendor: 'Vendor', tag: 'fast' }]}
        onChange={noop}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /^Chat model/ }))
    expect(await unresolvedClasses(renderedClasses(container))).toEqual([])
  })

  it('reports utilities Tailwind 3 drops', async () => {
    expect(await unresolvedClasses(['cursor-inherit', 'bg-panel-2/10', 'knik-btn'])).toEqual([
      'cursor-inherit',
      'bg-panel-2/10',
    ])
  })
})
