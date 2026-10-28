"""Synthesized score + SFX for the Vetri film, rendered from a cue sheet.

    python3 audio/synth.py            → audio/score_raw.wav, then ffmpeg loudnorm → audio/score.wav (−14 LUFS)

Every sound is generated here (no samples). Cues live in film/cues.json:
    {"bpm": 96, "dur": 20, "cues": [{"t": 0.0, "type": "sub", ...params}, ...]}
"""
import json, os, subprocess, sys
import numpy as np
from scipy import signal

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(7)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def env_adsr(n, a=0.005, d=0.1, s=0.0, r=0.2, total=None):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    total = total or n
    e = np.zeros(total)
    e[:a] = np.linspace(0, 1, a, endpoint=False) if a else 0
    e[a:a + d] = np.linspace(1, s, d, endpoint=False)
    sus_end = max(a + d, total - r)
    e[a + d:sus_end] = s
    e[sus_end:] = np.linspace(e[sus_end - 1] if sus_end > 0 else s, 0, total - sus_end)
    return e


def exp_env(d, tau):
    t = t_axis(d)
    return np.exp(-t / tau)


def lp(x, fc, order=2):
    b, a = signal.butter(order, min(fc, SR / 2 - 100) / (SR / 2), 'low')
    return signal.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def bp(x, f1, f2, order=2):
    b, a = signal.butter(order, [f1 / (SR / 2), min(f2, SR / 2 - 100) / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def sweep_filter(x, f0, f1, q=0.7, steps=64, kind='low'):
    """time-varying filter via block processing with state carry (smooth enough at 64 steps)."""
    out = np.zeros_like(x)
    n = len(x)
    blk = int(np.ceil(n / steps))
    zi = None
    for i in range(steps):
        s, e = i * blk, min(n, (i + 1) * blk)
        if s >= n:
            break
        fc = f0 * (f1 / f0) ** (i / max(1, steps - 1))
        fc = np.clip(fc, 30, SR / 2 - 200)
        b, a = signal.butter(2, fc / (SR / 2), kind)
        if zi is None:
            zi = signal.lfilter_zi(b, a) * x[s]
        out[s:e], zi = signal.lfilter(b, a, x[s:e], zi=zi)
    return out


def pan(x, p):  # p in [-1, 1], equal power
    th = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)])


# ── instruments ──────────────────────────────────────────────────────────────

def sub(d=2.2, f0=58, f1=34, gain=1.0, click=0.5):
    """cinematic low impact: pitch-dropping sine + soft transient."""
    t = t_axis(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / (d * 0.38))
    body += 0.35 * np.sin(2 * ph) * np.exp(-t / 0.25)
    tr = lp(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.012) * click
    x = np.tanh(1.6 * (body + tr)) * gain
    return pan(x, 0)


def boom_air(d=3.0, gain=0.5):
    """wide air/rumble tail that follows an impact."""
    t = t_axis(d)
    n = rng.standard_normal((2, len(t)))
    x = np.stack([lp(n[0], 260, 2), lp(n[1], 260, 2)]) * np.exp(-t / (d * 0.3)) * gain * 2.2
    return x


def tick(f=3200, d=0.05, gain=0.25, p=0.0):
    t = t_axis(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006)
    x += 0.5 * bp(rng.standard_normal(len(t)), f * 0.8, f * 1.6) * np.exp(-t / 0.004)
    return pan(x * gain, p)


def data_stream(d=1.2, rate=28, f=(2400, 5200), gain=0.12, p_spread=0.7, seed=1, accel=0.0):
    """granular ticks (digital texture); rate in grains/sec, optional acceleration."""
    r = np.random.default_rng(seed)
    out = np.zeros((2, int(d * SR) + SR // 10))
    tt = 0.0
    while tt < d:
        ff = r.uniform(*f)
        g = gain * r.uniform(0.4, 1.0) * (0.6 + 0.4 * np.sin(np.pi * tt / d))
        s = tick(ff, 0.03, g, r.uniform(-p_spread, p_spread))
        i = int(tt * SR)
        out[:, i:i + s.shape[1]] += s[:, :out.shape[1] - i]
        cur = rate * (1 + accel * tt / d)
        tt += r.exponential(1 / cur)
    return out


def whoosh(d=0.9, f0=300, f1=4000, gain=0.35, p0=-0.6, p1=0.6, peak=0.6):
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    x = sweep_filter(n, f0, f1, kind='low')
    x = hp(x, 120)
    pk = peak
    e = np.where(t / d < pk, (t / (d * pk)) ** 2.2, np.exp(-(t / d - pk) / 0.12))
    x = x * e * gain * 2.5
    # moving pan
    pp = np.linspace(p0, p1, len(t))
    th = (pp + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)])


def riser(d=2.0, f0=200, f1=2400, gain=0.25, tone=None):
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    x = sweep_filter(n, f0, f1, kind='low') * (t / d) ** 2.5
    if tone:
        f = tone * (1 + 0.5 * (t / d) ** 2)
        x += 0.25 * np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / d) ** 2
    x = x * gain * 2
    return np.stack([x * 0.9, x])


def reverse_swell(d=1.0, f=220, gain=0.3):
    t = t_axis(d)
    x = sum(np.sin(2 * np.pi * f * k * t) / k for k in (1, 2, 3, 5)) * (t / d) ** 3
    x = lp(x, 2500)
    n = min(len(x), int(0.025 * SR)); x[-n:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, n))   # a 25 ms release: never ends at full amplitude
    return pan(x * gain, 0)


def pluck(f=440, d=1.6, gain=0.3, p=0.0, bright=1.0):
    """glassy confirmation tone (FM bell-ish)."""
    t = t_axis(d)
    mod = np.sin(2 * np.pi * f * 2.0 * t) * 1.4 * bright * np.exp(-t / 0.15)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / 0.55)
    x += 0.3 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t / 0.12)
    x *= env_adsr(len(t), 0.002, 0.05, 1.0, 0.05)
    return pan(x * gain, p)


def chord_pad(freqs, d=4.0, gain=0.18, a=1.2, r=1.5, detune=0.004, cutoff=1600):
    t = t_axis(d)
    x = np.zeros(len(t))
    for f in freqs:
        for k, dt in enumerate((-detune, 0, detune)):
            ph = rng.uniform(0, 2 * np.pi)
            saw = signal.sawtooth(2 * np.pi * f * (1 + dt) * t + ph)
            x += saw * (0.5 if k == 1 else 0.3)
    x = lp(x, cutoff, 2)
    x *= env_adsr(len(t), a, 0.3, 0.85, r)
    x = x / (len(freqs) * 1.1) * gain
    l = x + 0.0
    rr = np.roll(x, int(0.011 * SR))
    return np.stack([l, rr])


def pulse(f=55, d=0.4, gain=0.5):
    """low heartbeat pulse for the beat grid."""
    t = t_axis(d)
    ph = 2 * np.pi * (f + 25 * np.exp(-t / 0.03)) * t
    x = np.sin(ph) * np.exp(-t / 0.12)
    x = np.tanh(1.3 * x)
    return pan(x * gain, 0)


def drone(f=36.7, d=20.0, gain=0.1, cutoff=180):
    t = t_axis(d)
    x = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2 * t + 0.3) + 0.15 * np.sin(2 * np.pi * f * 3.01 * t)
    x = lp(x, cutoff)
    x *= env_adsr(len(t), min(1.0, d * 0.2), 0.0, 1.0, min(1.6, d * 0.3))
    return pan(x * gain, 0)


def stamp(gain=0.6):
    """the 'Approve & Issue' seal: dull thud + bright glass."""
    a = sub(0.9, 120, 60, gain * 0.8, click=1.0)
    b = pluck(1318.5, 1.2, gain * 0.35, 0, 0.6)
    n = max(a.shape[1], b.shape[1])
    out = np.zeros((2, n)); out[:, :a.shape[1]] += a; out[:, :b.shape[1]] += b
    return out


def type_keys(text_len=12, d=0.6, gain=0.12, seed=3):
    r = np.random.default_rng(seed)
    out = np.zeros((2, int(d * SR) + SR // 5))
    for i in range(text_len):
        tt = i * d / text_len + r.uniform(-0.01, 0.01)
        s = tick(r.uniform(1800, 2600), 0.04, gain * r.uniform(0.6, 1), r.uniform(-0.15, 0.15))
        k = int(max(0, tt) * SR)
        out[:, k:k + s.shape[1]] += s[:, :out.shape[1] - k]
    return out


def air(d=2.0, gain=0.005):
    t = t_axis(d)
    n = rng.standard_normal((2, len(t)))
    x = np.stack([bp(n[0], 200, 3000), bp(n[1], 200, 3000)]) * gain
    e = env_adsr(len(t), 0.6, 0.0, 1.0, 0.5)
    return x * e


def kick(d=0.45, gain=0.3, f=55):
    """soft felt kick: pitched body with 2nd/3rd harmonics + a short click, so it carries on a hall PA."""
    t = t_axis(d)
    fr = f + 60 * np.exp(-t / 0.025)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    body = (np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.22 * np.sin(3 * ph)) * np.exp(-t / 0.13)
    clk = bp(rng.standard_normal(len(t)), 1800, 5000) * np.exp(-t / 0.004) * 0.35
    x = np.tanh(1.4 * (body + clk))
    return pan(x * gain, 0)


INSTR = dict(kick=kick, air=air, sub=sub, boom_air=boom_air, tick=tick, data_stream=data_stream, whoosh=whoosh, riser=riser,
             reverse_swell=reverse_swell, pluck=pluck, chord_pad=chord_pad, pulse=pulse, drone=drone,
             stamp=stamp, type_keys=type_keys)


def reverb(x, decay=2.2, mix=0.22, predelay=0.02, damp=6000):
    """synthetic stereo IR (exponentially decaying filtered noise) convolution."""
    n = int(decay * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-t * 6.9 / decay)
    ir = np.stack([lp(ir[0], damp), lp(ir[1], damp)])
    ir[:, :int(predelay * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    wet = np.stack([signal.fftconvolve(x[0], ir[0])[:x.shape[1]], signal.fftconvolve(x[1], ir[1])[:x.shape[1]]])
    return x * (1 - mix) + wet * mix * 1.4


def render(cfile, out_raw):
    cfg = json.load(open(cfile))
    dur = cfg.get('dur', 20.0)
    tail = 1.5
    N = int((dur + tail) * SR)
    dry = np.zeros((2, N))
    send = np.zeros((2, N))
    for c in cfg['cues']:
        c = dict(c)
        t0 = c.pop('t'); typ = c.pop('type')
        rv = c.pop('rev', 0.4)
        x = INSTR[typ](**c)
        nf = min(x.shape[1], int(0.04 * SR)); x[:, -nf:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, nf))   # every cue ends with a 40 ms release: no truncation ticks
        i = int(t0 * SR)
        if i >= N:
            continue
        m = min(N - i, x.shape[1])
        dry[:, i:i + m] += x[:, :m]
        send[:, i:i + m] += x[:, :m] * rv
    wet = reverb(send, decay=cfg.get('reverb', 2.4), mix=1.0)
    mix = dry + wet * 0.55
    # master: gentle glue compression (RMS envelope) + soft clip; fade the very end
    env = np.sqrt(lp(np.mean(mix ** 2, axis=0), 8) + 1e-9)
    thr = 0.25
    gain = np.where(env > thr, (thr / env) ** 0.35, 1.0)
    mix = mix * gain
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    fade = int(0.4 * SR)
    end = int((dur + tail) * SR)
    mix[:, end - fade:end] *= np.linspace(1, 0, fade)
    mix = mix[:, :int(dur * SR)] if cfg.get('trim', True) else mix
    fo = int(1.2 * SR)                     # fade to zero with the picture (58.8 → 60)
    mix[:, -fo:] *= np.linspace(1, 0, fo) ** 1.5
    pk = np.max(np.abs(mix)) or 1
    mix = mix / pk * 0.89
    import wave
    data = (mix.T * 32767).astype(np.int16)
    with wave.open(out_raw, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())


def loudnorm(src, dst, target=-14.0):
    """Deterministic master: soft pre-limit, measure integrated loudness, apply exact gain,
    then a final peak limiter at -1.5 dBFS (oversampled). Iterates once to land on target."""
    def measure(af):
        p = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', af + ',ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
        tail = p.stderr[p.stderr.rfind('Summary:'):]
        I = float(tail.split('I:')[1].split('LUFS')[0])
        return I, tail
    gain = 0.0
    for _ in range(3):
        af = f'alimiter=limit=0.6:attack=3:release=80:level=disabled,volume={gain:.3f}dB,aresample=192000,alimiter=limit=0.841:attack=1:release=40:level=disabled,aresample={SR}'
        I, tail = measure(af)
        if abs(I - target) < 0.15:
            break
        gain += target - I
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', src, '-af', af, '-ar', str(SR), dst], check=True)
    p3 = subprocess.run(['ffmpeg', '-hide_banner', '-i', dst, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
    print(p3.stderr[p3.stderr.rfind('Summary:'):].strip())


if __name__ == '__main__':
    film = sys.argv[1] if len(sys.argv) > 1 else 'film'
    tag = '' if film == 'film' else '2'
    cues = os.path.join(ROOT, film, 'cues.json')
    raw = os.path.join(ROOT, 'audio', f'score{tag}_raw.wav')
    render(cues, raw)
    loudnorm(raw, os.path.join(ROOT, 'audio', f'score{tag}.wav'))
