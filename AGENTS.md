# Web 3DS

TypeScript SDK for client-side 3D Secure session management and challenge handling.

## Build & Test

```bash
yarn install
yarn build                              # prepare.js + generateTypes + parcel build
yarn test                               # Jest unit tests
yarn lint                               # ESLint
npx jest --testPathPattern="<pattern>"  # Targeted test
yarn test:coverage                      # Tests with coverage
```

Always verify fixes with targeted tests before considering done.

## Project Structure

- `src/` — Library source (TypeScript)
- `src/pages/` — HTML pages (method.html, challenge.html) — bundled into dist
- `tests/` — Unit tests (Jest + jsdom)
- `terraform/` — Infrastructure for CDN deployment (DO NOT apply locally)
- `scripts/prepare.js` — Creates dist/package.json and copies HTML pages to dist

## Gotchas

- **Parcel bundler** (not Webpack/Vite): Configured via `"targets"` in `package.json`. Outputs: `dist/main/` (CJS), `dist/module/` (ESM), `dist/types/` (declarations), `dist/bundle/` (browser global).
- **4 build targets**: `main` (CJS lib), `module` (ESM lib), `types` (declarations via tsc), `bundle` (browser global, optimized). All configured in package.json `"targets"`.
- **HTML pages are part of the package**: `src/pages/method.html` and `src/pages/challenge.html` are copied to dist by `prepare.js`. Don't move them.
- **`prepare.js` is critical**: Creates dist/package.json, copies HTML pages. Runs as first step of `yarn build`.
- **CDN bundle deployment**: Release uploads a browser bundle to Cloudflare R2 via `scripts/uploadbundle.sh`. The terraform dir manages R2 infrastructure.
- **Size limits**: `size-limit` configured in package.json — main and module targets must be under 5KB each.
- **Husky git hooks**: `husky install` runs on `prepare`. CI disables with `HUSKY=0`.
- **`yarn` not `npm`**: Uses yarn + yarn.lock.
- **Version in package.json**: CI bumps via `make update-version` before publish.
- **Release triggered by GitHub Release**: Not on push to master.
- **Terraform dir**: DO NOT run terraform apply locally. It manages prod CDN infrastructure.

## Release

Triggered by GitHub Release. CI: terraform apply (CDN infra) -> bump version -> build -> npm publish -> upload CDN bundle to R2 -> commit version back to master. Published as `@basis-theory/web-threeds`.

## Docs

- [3D Secure](https://developers.basistheory.com/docs/features/3d-secure/)
