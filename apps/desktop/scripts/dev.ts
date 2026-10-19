import { spawn } from "child_process"

import treeKill from "tree-kill"

import { buildMain } from "./build"

async function spawnMain() {
  await buildMain()
  const env = { ...process.env }
  // Cursor's Electron sets this, which makes the child binary run as plain Node.
  delete env.ELECTRON_RUN_AS_NODE
  if (process.platform === "linux" && env.STREAM_NINJA_WAYLAND !== "1") {
    env.GDK_BACKEND = "x11"
    env.ELECTRON_OZONE_PLATFORM_HINT = "x11"
  }
  const electronArgs = ["."]
  if (env.STREAM_NINJA_DEBUG_PORT) {
    electronArgs.push(`--remote-debugging-port=${env.STREAM_NINJA_DEBUG_PORT}`)
  }
  return spawn("electron", electronArgs, {
    stdio: "inherit",
    env,
  })
}

export async function dev() {
  let mainProcess = await spawnMain()

  async function restart() {
    kill()
    mainProcess = await spawnMain()
  }

  function kill() {
    if (!mainProcess.pid) throw new Error("Main process not running")
    treeKill(mainProcess.pid)
  }

  process.stdin.on("data", async (data) => {
    const msg = data.toString().trim()

    if (msg === "r") {
      await restart()
    }

    if (msg === "q") {
      kill()
    }
  })

  process.on("SIGINT", () => {
    try {
      kill()
    } catch {
      // Main process may already be gone.
    }
    process.exit(0)
  })
}

if (import.meta.main) {
  void dev()
}
