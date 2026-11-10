#!/usr/bin/env python3.13
# AB2: build the Source Serif 4 roman subset WITH the opsz axis (and wght), so large hero/lead
# headlines get the display optical cut instead of the heavier text cut. Source: the same
# @fontsource-variable/source-serif-4 package AA3 used (a dev-only, --no-save fetch; it does NOT
# stay in package.json). We keep the latin + latin-ext unicode subsets unchanged, limit the weight
# axis to 400-700 (the only weights this product uses) and the opsz axis to 8-40pt (covers every
# role size, 11-36px) so the preloaded latin file stays within the 130KB first-paint budget.
#
#   npm install --no-save @fontsource-variable/source-serif-4@5.1.1
#   python3.13 scripts/build-opsz-serif.py           # writes the two woff2 into public/fonts/
#   npm run hash:fonts                               # content-hash + rewrite the references
import os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SRC = 'node_modules/@fontsource-variable/source-serif-4/files'
OUT = 'public/fonts'
WGHT = (400, 700)   # the weight set this product uses {400,500,600,700}
OPSZ = (8, 40)      # pt — covers every role size (11-36px) with margin; trims bytes vs the full 8-60

JOBS = [
    (f'{SRC}/source-serif-4-latin-opsz-normal.woff2',     f'{OUT}/source-serif-4-latin-wght.woff2'),
    (f'{SRC}/source-serif-4-latin-ext-opsz-normal.woff2', f'{OUT}/source-serif-4-latin-ext-wght.woff2'),
]

# remove any existing Source Serif woff2 (hashed or not) so there is exactly one of each after.
import glob
for old in glob.glob(f'{OUT}/source-serif-4-*.woff2'):
    os.remove(old)

for src, out in JOBS:
    f = TTFont(src)
    instancer.instantiateVariableFont(f, {'wght': WGHT, 'opsz': OPSZ}, inplace=True)
    f.flavor = 'woff2'
    f.save(out)
    axes = [(a.axisTag, a.minValue, a.defaultValue, a.maxValue) for a in f['fvar'].axes]
    print(f'{os.path.basename(out)}: {os.path.getsize(out)} B  axes={axes}')
