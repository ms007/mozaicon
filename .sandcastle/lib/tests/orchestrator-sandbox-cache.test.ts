/**
 * Tests for the lazy, wave-correct sandbox cache.
 *
 * The cache must materialise SandboxHooks at sandbox-creation time using
 * the *current* base SHA — not the run-start SHA captured at orchestrator
 * boot. This is what makes a multi-wave run actually build wave 2 on top
 * of wave 1's outcome: an issue first picked up after wave 1 lands gets a
 * sandbox whose `git reset --hard <sha>` targets the post-wave-1 base, not
 * the stale run-start base.
 */
import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import type {
  AgentProvider,
  Sandbox,
  SandboxHooks,
  SandboxProvider,
} from "@ai-hero/sandcastle"
import type { ResolvedConfig, SandboxHooksFactory } from "../config.ts"
import { __testing } from "../orchestrator.ts"
import type { IssueRef } from "../types.ts"

const { createSandboxCache, buildObserveDeps } = __testing

const fakeAgent = { name: "fake-agent" } as unknown as AgentProvider
const fakeSandbox = { name: "fake-sandbox" } as unknown as SandboxProvider

const stubSandbox: Sandbox = {
  branch: "stub",
  worktreePath: "/dev/null",
  run: async () => ({ iterations: [], stdout: "", commits: [] }),
  interactive: async () => ({ commits: [], exitCode: 0 }),
  close: async () => ({}),
  [Symbol.asyncDispose]: async () => {},
}

const buildResolved = (hooksFactory?: SandboxHooksFactory): ResolvedConfig => ({
  seedIssue: 1,
  runId: "01JTEST",
  stages: {
    implement: {
      agent: fakeAgent,
      promptFile: "p.md",
      promptArgs: {},
      sandbox: fakeSandbox,
      ...(hooksFactory ? { hooksFactory } : {}),
    },
    review: { agent: fakeAgent, promptFile: "r.md", promptArgs: {} },
    merge: {
      agent: fakeAgent,
      promptFile: "m.md",
      promptArgs: {},
      sandbox: fakeSandbox,
    },
  },
  tickCap: 10,
  attemptCap: 3,
  logDir: undefined,
})

const issue = (n: number): IssueRef => ({
  number: n,
  title: `feat: ${n}`,
  itemId: `PVTI_${n}`,
  branch: `sandcastle/issue-${n}`,
})

describe("createSandboxCache (lazy, wave-correct hooks)", () => {
  it("calls the hooks factory with the SHA returned at cache.get() time, not at construction time", () => {
    const factoryCalls: string[] = []
    const hooksFactory: SandboxHooksFactory = (sha) => {
      factoryCalls.push(sha)
      return { sandbox: { onSandboxReady: [{ command: `git reset --hard ${sha}` }] } }
    }
    const resolved = buildResolved(hooksFactory)

    let currentSha = "wave0-sha-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    const seenHooks: (SandboxHooks | undefined)[] = []
    const fakeCreate = ((opts: { hooks?: SandboxHooks }) => {
      seenHooks.push(opts.hooks)
      return Promise.resolve(stubSandbox)
    }) as unknown as Parameters<typeof createSandboxCache>[2]

    const cache = createSandboxCache(resolved, () => currentSha, fakeCreate)

    // Wave 0: issue 1.
    void cache.get(issue(1))
    assert.deepEqual(factoryCalls, [currentSha])

    // Wave 1 lands — the merger advances mergerBaseRef.
    currentSha = "wave1-sha-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"

    // Wave 1: issue 2 (was blocked, now unblocked) — must see the new SHA.
    void cache.get(issue(2))
    assert.deepEqual(factoryCalls, [
      "wave0-sha-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "wave1-sha-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    ])
    assert.equal(seenHooks.length, 2)
    const cmd0 = seenHooks[0]?.sandbox?.onSandboxReady?.[0]?.command
    const cmd1 = seenHooks[1]?.sandbox?.onSandboxReady?.[0]?.command
    assert.ok(cmd0?.endsWith("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"))
    assert.ok(cmd1?.endsWith("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"))
  })

  it("does NOT invoke the hooks factory at construction time", () => {
    const factoryCalls: string[] = []
    const hooksFactory: SandboxHooksFactory = (sha) => {
      factoryCalls.push(sha)
      return { sandbox: { onSandboxReady: [{ command: `noop ${sha}` }] } }
    }
    const resolved = buildResolved(hooksFactory)
    const fakeCreate = (() => Promise.resolve(stubSandbox)) as unknown as Parameters<
      typeof createSandboxCache
    >[2]

    createSandboxCache(resolved, () => "should-not-be-read", fakeCreate)

    // No issue has been requested yet — nothing should have been materialised.
    assert.deepEqual(factoryCalls, [])
  })

  it("memoises by issue number and does not re-invoke the factory on a repeat get()", () => {
    const factoryCalls: string[] = []
    const hooksFactory: SandboxHooksFactory = (sha) => {
      factoryCalls.push(sha)
      return { sandbox: { onSandboxReady: [{ command: `r ${sha}` }] } }
    }
    const resolved = buildResolved(hooksFactory)
    let currentSha = "first-sha-1111111111111111111111111111111111111111"
    const fakeCreate = (() => Promise.resolve(stubSandbox)) as unknown as Parameters<
      typeof createSandboxCache
    >[2]
    const cache = createSandboxCache(resolved, () => currentSha, fakeCreate)

    void cache.get(issue(1))
    // Even if the underlying SHA "advances", a repeat get() for the same
    // issue must reuse the cached sandbox, not rebuild it.
    currentSha = "second-sha-22222222222222222222222222222222222222"
    void cache.get(issue(1))

    assert.deepEqual(factoryCalls, ["first-sha-1111111111111111111111111111111111111111"])
  })

  it("works without a hooks factory (omits hooks from createSandbox options)", () => {
    const resolved = buildResolved(undefined)
    const seenHooks: (SandboxHooks | undefined)[] = []
    const fakeCreate = ((opts: { hooks?: SandboxHooks }) => {
      seenHooks.push(opts.hooks)
      return Promise.resolve(stubSandbox)
    }) as unknown as Parameters<typeof createSandboxCache>[2]

    const cache = createSandboxCache(resolved, () => "any-sha", fakeCreate)
    void cache.get(issue(1))

    assert.equal(seenHooks.length, 1)
    assert.equal(seenHooks[0], undefined)
  })
})

describe("buildObserveDeps (lazy base ref)", () => {
  it("re-reads the base ref on every getCommitsAhead call so wave-2 counts are wave-correct", () => {
    // We can't run real git here without setup, but we can prove the lazy
    // wiring by counting how often the getter is read.
    const reads: string[] = []
    let current: { sha: string; refName: string } = { sha: "wave0", refName: "main" }
    const observe = buildObserveDeps(() => {
      reads.push(current.sha)
      return { sha: current.sha, refName: current.refName }
    })

    // First call from the manager — observe must consult the getter.
    try {
      observe.getCommitsAhead("any-branch")
    } catch {
      // countCommitsAhead may throw because "any-branch" doesn't exist —
      // we don't care, we only assert the getter was consulted.
    }

    // Mutate the ref as if a wave landed.
    current = { sha: "wave1", refName: "main" }
    try {
      observe.getCommitsAhead("any-branch")
    } catch {
      // same as above
    }

    assert.deepEqual(reads, ["wave0", "wave1"])
  })
})
