export type OverlayState = {
  url: string
  css: string
  frame: boolean
  clickThrough: boolean
  alwaysOnTop: boolean
  visible: boolean
  x: number
  y: number
  width: number
  height: number
}

export type IpcInvokeDefinition = {
  args: unknown[]
  result: unknown
}

export type IpcInvokeMap = {
  "settings:get": { args: []; result: OverlayState }
  "settings:apply": { args: [url: string, css: string]; result: string }
  "overlay:set-visible": { args: [visible: boolean]; result: void }
  "overlay:set-frame": { args: [enabled: boolean]; result: void }
  "overlay:set-click-through": { args: [enabled: boolean]; result: void }
  "overlay:set-always-on-top": { args: [enabled: boolean]; result: void }
  "overlay:set-size": { args: [width: number, height: number]; result: void }
  "overlay:set-position": { args: [x: number, y: number]; result: void }
  "overlay:reload": { args: []; result: void }
  "app:quit": { args: []; result: void }
}

export type IpcEventMap = {
  "overlay:state": OverlayState
}

type InvokeChannel<C extends keyof IpcInvokeMap> = IpcInvokeMap[C] extends IpcInvokeDefinition
  ? IpcInvokeMap[C]
  : never

export type IpcInvokeArgs<C extends keyof IpcInvokeMap> = InvokeChannel<C>["args"] extends unknown[]
  ? InvokeChannel<C>["args"]
  : never

export type IpcInvokeResult<C extends keyof IpcInvokeMap> = InvokeChannel<C>["result"]

export type IpcApi = {
  invoke<C extends keyof IpcInvokeMap>(
    channel: C,
    ...args: IpcInvokeArgs<C>
  ): Promise<IpcInvokeResult<C>>
  on<C extends keyof IpcEventMap>(
    channel: C,
    listener: (payload: IpcEventMap[C]) => void,
  ): () => void
}
