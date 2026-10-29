# Licence register

**Declaration.** Running VETRI needs no paid licence or subscription. Every
component that ships, from npm packages to container images, is under an
open-source licence with no fee. The exceptions to watch are listed under
"Things to avoid".

VETRI's own source code is covered by [LICENSE](../LICENSE). Third-party
attributions are in [NOTICE](../NOTICE).

## Software bill of materials (SBOM)

| File | Covers | Components |
|---|---|---|
| [sbom/frontend.cdx.json](sbom/frontend.cdx.json) | Web portal production dependencies (bundled into the page) | 41 |
| [sbom/backend.cdx.json](sbom/backend.cdx.json) | API production dependencies | 275 |

Both files are CycloneDX 1.5. They list every package that each
`package-lock.json` marks as production, which is what `npm ci --omit=dev`
installs. They also list optional, platform-specific packages; npm installs
those only on a matching machine, such as the macOS or Windows builds of
msgpackr-extract. Every package installed in the API image (269 on linux/arm64)
is in the backend file. To regenerate them, run:

```bash
npm run sbom
```

The script fails in three cases:
- A production package in the lockfile is missing from the SBOM.
- A component has no licence.
- A component's licence expression is not permissive.

The permissive list is MIT, ISC, Apache-2.0, BSD-2/3-Clause, 0BSD,
BlueOak-1.0.0, CC0-1.0 and Python-2.0. In an expression, `AND` needs every
licence to be on the list, and `OR` needs one.

| Licence | Frontend | Backend |
|---|---|---|
| MIT | 33 | 215 |
| ISC | 8 | 32 |
| Apache-2.0 | 0 | 14 |
| BSD-3-Clause | 0 | 5 |
| BSD-2-Clause | 0 | 3 |
| 0BSD | 0 | 1 |
| Python-2.0 (PSF licence, permissive; `argparse`) | 0 | 1 |
| Checked by hand (metadata has no licence field) | 0 | 4 |

The four backend packages checked by hand are all MIT:
- `passport-strategy@1.0.0`: per the LICENSE file in the package.
- `pause@0.0.1`: per the Readme in the package.
- `busboy@1.6.0`: per the LICENSE file in the package.
- `streamsearch@1.1.0`: per the LICENSE file in the package.

## Container images and services

| Component | Image | Licence |
|---|---|---|
| Web server | `nginxinc/nginx-unprivileged:1.27-alpine` | nginx: BSD-2-Clause |
| API runtime | `node:22-alpine` | Node.js: MIT |
| Database | `postgres:16-alpine` | PostgreSQL Licence (permissive) |
| Cache / queue store | `valkey/valkey:8.1-alpine` | Valkey: BSD-3-Clause |
| Base OS of all images | Alpine Linux | Package licences vary, e.g. musl (MIT) and BusyBox (GPL-2.0). All are used unmodified, with no fee. |

**Valkey replaces Redis.**
- Redis 7.4 and the later 7.x releases are under RSALv2/SSPLv1, which is not
  open source.
- Redis 8 added AGPLv3 as a third option. AGPLv3 is a copyleft licence with
  network-use obligations.
- Valkey is the Linux Foundation fork. It speaks the same protocol and is
  BSD-3-Clause, with no copyleft or network-use obligations.

The compose service is still called `redis`, so configuration did not change.

## Fonts

Fonts are self-hosted from `public/fonts` and never fetched from a third
party.
- Inter: SIL Open Font License 1.1.
- Noto Sans Tamil and Noto Serif Tamil: SIL Open Font License 1.1.

## Container runtime

The compose files run on **Docker Engine** (Moby, Apache-2.0) with the Compose
plugin (Apache-2.0). Neither has a fee.

Production hosts do not need Docker Desktop. Its free tier excludes larger
organisations, so a Government deployment would otherwise need a paid
subscription.

**Podman** (Apache-2.0) is the other no-fee option. It has not been tested with
these compose files.

## Things to avoid

| Component | Why |
|---|---|
| `redis:7.4`+ images | RSALv2/SSPLv1; Redis 8+ adds an AGPLv3 (copyleft) option |
| Camunda 8 | Needs a paid production licence |
| Docker Desktop on servers | Needs a paid subscription at TNeGA's size |
