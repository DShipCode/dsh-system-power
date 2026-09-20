/**
 * Browser state owner for the settings-header power action. Issues the
 * shutdown/restart Remote calls against the plugin's own `systemPower`
 * namespace and tracks the single in-flight gesture.
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-store'

/** Browser state of one in-flight shutdown/restart gesture. */
export interface SystemPowerState {
  /** Which action is awaiting its host acknowledgement; `none` when idle. */
  pending: 'none' | 'shutdown' | 'restart'
  /** Shutdown has been accepted and the host is gone; show the static closed message. */
  closed: boolean
}

/**
 * Issues the host shutdown/restart Remote calls and tracks the single in-flight
 * gesture. A failure (the host already gone) clears the pending flag so the UI
 * does not stay stuck.
 */
export class SystemPowerStore {
  /** uSES-safe state source shared by the registered header action. */
  readonly store: SnapshotStore<SystemPowerState> = createSnapshotStore({ pending: 'none', closed: false })

  /**
   * @param ctx - the plugin's context, whose loopback `remote.systemPower`
   * namespace owns process lifecycle.
   */
  constructor(private readonly ctx: ClientContext) {}

  /** Request the host process to shut down. */
  async shutdown(): Promise<void> {
    if (this.store.getSnapshot().pending !== 'none') return
    this.store.update((state) => { state.pending = 'shutdown' })
    try {
      await this.ctx.remote.systemPower.shutdown()
    } catch {
      // The host exits almost immediately; a dropped connection here is expected, not an error.
    }
  }

  /** Request the host process to restart. */
  async restart(): Promise<void> {
    if (this.store.getSnapshot().pending !== 'none') return
    this.store.update((state) => { state.pending = 'restart' })
    try {
      await this.ctx.remote.systemPower.restart()
    } catch {
      // The host exits almost immediately; a dropped connection here is expected, not an error.
    }
  }

  /** Swap the shutdown overlay to its static "closed" message. */
  markClosed(): void {
    this.store.update((state) => { state.closed = true })
  }
}
