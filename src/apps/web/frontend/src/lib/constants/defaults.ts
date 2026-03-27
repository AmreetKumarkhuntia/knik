export const USER_PROFILE_DEFAULTS = {
  initials: 'AR',
  avatarColor: 'var(--color-primary)',
  name: 'Alex Rivera',
  accountType: 'Pro Account',
  displayOnly: true,
  showBadge: true,
  badgeType: 'pro' as const,
}

export const SEARCH_BAR_DEFAULTS = {
  placeholder: 'Search...',
}

export const STAT_CARD_DEFAULTS = {
  color: 'primary' as const,
}

export const FORM_FIELD_DEFAULTS = {
  type: 'text' as const,
  required: false,
  disabled: false,
  className: '',
}

export const STATUS_BADGE_DEFAULTS = {
  size: 'md' as const,
}

export const LOADING_SPINNER_DEFAULTS = {
  size: 'md' as const,
  className: '',
}

export const EMPTY_STATE_DEFAULTS = {
  icon: '📜',
  className: '',
}

export const CARD_DEFAULTS = {
  variant: 'default' as const,
  padding: 'md' as const,
  className: '',
}

export const TABS_DEFAULTS = {
  variant: 'underline' as const,
  className: '',
}

export const EXECUTION_DETAIL_DEFAULTS = {
  activeTab: 'overview' as const,
}

export const CHAT_DEFAULTS = {
  promptSelectionTimeout: 100,
}
