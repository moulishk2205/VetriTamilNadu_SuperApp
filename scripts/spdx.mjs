/** Permissive licences: no copyleft, no fee. Python-2.0 is the PSF licence (argparse). */
export const PERMISSIVE = new Set(['MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', '0BSD', 'BlueOak-1.0.0', 'CC0-1.0', 'Python-2.0'])

/**
 * Whether an SPDX licence expression is acceptable: an id must be permissive,
 * AND needs both sides acceptable, OR needs one (AND binds tighter). WITH adds
 * an exception, which only grants extra permissions, so it is judged by the
 * licence before it. Malformed expressions throw.
 */
export function allows(expression) {
  const tokens = expression.match(/\(|\)|[^\s()]+/g) ?? []
  let i = 0
  const primary = () => {
    const t = tokens[i++]
    if (t === '(') {
      const v = or()
      if (tokens[i++] !== ')') throw new Error(`unbalanced: ${expression}`)
      return v
    }
    if (!t || /^(AND|OR|WITH|\))$/.test(t)) throw new Error(`unexpected "${t ?? 'end'}" in: ${expression}`)
    if (tokens[i] === 'WITH') {
      if (!tokens[i + 1] || /^(AND|OR|WITH|\(|\))$/.test(tokens[i + 1])) throw new Error(`WITH needs an exception in: ${expression}`)
      i += 2
    }
    return PERMISSIVE.has(t)
  }
  const and = () => { let v = primary(); while (tokens[i] === 'AND') { i++; const r = primary(); v = v && r } return v }
  const or = () => { let v = and(); while (tokens[i] === 'OR') { i++; const r = and(); v = v || r } return v }
  const v = or()
  if (i !== tokens.length) throw new Error(`trailing tokens in: ${expression}`)
  return v
}
