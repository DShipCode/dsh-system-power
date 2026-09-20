/**
 * Settings-header power action: a power button (top-right of the Settings
 * panel, next to the "open config file" button) opening a Shutdown / Restart
 * menu. Firing an action raises a full-screen overlay: shutdown shows a static
 * "closed" notice, restart polls the new process and reloads this same tab
 * once it answers.
 *
 * The host capability comes from this plugin's own `systemPower` Remote
 * namespace, so the button works on a clean DSH install.
 */

import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SystemPowerStore } from './system-power-store.ts'

/** Registrant-owned dependencies of {@link SystemPowerAction}. */
export interface SystemPowerInjected {
  /** Controller issuing host shutdown/restart calls. */
  controller: SystemPowerStore
  hooks: {
    /** Controller snapshot bound by the UI renderer as useSnapshot. */
    snapshot: SystemPowerStore['store']
  }
}

/** Header-action owner share, localized copy, and the registrant's state face. */
export type SystemPowerActionProps =
  PropsRuntime<'settings.action'> & PropsLocale<'system-power'> & InjectFace<SystemPowerInjected>

/** Icon-button that toggles the menu. */
const iconButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  padding: 0,
  border: 0,
  borderRadius: 6,
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
}

/** Invisible full-screen layer that closes the menu on outside click. */
const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9,
}

/** Dropdown anchored under the power button. */
const menuStyle: CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 'calc(100% + 6px)',
  zIndex: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: 4,
  minWidth: 132,
  borderRadius: 8,
  border: '1px solid light-dark(rgba(31, 35, 41, 0.10), rgba(255, 255, 255, 0.12))',
  background: 'light-dark(#ffffff, #23262b)',
  color: 'light-dark(#1f2329, #f2f3f5)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)',
}

/** One menu row. */
const menuItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  width: '100%',
  padding: '6px 8px',
  border: 0,
  borderRadius: 6,
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  fontSize: 13,
  textAlign: 'left',
  cursor: 'pointer',
}

/** Full-screen overlay shown while a shutdown/restart gesture is in flight. */
const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'light-dark(rgba(255, 255, 255, 0.9), rgba(18, 20, 23, 0.9))',
  color: 'light-dark(#1f2329, #f2f3f5)',
  font: '14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif',
}

/**
 * Render the power button and its shutdown/restart popover.
 * @param props - header owner props, localized copy, and injected power state.
 * @returns the action fragment plus the overlay.
 */
export function SystemPowerAction({ controller, useSnapshot, t }: SystemPowerActionProps): ReactNode {
  const [open, setOpen] = useState(false)
  const state = useSnapshot((value) => value)
  const busy = state.pending !== 'none'
  const overlay = state.pending !== 'none'

  useEffect(() => {
    if (!overlay || state.pending !== 'shutdown') return
    // After the host has had time to exit, swap to the static "closed" message.
    const timer = window.setTimeout(() => { controller.markClosed() }, 2500)
    return () => { window.clearTimeout(timer) }
  }, [overlay, state.pending, controller])

  useEffect(() => {
    if (state.pending !== 'restart') return
    // Poll until the relaunched process answers, then reload this same tab
    // (no second browser tab). Strip the one-shot token; the cookie session re-auths.
    const started = Date.now()
    const timer = window.setInterval(() => {
      fetch('/', { cache: 'no-store' }).then(() => {
        window.clearInterval(timer)
        history.replaceState(null, '', '/')
        window.location.reload()
      }).catch(() => {
        if (Date.now() - started > 60000) window.clearInterval(timer)
      })
    }, 1000)
    return () => { window.clearInterval(timer) }
  }, [state.pending])

  return (
    <>
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t('power')}
          disabled={busy}
          onClick={() => { setOpen((value) => !value) }}
          style={iconButtonStyle}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 1.5a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0v-5A.75.75 0 0 1 8 1.5ZM4.5 4.94a.75.75 0 0 1 .06 1.06 4.5 4.5 0 1 0 6.88 0 .75.75 0 1 1 1.12-.99 6 6 0 1 1-9.12 0 .75.75 0 0 1 1.06.06Z"
              fill="currentColor"
            />
          </svg>
        </button>
        {open && (
          <>
            <div style={backdropStyle} onClick={() => { setOpen(false) }} />
            <div role="menu" aria-label={t('power')} style={menuStyle}>
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                onClick={() => { setOpen(false); void controller.shutdown() }}
                style={menuItemStyle}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8 1.5a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0v-5A.75.75 0 0 1 8 1.5ZM4.5 4.94a.75.75 0 0 1 .06 1.06 4.5 4.5 0 1 0 6.88 0 .75.75 0 1 1 1.12-.99 6 6 0 1 1-9.12 0 .75.75 0 0 1 1.06.06Z"
                    fill="currentColor"
                  />
                </svg>
                <span>{t('shutdown')}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                onClick={() => { setOpen(false); void controller.restart() }}
                style={menuItemStyle}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8.83 1.66a6.5 6.5 0 1 1-6.6 7.53.75.75 0 0 1 1.48-.26 5 5 0 1 0 2.1-3.04l1.16 1.16a.75.75 0 0 1-.53 1.28H3.75a.75.75 0 0 1-.75-.75V3.72a.75.75 0 0 1 1.28-.53l1.04 1.04A6.47 6.47 0 0 1 8.83 1.66Z"
                    fill="currentColor"
                  />
                </svg>
                <span>{t('restart')}</span>
              </button>
            </div>
          </>
        )}
      </span>
      {overlay && (
        <div style={overlayStyle}>
          <div>
            {state.pending === 'shutdown'
              ? (state.closed ? t('closed') : t('shuttingDown'))
              : t('restarting')}
          </div>
        </div>
      )}
    </>
  )
}
