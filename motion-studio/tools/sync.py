"""Sound-picture sync audit.

python3 tools/sync.py out/draft1.mp4  →  out/sync.json + out/sync.svg
- audio onset strength (spectral flux) from audio/score.wav
- picture change energy (mean abs frame difference) from the rendered video
- for every scheduled cue (film/cues.json) and picture event (film/beats.json) report offsets
"""
import json, subprocess, sys, wave, os
import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
vid = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'out', 'draft1.mp4')
FILM = sys.argv[2] if len(sys.argv) > 2 else 'film'
TAG = '' if FILM == 'film' else '2'

# audio onset strength
with wave.open(os.path.join(ROOT, 'audio', f'score{TAG}.wav')) as w:
    sr = w.getframerate(); n = w.getnframes(); ch = w.getnchannels()
    a = np.frombuffer(w.readframes(n), dtype=np.int16).reshape(-1, ch).mean(axis=1) / 32768
hop = 480  # 10 ms
f, t, Z = signal.stft(a, sr, nperseg=2048, noverlap=2048 - hop)
mag = np.log1p(np.abs(Z) * 50)
flux = np.maximum(0, np.diff(mag, axis=1)).sum(axis=0)
flux = np.concatenate([[0], flux])
flux /= flux.max() or 1
peaks, _ = signal.find_peaks(flux, height=0.18, distance=8)
onsets = [(float(t[p]), float(flux[p])) for p in peaks]
rms = np.sqrt(signal.convolve(a ** 2, np.ones(hop * 5) / (hop * 5), mode='same'))[::hop]

# picture change energy
W, H = 192, 108
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', vid, '-vf', f'scale={W}:{H},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H, W).astype(np.float32)
fps = 30.0
diff = np.concatenate([[0], np.abs(np.diff(frames, axis=0)).mean(axis=(1, 2))])
diff /= diff.max() or 1
vt = np.arange(len(diff)) / fps

cues = json.load(open(os.path.join(ROOT, FILM, 'cues.json')))['cues']
ev = json.load(open(os.path.join(ROOT, FILM, 'beats.json')))['events']
big = [c for c in cues if c['type'] in ('sub', 'stamp')]
rep = {'note': 'big_hits: for each sub/stamp, the frame of PEAK picture motion energy (mean abs frame difference) within ±0.3 s. offset_ms = peak-motion time minus hit time (+ = motion after the sound). Hits are deliberately placed on LANDINGS (where a move or fade ends), and peak motion energy falls mid-move, so an offset of about −100 to −250 ms means the hit lands as the motion settles, which is correct. strength is normalised to the film maximum (1.0 = the cut at 10 s); < 0.05 means no real picture change nearby (the hit marks a held beat).', 'onsets': onsets[:200], 'big_hits': [], 'events': {}}
for c in big:   # the strongest picture change within ±0.3 s of each hit: where it is (offset_ms, + = picture after sound) and how strong (0–1, film max = 1)
    k = int(round(c['t'] * fps)); lo = max(0, k - 9); win = diff[lo:k + 10]
    j = int(np.argmax(win)) if len(win) else 0
    rep['big_hits'].append({'t': c['t'], 'type': c['type'], 'peak_picture_change_offset_ms': round(((lo + j) / fps - c['t']) * 1000), 'peak_picture_change_strength': round(float(win[j]) if len(win) else 0, 3)})
for name, tv in ev.items():
    near = min(onsets, key=lambda o: abs(o[0] - tv)) if onsets else (None, 0)
    rep['events'][name] = {'t': tv, 'nearest_onset': round(near[0], 3) if near[0] is not None else None, 'offset_ms': round((near[0] - tv) * 1000) if near[0] is not None else None}
json.dump(rep, open(os.path.join(ROOT, 'out', f'sync{TAG}.json'), 'w'), indent=1)

# svg plot: audio flux (gold), rms (grey), picture change (crimson), event markers
Wp, Hp, D = 2400 if FILM == 'film' else 3600, 520, 20.0 if FILM == 'film' else 60.0
X = lambda s: 40 + s / D * (Wp - 80)
def poly(xs, ys, base, scale):
    return ' '.join(f'{X(x):.1f},{base - y * scale:.1f}' for x, y in zip(xs, ys))
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{Wp}" height="{Hp}" style="background:#111">']
for b in range(0, 33 if FILM == 'film' else 97):
    x = X(b * 0.625); svg.append(f'<line x1="{x}" y1="20" x2="{x}" y2="{Hp-20}" stroke="{"#555" if b % 4 == 0 else "#2a2a2a"}" />')
for name, tv in ev.items():
    x = X(tv); svg.append(f'<line x1="{x}" y1="20" x2="{x}" y2="{Hp-20}" stroke="#3b82f6" stroke-opacity=".35"/><text x="{x+2}" y="{14 + (hash(name) % 5) * 10}" fill="#60a5fa" font-size="9" font-family="monospace">{name}</text>')
svg.append(f'<polyline fill="none" stroke="#9ca3af" stroke-width="1" points="{poly(np.arange(len(rms)) * hop / sr, rms / (rms.max() or 1), 250, 200)}"/>')
svg.append(f'<polyline fill="none" stroke="#D4A843" stroke-width="1.4" points="{poly(t, flux, 250, 200)}"/>')
svg.append(f'<polyline fill="none" stroke="#e11d48" stroke-width="1.4" points="{poly(vt, diff, 500, 220)}"/>')
svg.append('<text x="44" y="240" fill="#D4A843" font-size="12" font-family="monospace">audio onset flux (gold) · rms (grey)</text><text x="44" y="490" fill="#e11d48" font-size="12" font-family="monospace">picture change energy</text></svg>')
open(os.path.join(ROOT, 'out', f'sync{TAG}.svg'), 'w').write('\n'.join(svg))
print('onsets', len(onsets))
for h in rep['big_hits']:
    print(f"hit {h['t']:6.3f} {h['type']:6s} picture_change={h['picture_change_near']}")
