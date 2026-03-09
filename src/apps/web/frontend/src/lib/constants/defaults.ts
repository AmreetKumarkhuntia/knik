// Default prop values for components

// UserProfile defaults
export const USER_PROFILE_DEFAULTS = {
  initials: 'AR',
  avatarColor: 'var(--color-primary)',
  name: 'Alex Rivera',
  accountType: 'Pro Account',
  displayOnly: true,
  showBadge: true,
  badgeType: 'pro' as const,
}

// SearchBar defaults
export const SEARCH_BAR_DEFAULTS = {
  placeholder: 'Search...',
}

// StatCard defaults
export const STAT_CARD_DEFAULTS = {
  color: 'primary' as const,
}

// FormField defaults
export const FORM_FIELD_DEFAULTS = {
  type: 'text' as const,
  required: false,
  disabled: false,
  className: '',
}

// StatusBadge defaults
export const STATUS_BADGE_DEFAULTS = {
  size: 'md' as const,
}

// LoadingSpinner defaults
export const LOADING_SPINNER_DEFAULTS = {
  size: 'md' as const,
  className: '',
}

// EmptyState defaults
export const EMPTY_STATE_DEFAULTS = {
  icon: '📜',
  className: '',
}

// Card defaults
export const CARD_DEFAULTS = {
  variant: 'default' as const,
  padding: 'md' as const,
  className: '',
}

// Tabs defaults
export const TABS_DEFAULTS = {
  variant: 'underline' as const,
  className: '',
}

// ExecutionDetail defaults
export const EXECUTION_DETAIL_DEFAULTS = {
  activeTab: 'overview' as const,
}

// Chat defaults
export const CHAT_DEFAULTS = {
  promptSelectionTimeout: 100,
}

// Workflow defaults
export const WORKFLOW_DEFAULTS = {
  topWorkflowsLimit: 10,
  activityLimit: 20,
  timeParameter: 'today',
}
