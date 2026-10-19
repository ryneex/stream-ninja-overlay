import type { IpcApi } from "@repo/ipc"

declare global {
  interface Window {
    ipc: IpcApi
  }
}

export {}
