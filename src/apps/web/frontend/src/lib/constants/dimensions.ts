// Dimension and spacing constants

// Layout dimensions
export const LAYOUT = {
  maxWidthPercentage: '70%',
  headerHeight: '80px',
  sidebarWidth: {
    collapsed: '80px',
    expanded: '320px',
  },
}

// Animation values
export const ANIMATION = {
  // Offsets
  yOffset: 20,
  hoverYOffset: -4,
  xOffset: 20,

  // Animation properties
  stiffness: 300,
  damping: 30,
  delay: 0.2,

  // Scale values
  hoverScale: 1.1,
  tapScale: 0.9,

  // Duration (in milliseconds)
  mediumDuration: 500,
  longDuration: 800,
}

// Spacing
export const SPACING = {
  // Padding
  p: {
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
  },

  // Margin
  m: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
  },

  // Gap
  gap: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 6,
    xl: 8,
  },
}

// Sizes
export const SIZES = {
  // Icon sizes
  icon: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 48,
  },

  // Avatar sizes
  avatar: {
    sm: 32,
    md: 40,
    lg: 48,
  },

  // Loading spinner
  spinner: {
    sm: { width: 16, border: 2 },
    md: { width: 32, border: 3 },
    lg: { width: 48, border: 4 },
  },

  // Box shadows
  boxShadow: {
    sm: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 20px 40px -10px var(--color-primary)',
  },
}

// Canvas dimensions
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

// Tab dimensions
export const TABS = {
  padding: {
    underline: { x: 6, y: 3 },
    pill: { x: 4, y: 2 },
  },
}

// Viewport
export const VIEWPORT = {
  maxHeight: {
    detailTab: '90vh',
  },
  padding: {
    detailTab: 4,
  },
}

// Status badge
export const STATUS_BADGE = {
  gap: 1.5,
}
