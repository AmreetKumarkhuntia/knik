import { Search } from '@mui/icons-material'

interface SearchBarProps {
  placeholder?: string
}

export default function SearchBar({ placeholder = 'Search...' }: SearchBarProps) {
  return (
    <label className="hidden sm:flex flex-col min-w-40 h-10 max-w-64">
      <div className="flex w-full flex-1 items-stretch rounded-lg h-full overflow-hidden border border-borderLight bg-surface">
        <div className="flex items-center justify-center pl-3">
          <Search style={{ fontSize: '20px' }} className="text-textSecondary" />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          className="flex w-full min-w-0 flex-1 border-none bg-transparent text-text placeholder-textSecondary focus:outline-none focus:ring-0 px-3 text-sm font-normal"
        />
      </div>
    </label>
  )
}
