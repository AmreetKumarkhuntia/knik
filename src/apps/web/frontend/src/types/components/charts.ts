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

export interface TokenMeterProps {
  used: number
  limit: number
  model?: string
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
