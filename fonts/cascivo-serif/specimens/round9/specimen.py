"""Round 9 specimen: 12/16/48/96 px, weights 300/400/700/900 + italics; Source Serif 4 (grey) and IBM Plex Serif (blue) under each line.

    python3 -I fonts/cascivo-serif/specimens/round9/specimen.py OUT.png REFS_DIR [PLEX_DIR] [sizes]
SERIF_FONTS=dir renders another build (the round's before). REFS_DIR holds fontsource source-serif-4-latin-wght-{normal,italic}.woff2; PLEX_DIR IBMPlexSerif-*.ttf (static, 400/700 only).
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont
F = os.environ.get('SERIF_FONTS') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'fonts')
F += '/'
R = sys.argv[2]; X = sys.argv[3] if len(sys.argv) > 3 else None
SIZES = [int(s) for s in sys.argv[4].split(',')] if len(sys.argv) > 4 else [12, 16, 48, 96]
UP, IT = F + 'CascivoSerif[opsz,wght].ttf', F + 'CascivoSerif-Italic[opsz,wght].ttf'
RU, RI = R + '/source-serif-4-latin-wght-normal.woff2', R + '/source-serif-4-latin-wght-italic.woff2'
TXT = {12: 'The quick brown fox jumps over 13 lazy dogs; minimum rhythm, agree, coffee, Illinois 1l1.',
       16: 'Hamburgefonstiv: eager agents read every page, 2025 figures 0123456789.',
       48: 'Hamburgefonstiv aeg 359', 96: 'Raeg aes'}
def font(p, s, w):
    f = ImageFont.truetype(p, s, layout_engine=ImageFont.Layout.RAQM)
    try:
        f.set_variation_by_axes([w if b'eight' in a['name'] else (min(max(s, 8), 48) if b'ptical' in a['name'] else a['default']) for a in f.get_variation_axes()])
    except OSError:
        pass
    return f
def plex(w, it):
    if not X or w not in (400, 700): return None
    n = {(400, 0): 'Regular', (700, 0): 'Bold', (400, 1): 'Italic', (700, 1): 'BoldItalic'}[(w, it)]
    return X + '/IBMPlexSerif-' + n + '.ttf'
rows = []
for it in (0, 1):
    for w in (300, 400, 700, 900):
        for s in SIZES:
            if s == 96 and w == 300: continue
            rows.append((IT if it else UP, RI if it else RU, plex(w, it), w, s))
H = int(sum(s * (3.9 if p else 2.6) + 10 for _, _, p, _, s in rows)) + 40
im = Image.new('RGB', (1600, H), 'white'); d = ImageDraw.Draw(im); y = 20
for own, ref, px, w, s in rows:
    t = TXT[s]
    d.text((10, y), str(w), font=font(RU, 10, 400), fill=(200, 0, 0))
    d.text((40, y), t, font=font(own, s, w), fill='black'); y += s * 1.3
    d.text((40, y), t, font=font(ref, s, w), fill=(125, 125, 125)); y += s * 1.3
    if px:
        d.text((40, y), t, font=ImageFont.truetype(px, s), fill=(40, 80, 170)); y += s * 1.3
    y += 10
im = im.crop((0, 0, 1100, int(y) + 10)).quantize(16); im.save(sys.argv[1], optimize=True)
