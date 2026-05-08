import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import { redirectConsoleToPane } from "../console-interceptor.ts"
import type { PaneHandle } from "../multiplexing-renderer.ts"

function fakePane() {
  const lines: string[] = []
  const sticky: string[] = []
  const handle: PaneHandle = {
    appendLine: (line) => {
      lines.push(line)
    },
    appendSticky: (line) => {
      sticky.push(line)
    },
    setTitle: () => {},
    close: () => {},
  }
  return { handle, lines, sticky }
}

describe("redirectConsoleToPane", () => {
  it("routes console.log/info/warn/error/debug into the pane", () => {
    const { handle, lines } = fakePane()
    const restore = redirectConsoleToPane(handle)
    try {
      console.log("hello %s", "world")
      console.info("info-msg")
      console.warn("warn-msg")
      console.error("err-msg")
      console.debug("debug-msg")
    } finally {
      restore()
    }

    assert.deepEqual(lines, [
      "hello world",
      "info-msg",
      "warn-msg",
      "err-msg",
      "debug-msg",
    ])
  })

  it("splits multi-line output into one append per physical line", () => {
    const { handle, lines } = fakePane()
    const restore = redirectConsoleToPane(handle)
    try {
      console.log("line one\nline two\nline three")
    } finally {
      restore()
    }

    assert.deepEqual(lines, ["line one", "line two", "line three"])
  })

  it("restores the original console methods when the restore callback runs", () => {
    const before = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    }
    const { handle } = fakePane()

    const restore = redirectConsoleToPane(handle)
    assert.notEqual(console.log, before.log)
    restore()

    assert.equal(console.log, before.log)
    assert.equal(console.info, before.info)
    assert.equal(console.warn, before.warn)
    assert.equal(console.error, before.error)
    assert.equal(console.debug, before.debug)
  })

  it("formats objects via util.format", () => {
    const { handle, lines } = fakePane()
    const restore = redirectConsoleToPane(handle)
    try {
      console.log({ a: 1, b: "two" })
    } finally {
      restore()
    }

    assert.equal(lines.length, 1)
    assert.match(lines[0] as string, /a: 1/)
    assert.match(lines[0] as string, /b: 'two'/)
  })
})
