/**
 * Integration-flavored tests for commitMergerResultToBaseRef.
 *
 * Runs against a real ephemeral git repo to exercise the CAS fast-forward,
 * temp-branch cleanup, detached-HEAD bypass, and worktree-hint codepaths.
 * Log assertions use an injected log dependency, not stdout capture.
 */
import { strict as assert } from "node:assert"
import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { after, before, describe, it } from "node:test"
import type { BaseRef } from "../git.ts"
import { resolveRef } from "../git.ts"
import { __testing, commitMergerResultToBaseRef, commitWaveMergerResult } from "../orchestrator.ts"

const { assertBaseRefStable } = __testing

describe("commitMergerResultToBaseRef (real git)", () => {
  let repo: string
  let originalCwd: string
  const git = (...a: string[]) => execFileSync("git", a, { cwd: repo, encoding: "utf8" }).trim()

  before(() => {
    originalCwd = process.cwd()
    repo = mkdtempSync(join(tmpdir(), "sandcastle-merger-test-"))
    process.chdir(repo)
    git("init", "-b", "main", "-q")
    git("config", "user.email", "test@example.com")
    git("config", "user.name", "Test")
    git("commit", "--allow-empty", "-m", "initial")
  })

  after(() => {
    process.chdir(originalCwd)
    rmSync(repo, { recursive: true, force: true })
  })

  it("happy path: base advances, temp branch deleted", () => {
    const baseSha = git("rev-parse", "main")
    const mergeBranch = "sandcastle/tmp-merge/happy"
    git("branch", mergeBranch, "main")
    git("checkout", "-q", mergeBranch)
    git("commit", "--allow-empty", "-m", "merger commit")
    const mergerTip = git("rev-parse", "HEAD")
    git("checkout", "-q", "main")

    const baseRef: BaseRef = { sha: baseSha, refName: "main" }
    const logs: string[] = []
    commitMergerResultToBaseRef(baseRef, mergeBranch, (msg) => logs.push(msg))

    // Base branch advanced to merger tip.
    assert.equal(git("rev-parse", "main"), mergerTip)
    // Temp branch deleted.
    assert.equal(resolveRef(mergeBranch).kind, "missing")
    // Log mentions the branch and short SHA.
    assert.ok(logs.some((l) => l.includes("main") && l.includes(mergerTip.slice(0, 7))))
  })

  it("stale-expected: helper throws, base unchanged, temp survives", () => {
    // Reset main to a known state.
    const baseSha = git("rev-parse", "main")
    const mergeBranch = "sandcastle/tmp-merge/stale"
    git("branch", mergeBranch, "main")
    git("checkout", "-q", mergeBranch)
    git("commit", "--allow-empty", "-m", "merger stale commit")
    git("checkout", "-q", "main")

    // Advance main concurrently so the CAS will fail.
    git("commit", "--allow-empty", "-m", "concurrent advance")
    const concurrentSha = git("rev-parse", "main")

    const baseRef: BaseRef = { sha: baseSha, refName: "main" }
    const logs: string[] = []
    assert.throws(
      () => commitMergerResultToBaseRef(baseRef, mergeBranch, (msg) => logs.push(msg)),
      (err: Error) => err.message.includes("moved") && err.message.includes(mergeBranch),
    )

    // Base branch is still at the concurrent SHA, NOT at baseSha.
    assert.equal(git("rev-parse", "main"), concurrentSha)
    // Temp branch survives (has unmerged commits).
    assert.equal(resolveRef(mergeBranch).kind, "resolved")
    // Clean up for subsequent tests.
    git("branch", "-D", mergeBranch)
  })

  it("detached-HEAD: helper no-ops cleanly", () => {
    const mergeBranch = "sandcastle/tmp-merge/detached"
    git("branch", mergeBranch, "main")

    const baseRef: BaseRef = { sha: git("rev-parse", "HEAD"), refName: "HEAD" }
    const logs: string[] = []
    commitMergerResultToBaseRef(baseRef, mergeBranch, (msg) => logs.push(msg))

    // Log says detached HEAD, names the temp branch.
    assert.ok(logs.some((l) => l.includes("Detached HEAD") && l.includes(mergeBranch)))
    // Early return before the try/finally — temp branch preserved as documented.

    // Clean up.
    git("branch", "-D", mergeBranch)
  })

  it("worktree-warn: hint message emitted when base branch is checked out", () => {
    const baseSha = git("rev-parse", "main")
    const mergeBranch = "sandcastle/tmp-merge/wt-hint"
    git("branch", mergeBranch, "main")
    git("checkout", "-q", mergeBranch)
    git("commit", "--allow-empty", "-m", "merger wt commit")
    git("checkout", "-q", "main")

    // main is checked out in the primary worktree — the hint should fire.
    const baseRef: BaseRef = { sha: baseSha, refName: "main" }
    const logs: string[] = []
    commitMergerResultToBaseRef(baseRef, mergeBranch, (msg) => logs.push(msg))

    assert.ok(
      logs.some((l) => l.includes("Hint") && l.includes("reset --hard")),
      `Expected a worktree hint, got: ${JSON.stringify(logs)}`,
    )
  })

  it("throws when merger branch does not exist (merger crashed)", () => {
    const baseRef: BaseRef = { sha: git("rev-parse", "main"), refName: "main" }
    const logs: string[] = []
    assert.throws(
      () =>
        commitMergerResultToBaseRef(baseRef, "sandcastle/tmp-merge/does-not-exist", (msg) =>
          logs.push(msg),
        ),
      (err: Error) => err.message.includes("not found") && err.message.includes("may have crashed"),
    )
  })

  it("throws when base branch was deleted concurrently", () => {
    const baseSha = git("rev-parse", "main")
    const mergeBranch = "sandcastle/tmp-merge/base-deleted"
    git("branch", mergeBranch, "main")
    git("checkout", "-q", mergeBranch)
    git("commit", "--allow-empty", "-m", "merger commit for deleted-base test")
    git("checkout", "-q", "main")

    // Use a non-existent branch as baseRef.refName to simulate deletion.
    const baseRef: BaseRef = { sha: baseSha, refName: "ghost-branch" }
    const logs: string[] = []
    assert.throws(
      () => commitMergerResultToBaseRef(baseRef, mergeBranch, (msg) => logs.push(msg)),
      (err: Error) => err.message.includes("no longer exists") && err.message.includes(mergeBranch),
    )
    // Temp branch survives (has unmerged commits).
    assert.equal(resolveRef(mergeBranch).kind, "resolved")
    git("branch", "-D", mergeBranch)
  })

  it("empty orphan temp branch is cleaned up in finally block", () => {
    const baseSha = git("rev-parse", "main")
    const mergeBranch = "sandcastle/tmp-merge/orphan-empty"
    // Create a temp branch at the same commit as main (no extra commits).
    git("branch", mergeBranch, "main")

    // Advance main so the CAS fails with "moved".
    git("commit", "--allow-empty", "-m", "advance for orphan test")
    const newMainSha = git("rev-parse", "main")

    const baseRef: BaseRef = { sha: baseSha, refName: "main" }
    assert.throws(
      () => commitMergerResultToBaseRef(baseRef, mergeBranch, () => {}),
      (err: Error) => err.message.includes("moved"),
    )

    // Main wasn't touched by the helper.
    assert.equal(git("rev-parse", "main"), newMainSha)
    // The empty orphan branch was cleaned up by the finally non-force delete,
    // because it has no unmerged commits (it's at the same point as an ancestor of main).
    assert.equal(resolveRef(mergeBranch).kind, "missing")
  })

  it("temp branch with commits survives the finally cleanup", () => {
    const baseSha = git("rev-parse", "main")
    const mergeBranch = "sandcastle/tmp-merge/orphan-commits"
    git("branch", mergeBranch, "main")
    git("checkout", "-q", mergeBranch)
    git("commit", "--allow-empty", "-m", "extra commit on temp")
    git("checkout", "-q", "main")

    // Advance main so CAS fails.
    git("commit", "--allow-empty", "-m", "advance for commit-orphan test")

    const baseRef: BaseRef = { sha: baseSha, refName: "main" }
    assert.throws(() => commitMergerResultToBaseRef(baseRef, mergeBranch, () => {}))

    // Temp branch with unmerged commits survives.
    assert.equal(resolveRef(mergeBranch).kind, "resolved")
    // Clean up.
    git("branch", "-D", mergeBranch)
  })

  it("non-fast-forward: helper throws naming both SHAs and preserves merger result", () => {
    // Reproduces the post-mortem bug: the orchestrator's mergerBaseRef.sha
    // matches the host branch tip (via the CAS old-value check), but the
    // merger forked from a different parent so the merger tip is not a
    // descendant of the base. The FF guard inside casFastForward must
    // reject this before update-ref mutates main.
    //
    // Setup: capture a snapshot of main, then advance main to a divergent
    // tip. Build the merge branch off the OLD snapshot — its commits are
    // not descendants of the new main tip, so update-ref must NOT advance.
    const oldMainSha = git("rev-parse", "main")
    git("commit", "--allow-empty", "-m", "main advanced past oldMainSha")
    const newMainSha = git("rev-parse", "main")

    // Merge branch forks off the OLD snapshot — explicitly NOT a descendant
    // of newMainSha.
    const mergeBranch = "sandcastle/tmp-merge/non-ff"
    git("checkout", "-q", "-b", mergeBranch, oldMainSha)
    git("commit", "--allow-empty", "-m", "merger commit on wrong parent")
    const mergerTip = git("rev-parse", "HEAD")
    git("checkout", "-q", "main")

    // Use newMainSha as the expected base SHA: matches main's current tip
    // (CAS old-value check would succeed) but mergerTip is not a descendant
    // of it. The FF guard must reject the update.
    const baseRef: BaseRef = { sha: newMainSha, refName: "main" }
    assert.throws(
      () => commitMergerResultToBaseRef(baseRef, mergeBranch, () => {}),
      (err: Error) => {
        assert.ok(
          err.message.includes("not a descendant"),
          `Expected 'not a descendant', got: ${err.message}`,
        )
        assert.ok(
          err.message.includes(mergerTip.slice(0, 7)),
          `Expected merger tip short SHA, got: ${err.message}`,
        )
        assert.ok(
          err.message.includes(newMainSha.slice(0, 7)),
          `Expected expected short SHA, got: ${err.message}`,
        )
        assert.ok(
          err.message.includes(mergeBranch),
          `Expected merge branch name, got: ${err.message}`,
        )
        return true
      },
    )

    // The whole point of the guard: main was NOT advanced.
    assert.equal(git("rev-parse", "main"), newMainSha)
    // Merger result preserved on the temp branch (has unmerged commits).
    assert.equal(resolveRef(mergeBranch).kind, "resolved")

    // Clean up.
    git("branch", "-D", mergeBranch)
  })
})

describe("commitWaveMergerResult (wave chain, real git)", () => {
  let repo: string
  let originalCwd: string
  const git = (...a: string[]) => execFileSync("git", a, { cwd: repo, encoding: "utf8" }).trim()

  before(() => {
    originalCwd = process.cwd()
    repo = mkdtempSync(join(tmpdir(), "sandcastle-wave-test-"))
    process.chdir(repo)
    git("init", "-b", "main", "-q")
    git("config", "user.email", "test@example.com")
    git("config", "user.name", "Test")
    git("commit", "--allow-empty", "-m", "initial")
  })

  after(() => {
    process.chdir(originalCwd)
    rmSync(repo, { recursive: true, force: true })
  })

  it("wave 0 failure wraps inner error with 'Wave 1' context", () => {
    const baseRef: BaseRef = { sha: git("rev-parse", "main"), refName: "main" }
    const logs: string[] = []
    assert.throws(
      () =>
        commitWaveMergerResult(baseRef, "sandcastle/tmp-merge/ghost-branch", 0, (m) =>
          logs.push(m),
        ),
      (err: Error) => {
        assert.ok(err.message.includes("Wave 1"), `Expected 'Wave 1', got: ${err.message}`)
        assert.ok(err.message.includes("not found"), `Expected 'not found', got: ${err.message}`)
        assert.ok(err.cause instanceof Error, "Expected cause to preserve original error")
        return true
      },
    )
  })

  it("detached HEAD with missing merge branch returns unchanged baseRef", () => {
    const sha = git("rev-parse", "main")
    const baseRef: BaseRef = { sha, refName: "HEAD" }
    const logs: string[] = []
    const result = commitWaveMergerResult(baseRef, "sandcastle/tmp-merge/ghost-detached", 0, (m) =>
      logs.push(m),
    )
    assert.equal(result.sha, sha)
    assert.equal(result.refName, "HEAD")
  })

  it("per-wave base ref evolution: host branch advances after wave 1, wave 2 forks from post-wave-1 tip", () => {
    const initialSha = git("rev-parse", "main")

    // Wave 0: fork temp branch from initial SHA, add a merge commit.
    const mergeBranch0 = "sandcastle/tmp-merge/wave-evol-0"
    git("checkout", "-q", "-b", mergeBranch0, initialSha)
    git("commit", "--allow-empty", "-m", "wave-0 merge commit")
    const wave0Tip = git("rev-parse", "HEAD")
    git("checkout", "-q", "main")

    const logs: string[] = []
    const baseRef0: BaseRef = { sha: initialSha, refName: "main" }
    const baseRef1 = commitWaveMergerResult(baseRef0, mergeBranch0, 0, (m) => logs.push(m))

    // main advanced to wave 0's merger tip.
    assert.equal(git("rev-parse", "main"), wave0Tip)
    assert.equal(baseRef1.sha, wave0Tip)
    assert.equal(baseRef1.refName, "main")
    // Temp branch deleted.
    assert.equal(resolveRef(mergeBranch0).kind, "missing")

    // Wave 1: fork temp branch from post-wave-0 tip, add a merge commit.
    const mergeBranch1 = "sandcastle/tmp-merge/wave-evol-1"
    git("checkout", "-q", "-b", mergeBranch1, baseRef1.sha)
    git("commit", "--allow-empty", "-m", "wave-1 merge commit")
    const wave1Tip = git("rev-parse", "HEAD")
    git("checkout", "-q", "main")

    const baseRef2 = commitWaveMergerResult(baseRef1, mergeBranch1, 1, (m) => logs.push(m))

    // main advanced to wave 1's merger tip.
    assert.equal(git("rev-parse", "main"), wave1Tip)
    assert.equal(baseRef2.sha, wave1Tip)
    assert.equal(baseRef2.refName, "main")
    // Wave 1's CAS expected SHA was the post-wave-0 SHA, not the run-start SHA.
    assert.notEqual(baseRef1.sha, initialSha)
    // Both waves' commits are in main's history.
    const history = git("log", "--oneline", `${initialSha}..main`)
    assert.ok(history.includes("wave-0 merge commit"))
    assert.ok(history.includes("wave-1 merge commit"))
  })

  it("detached-HEAD wave chain: both temp branches survive, wave 1 forks from wave 0 tip", () => {
    const initialSha = git("rev-parse", "main")

    // Wave 0: detached HEAD.
    const mergeBranch0 = "sandcastle/tmp-merge/detached-w0"
    git("checkout", "-q", "-b", mergeBranch0, initialSha)
    git("commit", "--allow-empty", "-m", "detached wave-0 commit")
    const wave0Tip = git("rev-parse", "HEAD")
    git("checkout", "-q", "main")

    const logs: string[] = []
    const baseRef0: BaseRef = { sha: initialSha, refName: "HEAD" }
    const baseRef1 = commitWaveMergerResult(baseRef0, mergeBranch0, 0, (m) => logs.push(m))

    assert.equal(baseRef1.sha, wave0Tip)
    assert.equal(baseRef1.refName, "HEAD")
    // Wave 0's temp branch survives (detached HEAD, no CAS).
    assert.equal(resolveRef(mergeBranch0).kind, "resolved")

    // Wave 1: fork from wave 0's tip.
    const mergeBranch1 = "sandcastle/tmp-merge/detached-w1"
    git("checkout", "-q", "-b", mergeBranch1, baseRef1.sha)
    git("commit", "--allow-empty", "-m", "detached wave-1 commit")
    const wave1Tip = git("rev-parse", "HEAD")
    git("checkout", "-q", "main")

    const baseRef2 = commitWaveMergerResult(baseRef1, mergeBranch1, 1, (m) => logs.push(m))

    assert.equal(baseRef2.sha, wave1Tip)
    assert.equal(baseRef2.refName, "HEAD")
    // Both temp branches survive.
    assert.equal(resolveRef(mergeBranch0).kind, "resolved")
    assert.equal(resolveRef(mergeBranch1).kind, "resolved")
    // Wave 0's commit is an ancestor of wave 1's tip.
    const mergeBase = git("merge-base", wave0Tip, wave1Tip)
    assert.equal(mergeBase, wave0Tip)

    // Clean up.
    git("branch", "-D", mergeBranch0)
    git("branch", "-D", mergeBranch1)
  })

  it("wave-failure termination: wave 1 lands, wave 2 fails, wave 1 effects remain", () => {
    const initialSha = git("rev-parse", "main")

    // Wave 0: succeeds.
    const mergeBranch0 = "sandcastle/tmp-merge/fail-w0"
    git("checkout", "-q", "-b", mergeBranch0, initialSha)
    git("commit", "--allow-empty", "-m", "fail-test wave-0 commit")
    const wave0Tip = git("rev-parse", "HEAD")
    git("checkout", "-q", "main")

    const logs: string[] = []
    const baseRef0: BaseRef = { sha: initialSha, refName: "main" }
    const baseRef1 = commitWaveMergerResult(baseRef0, mergeBranch0, 0, (m) => logs.push(m))
    assert.equal(baseRef1.sha, wave0Tip)

    // Concurrent advance: someone else pushes to main after wave 0 landed.
    git("commit", "--allow-empty", "-m", "concurrent advance")
    const concurrentSha = git("rev-parse", "main")

    // Wave 1: fork from wave 0's tip (as the orchestrator would), add a commit.
    // CAS will fail because main moved past wave0Tip.
    const mergeBranch1 = "sandcastle/tmp-merge/fail-w1"
    git("checkout", "-q", "-b", mergeBranch1, baseRef1.sha)
    git("commit", "--allow-empty", "-m", "fail-test wave-1 commit")
    git("checkout", "-q", "main")

    assert.throws(
      () => commitWaveMergerResult(baseRef1, mergeBranch1, 1, (m) => logs.push(m)),
      (err: Error) => err.message.includes("Wave 2") && err.message.includes(mergeBranch1),
    )

    // Wave 0's effects remain on main (the concurrent advance is ahead of wave0Tip).
    assert.equal(git("rev-parse", "main"), concurrentSha)
    const mergeBase = git("merge-base", wave0Tip, concurrentSha)
    assert.equal(mergeBase, wave0Tip, "Wave 0's tip should be an ancestor of main")

    // Wave 1's temp branch survives (has unmerged commits).
    assert.equal(resolveRef(mergeBranch1).kind, "resolved")

    // Clean up.
    git("branch", "-D", mergeBranch1)
  })
})

describe("assertBaseRefStable", () => {
  let repo: string
  let originalCwd: string
  const git = (...a: string[]) => execFileSync("git", a, { cwd: repo, encoding: "utf8" }).trim()

  before(() => {
    originalCwd = process.cwd()
    repo = mkdtempSync(join(tmpdir(), "sandcastle-invariant-test-"))
    process.chdir(repo)
    git("init", "-b", "main", "-q")
    git("config", "user.email", "test@example.com")
    git("config", "user.name", "Test")
    git("commit", "--allow-empty", "-m", "initial")
  })

  after(() => {
    process.chdir(originalCwd)
    rmSync(repo, { recursive: true, force: true })
  })

  it("returns silently when baseRef matches the current branch tip", () => {
    const sha = git("rev-parse", "main")
    const baseRef: BaseRef = { sha, refName: "main" }
    assert.doesNotThrow(() => assertBaseRefStable(baseRef, 0))
  })

  it("returns silently on detached HEAD (no branch to compare against)", () => {
    const sha = git("rev-parse", "main")
    const baseRef: BaseRef = { sha, refName: "HEAD" }
    assert.doesNotThrow(() => assertBaseRefStable(baseRef, 0))
  })

  it("throws with wave-numbered message when the host branch advanced underneath the run", () => {
    const baseSha = git("rev-parse", "main")
    // Simulate the host moving forward (e.g. user committed on main directly,
    // or a wave landed and then someone pushed something else).
    git("commit", "--allow-empty", "-m", "concurrent commit on main")
    const newSha = git("rev-parse", "main")

    const baseRef: BaseRef = { sha: baseSha, refName: "main" }
    assert.throws(
      () => assertBaseRefStable(baseRef, 1),
      (err: Error) => {
        assert.ok(err.message.includes("Wave 2"), `Expected 'Wave 2', got: ${err.message}`)
        assert.ok(
          err.message.includes("moved underneath"),
          `Expected 'moved underneath', got: ${err.message}`,
        )
        assert.ok(
          err.message.includes(baseSha.slice(0, 7)),
          `Expected expected short SHA, got: ${err.message}`,
        )
        assert.ok(
          err.message.includes(newSha.slice(0, 7)),
          `Expected found short SHA, got: ${err.message}`,
        )
        return true
      },
    )
  })

  it("throws when the host branch was deleted underneath the run", () => {
    // Create a separate branch we can safely delete.
    git("branch", "ephemeral", "main")
    const ephemeralSha = git("rev-parse", "ephemeral")
    git("branch", "-D", "ephemeral")

    const baseRef: BaseRef = { sha: ephemeralSha, refName: "ephemeral" }
    assert.throws(
      () => assertBaseRefStable(baseRef, 0),
      (err: Error) => {
        assert.ok(err.message.includes("Wave 1"), `Expected 'Wave 1', got: ${err.message}`)
        assert.ok(
          err.message.includes("no longer exists"),
          `Expected 'no longer exists', got: ${err.message}`,
        )
        return true
      },
    )
  })
})
