"""Round 8 specimen: Regular, Bold, Italic at 12/16/48 px, Source Serif 4 in grey under each line.

    python3 -I fonts/cascivo-serif/specimens/round8/specimen.py OUT.png REFS_DIR   (fontsource source-serif-4 latin-wght woff2s)
"""
import sys
from PIL import Image, ImageDraw, ImageFont
F='/home/user/cascivo/fonts/cascivo-serif/fonts/'; R=sys.argv[2]
UP, IT = F+'CascivoSerif[opsz,wght].ttf', F+'CascivoSerif-Italic[opsz,wght].ttf'
RU, RI = R+'/source-serif-4-latin-wght-normal.woff2', R+'/source-serif-4-latin-wght-italic.woff2'
T48 = ['0123456789 Hamburgefonstiv', 'a e f g 2 3 5 7 9 Rafters']
T = ['The quick brown fox jumps over 13 lazy dogs: 0123456789, agree, affine, coffee.',
     'Hamburgefonstiv Cogent graphs eager agents 2025 357 9 Il1 minimum rhythm.']
def font(p, s, w):
    f = ImageFont.truetype(p, s, layout_engine=ImageFont.Layout.RAQM)
    f.set_variation_by_axes([w if b'eight' in a['name'] else (min(max(s, 8), 48) if b'ptical' in a['name'] else a['default']) for a in f.get_variation_axes()])
    return f
rows = []
for name, own, ref, w in (('Regular', UP, RU, 400), ('Bold', UP, RU, 700), ('Italic', IT, RI, 400)):
    for s in (12, 16):
        rows += [(own, ref, w, s, t) for t in T]
    rows += [(own, ref, w, 48, t) for t in T48]
H = int(sum(s * 2.7 + 8 for *_, s, _ in rows)) + 40
im = Image.new('RGB', (1500, H), 'white'); d = ImageDraw.Draw(im); y = 20
for own, ref, w, s, t in rows:
    d.text((20, y), t, font=font(own, s, w), fill='black'); y += s * 1.35
    d.text((20, y), t, font=font(ref, s, w), fill=(125, 125, 125)); y += s * 1.35 + 8
im.save(sys.argv[1])
