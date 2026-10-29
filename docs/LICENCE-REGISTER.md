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
| [sbom/frontend.cdx.json](sbom/frontend.cdx.json) | Web portal production dependencies | 27 |
| [sbom/backend.cdx.json](sbom/backend.cdx.json) | API production dependencies | 129 |

Both files are CycloneDX 1.5. They are generated from each `package-lock.json`,
which is exactly what `npm ci` installs in the container images. To regenerate
them, run:

```bash
npm run sbom
```

The script fails if a component has no licence, or has one outside the
permissive list: MIT, ISC, Apache-2.0, BSD-2/3-Clause, 0BSD, BlueOak-1.0.0 or
CC0-1.0.

| Licence | Frontend | Backend |
|---|---|---|
| MIT | 20 | 88 |
| ISC | 7 | 22 |
| Apache-2.0 | 0 | 12 |
| BSD-3-Clause | 0 | 3 |
| BSD-2-Clause | 0 | 2 |
| Checked by hand (metadata has no licence field) | 0 | 2 |

The two backend packages checked by hand are both MIT:
- `passport-strategy@1.0.0`: MIT, per the LICENSE file in the package.
- `pause@0.0.1`: MIT, per the Readme in the package.

## Container images and services

| Component | Image | Licence |
|---|---|---|
| Web server | `nginxinc/nginx-unprivileged:1.27-alpine` | nginx: BSD-2-Clause |
| API runtime | `node:22-alpine` | Node.js: MIT |
| Database | `postgres:16-alpine` | PostgreSQL Licence (permissive) |
| Cache / queue store | `valkey/valkey:8.1-alpine` | Valkey: BSD-3-Clause |
| Base OS of all images | Alpine Linux | Package licences vary, e.g. musl (MIT) and BusyBox (GPL-2.0). All are used unmodified, with no fee. |

**Valkey replaces Redis.** Redis 7.4 and later is licensed under RSALv2/SSPLv1,
which is not open source. Valkey is the Linux Foundation fork and speaks the
same protocol. The compose service is still called `redis`, so configuration
did not change.

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
| `redis:7.4`+ images | RSALv2/SSPLv1 |
| Camunda 8 | Needs a paid production licence |
| Docker Desktop on servers | Needs a paid subscription at TNeGA's size |
