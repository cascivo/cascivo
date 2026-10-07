"""Composite glyphs: everything that can be assembled from existing outlines is, never redrawn.

A composite costs a few bytes (glyph index + offset) instead of a full outline plus a delta set
per master — this is the single biggest file-size lever in a Latin font: ~60% of the glyphs in
this family are composites.
"""

import unicodedata

# combining mark -> mark glyph
MARK_OF = {
    0x300: 'gravecomb', 0x301: 'acutecomb', 0x302: 'circumflexcomb', 0x303: 'tildecomb',
    0x304: 'macroncomb', 0x306: 'brevecomb', 0x307: 'dotaccentcomb', 0x308: 'dieresiscomb',
    0x30A: 'ringcomb', 0x30B: 'hungarumlautcomb', 0x30C: 'caroncomb', 0x326: 'commaaccentcomb',
    0x327: 'cedillacomb', 0x328: 'ogonekcomb',
}
BOTTOM = {'commaaccentcomb': 'bottom', 'cedillacomb': 'bottom', 'ogonekcomb': 'ogonek'}

# Latvian/Romanian convention: these "cedillas" are drawn as a comma below
COMMA_BELOW = set('ĢģĶķĻļŅņŖŗ')
# Czech/Slovak: caron on an ascender becomes a vertical comma to the right
CARON_ALT = set('ďĽľť')

SPECIAL = {
    'Ð': 'Eth', 'Đ': 'Dcroat', 'đ': 'dcroat', 'Ħ': 'Hbar', 'ħ': 'hbar', 'Ł': 'Lslash', 'ł': 'lslash',
    'Ŀ': 'Ldot', 'ŀ': 'ldot', 'Ĳ': 'IJ', 'ĳ': 'ij', 'ŉ': 'napostrophe', 'Ø': 'Oslash', 'ø': 'oslash',
    'Œ': 'OE', 'œ': 'oe',
}


def base_name(ch):
    if ch.isascii() and ch.isalpha():
        return ch
    return None


def accented_chars():
    """(char, base glyph, [mark glyphs]) for Latin-1 + Latin Extended-A + Romanian comma letters."""
    out = []
    cps = list(range(0xC0, 0x100)) + list(range(0x100, 0x180)) + [0x218, 0x219, 0x21A, 0x21B]
    for cp in cps:
        ch = chr(cp)
        d = unicodedata.normalize('NFD', ch)
        if len(d) < 2 or not d[0].isascii():
            continue
        base = d[0]
        marks = [MARK_OF[ord(m)] for m in d[1:] if ord(m) in MARK_OF]
        if len(marks) != len(d) - 1:
            continue
        if ch in COMMA_BELOW:
            marks = ['commaaccentcomb' if m == 'cedillacomb' else m for m in marks]
            if ch == 'ģ':
                marks = ['commaturnedabovecomb']
        if ch in CARON_ALT:
            marks = ['caroncomb.alt']
        out.append((ch, base, marks))
    return out


def glyph_name(ch):
    names = {
        'ı': 'dotlessi', 'ȷ': 'dotlessj',
    }
    if ch in names:
        return names[ch]
    if ch.isascii():
        return None
    return 'uni%04X' % ord(ch)
