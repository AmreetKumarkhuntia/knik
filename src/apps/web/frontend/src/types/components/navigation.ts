import type * as React from 'react'

/** A single breadcrumb navigation item. */
export interface BreadcrumbItem {
  label: string
  path?: string
}

/** Props for a breadcrumb navigation component. */
export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

/** Props for a navigation link. */
export interface NavLinkProps {
  icon: string
  label: string
  active?: boolean
  href?: string
  onClick?: () => void
}

/** A single tab item. */
export interface Tab<T extends string> {
  id: T
  label: string
  icon?: string
}

/** Props for a tab switcher component. */
export interface TabsProps<T extends string> {
  tabs: Tab<T>[]
  active: T
  onChange: (id: T) => void
  variant?: 'underline' | 'pills'
  className?: string
}

export interface VerticalTab {
  id: string
  label: string
  icon?: string
  content: React.ReactNode
}

export interface VerticalTabsProps {
  tabs: VerticalTab[]
  activeTab?: string
  onChange?: (id: string) => void
  className?: string
}

export interface SegmentedOption {
  value: string
  label: string
  icon?: React.ReactNode
}

export interface SegmentedProps {
  options: (SegmentedOption | string)[]
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
  className?: string
}

/** Props for a pagination control. */
export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

export interface CommandItem {
  id: string
  label: string
  shortcut?: string
  icon?: string
}

export interface CommandGroup {
  group: string
  items: CommandItem[]
}

export interface CommandPaletteProps {
  commands: CommandGroup[]
  onSelect: (id: string) => void
  open: boolean
  onClose: () => void
  className?: string
}
