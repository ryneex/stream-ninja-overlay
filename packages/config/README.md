# `@repo/config`

Shared **Oxlint** and **Oxfmt** presets for this starter monorepo. Depend on it from any app or package and extend the entry that matches your stack.

## Install

```sh
pnpm add -D @repo/config
```

(`workspace:*` in this repo.)

Oxlint/Oxfmt are declared here and hoisted via `publicHoistPattern` in root `pnpm-workspace.yaml` (`*oxlint*` / `*oxfmt*`). Apps and packages run `oxlint` / `oxfmt` without re-declaring those deps. Type-aware linting also needs `oxlint-tsgolint` (already a dependency of this package).

## How this repo wires lint/format

- **Root** `oxlint.config.ts` / `oxfmt.config.ts` — run `pnpm lint` / `pnpm format` from the monorepo root. Root Oxlint enables `options.typeAware` and `options.typeCheck` (those options are root-config only).
- **Nested** package configs (`apps/web`, `packages/ui`) — Oxlint/Oxfmt pick these up automatically for files under each package when linting/formatting from root.
- **Package scripts** — `apps/web` and `packages/ui` also expose `lint` / `format` for scoped runs. Package lint scripts pass `--type-aware --type-check` so local runs match root.

## Exports

| Subpath                     | Export        | When to use                                                 |
| --------------------------- | ------------- | ----------------------------------------------------------- |
| `@repo/config/oxlint/base`  | `baseConfig`  | TypeScript only (Node, scripts, non-UI packages).           |
| `@repo/config/oxlint/react` | `reactConfig` | React + Hooks, no Next (e.g. shared UI package).            |
| `@repo/config/oxlint/next`  | `nextConfig`  | Next.js apps (extends react + `nextjs` plugin).             |
| `@repo/config/oxfmt/base`   | `baseConfig`  | Formatting without Tailwind class sorting.                  |
| `@repo/config/oxfmt/react`  | `reactConfig` | Formatting with Tailwind class sorting (`sortTailwindcss`). |

## Oxlint

Add an `oxlint.config.ts` at the package root (same pattern as `apps/web` and `packages/ui`). Prefer `extends` with shared config objects imported from this package.

### Next.js

```ts
// oxlint.config.ts
import { defineConfig } from "oxlint"
import { nextConfig } from "@repo/config/oxlint/next"

export default defineConfig({
  extends: [nextConfig],
})
```

### React (no Next)

```ts
import { reactConfig } from "@repo/config/oxlint/react"

export default reactConfig
```

### TypeScript only

```ts
import { baseConfig } from "@repo/config/oxlint/base"

export default baseConfig
```

For monorepo-wide type-aware linting, set it on the **root** config (as this repo does):

```ts
// oxlint.config.ts (repo root)
import { defineConfig } from "oxlint"
import { baseConfig } from "./packages/config/src/oxlint/base.ts"

export default defineConfig({
  extends: [baseConfig],
  options: {
    typeAware: true,
    typeCheck: true,
  },
})
```

For a package-only run, pass the flags on the script:

```json
{
  "scripts": {
    "lint": "oxlint --type-aware --type-check"
  }
}
```

## Oxfmt

```ts
// oxfmt.config.ts
import { reactConfig } from "@repo/config/oxfmt/react"

export default reactConfig
```

For packages without Tailwind, use:

```ts
import { baseConfig } from "@repo/config/oxfmt/base"

export default baseConfig
```

## Scripts (this package)

| Script             | Description    |
| ------------------ | -------------- |
| `pnpm check-types` | `tsc --noEmit` |

Lint and format for the whole monorepo are run from the **repo root** (`pnpm lint` / `pnpm format`).

## Related

- **`@repo/ts-config`** — shared `tsconfig` bases; this package extends it for its own `tsc`.
