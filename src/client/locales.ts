/** Dictionary for the System Power header action (zh is the key-set source). */

export const zh = {
  'power': '电源',
  'shutdown': '关闭',
  'restart': '重启',
  'shuttingDown': '正在关闭 DeepSeek Harness…',
  'restarting': '正在重启 DeepSeek Harness…',
  'closed': 'DeepSeek Harness 已关闭。',
} satisfies Record<string, string>

/** The System Power namespace key union. */
export type SystemPowerKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'power': 'Power',
  'shutdown': 'Shutdown',
  'restart': 'Restart',
  'shuttingDown': 'Shutting down DeepSeek Harness…',
  'restarting': 'Restarting DeepSeek Harness…',
  'closed': 'DeepSeek Harness has shut down.',
} satisfies Record<SystemPowerKey, string>
