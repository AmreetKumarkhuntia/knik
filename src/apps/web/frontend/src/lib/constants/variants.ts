export const buttonVariants = {
  primary: 'bg-white/10 hover:bg-white/20 text-foreground border-white/30',
  secondary: 'bg-surface hover:bg-surfaceRaised text-secondary border-border',
  danger: 'bg-error/20 hover:bg-error/30 text-error border-error/30',
  ghost: 'bg-transparent hover:bg-white/10 text-foreground/70 border-transparent',
}

export const sizeVariants = {
  xs: 'px-2 py-2 text-xs gap-0',
  sm: 'px-2 py-1 text-xs gap-1',
  md: 'px-3 py-1.5 text-sm gap-1.5',
  lg: 'px-4 py-2 text-base gap-2',
}

export const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export const spinnerSizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
}

export const confirmDialogVariants = {
  danger: { icon: '⚠', confirmBtn: 'bg-error hover:bg-error/80' },
  warning: { icon: '⚡', confirmBtn: 'bg-warning hover:bg-warning/80' },
  info: { icon: 'ℹ', confirmBtn: 'bg-info hover:bg-info/80' },
}
