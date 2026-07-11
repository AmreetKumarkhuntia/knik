import { Search } from '@mui/icons-material'
import type { SearchBarProps } from '$types/components'
import { UI_TEXT, SIZES } from '$lib/constants'

/** Search input field with a magnifying glass icon. */
export default function SearchBar({ placeholder = UI_TEXT.search.placeholder }: SearchBarProps) {
  return (
    <label className="hidden sm:flex flex-col min-w-40 h-10 max-w-64">
      <div className="flex w-full flex-1 items-stretch rounded-md h-full overflow-hidden border border-[var(--border-2)] bg-[var(--bg-surface-2)] focus-within:border-[var(--border-focus)] focus-within:shadow-[0_0_0_2px_rgba(0,217,244,0.3)] transition-all duration-fast">
        <div className="flex items-center justify-center pl-3">
          <Search style={{ fontSize: SIZES.icon.md }} className="text-fg-3" />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          className="flex w-full min-w-0 flex-1 border-none bg-transparent text-fg-1 placeholder-[var(--fg-5)] focus:outline-none focus:ring-0 px-3 text-sm font-normal"
        />
      </div>
    </label>
  )
}
