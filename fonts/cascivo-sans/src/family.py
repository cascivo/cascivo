"""Sibling-family hook: one engine, several families (fonts/PLAN-families.md).

CASCIVO_FAMILY=mono|serif|condensed loads fonts/cascivo-<name>/src/family.py on top of this engine.
Unset (or 'sans'), every hook is a no-op and the Sans build is byte-identical.

A family module may define (all optional):
  NAME, PS                family name and PostScript stem
  ITALIC = False          build the italic too
  tune(p)                 after params.P.__init__: move any master number (V, cn, S, xh, ...)
  glyph(g, p, name)       after a glyph is drawn, before spacing: add strokes, set g.sb / g.adv_fixed
  master(o)               after a master is drawn and composed: e.g. force one advance (mono)
  fea(text) -> text       filter the feature source (e.g. drop kerning)
  woff2(font)             before a WOFF2 is saved: e.g. set font.flavorData (WOFF2's hmtx transform)
  BROTLI_TRIES = False    True: compress the WOFF2s the several ways Sans does (build.BROTLI_TRIES) and keep the smallest
and override drawings with the `override(name)` decorator below.
"""

import importlib.util
import os

HERE = os.path.dirname(os.path.abspath(__file__))
NAME = os.environ.get('CASCIVO_FAMILY', 'sans')
ACTIVE = NAME != 'sans'
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', f'cascivo-{NAME}'))
_mod = None


def load():
    """Import the family module. Called by build.py once glyphs.py is loaded, so a family can override drawings."""
    global _mod
    if ACTIVE and _mod is None:
        spec = importlib.util.spec_from_file_location(f'cascivo_family_{NAME}', os.path.join(ROOT, 'src', 'family.py'))
        _mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(_mod)
    return _mod


def get(attr, default=None):
    return getattr(_mod, attr, default) if _mod is not None else default


def tune(p):
    f = get('tune')
    if f:
        f(p)


def glyph(g, p, name):
    f = get('glyph')
    if f:
        f(g, p, name)


def master(o):
    f = get('master')
    if f:
        f(o)


def fea(text):
    f = get('fea')
    return f(text) if f else text


def woff2(font):
    f = get('woff2')
    if f:
        f(font)


def override(name):
    """Replace the drawing of an existing glyph (keeps its codepoints and order)."""
    import glyphs as GL

    def deco(fn):
        GL.GLYPHS[name] = (GL.GLYPHS[name][0], fn)
        return fn

    return deco
