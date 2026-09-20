/**
 * Build script for dsh-system-power.
 *
 * Emits two artifacts:
 *  - lib/index.js   — the Host Loader entry (ESM, node).
 *  - lib/client.js  — the browser bundle in the shape the DSH client-modules
 *                     system expects: CJS, wrapped in
 *                     `window.__ModuleLoader__.load({ id, factory })`, with
 *                     the shared platform modules left external so they
 *                     resolve through the runtime module table.
 */

import { build } from 'esbuild'
import { mkdirSync, readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const id = pkg.name

// Shared platform modules seeded by the DSH web shell. They must stay
// external: the runtime module table supplies them, and bundling a second
// copy would break React's shared identity.
const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

mkdirSync('lib', { recursive: true })

// Browser half: the client-modules bundle contract.
await build({
  entryPoints: ['src/client/index.ts'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2020'],
  jsx: 'automatic',
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  external: PLATFORM_MODULES,
  banner: {
    js: [
      'var module = { exports: {} };',
      'var exports = module.exports;',
      `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
    ].join('\n'),
  },
  footer: {
    js: 'return module.exports; } });',
  },
})

// Host half: the Loader entry (types-only imports, so effectively empty).
await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  external: ['@deepseek-ai/cordis'],
})

console.log(`[dsh-system-power] built lib/index.js and lib/client.js (${id})`)
