/**
 * Hand-written consumer contribution for the plugin's own `systemPower`
 * Remote namespace. This is the shape the Gateway client's `$mount` consumes;
 * it mirrors what the typert generator emits for the settings-controller
 * (`settings/shutdown`, `settings/restart`), with zero parameters and a
 * literal-only result schema.
 */

import { z } from 'zod'

const shutdownResultSchema = (): z.ZodType<{ readonly shuttingDown: true }> =>
  z.object({ shuttingDown: z.literal(true).readonly() })

const restartResultSchema = (): z.ZodType<{ readonly restarting: true }> =>
  z.object({ restarting: z.literal(true).readonly() })

/** Consumer-side Remote contribution for `dsh-system-power`. */
export const TYPERT_REMOTE = {
  package: 'dsh-system-power',
  descriptors: [
    {
      id: 'dsh-system-power#systemPower/shutdown',
      service: 'systemPowerController',
      namespace: 'systemPower',
      method: 'shutdown',
      invocation: { kind: 'direct' },
      parameters: [],
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-system-power#systemPower/shutdown:result',
        create: shutdownResultSchema,
      },
    },
    {
      id: 'dsh-system-power#systemPower/restart',
      service: 'systemPowerController',
      namespace: 'systemPower',
      method: 'restart',
      invocation: { kind: 'direct' },
      parameters: [],
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-system-power#systemPower/restart:result',
        create: restartResultSchema,
      },
    },
  ],
} as const
