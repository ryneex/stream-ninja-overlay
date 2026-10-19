import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

/** Electron's main process is ESM, but `electron` is still a CommonJS builtin. */
export const {
  app,
  BrowserWindow,
  desktopCapturer,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  session,
  Tray,
} = require("electron") as typeof import("electron")
