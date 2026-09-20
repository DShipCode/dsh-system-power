/**
 * Type-level merge for the plugin's `systemPower` Remote namespace.
 *
 * Mirrors the generated `typert.remote-client.d.ts` of the built-in
 * settings-controller: augmenting `TypertRemoteNamespaceMap` makes
 * `ctx.remote.systemPower` typed on the client Context, and `TypertRemoteMap`
 * backs the flat endpoint surface. Type-only — erased at build time.
 */

import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespace$systemPower {
    shutdown: () => Promise<RemoteResult<{ readonly shuttingDown: true }>>
    restart: () => Promise<RemoteResult<{ readonly restarting: true }>>
  }

  interface TypertRemoteMap {
    'systemPower/shutdown': () => Promise<RemoteResult<{ readonly shuttingDown: true }>>
    'systemPower/restart': () => Promise<RemoteResult<{ readonly restarting: true }>>
  }

  interface TypertRemoteNamespaceMap {
    'systemPower': TypertRemoteNamespace$systemPower
  }
}
