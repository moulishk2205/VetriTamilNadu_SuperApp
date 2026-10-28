"""Reduce the raw TN shapefile-derived GeoJSON into one compact film asset.

Output: assets/geo.json — every coordinate projected into a 1000-unit-tall plane
(equirectangular, cos(lat0) corrected), polygons simplified with Douglas-Peucker.
"""
import json, math, os

RAW = os.path.join(os.path.dirname(__file__), '..', 'assets', 'geo_raw')
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'geo.json')

state = json.load(open(os.path.join(RAW, 'state.geojson')))


def rings_of(geom):
    if geom['type'] == 'Polygon':
        return [geom['coordinates'][0]]  # outer ring only
    if geom['type'] == 'MultiPolygon':
        return [p[0] for p in geom['coordinates']]
    return []


# bounds from the state outline
lons, lats = [], []
for r in rings_of(state['features'][0]['geometry']):
    for lon, lat in r:
        lons.append(lon); lats.append(lat)
LON0, LON1, LAT0, LAT1 = min(lons), max(lons), min(lats), max(lats)
K = math.cos(math.radians((LAT0 + LAT1) / 2))
SCALE = 1000.0 / (LAT1 - LAT0)
W = (LON1 - LON0) * K * SCALE


def P(lon, lat):
    return ((lon - LON0) * K * SCALE, (LAT1 - lat) * SCALE)


def dp(pts, eps):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]; bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy)
        best, bi = -1, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            d = abs(dy * px - dx * py + bx * ay - by * ax) / L if L > 1e-6 else math.hypot(px - ax, py - ay)
            if d > best:
                best, bi = d, i
        if best > eps:
            keep[bi] = True
            stack.append((a, bi)); stack.append((bi, b))
    return [p for p, k in zip(pts, keep) if k]


def path_of(geom, eps, min_area=0.0):
    parts = []
    for r in rings_of(geom):
        pts = [P(lon, lat) for lon, lat in r]
        if area(pts) < min_area:
            continue
        s = dp(pts, eps)
        if len(s) < 3:
            continue
        parts.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in s) + 'Z')
    return ''.join(parts)


def area(pts):
    a = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2


def centroid(geom):
    best = None
    for r in rings_of(geom):
        pts = [P(lon, lat) for lon, lat in r]
        A = 0; cx = 0; cy = 0
        for i in range(len(pts)):
            x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
            c = x1 * y2 - x2 * y1
            A += c; cx += (x1 + x2) * c; cy += (y1 + y2) * c
        if A == 0:
            continue
        A /= 2
        cand = (abs(A), cx / (6 * A), cy / (6 * A))
        if best is None or cand[0] > best[0]:
            best = cand
    return (round(best[1], 1), round(best[2], 1)) if best else (0, 0)


def load(n):
    return json.load(open(os.path.join(RAW, n + '.geojson')))['features']


out = {'w': round(W, 1), 'h': 1000, 'bounds': [LON0, LAT0, LON1, LAT1], 'k': K, 'scale': SCALE}
out['state'] = path_of(state['features'][0]['geometry'], 0.35, min_area=0.5)

FIX = {'The Nilgiris': 'Nilgiris', 'Tuticorin': 'Thoothukudi', 'Villupuram': 'Viluppuram',
       'Thiruvallur': 'Tiruvallur', 'Thiruvarur': 'Tiruvarur', 'Kanchipuram': 'Kancheepuram'}
out['districts'] = []
for f in load('districts'):
    n = f['properties']['dtname']
    cx, cy = centroid(f['geometry'])
    out['districts'].append({'name': FIX.get(n, n), 'd': path_of(f['geometry'], 0.45, 0.3), 'c': [cx, cy]})
out['districts'].sort(key=lambda d: d['name'])

out['assembly'] = []
for f in load('assembly'):
    p = f['properties']
    if not p.get('AC_NO'):
        continue
    cx, cy = centroid(f['geometry'])
    out['assembly'].append({'no': p['AC_NO'], 'name': p['AC_NAME'], 'dist': p['DIST_NAME'],
                            'd': path_of(f['geometry'], 0.4, 0.05), 'c': [cx, cy]})
out['assembly'].sort(key=lambda a: a['no'])

# high-detail layer for the deep zoom into Chennai (AC 11–26 + neighbours)
def path_hi(geom, eps):
    parts = []
    for r in rings_of(geom):
        pts = dp([P(lon, lat) for lon, lat in r], eps)
        if len(pts) >= 3:
            parts.append('M' + 'L'.join(f'{x:.2f},{y:.2f}' for x, y in pts) + 'Z')
    return ''.join(parts)

out['chennai'] = []
for f in load('assembly'):
    p = f['properties']
    if not p.get('AC_NO'):
        continue
    cx, cy = centroid(f['geometry'])
    if abs(cx - 721) < 40 and abs(cy - 98) < 40:
        out['chennai'].append({'no': p['AC_NO'], 'name': p['AC_NAME'], 'd': path_hi(f['geometry'], 0.012), 'c': [cx, cy]})

out['taluks'] = [path_of(f['geometry'], 0.6, 0.2) for f in load('taluks')]

vil = load('villages')
dnames = [d['name'] for d in out['districts']]
pts = []
for f in vil:
    cx, cy = centroid(f['geometry'])
    pts.append([round(cx, 1), round(cy, 1)])
out['villages'] = pts

json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print('w', out['w'], 'districts', len(out['districts']), 'assembly', len(out['assembly']),
      'taluks', len(out['taluks']), 'villages', len(pts), 'bytes', os.path.getsize(OUT))
print('mylapore', [a for a in out['assembly'] if 'ylapore' in a['name']][0]['c'] if any('ylapore' in a['name'] for a in out['assembly']) else 'not found')
