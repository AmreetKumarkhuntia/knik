export const LAYOUT = {
  maxWidthPercentage: '70%',
  headerHeight: '80px',
  sidebarWidth: {
    collapsed: '80px',
    expanded: '320px',
  },
}

export const ANIMATION = {
  yOffset: 20,
  hoverYOffset: -4,
  xOffset: 20,

  stiffness: 300,
  damping: 30,
  delay: 0.2,

  hoverScale: 1.1,
  tapScale: 0.9,

  mediumDuration: 500,
  longDuration: 800,
}

export const SPACING = {
  p: {
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
  },

  m: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
  },

  gap: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 6,
    xl: 8,
  },
}

export const SIZES = {
  icon: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 48,
  },

  avatar: {
    sm: 32,
    md: 40,
    lg: 48,
  },

  spinner: {
    sm: { width: 16, border: 2 },
    md: { width: 32, border: 3 },
    lg: { width: 48, border: 4 },
  },

  boxShadow: {
    sm: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 20px 40px -10px var(--color-primary)',
  },
}

export const CANVAS = {
  nodePositions: {
    startX: 250,
    startY: 0,
    endX: 250,
    endY: 400,
  },
  background: {
    gap: 20,
    dotSize: 1,
  },
  nodeSpacing: {
    x: 100,
    yMultiplier: 120,
  },
}

export const TABS = {
  padding: {
    underline: { x: 6, y: 3 },
    pill: { x: 4, y: 2 },
  },
}

export const VIEWPORT = {
  maxHeight: {
    detailTab: '90vh',
  },
  padding: {
    detailTab: 4,
  },
}

export const STATUS_BADGE = {
  gap: 1.5,
}
