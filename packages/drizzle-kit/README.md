# @voidmix/drizzle-kit

[drizzle-kit](https://orm.drizzle.team/docs/kit-overview)'s command line and
`defineConfig`, without the prebuilt programmatic API and payload bundles that
make up most of the upstream package. Installed size drops from about 101 MB to
about 7 MB; the dependencies are the same.

```sh
bun add -d @voidmix/drizzle-kit drizzle-orm@1.0.0-rc.5-5935859
```

The files are upstream's, byte for byte. Each release pins one drizzle-kit
version; install the matching `drizzle-orm`.

| @voidmix/drizzle-kit | drizzle-kit          |
| -------------------- | -------------------- |
| `0.0.0-alpha.0`      | `1.0.0-rc.5-5935859` |

## Usage

The binary keeps its name, so scripts do not change:

```sh
drizzle-kit generate --config drizzle.config.ts
```

Import `defineConfig` from this package:

```ts
import { defineConfig } from "@voidmix/drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
});
```

To keep `import "drizzle-kit"` unchanged, install under that name with an alias
instead: `"drizzle-kit": "npm:@voidmix/drizzle-kit@0.0.0-alpha.0"`.

## What is omitted

Every CLI command (`generate`, `migrate`, `push`, `pull`, `check`, `up`,
`export`, `studio`, `skills`, `mcp`) ships in the CLI bundle, with the agent
skills it serves. The `drizzle-kit/api-*` and `drizzle-kit/payload/*` entries are
not included; use upstream drizzle-kit for programmatic migrations.

## License

MIT, as declared by upstream drizzle-kit. See [LICENSE](LICENSE).
