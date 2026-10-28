import { useEffect, useState } from 'react'

export interface Constituency {
  name: string
  d: string
  /** Centroid in map units. */
  c: [number, number]
}
export interface TnMap {
  w: number
  h: number
  state: string
  /** All 235 assembly constituencies. */
  assembly: Constituency[]
}

// Fetched once and shared (~330 KB): kept out of the JS bundle, and every map
// after the first paints from memory.
let cache: TnMap | null = null
let pending: Promise<TnMap> | null = null

function loadTnMap(): Promise<TnMap> {
  pending ??= fetch('/media/tn-assembly.json')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('map unavailable'))))
    .then((data: TnMap) => (cache = data))
  return pending
}

/** The constituency map, or `null` until it has loaded (or if it cannot). */
export function useTnMap(): TnMap | null {
  const [map, setMap] = useState<TnMap | null>(cache)
  useEffect(() => {
    if (map) return
    let live = true
    loadTnMap().then((m) => { if (live) setMap(m) }).catch(() => undefined)
    return () => { live = false }
  }, [map])
  return map
}
