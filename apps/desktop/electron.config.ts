import type { Configuration } from "electron-builder"

const config: Configuration = {
  appId: "dev.streamninja.overlay",
  productName: "Stream Ninja Overlay",
  executableName: "stream-ninja-overlay",
  artifactName: "stream-ninja-overlay-${version}-${arch}.${ext}",
  removePackageScripts: true,
  electronLanguages: ["en-US"],
  icon: "src/assets/icon.png",
  files: ["dist", "!node_modules/**/*"],
  directories: {
    output: "out",
  },
  linux: {
    target: ["flatpak"],
    category: "Utility",
  },
  flatpak: {
    runtime: "org.freedesktop.Platform",
    runtimeVersion: "24.08",
    base: "org.electronjs.Electron2.BaseApp",
    baseVersion: "24.08",
    finishArgs: [
      "--share=ipc",
      "--share=network",
      "--socket=fallback-x11",
      "--socket=wayland",
      "--socket=pulseaudio",
      "--device=dri",
      "--talk-name=org.kde.StatusNotifierWatcher",
    ],
  },
}

export default config
