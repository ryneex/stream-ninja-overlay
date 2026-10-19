import path from "node:path"

import type { OverlayState } from "@repo/ipc"
import type { BrowserWindow as BrowserWindowType, Tray as TrayType, WebContents } from "electron"

import {
  app,
  BrowserWindow,
  desktopCapturer,
  globalShortcut,
  Menu,
  nativeImage,
  screen,
  session,
  Tray,
} from "../electron.ts"
import {
  ensureTransparent,
  getSettings,
  isDirty,
  loadSettings,
  patchSettings,
  persistIfDirty,
  writeSettings,
} from "../persistence/store.ts"
import { FRAME_SCRIPT } from "./frame-script.ts"
import { themeCss } from "./theme.ts"

const PRELOAD_PATH = path.resolve(import.meta.dirname, "./preload.js")
const RENDERER_PATH = path.resolve(import.meta.dirname, "./renderer/index.html")
const ICON_PATH = path.resolve(import.meta.dirname, "./assets/icon.png")
const RENDERER_DEV_URL = "http://localhost:4783"
const MEDIA_HOSTS = new Set(["socialstream.ninja", "vdo.socialstream.ninja"])
const MEDIA_PERMISSIONS = new Set(["media", "display-capture"])

let settingsWindow: BrowserWindowType | null = null
let overlayWindow: BrowserWindowType | null = null
let tray: TrayType | null = null
let quitting = false
let cssKey: string | null = null

export function start() {
  console.log(`userData ${app.getPath("userData")}`)
  loadSettings()
  installPermissions()
  createTray()
  registerShortcuts()
  const saver = setInterval(() => {
    if (isDirty()) persistIfDirty()
  }, 500)
  app.on("before-quit", () => {
    quitting = true
    clearInterval(saver)
    writeSettings()
  })
  app.on("will-quit", () => {
    globalShortcut.unregisterAll()
  })
  app.on("activate", () => {
    if (!settingsWindow || settingsWindow.isDestroyed()) void openSettings()
  })
  void openSettings()
  void openOverlay()
}

export function snapshot(): OverlayState {
  const settings = getSettings()
  const window = liveOverlay()
  const bounds = window?.getBounds()
  return {
    url: settings.url,
    css: settings.css,
    frame: settings.frame,
    clickThrough: settings.clickThrough,
    alwaysOnTop: settings.alwaysOnTop,
    visible: window ? window.isVisible() : settings.overlayVisible,
    x: bounds?.x ?? settings.x ?? 0,
    y: bounds?.y ?? settings.y ?? 0,
    width: bounds?.width ?? settings.width ?? 420,
    height: bounds?.height ?? settings.height ?? 720,
  }
}

export function emitState() {
  if (!settingsWindow || settingsWindow.isDestroyed()) return
  settingsWindow.webContents.send("overlay:state", snapshot())
}

export async function applySettings(url: string, css: string) {
  const trimmed = url.trim()
  if (!trimmed) throw new Error("Enter an overlay URL")
  const next = ensureTransparent(trimmed)
  try {
    new URL(next)
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid"
    throw new Error(`Invalid URL: ${message}`)
  }
  const previous = getSettings().url
  patchSettings({ url: next, css })
  writeSettings()
  await injectTheme()
  if (previous !== next) {
    const window = requireOverlay()
    await window.loadURL(next)
  }
  emitState()
  return next
}

export function setOverlayVisible(visible: boolean) {
  patchSettings({ overlayVisible: visible })
  const window = requireOverlay()
  if (visible) {
    if (window.isMinimized()) window.restore()
    window.show()
  } else {
    window.hide()
  }
  writeSettings()
  emitState()
}

export function setFrame(enabled: boolean) {
  patchSettings({ frame: enabled })
  writeSettings()
  void syncFrame()
  emitState()
}

export function setClickThrough(enabled: boolean) {
  patchSettings({ clickThrough: enabled })
  const window = liveOverlay()
  if (window) {
    window.setIgnoreMouseEvents(enabled)
    window.setFocusable(!enabled)
    if (!enabled) window.focus()
  }
  writeSettings()
  emitState()
}

export function toggleClickThrough() {
  setClickThrough(!getSettings().clickThrough)
}

export function setAlwaysOnTop(enabled: boolean) {
  patchSettings({ alwaysOnTop: enabled })
  const window = liveOverlay()
  if (window) window.setAlwaysOnTop(enabled, "screen-saver")
  writeSettings()
  emitState()
}

export function setOverlaySize(width: number, height: number) {
  const nextWidth = clamp(Math.round(width), 240, 4000)
  const nextHeight = clamp(Math.round(height), 180, 4000)
  const window = requireOverlay()
  window.setSize(nextWidth, nextHeight)
  if (!window.isVisible()) {
    setOverlayVisible(true)
    return
  }
  rememberBounds()
  writeSettings()
  emitState()
}

export function setOverlayPosition(x: number, y: number) {
  const window = requireOverlay()
  window.setPosition(Math.round(x), Math.round(y))
  if (!window.isVisible()) {
    setOverlayVisible(true)
    return
  }
  rememberBounds()
  writeSettings()
  emitState()
}

export function reloadOverlay() {
  requireOverlay().webContents.reload()
}

export function toggleDevtools() {
  const contents = liveOverlay()?.webContents
  if (!contents) return
  if (contents.isDevToolsOpened()) contents.closeDevTools()
  else contents.openDevTools({ mode: "detach" })
}

export function focusSettings() {
  void openSettings()
}

export function quitApp() {
  writeSettings()
  app.quit()
}

function liveOverlay() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return null
  return overlayWindow
}

function requireOverlay() {
  const window = liveOverlay()
  if (!window) throw new Error("Chat window is not open")
  return window
}

function installPermissions() {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      const url = details.requestingUrl || webContents.getURL()
      callback(hostAllowed(url) && MEDIA_PERMISSIONS.has(permission))
    },
  )
  session.defaultSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => {
    if (!MEDIA_PERMISSIONS.has(permission)) return true
    return hostAllowed(requestingOrigin)
  })
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    const frameUrl = request.frame?.url ?? ""
    if (!hostAllowed(request.securityOrigin) && !hostAllowed(frameUrl)) {
      callback(null)
      return
    }
    void desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
      const source = sources[0]
      callback(source ? { video: source } : null)
    })
  })
}

function hostAllowed(raw: string) {
  try {
    return MEDIA_HOSTS.has(new URL(raw).hostname)
  } catch {
    return false
  }
}

async function openSettings() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (settingsWindow.isMinimized()) settingsWindow.restore()
    settingsWindow.show()
    settingsWindow.focus()
    return
  }

  const window = new BrowserWindow({
    width: 440,
    height: 700,
    minWidth: 380,
    minHeight: 560,
    title: "Stream Ninja",
    icon: ICON_PATH,
    autoHideMenuBar: true,
    center: true,
    webPreferences: {
      preload: PRELOAD_PATH,
      autoplayPolicy: "no-user-gesture-required",
    },
  })
  settingsWindow = window
  window.on("closed", () => {
    settingsWindow = null
    if (!quitting) app.quit()
  })
  await loadRenderer(window)
  console.log("settings-ready")
}

async function openOverlay() {
  const settings = getSettings()
  const window = new BrowserWindow({
    width: 420,
    height: 720,
    minWidth: 240,
    minHeight: 180,
    title: "Chat",
    icon: ICON_PATH,
    frame: false,
    transparent: true,
    hasShadow: false,
    backgroundColor: "#00000000",
    alwaysOnTop: settings.alwaysOnTop,
    skipTaskbar: true,
    resizable: true,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: PRELOAD_PATH,
      backgroundThrottling: false,
      autoplayPolicy: "no-user-gesture-required",
    },
  })
  overlayWindow = window
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  if (settings.alwaysOnTop) window.setAlwaysOnTop(true, "screen-saver")

  window.on("close", (event) => {
    if (quitting) return
    event.preventDefault()
    setOverlayVisible(false)
  })
  window.on("move", rememberBounds)
  window.on("resize", rememberBounds)
  window.webContents.on("did-finish-load", () => {
    console.log(`page-load finished ${window.webContents.getURL()}`)
    void injectTheme()
    void syncFrame()
    void probeChat(window.webContents)
  })
  window.webContents.on("did-fail-load", (_event, code, description, url) => {
    console.error(`page-load failed ${code} ${description} ${url}`)
  })
  window.webContents.on("console-message", (event) => {
    if (event.level === "warning" || event.level === "error") {
      console.error(`chat: ${event.message}`)
    }
  })

  placeWindow(window, settings)
  if (settings.overlayVisible) window.show()
  if (settings.clickThrough) setClickThrough(true)
  console.log("overlay-created")
  // The CDP reply often never arrives, while the command itself is applied.
  void installDocumentStart(window.webContents).catch((error: unknown) => {
    console.error("document-start script failed", error)
  })
  await delay(400)
  void window.loadURL(settings.url).catch((error: unknown) => {
    console.error("could not open the overlay", error)
  })
}

async function loadRenderer(window: BrowserWindowType) {
  if (app.isPackaged) {
    await window.loadFile(RENDERER_PATH)
    return
  }
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      await window.loadURL(RENDERER_DEV_URL)
      return
    } catch (error) {
      if (attempt === 49) throw error
      await delay(200)
    }
  }
}

async function installDocumentStart(contents: WebContents) {
  try {
    if (!contents.debugger.isAttached()) contents.debugger.attach("1.3")
    await contents.debugger.sendCommand("Page.addScriptToEvaluateOnNewDocument", {
      source: FRAME_SCRIPT,
      runImmediately: true,
    })
  } catch (error) {
    console.error("document-start script failed", error)
  }
}

async function injectTheme() {
  const window = liveOverlay()
  if (!window) return
  const css = themeCss(getSettings().css)
  try {
    if (cssKey) {
      await window.webContents.removeInsertedCSS(cssKey).catch(() => undefined)
      cssKey = null
    }
    cssKey = await window.webContents.insertCSS(css)
  } catch (error) {
    console.error("theme css failed", error)
  }
}

async function syncFrame() {
  const window = liveOverlay()
  if (!window) return
  const enabled = getSettings().frame ? "true" : "false"
  try {
    await window.webContents.executeJavaScript(`(function apply(tries) {
      if (window.__sno && window.__sno.setFrame) { window.__sno.setFrame(${enabled}); return; }
      if (tries > 0) setTimeout(function() { apply(tries - 1); }, 50);
    })(40);`)
  } catch (error) {
    console.error("frame sync failed", error)
  }
}

async function probeChat(contents: WebContents) {
  if (app.isPackaged) return
  await delay(1500)
  if (contents.isDestroyed()) return
  try {
    const value: unknown = await contents.executeJavaScript(
      `JSON.stringify({rtc:typeof RTCPeerConnection,frames:[...document.querySelectorAll('iframe')].map(f=>({allow:f.getAttribute('allow'),host:(()=>{try{return new URL(f.src).host}catch(e){return ''}})()}))})`,
    )
    console.log(`sno-probe ${String(value)}`)
  } catch (error) {
    console.error("sno-probe failed", error)
  }
}

function rememberBounds() {
  const window = liveOverlay()
  if (!window) return
  const bounds = window.getBounds()
  patchSettings({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  })
}

function placeWindow(window: BrowserWindowType, settings: ReturnType<typeof getSettings>) {
  const { x, y, width, height } = settings
  if (x != null && y != null && width != null && height != null && width >= 240 && height >= 180) {
    const logical = boundsVisible(x, y)
      ? { x, y, width, height }
      : logicalFromPhysical(x, y, width, height)
    if (logical && boundsVisible(logical.x, logical.y)) {
      window.setBounds({
        x: logical.x,
        y: logical.y,
        width: Math.round(logical.width),
        height: Math.round(logical.height),
      })
      return
    }
  }

  const display = screen.getPrimaryDisplay()
  const area = display.workArea
  const nextWidth = Math.min(420, Math.max(280, area.width))
  const nextHeight = Math.min(Math.max(320, Math.round(area.height * 0.72)), area.height)
  window.setBounds({
    x: area.x + area.width - nextWidth - 24,
    y: area.y + 40,
    width: nextWidth,
    height: nextHeight,
  })
}

function logicalFromPhysical(x: number, y: number, width: number, height: number) {
  const scale = screen.getPrimaryDisplay().scaleFactor
  if (scale <= 1) return null
  return {
    x: Math.round(x / scale),
    y: Math.round(y / scale),
    width: Math.round(width / scale),
    height: Math.round(height / scale),
  }
}

function boundsVisible(x: number, y: number) {
  return screen.getAllDisplays().some((display) => {
    const bounds = display.bounds
    return (
      x >= bounds.x - 80 &&
      x < bounds.x + bounds.width &&
      y >= bounds.y - 80 &&
      y < bounds.y + bounds.height
    )
  })
}

function createTray() {
  try {
    const icon = nativeImage.createFromPath(ICON_PATH).resize({ width: 32, height: 32 })
    tray = new Tray(icon)
    tray.setToolTip("Stream Ninja Overlay")
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: "Settings", click: () => focusSettings() },
        { label: "Show chat", click: () => setOverlayVisible(true) },
        { label: "Reload chat", click: () => reloadOverlay() },
        { label: "Toggle devtools", click: () => toggleDevtools() },
        { label: "Quit", click: () => quitApp() },
      ]),
    )
  } catch (error) {
    console.error("tray unavailable", error)
  }
}

function registerShortcuts() {
  const shortcuts: Array<[string, () => void]> = [
    ["CommandOrControl+Shift+Alt+X", () => toggleClickThrough()],
    ["CommandOrControl+Shift+Alt+R", () => reloadOverlay()],
  ]
  for (const [accelerator, action] of shortcuts) {
    const registered = globalShortcut.register(accelerator, action)
    if (!registered) console.error(`overlay hotkey ${accelerator} unavailable`)
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
