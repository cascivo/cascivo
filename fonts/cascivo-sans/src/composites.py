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
    0x4AE: 'Y', 0x4BB: 'h', 0x4C0: 'I.ss01', 0x4CF: 'I.ss01', 0x4D8: 'uni018F', 0x4D9: 'uni0259',
}

# Greek letters drawn exactly as a Latin or Cyrillic glyph (greek.py draws the rest)
GREEK_ALIAS = {
    0x391: 'A', 0x392: 'B', 0x393: 'uni0413', 0x395: 'E', 0x396: 'Z', 0x397: 'H', 0x399: 'I.ss01',
    0x39A: 'K', 0x39C: 'M', 0x39D: 'N', 0x39F: 'O', 0x3A0: 'uni041F', 0x3A1: 'P', 0x3A4: 'T',
    0x3A5: 'Y', 0x3A6: 'uni0424', 0x3A7: 'X',
    0x3B3: 'uni04AF', 0x3B4: 'uni0431.loclSRB', 0x3BA: 'kgreenlandic', 0x3BC: 'mu', 0x3BD: 'v',
    0x3BF: 'o', 0x37E: 'semicolon', 0x387: 'periodcentered',
}
ALIAS = {**CYR_ALIAS, **GREEK_ALIAS}
# Monotonic Greek's accented letters: tonos, dialytika, and both (ΐ ΰ)
GREEK_ACCENTED = [0x386, 0x388, 0x389, 0x38A, 0x38C, 0x38E, 0x38F, 0x390, 0x3AA, 0x3AB] + list(range(0x3AC, 0x3B1)) + list(range(0x3CA, 0x3CF))


def script_glyph(ch):
    """The glyph a Cyrillic or Greek letter is: its Latin twin's, or its own uniXXXX."""
    return ALIAS.get(ord(ch), 'uni%04X' % ord(ch))

# Extended Cyrillic: a base glyph plus a piece (cyrillic.py), placed by `where`:
# 'foot' at the base's right ink edge, 'stem' off its right stem (the advance grows, as Ц's),
# 'left' over its stem from the left, 'centre', 'arm' (across К's arm), 'bowl' (Ч's), 'bottom'
# at the bottom anchor.
CYR_EXT = {
    0x49A: ('K', 'cyrtail.foot', 'foot'), 0x49B: ('kgreenlandic', 'cyrtail.foot', 'foot'),
    0x4B2: ('X', 'cyrtail.foot', 'foot'), 0x4B3: ('x', 'cyrtail.foot', 'foot'),
    0x496: ('uni0416', 'cyrtail.foot', 'foot'), 0x497: ('uni0436', 'cyrtail.foot', 'foot'),
    0x4A2: ('H', 'cyrtail.stem', 'stem'), 0x4A3: ('uni043D', 'cyrtail.stem', 'stem'),
    0x4B6: ('uni0427', 'cyrtail.stem', 'stem'), 0x4B7: ('uni0447', 'cyrtail.stem', 'stem'),
    0x492: ('uni0413', 'cyrbar.Ge', 'left'), 0x493: ('uni0433', 'cyrbar.ge', 'left'),
    0x4B0: ('Y', 'cyrbar.Ue', 'centre'), 0x4B1: ('uni04AF', 'cyrbar.ue', 'centre'),
    0x49C: ('K', 'cyrvbar.Ka', 'arm'), 0x49D: ('kgreenlandic', 'cyrvbar.ka', 'arm'),
    0x4B8: ('uni0427', 'cyrvbar.Che', 'bowl'), 0x4B9: ('uni0447', 'cyrvbar.che', 'bowl'),
    0x498: ('uni0417', 'cedillacomb', 'bottom'), 0x499: ('uni0437', 'cedillacomb', 'bottom'),
    0x4AA: ('C', 'cedillacomb', 'bottom'), 0x4AB: ('c', 'cedillacomb', 'bottom'),
}

# Local forms (locl) that are composites: alternate -> (base glyph, mark or piece, or None).
# Bulgarian's in both styles; Serbian's/Macedonian's г д п т only in the italic (ITALIC_ONLY).
CYR_LOCL = {
    'uni0434.loclBGR': ('g', None), 'uni0438.loclBGR': ('u', None), 'uni0439.loclBGR': ('u', 'brevecomb'),
    'uni043A.loclBGR': ('k', None), 'uni043F.loclBGR': ('n', None), 'uni0442.loclBGR': ('m', None),
    'uni0446.loclBGR': ('u', 'cyrtail.foot'), 'uni0449.loclBGR': ('uni0448.loclBGR', 'cyrtail.foot'),
    'uni0433.loclSRB': ('dotlessi', 'macroncomb'), 'uni0434.loclSRB': ('g', None),
    'uni043F.loclSRB': ('u', 'macroncomb'), 'uni0442.loclSRB': ('uni0448.loclBGR', 'macroncomb'),
}
ITALIC_ONLY = {'uni0433.loclSRB', 'uni0434.loclSRB', 'uni043F.loclSRB', 'uni0442.loclSRB'}


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
    cps += list(range(0x400, 0x460)) + list(range(0x4C0, 0x500))  # Ё Ї Й Ў ..., Ӑ Ӓ Ӣ Ӧ Ӱ ...
    for cp in cps:
        ch = chr(cp)
        d = unicodedata.normalize('NFD', ch)
        if len(d) < 2:
            continue
        if d[0].isascii():
            base = d[0]
        elif 0x400 <= ord(d[0]) < 0x500:  # on the Latin glyph where the letter is one (Ё on E)
            base = script_glyph(d[0])
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
