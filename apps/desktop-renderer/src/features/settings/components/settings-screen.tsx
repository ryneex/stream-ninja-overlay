import { Button } from "@repo/ui/components/button"
import { Checkbox } from "@repo/ui/components/checkbox"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import { Textarea } from "@repo/ui/components/textarea"
import { useEffect, useRef, useState } from "react"

import { quitApp } from "@/lib/main"

import { isCatalogTheme, overlayThemeGroups, overlayThemes } from "../lib/overlay-themes"
import { composeOverlayUrl, readOverlayTarget } from "../lib/overlay-url"
import { useSettingsForm } from "../lib/use-settings-form"

type SettingsDraft = {
  sessionId: string
  themeFile: string
  savedUrl: string
  css: string
}

function themeItems(themeFile: string, themeKnown: boolean) {
  const saved = themeFile && !themeKnown ? [{ value: themeFile, label: themeFile }] : []
  return [...saved, ...overlayThemes.map((theme) => ({ value: theme.file, label: theme.label }))]
}

export function SettingsScreen() {
  const form = useSettingsForm()
  const [draft, setDraft] = useState<SettingsDraft | null>(null)
  const [status, setStatus] = useState("")

  if (form.data && draft === null) {
    const target = readOverlayTarget(form.data.url)
    setDraft({
      sessionId: target.sessionId,
      themeFile: target.themeFile,
      savedUrl: form.data.url,
      css: form.data.css,
    })
  }

  if (form.isPending || (form.data && draft === null)) {
    return (
      <main className="flex h-dvh items-center justify-center">
        <p className="text-muted-foreground">Loading settings…</p>
      </main>
    )
  }

  if (form.loadError || !form.data || !draft) {
    return (
      <main className="flex h-dvh p-6">
        <p role="alert">{form.loadError ?? "Couldn't open settings."}</p>
      </main>
    )
  }

  const data = form.data
  const message = form.apply.error instanceof Error ? form.apply.error.message : status
  const overlayUrl = composeOverlayUrl(draft.sessionId, draft.themeFile, draft.savedUrl)
  const themeKnown = isCatalogTheme(draft.themeFile)

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col gap-4 overflow-y-auto px-5 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Stream Ninja</h1>
        <p className="text-muted-foreground text-xs">
          This window is the app. Chat is a separate overlay.
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <Label htmlFor="session">Session ID</Label>
        <Input
          id="session"
          spellCheck={false}
          autoComplete="off"
          placeholder="EE8QNKvR6N"
          value={draft.sessionId}
          onChange={(event) =>
            setDraft((current) => current && { ...current, sessionId: event.target.value })
          }
        />
        <p className="text-muted-foreground text-xs">
          Paste the session id from Social Stream Ninja, for example EE8QNKvR6N.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="theme">Theme</Label>
        <Select
          value={draft.themeFile === "" ? null : draft.themeFile}
          items={themeItems(draft.themeFile, themeKnown)}
          onValueChange={(value) => {
            if (value == null) return
            setDraft((current) => current && { ...current, themeFile: value })
          }}
        >
          <SelectTrigger id="theme">
            <SelectValue placeholder="Choose a theme" />
          </SelectTrigger>
          <SelectContent>
            {draft.themeFile && !themeKnown ? (
              <SelectGroup>
                <SelectLabel>Saved theme</SelectLabel>
                <SelectItem value={draft.themeFile}>{draft.themeFile}</SelectItem>
              </SelectGroup>
            ) : null}
            {overlayThemeGroups.map((group) => (
              <SelectGroup key={group.id}>
                <SelectLabel>{group.label}</SelectLabel>
                {overlayThemes
                  .filter((theme) => theme.group === group.id)
                  .map((theme) => (
                    <SelectItem key={theme.file} value={theme.file}>
                      {theme.label}
                    </SelectItem>
                  ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Themes from the Social Stream Ninja overlay gallery. <code>transparent</code> is added if
          it is missing.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="overlay-url">Overlay URL</Label>
        <Input
          id="overlay-url"
          readOnly
          spellCheck={false}
          value={overlayUrl}
          className="font-mono text-xs"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="css">Custom CSS</Label>
        <Textarea
          id="css"
          rows={7}
          spellCheck={false}
          placeholder="/* overrides for the chat page */"
          value={draft.css}
          className="min-h-24 font-mono text-xs"
          onChange={(event) =>
            setDraft((current) => current && { ...current, css: event.target.value })
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          disabled={form.apply.isPending}
          onClick={() => {
            setStatus("Saving…")
            form.apply.mutate(
              { url: overlayUrl, css: draft.css },
              {
                onSuccess: (next) => {
                  const target = readOverlayTarget(next)
                  setDraft(
                    (current) =>
                      current && {
                        ...current,
                        sessionId: target.sessionId,
                        themeFile: target.themeFile,
                        savedUrl: next,
                      },
                  )
                  setStatus("Saved")
                },
                onError: () => setStatus(""),
              },
            )
          }}
        >
          Apply
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={form.reload.isPending}
          onClick={() => {
            form.reload.mutate(undefined, {
              onSuccess: () => setStatus("Reloaded"),
              onError: (error) =>
                setStatus(error instanceof Error ? error.message : "Reload failed"),
            })
          }}
        >
          Reload chat
        </Button>
        <span className="text-muted-foreground text-xs" role="status">
          {message}
        </span>
      </div>

      <section className="border-border flex flex-col gap-3 border-t pt-4">
        <h2 className="text-sm font-semibold">Chat window</h2>
        <div className="flex gap-2">
          <Button type="button" onClick={() => form.visible.mutate(true)}>
            Open chat
          </Button>
          <Button type="button" variant="ghost" onClick={() => form.visible.mutate(false)}>
            Close chat
          </Button>
        </div>
        <Check
          label="Drag border"
          checked={data.frame}
          onCheckedChange={(checked) => form.frame.mutate(checked)}
        />
        <p className="text-muted-foreground text-xs">
          The border can be dragged and resized, and its Close button hides the chat. Turn it off
          for a clean overlay. Click-through ignores the border.
        </p>
        <Check
          label="Click-through"
          checked={data.clickThrough}
          onCheckedChange={(checked) => form.clickThrough.mutate(checked)}
        />
        <p className="text-muted-foreground text-xs">
          Clicks pass through the chat. Ctrl+Shift+Alt+X toggles this. Ctrl+Shift+Alt+R reloads.
        </p>
        <Check
          label="Always on top"
          checked={data.alwaysOnTop}
          onCheckedChange={(checked) => form.alwaysOnTop.mutate(checked)}
        />
        <SizeFields
          width={data.width}
          height={data.height}
          onCommit={(width, height) => form.size.mutate({ width, height })}
        />
      </section>

      <Button type="button" variant="ghost" className="w-fit" onClick={() => void quitApp()}>
        Quit
      </Button>
    </main>
  )
}

function Check({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Label className="text-sm font-normal">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      {label}
    </Label>
  )
}

function SizeFields({
  width,
  height,
  onCommit,
}: {
  width: number
  height: number
  onCommit: (width: number, height: number) => void
}) {
  const [draftWidth, setDraftWidth] = useState(String(width))
  const [draftHeight, setDraftHeight] = useState(String(height))
  const widthFocused = useRef(false)
  const heightFocused = useRef(false)

  useEffect(() => {
    if (!widthFocused.current) setDraftWidth(String(width))
  }, [width])

  useEffect(() => {
    if (!heightFocused.current) setDraftHeight(String(height))
  }, [height])

  function commit(nextWidth: string, nextHeight: string) {
    const widthValue = Number(nextWidth)
    const heightValue = Number(nextHeight)
    if (!Number.isFinite(widthValue) || !Number.isFinite(heightValue)) return
    onCommit(widthValue, heightValue)
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="width">Width</Label>
        <Input
          id="width"
          type="number"
          min={240}
          max={4000}
          step={10}
          value={draftWidth}
          onFocus={() => {
            widthFocused.current = true
          }}
          onBlur={() => {
            widthFocused.current = false
            commit(draftWidth, draftHeight)
          }}
          onChange={(event) => setDraftWidth(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="height">Height</Label>
        <Input
          id="height"
          type="number"
          min={180}
          max={4000}
          step={10}
          value={draftHeight}
          onFocus={() => {
            heightFocused.current = true
          }}
          onBlur={() => {
            heightFocused.current = false
            commit(draftWidth, draftHeight)
          }}
          onChange={(event) => setDraftHeight(event.target.value)}
        />
      </div>
    </div>
  )
}
