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
    0x327: 'cedillacomb', 0x328: 'ogonekcomb', 0x309: 'hookabovecomb', 0x323: 'dotbelowcomb', 0x31B: 'horncomb',
}
BOTTOM = {'commaaccentcomb': 'bottom', 'cedillacomb': 'bottom', 'ogonekcomb': 'ogonek', 'dotbelowcomb': 'bottom'}

# Latvian/Romanian convention: these "cedillas" are drawn as a comma below
COMMA_BELOW = set('ĢģĶķĻļŅņŖŗ')
# Czech/Slovak: caron on an ascender becomes a vertical comma to the right
CARON_ALT = set('ďĽľť')

SPECIAL = {
    'Ð': 'Eth', 'Đ': 'Dcroat', 'đ': 'dcroat', 'Ħ': 'Hbar', 'ħ': 'hbar', 'Ł': 'Lslash', 'ł': 'lslash',
    'Ŀ': 'Ldot', 'ŀ': 'ldot', 'Ĳ': 'IJ', 'ĳ': 'ij', 'ŉ': 'napostrophe', 'Ø': 'Oslash', 'ø': 'oslash',
    'Œ': 'OE', 'œ': 'oe',
}


# Cyrillic letters drawn exactly as a Latin glyph: composites of it (cyrillic.py draws the rest)
CYR_ALIAS = {
    0x405: 'S', 0x406: 'I', 0x408: 'J', 0x410: 'A', 0x412: 'B', 0x415: 'E', 0x41A: 'K', 0x41C: 'M',
    0x41D: 'H', 0x41E: 'O', 0x420: 'P', 0x421: 'C', 0x422: 'T', 0x425: 'X',
    0x430: 'a', 0x435: 'e', 0x43A: 'kgreenlandic', 0x43E: 'o', 0x440: 'p', 0x441: 'c', 0x443: 'y',
    0x445: 'x', 0x455: 's', 0x456: 'i', 0x458: 'j', 0x45B: 'hbar',
}


def is_cap(name):
    """A capital (spaced with the capitals' sidebearing), by glyph name: A, Ə (uni018F), Ж (uni0416)."""
    if name.startswith('uni') and len(name) >= 7:
        try:
            return chr(int(name[3:7], 16)).isupper()
        except ValueError:
            pass
    return name[0].isupper()


def base_name(ch):
    if ch.isascii() and ch.isalpha():
        return ch
    return None


def accented_chars():
    """(char, base glyph, [mark glyphs]) for Latin-1, Latin Extended-A, Romanian comma letters,
    Vietnamese (horned O and U, and Latin Extended Additional), Welsh (Ẁ Ẃ Ẅ Ỳ) and Cyrillic."""
    out = []
    cps = list(range(0xC0, 0x100)) + list(range(0x100, 0x180)) + [0x218, 0x219, 0x21A, 0x21B]
    cps += [0x1A0, 0x1A1, 0x1AF, 0x1B0] + list(range(0x1E80, 0x1E86)) + list(range(0x1EA0, 0x1EFA))
    cps += list(range(0x400, 0x460))  # Ѐ Ё Ѓ Ї Ќ Ѝ Ў Й and their lowercase
    for cp in cps:
        ch = chr(cp)
        d = unicodedata.normalize('NFD', ch)
        if len(d) < 2:
            continue
        if d[0].isascii():
            base = d[0]
        elif 0x400 <= ord(d[0]) < 0x460:  # on the Latin glyph where the letter is one (Ё on E)
            base = CYR_ALIAS.get(ord(d[0]), 'uni%04X' % ord(d[0]))
        else:
            continue
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
