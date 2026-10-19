import { randomUUID } from "node:crypto"
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"

import { app } from "../electron.ts"

export const DEFAULT_URL =
  "https://socialstream.ninja/themes/compact-clean.html?ultra=&session=EE8QNKvR6N&ln=en-us&showtime=0"

export type Settings = {
  url: string
  css: string
  frame: boolean
  clickThrough: boolean
  alwaysOnTop: boolean
  overlayVisible: boolean
  x: number | null
  y: number | null
  width: number | null
  height: number | null
}

const DEFAULTS: Settings = {
  url: ensureTransparent(DEFAULT_URL),
  css: "",
  frame: true,
  clickThrough: false,
  alwaysOnTop: true,
  overlayVisible: true,
  x: null,
  y: null,
  width: null,
  height: null,
}

let current: Settings = { ...DEFAULTS }
let dirty = false

function settingsPath() {
  return path.join(app.getPath("userData"), "settings.json")
}

export function ensureTransparent(raw: string) {
  const already = raw
    .split(/[?&]/)
    .some((part) => part === "transparent" || part.startsWith("transparent="))
  if (already) return raw
  return raw.includes("?") ? `${raw}&transparent` : `${raw}?transparent`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function readBool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback
}

function parseSettings(raw: unknown): Settings | null {
  if (!isRecord(raw) || typeof raw.url !== "string") return null
  const url = raw.url.trim()
  return {
    url: ensureTransparent(url.length > 0 ? url : DEFAULT_URL),
    css: typeof raw.css === "string" ? raw.css : "",
    frame: readBool(raw.frame, true),
    clickThrough: readBool(raw.clickThrough, false),
    alwaysOnTop: readBool(raw.alwaysOnTop, true),
    overlayVisible: readBool(raw.overlayVisible, true),
    x: readNumber(raw.x),
    y: readNumber(raw.y),
    width: readNumber(raw.width),
    height: readNumber(raw.height),
  }
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8"))
  } catch {
    return null
  }
}

function writeJson(file: string, data: unknown) {
  mkdirSync(path.dirname(file), { recursive: true })
  const temporary = `${file}.${randomUUID()}.tmp`
  writeFileSync(temporary, `${JSON.stringify(data, null, 2)}\n`)
  renameSync(temporary, file)
}

function readLegacySession(file: string): Partial<Settings> {
  const raw = readJson(file)
  if (!isRecord(raw)) return {}
  const clickThrough = raw.clickThrough ?? raw.click_through
  const alwaysOnTop = raw.alwaysOnTop ?? raw.always_on_top
  return {
    clickThrough: readBool(clickThrough, false),
    alwaysOnTop: readBool(alwaysOnTop, true),
    x: readNumber(raw.x),
    y: readNumber(raw.y),
    width: readNumber(raw.width),
    height: readNumber(raw.height),
  }
}

export function loadSettings() {
  const saved = parseSettings(readJson(settingsPath()))
  if (saved) {
    current = saved
    dirty = false
    return current
  }

  const legacy = readLegacySession(path.join(app.getPath("userData"), "state.json"))
  const projectConfig = readJson(path.resolve(import.meta.dirname, "../../../overlay.config.json"))
  let url = DEFAULTS.url
  if (
    isRecord(projectConfig) &&
    typeof projectConfig.url === "string" &&
    projectConfig.url.trim()
  ) {
    url = ensureTransparent(projectConfig.url.trim())
  }
  current = { ...DEFAULTS, ...legacy, url }
  dirty = false
  writeSettings()
  return current
}

export function getSettings(): Settings {
  return { ...current }
}

export function replaceSettings(next: Settings) {
  current = { ...next }
  dirty = true
}

export function patchSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch }
  dirty = true
}

export function isDirty() {
  return dirty
}

export function writeSettings() {
  const snapshot = getSettings()
  writeJson(settingsPath(), snapshot)
  dirty = false
  return snapshot
}

export function persistIfDirty() {
  if (!dirty) return
  writeSettings()
}
