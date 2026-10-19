import {
  type IpcEventMap,
  type IpcInvokeArgs,
  type IpcInvokeMap,
  type IpcInvokeResult,
} from "@repo/ipc"
import type { BrowserWindow } from "electron"

import { ipcMain } from "../electron.ts"

export function handle<C extends keyof IpcInvokeMap>(
  channel: C,
  listener: (...args: IpcInvokeArgs<C>) => Promise<IpcInvokeResult<C>> | IpcInvokeResult<C>,
) {
  ipcMain.handle(channel, (_event, ...args) => {
    return listener(...(args as IpcInvokeArgs<C>))
  })
}

export function emit<C extends keyof IpcEventMap>(
  window: BrowserWindow,
  channel: C,
  payload: IpcEventMap[C],
) {
  if (window.isDestroyed()) return
  window.webContents.send(channel, payload)
}
