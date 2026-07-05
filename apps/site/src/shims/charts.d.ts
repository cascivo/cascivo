type Accessor<D> = (d: D) => unknown
type SeriesChart<D = Record<string, unknown>> = (props: {
  series?: unknown[]
  x?: Accessor<D>
  y?: Accessor<D>
  [key: string]: unknown
}) => JSX.Element

export declare const LineChart: SeriesChart
export declare const AreaChart: SeriesChart
export declare const BarChart: SeriesChart
export declare const ScatterChart: SeriesChart
export declare function PieChart(props: { data?: unknown[]; [key: string]: unknown }): JSX.Element
export declare function Sparkline(props: { data?: unknown[]; [key: string]: unknown }): JSX.Element
export declare function Meter(props: { value?: number; [key: string]: unknown }): JSX.Element
export declare function Kpi(props: { value?: unknown; [key: string]: unknown }): JSX.Element
export declare function Histogram(props: { data?: unknown[]; [key: string]: unknown }): JSX.Element
export declare function Boxplot(props: { series?: unknown[]; [key: string]: unknown }): JSX.Element
export declare function BubbleChart(props: {
  series?: unknown[]
  [key: string]: unknown
}): JSX.Element
export declare function ComboChart(props: {
  bars?: unknown[]
  lines?: unknown[]
  [key: string]: unknown
}): JSX.Element
export declare function Heatmap(props: { data?: unknown[]; [key: string]: unknown }): JSX.Element
export declare function Treemap(props: { data?: unknown[]; [key: string]: unknown }): JSX.Element
export declare function Radar(props: { series?: unknown[]; [key: string]: unknown }): JSX.Element
export declare function Bullet(props: { value?: number; [key: string]: unknown }): JSX.Element
export declare function RadialBar(props: { data?: unknown[]; [key: string]: unknown }): JSX.Element
export declare function Funnel(props: { data?: unknown[]; [key: string]: unknown }): JSX.Element
export declare function Calendar(props: { data?: unknown[]; [key: string]: unknown }): JSX.Element
export declare function Candlestick(props: {
  data?: unknown[]
  [key: string]: unknown
}): JSX.Element
export declare function Gauge(props: { value?: number; [key: string]: unknown }): JSX.Element
export declare function Polar(props: { data?: unknown[]; [key: string]: unknown }): JSX.Element
export declare function Stream(props: { series?: unknown[]; [key: string]: unknown }): JSX.Element
export declare function Sunburst(props: { data?: unknown; [key: string]: unknown }): JSX.Element
export declare function toStackedSeries(rows: readonly unknown[]): {
  series: unknown[]
  x: Accessor<unknown>
  y: Accessor<unknown>
}
