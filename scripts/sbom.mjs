// Writes CycloneDX SBOMs of the production dependencies to docs/sbom/, read
// from each package-lock.json (what `npm ci` installs in the images), and
// fails if any component's licence is missing or outside the permissive list
// below, unless it is listed in VERIFIED with the source that was checked.
//   node scripts/sbom.mjs
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const PERMISSIVE = new Set(['MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', '0BSD', 'BlueOak-1.0.0', 'CC0-1.0'])
/** Packages whose metadata has no licence field, checked by hand. */
const VERIFIED = {
  'passport-strategy@1.0.0': 'MIT (LICENSE file in the package)',
  'pause@0.0.1': 'MIT (Readme.md in the package)',
}

const root = new URL('..', import.meta.url).pathname
const out = join(root, 'docs', 'sbom')
mkdirSync(out, { recursive: true })

let problems = 0
for (const [dir, file] of [['.', 'frontend.cdx.json'], ['backend', 'backend.cdx.json']]) {
  const cwd = join(root, dir)
  const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
  const raw = execFileSync('npm', ['sbom', '--sbom-format', 'cyclonedx', '--omit', 'dev', '--package-lock-only'], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const bom = JSON.parse(raw)
  // With --package-lock-only npm names the root after the folder; use package.json.
  Object.assign(bom.metadata.component, { name: pkg.name, version: pkg.version })
  for (const c of bom.components ?? []) {
    const ids = (c.licenses ?? []).map((l) => l.license?.id ?? l.license?.name ?? l.expression).filter(Boolean)
    const ok = ids.length > 0 && ids.every((id) => id.split(/ OR | AND |[()]/).map((s) => s.trim()).filter(Boolean).some((p) => PERMISSIVE.has(p)))
    if (!ok && !VERIFIED[`${c.name}@${c.version}`]) {
      console.error(`${file}: ${c.name}@${c.version} has licence "${ids.join(' AND ') || 'none'}"`)
      problems++
    }
  }
  writeFileSync(join(out, file), JSON.stringify(bom, null, 2) + '\n')
  console.log(`${file}: ${bom.components?.length ?? 0} components`)
}
if (problems) process.exit(1)
