import { format } from "node:util"
import type { PaneHandle } from "./multiplexing-renderer.ts"

type ConsoleMethod = "log" | "info" | "warn" | "error" | "debug"

const PATCHED: readonly ConsoleMethod[] = ["log", "info", "warn", "error", "debug"]

export type RestoreConsole = () => void

/**
 * Redirect `console.log/info/warn/error/debug` into the given pane while a live
 * pane render is active. Library code (e.g. `@ai-hero/sandcastle`) writes
 * status lines straight to stdout via `console.log`; without this redirect
 * those lines slip past the pane's row tracker and break in-place redraws,
 * leaving the pane header repeated several times on screen.
 */
export function redirectConsoleToPane(pane: PaneHandle): RestoreConsole {
  const originals = new Map<ConsoleMethod, typeof console.log>()

  for (const method of PATCHED) {
    originals.set(method, console[method])
    console[method] = ((...args: unknown[]) => {
      const formatted = format(...args)
      for (const line of formatted.split("\n")) {
        pane.appendLine(line)
      }
    }) as typeof console.log
  }

  return () => {
    for (const method of PATCHED) {
      const original = originals.get(method)
      if (original) console[method] = original
    }
  }
}
