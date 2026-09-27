// Vitest test-only stand-in for the `server-only` package.
//
// `server-only` is not a dependency of this project - Next's own webpack/turbopack build aliases
// the bare `"server-only"` specifier straight to its internally bundled copy (see
// `node_modules/next/dist/build/webpack-config.js`), and the real npm package is only declared as
// a `devDependency` of `next` itself (never installed transitively into a consumer's
// `node_modules`). Outside Next's bundler - i.e. under Vitest - there is nothing to alias it to,
// so every module doing `import "server-only"` (e.g. `@/lib/api/product-detail`) needs this no-op
// stand-in (wired up in `vitest.workspace.ts` / `vitest.config.mts`) to be importable from a test.
export {}
