/**
 * Minimal QR Code encoder (byte mode, versions 1–40, EC levels L/M/Q/H).
 *
 * Vendored as owned source to keep `@cascivo` free of runtime dependencies.
 * Algorithm and lookup tables adapted from Project Nayuki's "QR Code generator
 * library" (MIT License, https://www.nayuki.io/page/qr-code-generator-library),
 * trimmed to byte-mode segments with automatic version and mask selection.
 */

export type ErrorCorrection = 'L' | 'M' | 'Q' | 'H'

// Table row index (ordinal) and format-info bits per EC level.
const ECC: Record<ErrorCorrection, { ordinal: number; formatBits: number }> = {
  L: { ordinal: 0, formatBits: 1 },
  M: { ordinal: 1, formatBits: 0 },
  Q: { ordinal: 2, formatBits: 3 },
  H: { ordinal: 3, formatBits: 2 },
}

const MIN_VERSION = 1
const MAX_VERSION = 40

// ECC codewords per block, indexed by [ecl.ordinal][version] (index 0 unused).
const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  [
    -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30,
    30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  [
    -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
  [
    -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30,
    30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  [
    -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
]

// Number of error-correction blocks, indexed by [ecl.ordinal][version].
const NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
  [
    -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14,
    15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
  ],
  [
    -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23,
    25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
  [
    -1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34,
    34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
  [
    -1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35,
    37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
  ],
]

function getNumRawDataModules(ver: number): number {
  let result = (16 * ver + 128) * ver + 64
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2
    result -= (25 * numAlign - 10) * numAlign - 55
    if (ver >= 7) result -= 36
  }
  return result
}

function getNumDataCodewords(ver: number, ecl: ErrorCorrection): number {
  const ord = ECC[ecl].ordinal
  return (
    Math.floor(getNumRawDataModules(ver) / 8) -
    ECC_CODEWORDS_PER_BLOCK[ord]![ver]! * NUM_ERROR_CORRECTION_BLOCKS[ord]![ver]!
  )
}

// --- Reed-Solomon over GF(256) with primitive polynomial 0x11D ---

function reedSolomonMultiply(x: number, y: number): number {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z & 0xff
}

function reedSolomonComputeDivisor(degree: number): number[] {
  const result = Array.from<number>({ length: degree }).fill(0)
  result[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = reedSolomonMultiply(result[j]!, root)
      if (j + 1 < result.length) result[j] = result[j]! ^ result[j + 1]!
    }
    root = reedSolomonMultiply(root, 0x02)
  }
  return result
}

function reedSolomonComputeRemainder(data: number[], divisor: number[]): number[] {
  const result = Array.from<number>({ length: divisor.length }).fill(0)
  for (const b of data) {
    const factor = b ^ result.shift()!
    result.push(0)
    for (let i = 0; i < result.length; i++)
      result[i] = result[i]! ^ reedSolomonMultiply(divisor[i]!, factor)
  }
  return result
}

// --- Bit buffer for byte-mode data ---

function appendBits(value: number, len: number, bits: number[]): void {
  for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1)
}

function encodeByteSegment(data: number[], version: number): number[] {
  const bits: number[] = []
  appendBits(0x4, 4, bits) // byte-mode indicator
  const charCountBits = version <= 9 ? 8 : 16
  appendBits(data.length, charCountBits, bits)
  for (const b of data) appendBits(b, 8, bits)
  return bits
}

function fitsVersion(numChars: number, version: number, ecl: ErrorCorrection): boolean {
  const charCountBits = version <= 9 ? 8 : 16
  const dataBits = 4 + charCountBits + numChars * 8
  return dataBits <= getNumDataCodewords(version, ecl) * 8
}

// --- Codeword assembly (terminator, padding, block interleave + ECC) ---

function addEccAndInterleave(
  dataCodewords: number[],
  version: number,
  ecl: ErrorCorrection,
): number[] {
  const ord = ECC[ecl].ordinal
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ord]![version]!
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ord]![version]!
  const rawCodewords = Math.floor(getNumRawDataModules(version) / 8)
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks)
  const shortBlockLen = Math.floor(rawCodewords / numBlocks)

  const blocks: number[][] = []
  const rsDiv = reedSolomonComputeDivisor(blockEccLen)
  let k = 0
  for (let i = 0; i < numBlocks; i++) {
    const datLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1)
    const dat = dataCodewords.slice(k, k + datLen)
    k += datLen
    const ecc = reedSolomonComputeRemainder(dat, rsDiv)
    if (i < numShortBlocks) dat.push(0) // pad short blocks so columns align
    blocks.push(dat.concat(ecc))
  }

  const result: number[] = []
  for (let i = 0; i < blocks[0]!.length; i++) {
    for (let j = 0; j < blocks.length; j++) {
      // Skip the alignment padding cell in short data blocks.
      if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(blocks[j]![i]!)
    }
  }
  return result
}

function buildDataCodewords(text: string, version: number, ecl: ErrorCorrection): number[] {
  const data = utf8Bytes(text)
  const bits = encodeByteSegment(data, version)
  const dataCapacityBits = getNumDataCodewords(version, ecl) * 8

  // Terminator + bit padding to a byte boundary.
  appendBits(0, Math.min(4, dataCapacityBits - bits.length), bits)
  appendBits(0, (8 - (bits.length % 8)) % 8, bits)

  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]!
    codewords.push(b)
  }
  // Pad bytes alternate between 0xEC and 0x11.
  for (let pad = 0xec; codewords.length < dataCapacityBits / 8; pad ^= 0xec ^ 0x11)
    codewords.push(pad)
  return codewords
}

function utf8Bytes(str: string): number[] {
  if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(str))
  return Array.from(unescape(encodeURIComponent(str)), (c) => c.charCodeAt(0))
}

// --- Matrix drawing ---

class QrMatrix {
  readonly size: number
  readonly modules: boolean[][]
  private readonly isFunction: boolean[][]

  constructor(version: number) {
    this.size = version * 4 + 17
    this.modules = Array.from({ length: this.size }, () =>
      Array.from<boolean>({ length: this.size }).fill(false),
    )
    this.isFunction = Array.from({ length: this.size }, () =>
      Array.from<boolean>({ length: this.size }).fill(false),
    )
  }

  set(x: number, y: number, dark: boolean, fn: boolean): void {
    this.modules[y]![x] = dark
    this.isFunction[y]![x] = fn
  }

  drawFinder(x: number, y: number): void {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const xx = x + dx
        const yy = y + dy
        if (xx < 0 || xx >= this.size || yy < 0 || yy >= this.size) continue
        const dist = Math.max(Math.abs(dx), Math.abs(dy))
        this.set(xx, yy, dist !== 2 && dist !== 4, true)
      }
    }
  }

  drawAlignment(x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.set(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1, true)
      }
    }
  }

  isFn(x: number, y: number): boolean {
    return this.isFunction[y]![x]!
  }
}

function alignmentPositions(version: number): number[] {
  if (version === 1) return []
  const numAlign = Math.floor(version / 7) + 2
  const step = Math.floor((version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2
  const result = [6]
  for (let pos = version * 4 + 10; result.length < numAlign; pos -= step) result.splice(1, 0, pos)
  return result
}

function drawFunctionPatterns(m: QrMatrix, version: number, ecl: ErrorCorrection): void {
  const size = m.size
  // Timing patterns.
  for (let i = 0; i < size; i++) {
    m.set(6, i, i % 2 === 0, true)
    m.set(i, 6, i % 2 === 0, true)
  }
  // Finder patterns + separators.
  m.drawFinder(3, 3)
  m.drawFinder(size - 4, 3)
  m.drawFinder(3, size - 4)
  // Alignment patterns.
  const aligns = alignmentPositions(version)
  for (let i = 0; i < aligns.length; i++) {
    for (let j = 0; j < aligns.length; j++) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === aligns.length - 1) ||
        (i === aligns.length - 1 && j === 0)
      )
        continue
      m.drawAlignment(aligns[i]!, aligns[j]!)
    }
  }
  // Reserve format + version areas (filled later); dark module.
  drawFormatBits(m, ecl, 0, true)
  drawVersion(m, version)
}

function drawFormatBits(
  m: QrMatrix,
  ecl: ErrorCorrection,
  mask: number,
  reserveOnly: boolean,
): void {
  const size = m.size
  const data = (ECC[ecl].formatBits << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  const bits = ((data << 10) | rem) ^ 0x5412
  const get = (i: number): boolean => (reserveOnly ? false : ((bits >>> i) & 1) !== 0)

  for (let i = 0; i <= 5; i++) m.set(8, i, get(i), true)
  m.set(8, 7, get(6), true)
  m.set(8, 8, get(7), true)
  m.set(7, 8, get(8), true)
  for (let i = 9; i < 15; i++) m.set(14 - i, 8, get(i), true)

  for (let i = 0; i < 8; i++) m.set(size - 1 - i, 8, get(i), true)
  for (let i = 8; i < 15; i++) m.set(8, size - 15 + i, get(i), true)
  m.set(8, size - 8, true, true) // dark module
}

function drawVersion(m: QrMatrix, version: number): void {
  if (version < 7) return
  let rem = version
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
  const bits = (version << 12) | rem
  for (let i = 0; i < 18; i++) {
    const bit = ((bits >>> i) & 1) !== 0
    const a = m.size - 11 + (i % 3)
    const b = Math.floor(i / 3)
    m.set(a, b, bit, true)
    m.set(b, a, bit, true)
  }
}

function drawCodewords(m: QrMatrix, codewords: number[]): void {
  const size = m.size
  let i = 0 // bit index into codewords
  for (let right = size - 1; right >= 1; right -= 2) {
    const col = right === 6 ? 5 : right
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = col - j
        const upward = ((col + 1) & 2) === 0
        const y = upward ? size - 1 - vert : vert
        if (!m.isFn(x, y) && i < codewords.length * 8) {
          const dark = ((codewords[i >>> 3]! >>> (7 - (i & 7))) & 1) !== 0
          m.set(x, y, dark, false)
          i++
        }
      }
    }
  }
}

function applyMask(m: QrMatrix, mask: number): void {
  for (let y = 0; y < m.size; y++) {
    for (let x = 0; x < m.size; x++) {
      if (m.isFn(x, y)) continue
      let invert = false
      switch (mask) {
        case 0:
          invert = (x + y) % 2 === 0
          break
        case 1:
          invert = y % 2 === 0
          break
        case 2:
          invert = x % 3 === 0
          break
        case 3:
          invert = (x + y) % 3 === 0
          break
        case 4:
          invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0
          break
        case 5:
          invert = ((x * y) % 2) + ((x * y) % 3) === 0
          break
        case 6:
          invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0
          break
        case 7:
          invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
          break
      }
      if (invert) m.modules[y]![x] = !m.modules[y]![x]
    }
  }
}

function penaltyScore(m: QrMatrix): number {
  const size = m.size
  let score = 0
  const dark = m.modules
  // Adjacent runs in rows and columns.
  for (let y = 0; y < size; y++) {
    let runColor = false
    let runLen = 0
    for (let x = 0; x < size; x++) {
      if (dark[y]![x] === runColor) {
        runLen++
        if (runLen === 5) score += 3
        else if (runLen > 5) score++
      } else {
        runColor = dark[y]![x]!
        runLen = 1
      }
    }
  }
  for (let x = 0; x < size; x++) {
    let runColor = false
    let runLen = 0
    for (let y = 0; y < size; y++) {
      if (dark[y]![x] === runColor) {
        runLen++
        if (runLen === 5) score += 3
        else if (runLen > 5) score++
      } else {
        runColor = dark[y]![x]!
        runLen = 1
      }
    }
  }
  // 2x2 blocks.
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = dark[y]![x]
      if (c === dark[y]![x + 1] && c === dark[y + 1]![x] && c === dark[y + 1]![x + 1]) score += 3
    }
  }
  // Proportion of dark modules.
  let darkCount = 0
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (dark[y]![x]) darkCount++
  const total = size * size
  const k = Math.ceil(Math.abs(darkCount * 20 - total * 10) / total) - 1
  score += k * 10
  return score
}

/**
 * Encode `value` into a QR module matrix. Returns a square `boolean[][]` where
 * `true` is a dark module. Throws if the text does not fit in version 40.
 */
export function encode(value: string, ecLevel: ErrorCorrection = 'M'): boolean[][] {
  const numChars = utf8Bytes(value).length

  let version = MIN_VERSION
  while (version <= MAX_VERSION && !fitsVersion(numChars, version, ecLevel)) version++
  if (version > MAX_VERSION) throw new Error('Data too long for a QR code')

  const dataCodewords = buildDataCodewords(value, version, ecLevel)
  const allCodewords = addEccAndInterleave(dataCodewords, version, ecLevel)

  const m = new QrMatrix(version)
  drawFunctionPatterns(m, version, ecLevel)
  drawCodewords(m, allCodewords)

  // Choose the mask with the lowest penalty.
  let bestMask = 0
  let minPenalty = Infinity
  for (let mask = 0; mask < 8; mask++) {
    applyMask(m, mask)
    drawFormatBits(m, ecLevel, mask, false)
    const penalty = penaltyScore(m)
    if (penalty < minPenalty) {
      minPenalty = penalty
      bestMask = mask
    }
    applyMask(m, mask) // undo (XOR is its own inverse)
  }
  applyMask(m, bestMask)
  drawFormatBits(m, ecLevel, bestMask, false)

  return m.modules
}
