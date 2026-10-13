"""Hebrew: the 27 letters with their final forms (U+05D0-05EA), the Yiddish digraphs װ ױ ײ, maqaf
־, paseq ׀, geresh ׳, gershayim ״ and the sheqel sign ₪. Sof pasuq ׃ is this font's colon, and
the digraphs are pairs of its letters. The points (niqqud) and cantillation marks are not drawn yet: they need mark positioning. A DRAFT:
built only with CASCIVO_HEBREW=1, and not shipped until a native reader has reviewed it.

None of Inter, Geist or Plex has Hebrew. The letters' centre lines are traced from Noto Sans
Hebrew (`hebrew_paths.py`, made by `trace_noto.py hebrew`) and drawn by traced.py.
"""

import json
import os

import traced
from hebrew_paths import REF, TRACE

ALIAS = {0x5C3: 'colon'}  # sof pasuq: the Latin shape
# װ ױ ײ: Noto sets each as its two letters side by side, within 20 units of their two widths (50 at
# Black); logical order, so the second letter stands on the left
LIGATURES = {0x5F0: (0x5D5, 0x5D5), 0x5F1: (0x5D5, 0x5D9), 0x5F2: (0x5D9, 0x5D9)}
RTL = True

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kern_hebrew.json'), encoding='utf-8') as _fh:
    KERN = json.load(_fh)  # pair -> Noto's value at Thin, Regular, Black (trace_noto.py)

traced.register(TRACE, REF)

MASTERS = []  # every master's outlines (build.py), for the pair set
CORNERS = {}  # optical-size master name -> its Black and Thin corners (build.py)


def kern_fea(o):
    return traced.kern_fea(o, REF, KERN, 'HEBREW_KERN', MASTERS, CORNERS, cps=TRACE, rtl=True)
