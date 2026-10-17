"""Measures Cascivo Sans against the reference families for the /cascivo-sans comparison table.

    python3 -I src/compare.py --refs DIR --plex-var DIR   # all fonts, rewrites comparison.json
    python3 -I src/compare.py --cascivo-only    # re-measure only the Cascivo entry (no refs needed)

Every font is cut down the same way: axes other than `wght` pinned at their defaults, subset
to build.LATIN with fontTools (default subsetter options, which drop the ssXX/cvXX features that
the shipped Latin file keeps, so these figures sit below the file sizes in the README), saved as WOFF2. The reference figures are committed in comparison.json so
neither the site build nor the tests need the reference fonts; a test checks that the Cascivo
entry still matches the current font files.
"""

import argparse
import datetime
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from fontTools import subset  # noqa: E402
from fontTools.ttLib import TTFont  # noqa: E402
from fontTools.varLib import instancer  # noqa: E402

import build  # noqa: E402

FONTS = os.path.join(HERE, '..', 'fonts')
OUT = os.path.join(HERE, '..', 'comparison.json')

# Static facts that cannot be read from a font file. Each carries its source; where the file
# cannot prove a fact it is stated conservatively (a year range) rather than guessed.
#   license: OFL 1.1 for all four, from name ID 13 of each file (checked) and each project's
#            LICENSE file.
#   since:   Inter's file says "Copyright 2016" and the project's public releases began
#            shortly after; Plex's file says 2018 and IBM announced it in 2017; Geist's file
#            says 2024 and Vercel announced it in 2023. Ranges, not exact release dates.
#   scripts: counted from each file's cmap (Latin, Cyrillic and Greek letters; Geist's six
#            Greek codepoints are symbols, so it is not listed as Greek).
#   Cascivo: this repository, first release 2026.
FACTS = {
    'Cascivo Sans': {
        'license': 'OFL 1.1',
        'scripts': 'Latin, Cyrillic, Greek',
        'since': '2026',
    },
    'Inter': {
        'license': 'OFL 1.1',
        'scripts': 'Latin, Cyrillic, Greek',
        'since': '2016–17',
    },
    'Geist': {
        'license': 'OFL 1.1',
        'scripts': 'Latin, Cyrillic',
        'since': '2023–24',
    },
    'IBM Plex Sans': {
        'license': 'OFL 1.1',
        'scripts': 'Latin, Cyrillic, Greek',
        'since': '2017–18',
    },
}


def _version(font):
    v = font['name'].getDebugName(5) or ''
    return v.removeprefix('Version ').split(';')[0].strip()


def _latin_woff2(font):
    """Instance (if variable) to `wght` only, subset to LATIN, return (woff2 bytes, codepoints)."""
    font = TTFont(io.BytesIO(_save(font)))
    if 'fvar' in font:
        pin = {a.axisTag: a.defaultValue for a in font['fvar'].axes if a.axisTag != 'wght'}
        if pin:
            font = instancer.instantiateVariableFont(font, pin, inplace=False)
    opts = subset.Options()
    opts.flavor = 'woff2'
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=subset.parse_unicodes(build.LATIN))
    sub.subset(font)
    cps = len(font.getBestCmap())
    font.flavor = 'woff2'
    return _save(font), cps


def _save(font):
    buf = io.BytesIO()
    flavor = font.flavor
    font.save(buf)
    font.flavor = flavor
    return buf.getvalue()


def _entry(name, upright, italic, note=None):
    f = TTFont(upright)
    data, cps = _latin_woff2(f)
    axes = [a.axisTag for a in f['fvar'].axes] if 'fvar' in f else []
    italic_bytes = len(_latin_woff2(TTFont(italic))[0]) if italic else None
    entry = {
        'name': name,
        'version': _version(f),
        **FACTS[name],
        'axes': axes,
        # Hinted means TrueType instructions (fpgm); a bare prep/gasp is only a rasterizer hint.
        'hinted': 'fpgm' in f,
        'latin_wght_upright_bytes': len(data),
        'latin_wght_italic_bytes': italic_bytes,
        'codepoints_upright': cps,
    }
    if note:
        entry['note'] = note
    return entry


def measure_cascivo():
    return _entry(
        'Cascivo Sans',
        os.path.join(FONTS, 'CascivoSans[opsz,wght].ttf'),
        os.path.join(FONTS, 'CascivoSans-Italic[opsz,wght].ttf'),
    )


PLEX_SOURCE = '@fontsource-variable/ibm-plex-sans@5.3.0'


def measure_references(refs, plex_dir):
    p = lambda n: os.path.join(refs, n)  # noqa: E731
    q = lambda n: os.path.join(plex_dir, n)  # noqa: E731
    return [
        _entry('Inter', p('Inter.ttf'), p('InterItalic.ttf')),
        _entry('Geist', p('Geist.ttf'), None),
        # IBM's own static files are one weight each, so Plex is measured from its variable
        # release instead: the npm package above, files/ibm-plex-sans-latin-wght-{normal,italic}
        # .woff2 (IBM Plex Sans Variable 3.201, wght axis only, already a Latin slice of the
        # full font, so the LATIN subset below is of that slice). The full family also has a
        # width axis, which this build leaves out, as opsz is pinned for Inter and Cascivo.
        _entry(
            'IBM Plex Sans', q('ibm-plex-sans-latin-wght-normal.woff2'),
            q('ibm-plex-sans-latin-wght-italic.woff2'),
            note=f'measured from {PLEX_SOURCE}, a Latin slice of the variable release (weight axis only; the full family also has a width axis).',
        ),
    ]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--refs', help='directory holding Inter.ttf, InterItalic.ttf, Geist.ttf, (Plex comes from --plex-var)')
    ap.add_argument('--plex-var', help='extracted @fontsource-variable/ibm-plex-sans package files/ directory')
    ap.add_argument('--cascivo-only', action='store_true', help='re-measure only the Cascivo entry')
    args = ap.parse_args()
    if args.cascivo_only:
        with open(OUT, encoding='utf-8') as fh:
            data = json.load(fh)
        data['fonts'][0] = measure_cascivo()
    elif args.refs and args.plex_var:
        data = {
            'codepoints': build.LATIN,
            'measured': datetime.date.today().isoformat(),
            'fonts': [measure_cascivo(), *measure_references(args.refs, args.plex_var)],
        }
    else:
        ap.error('pass --refs DIR --plex-var DIR, or --cascivo-only')
    data['codepoints'] = build.LATIN
    with open(OUT, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
        fh.write('\n')
    for f in data['fonts']:
        print(f"{f['name']:14} {f['version']:10} up={f['latin_wght_upright_bytes']} it={f['latin_wght_italic_bytes']} cps={f['codepoints_upright']}")


if __name__ == '__main__':
    main()
