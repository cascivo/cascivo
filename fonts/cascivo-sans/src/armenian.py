"""Armenian: the 38 capitals and 40 lowercase letters (U+0531-0556, U+0560-0588, with և), the six
marks (U+0559-055F), the dram sign ֏, and the five ligatures ﬓ-ﬗ. ։ and ֊ are this font's colon
and hyphen. A DRAFT: built only with CASCIVO_ARMENIAN=1, and not shipped until a native reader has
reviewed it.

None of Inter, Geist or Plex has Armenian. The letters' centre lines are traced from Noto Sans
Armenian (`armenian_paths.py`, made by `trace_noto.py armenian`) and drawn by traced.py.
"""

import json
import os
import unicodedata

import traced
from armenian_paths import REF, TRACE

ALIAS = {0x589: 'colon', 0x58A: 'hyphen'}  # Armenian full stop and hyphen: the Latin shapes
# ﬓ ﬔ ﬕ ﬖ ﬗ: Noto sets each as its two letters side by side, within 20 units of their two widths
LIGATURES = {cp: tuple(ord(c) for c in unicodedata.normalize('NFKD', chr(cp))) for cp in range(0xFB13, 0xFB18)}
RTL = False

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kern_armenian.json'), encoding='utf-8') as _fh:
    KERN = json.load(_fh)  # pair -> Noto's value at Thin, Regular, Black (trace_noto.py)

traced.register(TRACE, REF)


MASTERS = []  # every master's outlines (build.py), for the pair set
CORNERS = {}  # optical-size master name -> its Black and Thin corners (build.py)


def kern_fea(o):
    return traced.kern_fea(o, REF, KERN, 'ARMENIAN_KERN', MASTERS, CORNERS, cps=TRACE)
