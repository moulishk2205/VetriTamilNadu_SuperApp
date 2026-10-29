// Writes CycloneDX SBOMs of the production dependencies to docs/sbom/, read
// from each package-lock.json (what `npm ci --omit=dev` installs in the
// images), and fails if:
//   - any production package in the lockfile is missing from the SBOM, or
//   - any component's licence is missing or not permissive (see allows()),
//     unless it is listed in VERIFIED with the source that was checked.
//   node scripts/sbom.mjs
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { allows } from './spdx.mjs'

/** Packages whose metadata has no licence field, checked by hand. */
const VERIFIED = {
  'passport-strategy@1.0.0': 'MIT (LICENSE file in the package)',
  'pause@0.0.1': 'MIT (Readme.md in the package)',
  'busboy@1.6.0': 'MIT (LICENSE file in the package)',
  'streamsearch@1.1.0': 'MIT (LICENSE file in the package)',
}

const licenceOf = (c) => (c.licenses ?? []).map((l) => l.expression ?? l.license?.id ?? l.license?.name).filter(Boolean)
const isDev = (c) => (c.properties ?? []).some((p) => p.name === 'cdx:npm:package:development' && p.value === 'true')

/** name@version of every production package in a lockfile (v2/v3). */
function productionPackages(lock) {
  const out = new Set()
  for (const [path, p] of Object.entries(lock.packages ?? {})) {
    if (!path || p.link || p.dev || p.devOptional) continue
    out.add(`${p.name ?? path.split('node_modules/').pop()}@${p.version}`)
  }
  return out
}

const root = new URL('..', import.meta.url).pathname
const out = join(root, 'docs', 'sbom')
mkdirSync(out, { recursive: true })

let problems = 0
const fail = (msg) => { console.error(msg); problems++ }
for (const [dir, file] of [['.', 'frontend.cdx.json'], ['backend', 'backend.cdx.json']]) {
  const cwd = join(root, dir)
  const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
  const lock = JSON.parse(readFileSync(join(cwd, 'package-lock.json'), 'utf8'))
  // The full tree, then keep what the lockfile says production installs.
  // npm's own filters are not trusted: `--omit dev` with --package-lock-only
  // leaves out production packages, and a package installed both under a dev
  // tool and under a production dependency is merged and flagged as dev.
  const raw = execFileSync('npm', ['sbom', '--sbom-format', 'cyclonedx', '--package-lock-only'], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const bom = JSON.parse(raw)
  const production = productionPackages(lock)
  const removed = new Set((bom.components ?? []).filter((c) => !production.has(`${c.name}@${c.version}`)).map((c) => c['bom-ref']))
  bom.components = (bom.components ?? [])
    .filter((c) => !removed.has(c['bom-ref']))
    .map((c) => (isDev(c) ? { ...c, properties: c.properties.filter((p) => p.name !== 'cdx:npm:package:development') } : c))
  bom.dependencies = (bom.dependencies ?? [])
    .filter((d) => !removed.has(d.ref))
    .map((d) => ({ ...d, dependsOn: (d.dependsOn ?? []).filter((r) => !removed.has(r)) }))
  // With --package-lock-only npm names the root after the folder; use package.json.
  Object.assign(bom.metadata.component, { name: pkg.name, version: pkg.version })

  const listed = new Set(bom.components.map((c) => `${c.name}@${c.version}`))
  for (const p of production) if (!listed.has(p)) fail(`${file}: production package ${p} is missing from the SBOM`)
  for (const c of bom.components) {
    const id = `${c.name}@${c.version}`
    const exprs = licenceOf(c)
    if (VERIFIED[id]) continue
    if (exprs.length === 0) { fail(`${file}: ${id} has no licence`); continue }
    for (const e of exprs) if (!allows(e)) fail(`${file}: ${id} has licence "${e}"`)
  }
  writeFileSync(join(out, file), JSON.stringify(bom, null, 2) + '\n')
  console.log(`${file}: ${bom.components.length} components`)
}
if (problems) process.exit(1)
