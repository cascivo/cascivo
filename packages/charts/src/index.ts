// ── Composable primitives toolkit ────────────────────────────────────────────
// Build a custom chart by assembling these with <ChartFrame>: scales + shapes/
// curves + chrome (axes, grids, glyphs, gradients, text, brush, annotations) +
// hit-testing (nearest/voronoi) + stats + layouts (treemap/sankey/hierarchy/stream).

// Scales — d0/d1 domain → r0/r1 range; expose .map / .ticks / .domain / .bandwidth.
export * from './engine/scale'
export * from './engine/scale-log'
export * from './engine/scale-time'
// Shapes & curves — linePath/areaPath/arcPath + the Curve set + splitDefined gaps.
export * from './engine/shape'
export * from './engine/stacked'
// Hit-testing — rectilinear nearest + voronoi cell membership / cell polygons.
export * from './engine/nearest'
export * from './engine/voronoi'
// Stats & layouts — extent/quantiles; squarified treemap, sankey, radial partition, stream.
export * from './engine/stats'
export * from './engine/treemap'
export * from './engine/stream'
export * from './engine/hierarchy'
export * from './engine/sankey'
export * from './engine/ramp'
// Data pipeline — filter/sort/aggregate/bin/regression + encode (table → series).
export * from './engine/transform'
export * from './engine/dataset'

// Frame & chrome — the SVG/Canvas shell + the reusable visual primitives.
export * from './core/chart-frame'
export * from './core/canvas-layer'
export * from './core/use-chart'
export * from './core/zoom'
export * from './core/sync'
export * from './chrome/axis'
export * from './chrome/grid-lines'
export * from './chrome/reference'
export * from './chrome/data-label'
export * from './chrome/defs'
export * from './chrome/glyph'
export * from './chrome/text'
export * from './chrome/brush'
export * from './chrome/data-zoom'
export * from './chrome/visual-map'
export * from './chrome/legend'

// Wave-1 chart components
export * from './charts/line-chart/line-chart'
export * from './charts/area-chart/area-chart'
export * from './charts/bar-chart/bar-chart'
export * from './charts/pie-chart/pie-chart'
export * from './charts/scatter-chart/scatter-chart'
export * from './charts/sparkline/sparkline'
export * from './charts/meter/meter'
export * from './charts/kpi/kpi'

// Wave-2 chart components
export * from './charts/histogram/histogram'
export * from './charts/boxplot/boxplot'
export * from './charts/bubble-chart/bubble-chart'
export * from './charts/combo-chart/combo-chart'
export * from './charts/heatmap/heatmap'
export * from './charts/treemap/treemap'
export * from './charts/radar/radar'
export * from './charts/bullet/bullet'

// Wave-3 chart components
export * from './charts/radial-bar/radial-bar'
export * from './charts/funnel/funnel'

// Wave-4 chart components (nivo/visx exotic types)
export * from './charts/stream/stream'
export * from './charts/sunburst/sunburst'
export * from './charts/sankey/sankey'
export * from './charts/calendar/calendar'
