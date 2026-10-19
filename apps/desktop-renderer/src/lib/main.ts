import type { IpcEventMap } from "@repo/ipc"

function ipc() {
  if (!window.ipc) {
    throw new Error("Open the desktop app to change the overlay.")
  }
  return window.ipc
}

export function getSettings() {
  return ipc().invoke("settings:get")
}

export function applySettings(url: string, css: string) {
  return ipc().invoke("settings:apply", url, css)
}

export function setOverlayVisible(visible: boolean) {
  return ipc().invoke("overlay:set-visible", visible)
}

export function setFrame(enabled: boolean) {
  return ipc().invoke("overlay:set-frame", enabled)
}

export function setClickThrough(enabled: boolean) {
  return ipc().invoke("overlay:set-click-through", enabled)
}

export function setAlwaysOnTop(enabled: boolean) {
  return ipc().invoke("overlay:set-always-on-top", enabled)
}

export function setOverlaySize(width: number, height: number) {
  return ipc().invoke("overlay:set-size", width, height)
}

export function reloadChat() {
  return ipc().invoke("overlay:reload")
}

export function quitApp() {
  return ipc().invoke("app:quit")
}

export function onOverlayState(listener: (payload: IpcEventMap["overlay:state"]) => void) {
  if (!window.ipc) return () => {}
  return window.ipc.on("overlay:state", listener)
}

export const settingsQueryKey = ["settings"] as const
