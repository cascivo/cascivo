export interface LogScale {
  domain: [number, number]
  range: [number, number]
  map(value: number): number
  invert(position: number): number
  ticks(): number[]
}

export function logScale(domain: [number, number], range: [number, number]): LogScale {
  const [d0, d1] = domain
  if (d0 <= 0 || d1 <= 0)
    throw new Error(`logScale: domain must be strictly positive, got [${d0}, ${d1}]`)
  const [r0, r1] = range
  const logD0 = Math.log10(d0)
  const logD1 = Math.log10(d1)
  const logSpan = logD1 - logD0
  return {
    domain,
    range,
    map: (value) => (logSpan === 0 ? r0 : r0 + ((Math.log10(value) - logD0) / logSpan) * (r1 - r0)),
    invert: (position) => 10 ** (logD0 + ((position - r0) / (r1 - r0)) * logSpan),
    ticks: () => {
      const minPow = Math.ceil(logD0)
      const maxPow = Math.floor(logD1)
      const ticks: number[] = []
      for (let p = minPow; p <= maxPow; p++) ticks.push(10 ** p)
      if (ticks.length < 3) {
        // Add 2 and 5 subdivisions
        const extra: number[] = []
        for (let p = Math.floor(logD0); p <= Math.ceil(logD1); p++) {
          for (const sub of [2, 5]) {
            const v = sub * 10 ** p
            if (v > d0 && v < d1) extra.push(v)
          }
        }
        ticks.push(...extra)
        ticks.sort((a, b) => a - b)
      }
      return ticks.filter((v) => v >= d0 && v <= d1)
    },
  }
}
