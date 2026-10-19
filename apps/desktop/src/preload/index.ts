import {
  type IpcApi,
  type IpcEventMap,
  type IpcInvokeArgs,
  type IpcInvokeMap,
  type IpcInvokeResult,
} from "@repo/ipc"
import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron"

const ipc = {
  invoke<C extends keyof IpcInvokeMap>(
    channel: C,
    ...args: IpcInvokeArgs<C>
  ): Promise<IpcInvokeResult<C>> {
    return ipcRenderer.invoke(channel, ...(args as unknown[]))
  },
  on<C extends keyof IpcEventMap>(channel: C, listener: (payload: IpcEventMap[C]) => void) {
    const callback = (_event: IpcRendererEvent, payload: IpcEventMap[C]) => {
      listener(payload)
    }

    ipcRenderer.on(channel, callback)

    return () => {
      ipcRenderer.off(channel, callback)
    }
  },
} satisfies IpcApi

contextBridge.exposeInMainWorld("ipc", ipc)
