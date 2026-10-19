import path from "node:path"

import { app } from "./electron.ts"
import { registerHandlers } from "./ipc/handlers.ts"
import { start } from "./overlay/app.ts"

if (process.platform === "linux" && process.env.STREAM_NINJA_WAYLAND !== "1") {
  process.env.GDK_BACKEND = "x11"
  app.commandLine.appendSwitch("ozone-platform", "x11")
  app.commandLine.appendSwitch("enable-transparent-visuals")
}

const userData = path.join(app.getPath("appData"), "stream-ninja-overlay")
app.setName("stream-ninja-overlay")
app.setPath("userData", userData)

function whenReady() {
  registerHandlers()
  start()
}

void app.whenReady().then(whenReady)
