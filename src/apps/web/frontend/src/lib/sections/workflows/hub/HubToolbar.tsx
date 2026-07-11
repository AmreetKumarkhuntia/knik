import { Segmented } from '$components'
import { PaneHeader, SearchField } from '$widgets'
import type { HubToolbarProps } from '$types'

/** Hub toolbar: title + shown/total count, search field, and status filter. */
export default function HubToolbar({
  shown,
  total,
  query,
  onQueryChange,
  filter,
  onFilterChange,
}: HubToolbarProps) {
  return (
    <PaneHeader
      title="Workflows"
      subtitle={`${shown} of ${total} shown`}
      right={
        <div className="flex items-center" style={{ gap: 10 }}>
          <SearchField value={query} onChange={onQueryChange} />
          <Segmented
            size="sm"
            value={filter}
            onChange={onFilterChange}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
      }
    />
  )
}
