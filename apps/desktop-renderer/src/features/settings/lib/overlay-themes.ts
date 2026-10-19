/**
 * Social Stream Ninja theme files shown in settings.
 *
 * Source: Overlay Gallery cards whose `data-path` is under `themes/`.
 * https://socialstream.ninja/docs/overlay-gallery.html
 * Labels are each card's heading. Cards that only add a style query
 * (`compact-clean.html?style=cute`) stay on that same HTML file.
 *
 * Featured-style files are listed there only with a `style` query, so their
 * labels are the `<title>` of the HTML file the gallery links, for example
 * https://socialstream.ninja/themes/featured-styles/featured-modern.html
 */
export type OverlayThemeGroup = "chat" | "featured" | "alerts"

export type OverlayTheme = {
  file: string
  label: string
  group: OverlayThemeGroup
}

export const overlayThemeGroups: { id: OverlayThemeGroup; label: string }[] = [
  { id: "chat", label: "Combined chat" },
  { id: "featured", label: "Featured message" },
  { id: "alerts", label: "Alerts" },
]

export const overlayThemes: readonly OverlayTheme[] = [
  { file: "compact-classic.html", label: "Compact Classic", group: "chat" },
  { file: "compact-clean.html", label: "Compact Clean", group: "chat" },
  { file: "compact-glass.html", label: "Compact Glass", group: "chat" },
  { file: "overlay-comic-pop.html", label: "Comic Pop Dock", group: "chat" },
  { file: "overlay-comic-classic.html", label: "Comic Pop Classic", group: "chat" },
  { file: "horizontal.html", label: "Horizontal Scroll", group: "chat" },
  { file: "overlay-ticker-news.html", label: "News Ticker", group: "chat" },
  { file: "overlay-credits.html", label: "Movie Credits", group: "chat" },
  { file: "overlay-danmaku.html", label: "Danmaku Bullet Chat", group: "chat" },
  { file: "overlay-neon-cyberpunk.html", label: "Neon Cyberpunk", group: "chat" },
  { file: "overlay-particles.html", label: "Particle System", group: "chat" },
  { file: "overlay-typewriter.html", label: "Terminal Typewriter", group: "chat" },
  { file: "overlay-bubbles.html", label: "Bubble Chat", group: "chat" },
  { file: "overlay-cards.html", label: "Card Flip 3D", group: "chat" },
  { file: "overlay-xacception.html", label: "Simple Alternative", group: "chat" },
  { file: "pretty.html", label: "Pretty Theme", group: "chat" },
  { file: "Neutron/chatOnly.html", label: "Neutron Chat", group: "chat" },
  { file: "Neutron/stream.html", label: "Neutron Stream", group: "chat" },
  { file: "Windows3.1/index.html", label: "Windows 3.1", group: "chat" },
  { file: "deuks_overlay/overlay1.html", label: "Deuks Overlay 1", group: "chat" },
  { file: "deuks_overlay/overlay2.html", label: "Deuks Overlay 2", group: "chat" },
  { file: "rainbowpuke/index.html", label: "Rainbow Puke", group: "chat" },
  { file: "t3nk3y/index.html", label: "T3nk3y Theme", group: "chat" },
  { file: "LuckyLootTube/luckyloottube.html", label: "LuckyLootTube", group: "chat" },
  { file: "huan-kiara/index.html", label: "Huan Kiara", group: "chat" },
  { file: "notimeoutmessages.html", label: "Neon Red Persistent Chat", group: "chat" },
  { file: "spiritoverlay.html", label: "Spiritveil", group: "chat" },
  { file: "sampleoverlay_reverse.html", label: "Reverse Sample Chat", group: "chat" },
  {
    file: "featured-styles/featured-modern.html",
    label: "Featured Message - Modern Styles",
    group: "featured",
  },
  {
    file: "featured-styles/featured-animated.html",
    label: "Featured Message - Animated Styles",
    group: "featured",
  },
  {
    file: "featured-styles/featured-3d.html",
    label: "Featured Message - 3D Styles",
    group: "featured",
  },
  {
    file: "featured-styles/featured-particles.html",
    label: "Featured Message - Particle Effects",
    group: "featured",
  },
  {
    file: "featured-styles/featured-cyberpunk.html",
    label: "Featured Message - Cyberpunk Effects",
    group: "featured",
  },
  {
    file: "featured-styles/featured-dynamic.html",
    label: "Featured Message - Dynamic Physics",
    group: "featured",
  },
  {
    file: "featured-styles/featured-elegant.html",
    label: "Featured Message - Elegant & Sophisticated",
    group: "featured",
  },
  {
    file: "featured-styles/featured-gaming.html",
    label: "Featured Message - Gaming Themed",
    group: "featured",
  },
  {
    file: "featured-styles/featured-glass.html",
    label: "Featured Message - Glassmorphism Effects",
    group: "featured",
  },
  {
    file: "featured-styles/featured-gradient.html",
    label: "Featured Message - Gradient Animations",
    group: "featured",
  },
  {
    file: "featured-styles/featured-neon.html",
    label: "Featured Message - Neon Glow Effects",
    group: "featured",
  },
  {
    file: "featured-styles/featured-retro.html",
    label: "Featured Message - Retro/Synthwave Style",
    group: "featured",
  },
  {
    file: "featured-styles/featured-slide.html",
    label: "Featured Message - Slide Animations",
    group: "featured",
  },
  { file: "events/index.html", label: "Event Dashboard", group: "alerts" },
]

const themeFiles = new Set(overlayThemes.map((theme) => theme.file))

export function isCatalogTheme(file: string) {
  return themeFiles.has(file)
}
