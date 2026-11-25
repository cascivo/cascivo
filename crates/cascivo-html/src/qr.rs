//! Minimal QR Code encoder (byte mode, versions 1-40, EC levels L/M/Q/H).
//!
//! Port of `packages/components/src/qr-code/encode.ts`; output is bit-for-bit
//! identical (same version selection, mask selection and penalty rules).
//! Algorithm and tables adapted from Project Nayuki's QR Code generator
//! library (MIT License, https://www.nayuki.io/page/qr-code-generator-library).

const MIN_VERSION: usize = 1;
const MAX_VERSION: usize = 40;

/// (table ordinal, format-info bits) per EC level.
fn ecc(ec: char) -> (usize, u32) {
    match ec {
        'L' => (0, 1),
        'Q' => (2, 3),
        'H' => (3, 2),
        _ => (1, 0),
    }
}

// ECC codewords per block, indexed by [ordinal][version] (index 0 unused).
const ECC_CODEWORDS_PER_BLOCK: [[i32; 41]; 4] = [
    [
        -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28,
        30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    ],
    [
        -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28,
        28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
    ],
    [
        -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30,
        30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    ],
    [
        -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24,
        30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    ],
];

// Number of error-correction blocks, indexed by [ordinal][version].
const NUM_ERROR_CORRECTION_BLOCKS: [[i32; 41]; 4] = [
    [
        -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12,
        13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
    ],
    [
        -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21,
        23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
    ],
    [
        -1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27,
        29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
    ],
    [
        -1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32,
        35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
    ],
];

fn num_raw_data_modules(ver: usize) -> usize {
    let mut result = (16 * ver + 128) * ver + 64;
    if ver >= 2 {
        let num_align = ver / 7 + 2;
        result -= (25 * num_align - 10) * num_align - 55;
        if ver >= 7 {
            result -= 36;
        }
    }
    result
}

fn num_data_codewords(ver: usize, ord: usize) -> usize {
    num_raw_data_modules(ver) / 8
        - (ECC_CODEWORDS_PER_BLOCK[ord][ver] * NUM_ERROR_CORRECTION_BLOCKS[ord][ver]) as usize
}

// --- Reed-Solomon over GF(256) with primitive polynomial 0x11D ---

fn rs_multiply(x: u32, y: u32) -> u32 {
    let mut z: u32 = 0;
    for i in (0..8).rev() {
        z = (z << 1) ^ ((z >> 7) * 0x11d);
        z ^= ((y >> i) & 1) * x;
    }
    z & 0xff
}

fn rs_divisor(degree: usize) -> Vec<u32> {
    let mut result = vec![0u32; degree];
    result[degree - 1] = 1;
    let mut root = 1;
    for _ in 0..degree {
        for j in 0..result.len() {
            result[j] = rs_multiply(result[j], root);
            if j + 1 < result.len() {
                result[j] ^= result[j + 1];
            }
        }
        root = rs_multiply(root, 0x02);
    }
    result
}

fn rs_remainder(data: &[u32], divisor: &[u32]) -> Vec<u32> {
    let mut result = vec![0u32; divisor.len()];
    for &b in data {
        let factor = b ^ result.remove(0);
        result.push(0);
        for (r, &d) in result.iter_mut().zip(divisor) {
            *r ^= rs_multiply(d, factor);
        }
    }
    result
}

// --- Bit buffer for byte-mode data ---

fn append_bits(value: u32, len: usize, bits: &mut Vec<u8>) {
    for i in (0..len).rev() {
        bits.push(((value >> i) & 1) as u8);
    }
}

fn fits_version(num_chars: usize, version: usize, ord: usize) -> bool {
    let cc_bits = if version <= 9 { 8 } else { 16 };
    4 + cc_bits + num_chars * 8 <= num_data_codewords(version, ord) * 8
}

fn add_ecc_and_interleave(data: &[u32], version: usize, ord: usize) -> Vec<u32> {
    let num_blocks = NUM_ERROR_CORRECTION_BLOCKS[ord][version] as usize;
    let block_ecc_len = ECC_CODEWORDS_PER_BLOCK[ord][version] as usize;
    let raw = num_raw_data_modules(version) / 8;
    let num_short = num_blocks - (raw % num_blocks);
    let short_len = raw / num_blocks;

    let mut blocks: Vec<Vec<u32>> = Vec::with_capacity(num_blocks);
    let div = rs_divisor(block_ecc_len);
    let mut k = 0;
    for i in 0..num_blocks {
        let dat_len = short_len - block_ecc_len + usize::from(i >= num_short);
        let mut dat = data[k..k + dat_len].to_vec();
        k += dat_len;
        let e = rs_remainder(&dat, &div);
        if i < num_short {
            dat.push(0); // pad short blocks so columns align
        }
        dat.extend(e);
        blocks.push(dat);
    }

    let mut result = Vec::new();
    for i in 0..blocks[0].len() {
        for (j, block) in blocks.iter().enumerate() {
            if i != short_len - block_ecc_len || j >= num_short {
                result.push(block[i]);
            }
        }
    }
    result
}

fn build_data_codewords(bytes: &[u8], version: usize, ord: usize) -> Vec<u32> {
    let mut bits: Vec<u8> = Vec::new();
    append_bits(0x4, 4, &mut bits);
    append_bits(
        bytes.len() as u32,
        if version <= 9 { 8 } else { 16 },
        &mut bits,
    );
    for &b in bytes {
        append_bits(u32::from(b), 8, &mut bits);
    }
    let capacity_bits = num_data_codewords(version, ord) * 8;
    append_bits(0, 4.min(capacity_bits - bits.len()), &mut bits);
    append_bits(0, (8 - bits.len() % 8) % 8, &mut bits);

    let mut codewords: Vec<u32> = bits
        .chunks(8)
        .map(|c| c.iter().fold(0u32, |a, &b| (a << 1) | u32::from(b)))
        .collect();
    let mut pad = 0xec;
    while codewords.len() < capacity_bits / 8 {
        codewords.push(pad);
        pad ^= 0xec ^ 0x11;
    }
    codewords
}

// --- Matrix drawing ---

struct Matrix {
    size: usize,
    modules: Vec<Vec<bool>>,
    is_function: Vec<Vec<bool>>,
}

impl Matrix {
    fn new(version: usize) -> Self {
        let size = version * 4 + 17;
        Matrix {
            size,
            modules: vec![vec![false; size]; size],
            is_function: vec![vec![false; size]; size],
        }
    }

    fn set(&mut self, x: usize, y: usize, dark: bool, func: bool) {
        self.modules[y][x] = dark;
        self.is_function[y][x] = func;
    }

    fn draw_finder(&mut self, x: usize, y: usize) {
        let size = self.size as isize;
        for dy in -4isize..=4 {
            for dx in -4isize..=4 {
                let xx = x as isize + dx;
                let yy = y as isize + dy;
                if xx < 0 || xx >= size || yy < 0 || yy >= size {
                    continue;
                }
                let dist = dx.abs().max(dy.abs());
                self.set(xx as usize, yy as usize, dist != 2 && dist != 4, true);
            }
        }
    }

    fn draw_alignment(&mut self, x: usize, y: usize) {
        for dy in -2isize..=2 {
            for dx in -2isize..=2 {
                self.set(
                    (x as isize + dx) as usize,
                    (y as isize + dy) as usize,
                    dx.abs().max(dy.abs()) != 1,
                    true,
                );
            }
        }
    }
}

fn alignment_positions(version: usize) -> Vec<usize> {
    if version == 1 {
        return Vec::new();
    }
    let num_align = version / 7 + 2;
    let step = (version * 8 + num_align * 3 + 5) / (num_align * 4 - 4) * 2;
    let mut result = vec![6];
    let mut pos = version * 4 + 10;
    while result.len() < num_align {
        result.insert(1, pos);
        pos = pos.wrapping_sub(step);
    }
    result
}

fn draw_function_patterns(m: &mut Matrix, version: usize, ec: char) {
    let size = m.size;
    for i in 0..size {
        m.set(6, i, i % 2 == 0, true);
        m.set(i, 6, i % 2 == 0, true);
    }
    m.draw_finder(3, 3);
    m.draw_finder(size - 4, 3);
    m.draw_finder(3, size - 4);
    let aligns = alignment_positions(version);
    let n = aligns.len();
    for i in 0..n {
        for j in 0..n {
            if (i == 0 && j == 0) || (i == 0 && j == n - 1) || (i == n - 1 && j == 0) {
                continue;
            }
            m.draw_alignment(aligns[i], aligns[j]);
        }
    }
    draw_format_bits(m, ec, 0, true);
    draw_version(m, version);
}

fn draw_format_bits(m: &mut Matrix, ec: char, mask: u32, reserve_only: bool) {
    let size = m.size;
    let data = (ecc(ec).1 << 3) | mask;
    let mut rem = data;
    for _ in 0..10 {
        rem = (rem << 1) ^ ((rem >> 9) * 0x537);
    }
    let bits = ((data << 10) | rem) ^ 0x5412;
    let get = |i: usize| !reserve_only && (bits >> i) & 1 != 0;

    for i in 0..=5 {
        m.set(8, i, get(i), true);
    }
    m.set(8, 7, get(6), true);
    m.set(8, 8, get(7), true);
    m.set(7, 8, get(8), true);
    for i in 9..15 {
        m.set(14 - i, 8, get(i), true);
    }
    for i in 0..8 {
        m.set(size - 1 - i, 8, get(i), true);
    }
    for i in 8..15 {
        m.set(8, size - 15 + i, get(i), true);
    }
    m.set(8, size - 8, true, true);
}

fn draw_version(m: &mut Matrix, version: usize) {
    if version < 7 {
        return;
    }
    let v = version as u32;
    let mut rem = v;
    for _ in 0..12 {
        rem = (rem << 1) ^ ((rem >> 11) * 0x1f25);
    }
    let bits = (v << 12) | rem;
    for i in 0..18 {
        let bit = (bits >> i) & 1 != 0;
        let a = m.size - 11 + i % 3;
        let b = i / 3;
        m.set(a, b, bit, true);
        m.set(b, a, bit, true);
    }
}

fn draw_codewords(m: &mut Matrix, codewords: &[u32]) {
    let size = m.size;
    let mut i = 0usize;
    let mut right = size - 1;
    while right >= 1 {
        let col = if right == 6 { 5 } else { right };
        for vert in 0..size {
            for j in 0..2 {
                let x = col - j;
                let upward = ((col + 1) & 2) == 0;
                let y = if upward { size - 1 - vert } else { vert };
                if !m.is_function[y][x] && i < codewords.len() * 8 {
                    let dark = (codewords[i >> 3] >> (7 - (i & 7))) & 1 != 0;
                    m.set(x, y, dark, false);
                    i += 1;
                }
            }
        }
        if right < 2 {
            break;
        }
        right -= 2;
    }
}

fn apply_mask(m: &mut Matrix, mask: u32) {
    for y in 0..m.size {
        for x in 0..m.size {
            if m.is_function[y][x] {
                continue;
            }
            let invert = match mask {
                0 => (x + y) % 2 == 0,
                1 => y % 2 == 0,
                2 => x % 3 == 0,
                3 => (x + y) % 3 == 0,
                4 => (x / 3 + y / 2) % 2 == 0,
                5 => (x * y) % 2 + (x * y) % 3 == 0,
                6 => ((x * y) % 2 + (x * y) % 3) % 2 == 0,
                _ => ((x + y) % 2 + (x * y) % 3) % 2 == 0,
            };
            if invert {
                m.modules[y][x] = !m.modules[y][x];
            }
        }
    }
}

fn run_penalty(line: impl Iterator<Item = bool>) -> i64 {
    let mut score = 0;
    let mut color = false;
    let mut len = 0;
    for cell in line {
        if cell == color {
            len += 1;
            if len == 5 {
                score += 3;
            } else if len > 5 {
                score += 1;
            }
        } else {
            color = cell;
            len = 1;
        }
    }
    score
}

fn penalty_score(m: &Matrix) -> i64 {
    let size = m.size;
    let d = &m.modules;
    let mut score = 0;
    for row in d.iter().take(size) {
        score += run_penalty((0..size).map(|x| row[x]));
    }
    for x in 0..size {
        score += run_penalty(d.iter().take(size).map(|row| row[x]));
    }
    for y in 0..size - 1 {
        for x in 0..size - 1 {
            let c = d[y][x];
            if c == d[y][x + 1] && c == d[y + 1][x] && c == d[y + 1][x + 1] {
                score += 3;
            }
        }
    }
    let dark_count = d.iter().flatten().filter(|&&b| b).count() as i64;
    let total = (size * size) as i64;
    let diff = (dark_count * 20 - total * 10).abs();
    let k = (diff + total - 1) / total - 1;
    score + k * 10
}

/// Encode `value` into a QR module matrix (`true` = dark). `ec` is one of
/// `'L'`, `'M'`, `'Q'`, `'H'` (anything else is treated as `'M'`). Returns an
/// empty matrix if the text does not fit in version 40.
pub fn encode(value: &str, ec: char) -> Vec<Vec<bool>> {
    let bytes = value.as_bytes();
    let ord = ecc(ec).0;

    let mut version = MIN_VERSION;
    while version <= MAX_VERSION && !fits_version(bytes.len(), version, ord) {
        version += 1;
    }
    if version > MAX_VERSION {
        return Vec::new();
    }

    let data = build_data_codewords(bytes, version, ord);
    let all = add_ecc_and_interleave(&data, version, ord);

    let mut m = Matrix::new(version);
    draw_function_patterns(&mut m, version, ec);
    draw_codewords(&mut m, &all);

    let mut best_mask = 0;
    let mut min_penalty = i64::MAX;
    for mask in 0..8 {
        apply_mask(&mut m, mask);
        draw_format_bits(&mut m, ec, mask, false);
        let p = penalty_score(&m);
        if p < min_penalty {
            min_penalty = p;
            best_mask = mask;
        }
        apply_mask(&mut m, mask);
    }
    apply_mask(&mut m, best_mask);
    draw_format_bits(&mut m, ec, best_mask, false);
    m.modules
}

#[cfg(test)]
mod tests {
    use super::encode;

    fn render(m: &[Vec<bool>]) -> String {
        m.iter()
            .map(|r| {
                r.iter()
                    .map(|&b| if b { '#' } else { '.' })
                    .collect::<String>()
            })
            .collect::<Vec<_>>()
            .join("\n")
    }

    #[test]
    fn url_m() {
        let expected = r"
#######..###..##..#######
#.....#.##...###..#.....#
#.###.#..#.#......#.###.#
#.###.#....#..##..#.###.#
#.###.#.##.##..#..#.###.#
#.....#...##..##..#.....#
#######.#.#.#.#.#.#######
.........##.##..#........
#.#.#.#..#.##.###...#..#.
....#...#.#......##.....#
#####.#..##.##....##..###
.###...#..#.....#..#...#.
###..##...#.#..####..#.##
.#..#..#..####..#.#..#..#
#.#.#.####.##.#.#.##..###
.#..##.#..#.###.#.#.#..#.
#.##..#..#.#..#.######...
........####..#.#...##.##
#######..##..#.##.#.##.##
#.....#...##....#...##..#
#.###.#.##..#...######..#
#.###.#..#.###.....####..
#.###.#.#.###.#.....#...#
#.....#..#..######..##.#.
#######.#..#..####.#...##
";
        assert_eq!(render(&encode("https://cascivo.dev", 'M')), expected.trim());
    }

    #[test]
    fn a_l() {
        let expected = r"
#######..#.##.#######
#.....#..###..#.....#
#.###.#.##.##.#.###.#
#.###.#..#.#..#.###.#
#.###.#...#.#.#.###.#
#.....#.....#.#.....#
#######.#.#.#.#######
........##.##........
###.########.##...#..
..#.....#.....#...##.
##.#.##..##.#...#...#
.#.#....##....#...#..
###..##.#...#.#.#.#.#
........#..#.#.#.#.#.
#######.#.##.###.####
#.....#.######.###...
#.###.#.##.#.###.##.#
#.###.#..##...#...##.
#.###.#.##..#...#...#
#.....#.#.....#...##.
#######.###.#.#.#.###
";
        assert_eq!(render(&encode("A", 'L')), expected.trim());
    }

    #[test]
    fn long_h() {
        let expected = r"
#######.###....#...###....#.###.##..#.#######
#.....#.###...####..#.##..##.#.....#..#.....#
#.###.#.##.#.#....###..######.#..#.#..#.###.#
#.###.#..#.#.#.#.#..#..#.#.##.####.##.#.###.#
#.###.#..#.###.##.#.#####..#.##.#.###.#.###.#
#.....#.##...#...#.##...###.##.###....#.....#
#######.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#######
........#.#.##.##..##...##.##.#####.#........
..###.#.##.#.##..##.#####..####....#.###..###
#.#.#..#..####.....#.#.#.##.###.....##.#.##.#
#####.#..#.###.#..#.##.#.###.#.#.##.##.#.#...
###..#..##...##.#..###.##.#.###.##..#..##.##.
#...#.##.##..###.#..#.##.#..####.#.......#..#
#.#.##....###.#..##.#.#.##.#..#....###..###.#
##....##...###.##.##.#.#....##.####.###.#.##.
#.#.##...#...####.##.##..#..#.########..###..
#.#...#...###.##....#.#..#.#.###.#....#......
###.....#.###..###...##..####.##....##...####
##...##..#..#.###..#.###.#.########.#.#..#.#.
#.##...#.#....###.#.##...#..##..##.....######
#.#######.###.###..########.#..#....#####..##
#.###...#.#....###..#...##..##...#.##...##.#.
###.#.#.#.##.#.#.#.##.#.##..#.#...###.#.##.#.
###.#...#...#...##..#...#.#..#.#.#..#...#####
##############.##..########.#.#....#######..#
####....###..#....####.#.#.#####.#....#...###
#.#...##.#...#...#.#.##...#.##...#..#..#..#..
#####...#.#....#.####.##.##..#####.##.##.##.#
##.#.##.#.#...#..###...#....##....#.##.##..#.
####.#..####.#..#.#...###..######..#####...##
#.#.###.#...##.####.###..#....#..##.......##.
####...###..##.##.#..##...#####.#####.#...#.#
####..##..#####..#########.###.#.##.#..###..#
####...#...##.####........#.###.....##.#....#
....#.#######..###..##.#...##.#...#..#....#..
.####..#.#..#.#.#####......#....#..#.#.######
#..##.###.#.#...###.#####...##.#....#####....
........#...###....##...#.#....#.#..#...##..#
#######....##..##.###.#.###.#..#.##.#.#.#..#.
#.....#..#.#.###....#...#.#.....##..#...#.#.#
#.###.#.#.#####..#.######.###.#..##.#####....
#.###.#.#.........#.#.###...######.#...######
#.###.#.#.#....####..#...######.#.####.......
#.....#...###.####...#..#.#..##...##.#.#.##..
#######....###.###..######..##.#####.##....#.
";
        assert_eq!(
            render(&encode(
                "The quick brown fox jumps over the lazy dog 0123456789 QR!!",
                'H'
            )),
            expected.trim()
        );
    }
}
