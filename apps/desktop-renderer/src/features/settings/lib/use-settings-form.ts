import type { OverlayState } from "@repo/ipc"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import {
  applySettings,
  getSettings,
  onOverlayState,
  reloadChat,
  setAlwaysOnTop,
  setClickThrough,
  setFrame,
  setOverlaySize,
  setOverlayVisible,
  settingsQueryKey,
} from "@/lib/main"

export function useSettingsForm() {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: settingsQueryKey,
    queryFn: getSettings,
    retry: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    return onOverlayState((state) => {
      queryClient.setQueryData<OverlayState>(settingsQueryKey, state)
    })
  }, [queryClient])

  const apply = useMutation({
    mutationFn: (input: { url: string; css: string }) => applySettings(input.url, input.css),
  })

  const reload = useMutation({
    mutationFn: reloadChat,
  })

  const visible = useMutation({
    mutationFn: (next: boolean) => setOverlayVisible(next),
  })

  const frame = useMutation({
    mutationFn: (enabled: boolean) => setFrame(enabled),
  })

  const clickThrough = useMutation({
    mutationFn: (enabled: boolean) => setClickThrough(enabled),
  })

  const alwaysOnTop = useMutation({
    mutationFn: (enabled: boolean) => setAlwaysOnTop(enabled),
  })

  const size = useMutation({
    mutationFn: (input: { width: number; height: number }) =>
      setOverlaySize(input.width, input.height),
  })

  return {
    data,
    isPending,
    loadError: error instanceof Error ? error.message : null,
    apply,
    reload,
    visible,
    frame,
    clickThrough,
    alwaysOnTop,
    size,
  }
}
