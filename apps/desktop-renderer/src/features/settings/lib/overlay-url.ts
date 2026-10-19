import { isCatalogTheme } from "./overlay-themes"

const CONTROLLED_PARAMS = new Set(["session", "ln", "showtime", "transparent"])

export type OverlayTarget = {
  sessionId: string
  themeFile: string
}

export function readOverlayTarget(raw: string): OverlayTarget {
  try {
    const url = new URL(raw)
    return {
      sessionId: url.searchParams.get("session") ?? "",
      themeFile: themeFileFromPath(url.pathname),
    }
  } catch {
    return { sessionId: "", themeFile: "" }
  }
}

export function composeOverlayUrl(sessionId: string, themeFile: string, previousRaw: string) {
  const previous = parseUrl(previousRaw)
  const file = themeFile.replace(/^\/+/, "")
  const next = new URL("https://socialstream.ninja/")
  const catalogTheme = isCatalogTheme(file)
  const previousFile = previous ? themeFileFromPath(previous.pathname) : ""
  const keepSavedPage = Boolean(
    previous &&
    !catalogTheme &&
    file &&
    previousFile === file &&
    !previous.pathname.includes("/themes/"),
  )

  if (keepSavedPage && previous) {
    next.protocol = previous.protocol
    next.host = previous.host
    next.pathname = previous.pathname
  } else {
    next.pathname = themePath(file || "compact-clean.html")
  }

  if (previous?.hash) next.hash = previous.hash

  const params = new URLSearchParams()
  params.set("session", sessionId.trim())
  params.set("ln", "en-us")
  params.set("showtime", "0")
  if (previous) {
    for (const [key, value] of previous.searchParams) {
      if (CONTROLLED_PARAMS.has(key)) continue
      params.append(key, value)
    }
  }
  if (!params.has("transparent")) params.append("transparent", "")
  next.search = params.toString()
  return next.toString().replace(/([?&])transparent=(?=&|$)/, "$1transparent")
}

function themeFileFromPath(pathname: string) {
  const path = decodeURIComponent(pathname)
  const marker = "/themes/"
  const at = path.indexOf(marker)
  if (at >= 0) return path.slice(at + marker.length)
  return path.replace(/^\//, "")
}

function themePath(file: string) {
  const segments = file.split("/").filter(Boolean).map(encodeURIComponent)
  return `/themes/${segments.join("/")}`
}

function parseUrl(raw: string) {
  try {
    return new URL(raw)
  } catch {
    return null
  }
}
