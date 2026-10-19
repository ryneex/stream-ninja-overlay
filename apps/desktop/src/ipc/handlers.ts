import {
  applySettings,
  quitApp,
  reloadOverlay,
  setAlwaysOnTop,
  setClickThrough,
  setFrame,
  setOverlayPosition,
  setOverlaySize,
  setOverlayVisible,
  snapshot,
} from "../overlay/app.ts"
import { handle } from "./index.ts"

export function registerHandlers() {
  handle("settings:get", () => snapshot())

  handle("settings:apply", async (url, css) => {
    if (typeof url !== "string" || typeof css !== "string") {
      throw new Error("Enter an overlay URL")
    }
    return applySettings(url, css)
  })

  handle("overlay:set-visible", (visible) => {
    if (typeof visible !== "boolean") return
    setOverlayVisible(visible)
  })

  handle("overlay:set-frame", (enabled) => {
    if (typeof enabled !== "boolean") return
    setFrame(enabled)
  })

  handle("overlay:set-click-through", (enabled) => {
    if (typeof enabled !== "boolean") return
    setClickThrough(enabled)
  })

  handle("overlay:set-always-on-top", (enabled) => {
    if (typeof enabled !== "boolean") return
    setAlwaysOnTop(enabled)
  })

  handle("overlay:set-size", (width, height) => {
    if (!isFiniteNumber(width) || !isFiniteNumber(height)) return
    setOverlaySize(width, height)
  })

  handle("overlay:set-position", (x, y) => {
    if (!isFiniteNumber(x) || !isFiniteNumber(y)) return
    setOverlayPosition(x, y)
  })

  handle("overlay:reload", () => {
    reloadOverlay()
  })

  handle("app:quit", () => {
    quitApp()
  })
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}
