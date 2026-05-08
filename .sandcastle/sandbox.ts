/**
 * Project-specific sandbox configuration: builds the chown-narrow Docker
 * provider with our local image, named volumes for the JS workspace, and
 * the install hook that warms `node_modules/` after sandbox boot.
 */
import type { SandboxHooks } from "@ai-hero/sandcastle"
import type { SandboxFactory } from "./lib/config.ts"
import { docker, workspaceVolumes } from "./sandboxes/docker/index.ts"

export const sandbox: SandboxFactory = (runId) =>
  docker({
    imageName: "sandcastle:latest",
    namePrefix: runId,
    volumes: workspaceVolumes({
      nodeModules: "sandcastle-node-modules",
      pnpmStore: "sandcastle-pnpm-store",
    }),
  })

/**
 * Build sandbox hooks pinned to a specific base SHA.
 *
 * The first onSandboxReady command force-resets the worktree to `baseSha`
 * regardless of what @ai-hero/sandcastle's branch-strategy did or what the
 * host HEAD is currently pointing at. This is what makes the orchestrator
 * resilient against the user `git checkout`-ing a different branch on the
 * host while a multi-wave run is in progress: each wave's sandbox starts
 * from the run-fixed baseRef, not from the live host HEAD.
 */
export const buildSandboxHooks = (baseSha: string): SandboxHooks => ({
  sandbox: {
    onSandboxReady: [
      { command: `git reset --hard ${baseSha}` },
      { command: "pnpm install --prefer-offline" },
    ],
  },
})
