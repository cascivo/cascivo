"""Georgian: the 33 letters of modern Mkhedruli (U+10D0-10F0), their Mtavruli capitals
(U+1C90-1CB0), and ჻ (U+10FB). A DRAFT: built only with CASCIVO_GEORGIAN=1, and not shipped until
a native reader has reviewed it.

None of Inter, Geist or Plex has Georgian. The letters' centre lines are traced from Noto Sans
Georgian (`georgian_paths.py`, made by `trace_noto.py georgian`) and drawn by traced.py.
"""

import json
import os

import traced
from georgian_paths import REF, TRACE
from glyphs import glyph

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kern_georgian.json'), encoding='utf-8') as _fh:
    KERN = json.load(_fh)  # pair -> Noto's value at Thin, Regular, Black (trace_noto.py)

traced.register(TRACE, REF)


def kern_fea(o):
    return traced.kern_fea(o, REF, KERN, 'GEORGIAN_KERN')


@glyph('uni10FB', 0x10FB)
def _paragraph(g, p):
    """჻: three dots in a triangle, the Georgian paragraph separator."""
    d = p.dot
    g.dot(d * 0.5, p.xh - d, d).dot(d * 2.1, p.xh - d, d).dot(d * 1.3, p.xh * 0.45 - d, d)
    g.sb = (0.6, 0.6)
