# @voidmix/drizzle-kit

## Purpose

Redistributes drizzle-kit's CLI bundle and `defineConfig` without the unused
prebuilt API and payload bundles.

## Interface

| Path          | Purpose                                      |
| ------------- | -------------------------------------------- |
| `.`           | Upstream `defineConfig` and its declarations |
| `drizzle-kit` | Upstream CLI binary (`dist/bin.cjs`)         |

## Constraints

- `bun run build` copies upstream files from the pinned `drizzle-kit`
  devDependency into `dist/`. Never edit or rebundle them.
- `dependencies` equal upstream's exactly, ranges included, so consumers dedupe
  as they would with drizzle-kit. Tests enforce this.
- The `drizzle-kit` and `drizzle-orm` devDependencies pin the same version.
- To upgrade: bump both devDependencies, copy upstream dependencies, update the
  README version table, add a changeset and run the tests.

## Verification

```bash
bun run --cwd packages/drizzle-kit test
bun run --cwd packages/drizzle-kit check
bun run build --filter=@voidmix/drizzle-kit
bun run --cwd packages/drizzle-kit pack:check
```
