/**
 * dsh-system-power — client half.
 *
 * Mounts the self-contained `systemPower` Remote namespace (shutdown/restart)
 * and registers a power button in the Settings header action row, next to the
 * "open config file" button. The capability is fully owned by this plugin, so
 * it works on a clean DSH install without any source edits.
 *
 * The stock DSH settings shell never ships a power action, so this plugin is
 * the only provider on stock installs. When the host build already carries a
 * power action under the reserved id `system-power` (a locally patched DSH),
 * this plugin yields to it instead of duplicating the button.
 *
 * The `systemPower` namespace is mounted by this very apply, so the UI half
 * runs in a child fiber that injects `remote.systemPower` (Cordis associate
 * resolution requires the accessing fiber to declare the dotted service key;
 * injecting it in this apply would deadlock, since this apply itself provides
 * it).
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the ctx.remote merge into this program.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
// Type-only: the `settings.action` slot declaration (SlotMap + owner props).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls ctx.locale into this program.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: LocaleNamespaceMap merge target.
import type {} from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: merges the `remote.systemPower` namespace surface.
import type {} from './types.ts'
import { TYPERT_REMOTE } from './remote.ts'
import { SystemPowerAction } from './SystemPowerAction.tsx'
import type { SystemPowerInjected } from './SystemPowerAction.tsx'
import { SystemPowerStore } from './system-power-store.ts'
import { en, zh, type SystemPowerKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Dictionary namespace owned by this plugin. */
    'system-power': SystemPowerKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'system-power'

/** Reserved action id of a power action shipped by the host itself. */
const HOST_POWER_ACTION_ID = 'system-power'

/** This plugin's own header action id. */
const PLUGIN_POWER_ACTION_ID = 'system-power-plugin'

/**
 * Required services (cordis fiber inject). The `systemPower` namespace is
 * mounted by this very apply; the UI fiber (child plugin) declares it.
 */
export const inject = ['slots', 'locale', 'remote']

/**
 * Mount the Remote namespace and register the header power action.
 * @param ctx - client root context.
 * @returns disposer unwinding the Remote namespace mount and the UI fiber.
 */
export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  // Self-contained host capability: this namespace carries the shutdown and
  // restart methods, regardless of what the host build provides.
  const disposeRemote = await ctx.remote.$mount(TYPERT_REMOTE)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-system-power: locale')

  // The action fiber injects `remote.systemPower`, so its context can resolve
  // the namespace through the Cordis associate mechanism.
  const uiFiber = await ctx.plugin({
    name: 'dsh-system-power.ui',
    inject: ['slots', 'locale', 'remote', 'remote.systemPower'],
    apply: async (ui: ClientContext): Promise<void> => {
      // Process lifecycle is only meaningful for a loopback host we can
      // actually shut down (mirrors the built-in settings shell's action).
      const controller = ui.remote.$host.isLoopback ? new SystemPowerStore(ui) : undefined
      const injected = controller === undefined
        ? undefined
        : (): SystemPowerInjected => ({
          controller,
          hooks: { snapshot: controller.store },
        })

      if (injected === undefined) return
      ui.slots.inject('settings.action', () => {
        // A host-patched DSH already owns the header power button; do not
        // duplicate it. The host action's inject callback runs before ours, so
        // its entry is already on the ledger here.
        if (ui.slots.entries('settings.action').some(entry => entry.options.id === HOST_POWER_ACTION_ID)) {
          return undefined
        }
        return ui.slots.register({
          name: 'settings.action',
          id: PLUGIN_POWER_ACTION_ID,
          order: 2,
          locale: NS,
          inject: injected,
        }, SystemPowerAction)
      })
    },
  })

  return async () => {
    await uiFiber.dispose()
    await disposeRemote()
  }
}
