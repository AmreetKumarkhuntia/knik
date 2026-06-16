import type * as React from 'react'
import type { ReactNode, CSSProperties, InputHTMLAttributes } from 'react'
import type { ExecutionStatus, NodeExecutionStep, ExecutionDetail } from '$types/workflow'
import type { DemoModel } from '$lib/constants/redesignData'

/** Supported toast notification types. */
export type ToastType = 'success' | 'error' | 'info'

/** Props for a toast notification. */
export interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

/** Available sizes for a modal dialog. */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

/** Props for a modal dialog. */
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  className?: string
  size?: ModalSize
  animationEnabled?: boolean
}

/** Props for a confirmation dialog. */
export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  loading?: boolean
}

/** Props for a generic action button. */
export interface ActionButtonProps {
  icon?: ReactNode
  label?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  title?: string
}

/** Props for a backdrop overlay. */
export interface BackdropProps {
  visible: boolean
  onClick: () => void
  blur?: 'sm' | 'md' | 'lg'
  opacity?: number
  className?: string
}

/** Props for a card container. */
export interface CardProps {
  children: ReactNode
  variant?: 'default' | 'bordered' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

/** Props for an empty state placeholder. */
export interface EmptyStateProps {
  icon?: string | ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/** Props for a generic form field. */
export interface FormFieldProps {
  label?: string
  type?: 'text' | 'select' | 'number'
  name?: string
  value?: string
  onChange?: (value: string) => void
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

/** Props for an icon-only button. */
export interface IconButtonProps {
  icon: ReactNode
  onClick: () => void
  variant?: 'ghost' | 'secondary' | 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  ariaLabel: string
  disabled?: boolean
  className?: string
}

/** Props for a text input field. */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string
  fullWidth?: boolean
  id?: string
}

/** Props for a link-styled button. */
export interface LinkButtonProps {
  icon?: string
  label: string
  onClick?: () => void
  active?: boolean
  className?: string
}

/** Props for a loading spinner. */
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

/** Props for a markdown message renderer. */
export interface MarkdownMessageProps {
  content: string
  isStreaming?: boolean
}

/** Props for a status badge. */
export interface StatusBadgeProps {
  status: ExecutionStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** Column definition for a data table. */
export interface TableColumn<T> {
  key: keyof T | string
  label: string
  render?: (value: unknown, row: T) => ReactNode
}

/** Props for a generic data table. */
export interface TableProps<T = Record<string, unknown>> {
  columns: TableColumn<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  loading?: boolean
  empty?: ReactNode
  className?: string
  maxHeight?: string
  stickyHeader?: boolean
  glassContainer?: boolean
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

/** Props for a toggle switch. */
export interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  className?: string
}

/** Props for a hamburger menu button. */
export interface HamburgerButtonProps {
  onClick: () => void
  className?: string
}

/** A trend indicator with direction and value. */
export interface Trend {
  direction: 'up' | 'down' | 'neutral'
  value: string
  icon?: string
}

/** Props for a metric card. */
export interface MetricCardProps {
  icon: string
  label: string
  value: number | string
  subtext?: string
  trend?: Trend
  color?: 'primary' | 'teal' | 'rose' | 'blue'
  loading?: boolean
}

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

/** Props for a notification bell button. */
export interface NotificationButtonProps {
  badgeCount?: number
  onClick?: () => void
}

/** Props for a search bar input. */
export interface SearchBarProps {
  placeholder?: string
}

/** Props for a section header with optional action. */
export interface SectionHeaderProps {
  title: string
  actionText?: string
  onActionClick?: () => void
  badge?: string
  className?: string
}

/** Props for a user profile display. */
export interface UserProfileProps {
  avatar?: string
  avatarColor?: string
  name?: string
  account?: string
  displayOnly?: boolean
  showBadge?: boolean
  badgeType?: 'pro' | 'basic' | 'admin'
}

/** Props for a pagination control. */
export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

/** Props for an execution timeline visualization. */
export interface ExecutionTimelineProps {
  timeline: NodeExecutionStep[] | undefined
  loading?: boolean
}

/** Props for an execution flow graph visualization. */
export interface ExecutionFlowGraphProps {
  execution: ExecutionDetail
  timeline: NodeExecutionStep[]
}

/** Props for a structured input/output viewer. */
export interface StructuredOutputProps {
  inputs: Record<string, unknown> | undefined
  outputs: Record<string, unknown> | undefined
  loading: boolean
}

/** Props for a page header with breadcrumbs. */
export interface PageHeaderProps {
  breadcrumbs: string[]
  rightContent?: ReactNode
  showBackButton?: boolean
  onBackClick?: () => void
  sticky?: boolean
}

/** Props for a markdown code block renderer. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CodeProps = any & {
  _node: unknown
  inline: boolean
  className: string
  children: unknown
}

/** Internal state for a toast notification. */
export interface ToastState {
  id: number
  message: string
  type: ToastType
}

/* ------------------------------------------------------------------ *
 * Design-system component props (relocated from co-located .tsx files
 * to satisfy the types-live-in-types/ boundary; see eslint.config.js).
 * ------------------------------------------------------------------ */

export interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
}

export interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
  defaultOpen?: string[]
  className?: string
}

export interface ActionIconProps {
  icon: ReactNode
  onClick?: (e: React.MouseEvent) => void
  title?: string
  size?: number
  active?: boolean
  danger?: boolean
  className?: string
}

export interface AgentThinkingStep {
  type: 'thinking' | 'tool_call' | 'diff'
  content: string
}

export interface AgentThinkingProps {
  steps: AgentThinkingStep[]
  defaultExpanded?: boolean
  className?: string
}

export interface AvatarProps {
  initials: string
  size?: number
  color?: 'surface' | 'accent'
  className?: string
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
  size?: 'sm' | 'md'
  className?: string
  children: React.ReactNode
}

export interface BannerProps {
  variant?: 'info' | 'warning' | 'danger' | 'success'
  dismissible?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  onDismiss?: () => void
}

export interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: React.ReactNode
  timestamp?: string
  actions?: {
    copy?: () => void
    thumbsUp?: () => void
    retry?: () => void
  }
  className?: string
}

export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  indeterminate?: boolean
  className?: string
}

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: React.ReactNode
  variant?: 'default' | 'tag' | 'voice' | 'lang' | 'team' | 'input' | 'kbd'
  icon?: React.ReactNode
  onRemove?: () => void
  className?: string
}

export interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  copyable?: boolean
  className?: string
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
  commands?: CommandGroup[]
  onSelect: (id: string) => void
  open: boolean
  onClose: () => void
  className?: string
}

export interface FileUploadProps {
  accept?: string
  multiple?: boolean
  onUpload: (files: File[]) => void
  maxSize?: number // in bytes
  className?: string
}

export interface JsonViewerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  tabs?: string[]
  copyable?: boolean
  className?: string
}

export interface KbdProps {
  children: ReactNode
  className?: string
}

export interface KnikGlyphProps {
  size?: number
  glow?: boolean
  className?: string
}

export interface MSProps {
  name: string
  size?: number
  fill?: 0 | 1
  weight?: number
  grade?: number
  className?: string
  style?: CSSProperties
}

export interface McpTool {
  id: string
  name: string
  desc: string
  category: 'shell' | 'file' | 'browser' | 'cron' | 'text' | string
  icon: string
}

export interface McpToolsPanelProps {
  tools?: McpTool[]
  onToggle?: (id: string) => void
  className?: string
}

export interface MicRecorderProps {
  onRecordComplete: (blob: Blob) => void
  maxDuration?: number // in seconds
  className?: string
}

export interface ModelPickerProps {
  model: string
  onChange: (id: string) => void
  compact?: boolean
  models?: DemoModel[]
}

export interface NotificationItem {
  id: string
  type: 'success' | 'fail' | 'info' | 'user'
  title: ReactNode
  time: string
  unread: boolean
}

export interface NotificationFeedProps {
  notifications?: NotificationItem[]
  onDismiss: (id: string) => void
  onMarkRead: () => void
  className?: string
}

export interface PopoverProps {
  trigger: React.ReactNode
  content: React.ReactNode
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export interface ProgressBarProps {
  value: number
  max?: number
  variant?: 'default' | 'running'
  animated?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface RadioOption {
  label: string
  value: string
  monoLabel?: string
}

export interface RadioProps {
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  name: string
  disabled?: boolean
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

export interface SelectOption {
  label: string
  value: string
  icon?: string
}

export interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface SliderProps {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  step?: number
  label?: string
  className?: string
}

export interface StatItem {
  label: string
  value: string | number
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
  }
  icon?: string
}

export interface StatStripProps {
  stats: StatItem[]
  className?: string
}

export interface TTSPlayerProps {
  audioSrc?: string
  voiceName?: string
  text?: string
  className?: string
}

export interface TokenMeterProps {
  used: number
  limit: number
  model?: string
  className?: string
}

export interface TooltipProps {
  content: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  children: React.ReactNode
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

export interface Voice {
  id: string
  name: string
  lang: string
  tags: string[]
  gradient: string
}

export interface VoicePickerProps {
  voices?: Voice[]
  selected?: string
  onSelect: (id: string) => void
  className?: string
}

export interface AreaChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  xKey: string
  yKey: string
  legend?: boolean
  gradient?: boolean
  className?: string
}

export interface BarChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  xKey: string
  yKey: string
  horizontal?: boolean
  className?: string
}

export interface DonutSegment {
  label: string
  value: number
  color: string
}

export interface DonutChartProps {
  segments: DonutSegment[]
  size?: number
  className?: string
}

export interface SparklineChartProps {
  data: number[]
  color?: string
  width?: number | string
  height?: number | string
  className?: string
}
