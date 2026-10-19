import fs from "node:fs"
import path from "path"

import esbuild, { type BuildOptions } from "esbuild"

export async function buildMain() {
  const srcPath = path.resolve(import.meta.dirname, "../src")
  const mainEntry = path.resolve(srcPath, "index.ts")
  const preloadEntry = path.resolve(srcPath, "preload/index.ts")
  const distPath = path.resolve(import.meta.dirname, "../dist")

  const commonOptions: BuildOptions = {
    platform: "node",
    bundle: true,
    external: ["electron"],
    metafile: true,
  }

  const mainBuild = esbuild.build({
    ...commonOptions,
    entryPoints: [mainEntry],
    format: "esm",
    outfile: path.resolve(distPath, "index.js"),
  })

  const preloadBuild = esbuild.build({
    ...commonOptions,
    entryPoints: [preloadEntry],
    format: "cjs",
    outfile: path.resolve(distPath, "preload.js"),
  })

  const [main, preload] = await Promise.all([mainBuild, preloadBuild])

  const assetsPath = path.resolve(srcPath, "assets")
  fs.cpSync(assetsPath, path.resolve(distPath, "assets"), { recursive: true })

  return {
    main,
    preload,
  }
}

export async function build() {
  const distPath = path.resolve(import.meta.dirname, "../dist")

  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true })
  }

  await buildMain()
}

if (import.meta.main) {
  void build()
}
