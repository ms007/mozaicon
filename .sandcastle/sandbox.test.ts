/**
 * Tests for the project-specific sandbox hooks factory.
 *
 * The hook factory is what makes a multi-wave run resilient against the user
 * switching the host HEAD mid-run: each wave's onSandboxReady starts with a
 * `git reset --hard <wave-correct-sha>` so the sandbox worktree is pinned to
 * the run-fixed baseRef regardless of where the host wandered to.
 */
import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import { buildSandboxHooks } from "./sandbox.ts"

describe("buildSandboxHooks", () => {
  const baseSha = "abcdef1234567890abcdef1234567890abcdef12"

  it("emits `git reset --hard <baseSha>` as the first onSandboxReady command", () => {
    const hooks = buildSandboxHooks(baseSha)
    const commands = hooks.sandbox?.onSandboxReady ?? []
    assert.equal(
      commands.length >= 1,
      true,
      "Expected at least one onSandboxReady command (the reset).",
    )
    assert.deepEqual(commands[0], { command: `git reset --hard ${baseSha}` })
  })

  it("interpolates the exact base SHA into the reset command", () => {
    const a = buildSandboxHooks("aaaaaaa1111111aaaaaaa1111111aaaaaaa11111")
    const b = buildSandboxHooks("bbbbbbb2222222bbbbbbb2222222bbbbbbb22222")
    const aReset = a.sandbox?.onSandboxReady?.[0]?.command
    const bReset = b.sandbox?.onSandboxReady?.[0]?.command
    assert.notEqual(aReset, bReset)
    assert.ok(aReset?.endsWith("aaaaaaa1111111aaaaaaa1111111aaaaaaa11111"))
    assert.ok(bReset?.endsWith("bbbbbbb2222222bbbbbbb2222222bbbbbbb22222"))
  })

  it("keeps the pnpm install warm-up command after the reset", () => {
    const hooks = buildSandboxHooks(baseSha)
    const commands = hooks.sandbox?.onSandboxReady ?? []
    // Reset must come BEFORE install so install runs on the right tree.
    const installIndex = commands.findIndex((c) => c.command.includes("pnpm install"))
    assert.ok(
      installIndex > 0,
      `Expected pnpm install after reset, got commands: ${JSON.stringify(commands)}`,
    )
    assert.equal(commands[0]?.command.startsWith("git reset --hard "), true)
  })
})
