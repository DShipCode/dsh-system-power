/**
 * dsh-system-power — Host Loader entry.
 *
 * Registers a self-contained `systemPower` Typert Remote namespace that the
 * browser half mounts and calls. Stock DSH has no power control on the
 * Settings page, so this plugin ships its own host capability: the shutdown /
 * restart implementations live here, inside the plugin, and work on a clean
 * DSH install with no source edits.
 *
 * The Typert Remote surface is declared without the protocol package's
 * compiler decorators: the `typertRemote` binding and the `@Remote` method
 * markers are written by hand (the marker key is a plain string, so no
 * runtime dependency on the protocol package is needed).
 */

import { spawn } from 'node:child_process'
import type { Context } from '@deepseek-ai/cordis'

/** Prototype marker key written by the protocol package's @Remote decorator. */
const REMOTE_METHOD_DESCRIPTOR = '@deepseek-ai/dsh-typert-protocol/remote-methods'

/** Cordis service key that owns the process lifecycle. */
const SERVICE_KEY = 'systemPowerController'

/** Wire namespace exported to the browser half. */
const NAMESPACE = 'systemPower'

/** Typert Remote binding consumed by the Gateway's source-mode discovery. */
export interface SystemPowerBinding {
  /** Owning Service instance. */
  readonly service: object
  /** Exact Cordis service key. */
  readonly serviceKey: string
  /** Wire namespace. */
  readonly namespace: string
}

/**
 * Host process power control. The methods acknowledge the request first and
 * act after a short delay so the RPC response can flush; restart spawns a
 * detached copy of the current command (never auto-opening a browser: the
 * existing tab reloads itself) and then exits.
 */
class SystemPowerController {
  /** Visible binding consumed by the Gateway's source-mode discovery. */
  readonly typertRemote: SystemPowerBinding

  constructor() {
    this.typertRemote = Object.freeze({
      service: this,
      serviceKey: SERVICE_KEY,
      namespace: NAMESPACE,
    })
  }

  /** Shut the host process down. */
  shutdown(): { readonly shuttingDown: true } {
    setTimeout(() => { process.exit(0) }, 300).unref()
    return { shuttingDown: true }
  }

  /** Restart the host process with the same command line. */
  restart(): { readonly restarting: true } {
    // Never auto-open a browser on relaunch: the existing tab reloads itself.
    const args = [...process.execArgv, ...process.argv.slice(1)]
    if (!args.includes('--no-open')) args.push('--no-open')
    const child = spawn(
      process.execPath,
      args,
      { detached: true, stdio: 'ignore', cwd: process.cwd(), env: process.env },
    )
    child.unref()
    setTimeout(() => { process.exit(0) }, 300).unref()
    return { restarting: true }
  }
}

// Hand-applied @Remote markers, equivalent to decorating both methods with
// `@Remote` from @deepseek-ai/dsh-typert-protocol (see its `mark()` helper).
Object.defineProperty(SystemPowerController.prototype, REMOTE_METHOD_DESCRIPTOR, {
  configurable: true,
  value: Object.freeze({
    version: 1,
    methods: Object.freeze([
      Object.freeze({ method: 'shutdown', invocation: Object.freeze({ kind: 'direct' }) }),
      Object.freeze({ method: 'restart', invocation: Object.freeze({ kind: 'direct' }) }),
    ]),
  }),
})

export const name = 'dsh-system-power'

/**
 * Mount the power controller as a Cordis service. The Gateway discovers it
 * through its `typertRemote` binding and the prototype method markers.
 * @param ctx - host root context.
 */
export function apply(ctx: Context): void {
  ctx.provide(SERVICE_KEY, new SystemPowerController())
}
