import type { AgentProvider, PromptArgs, SandboxHooks, SandboxProvider } from "@ai-hero/sandcastle"

/**
 * Build sandbox hooks pinned to a specific base SHA. The orchestrator calls
 * this once per stage invocation with the wave-correct base SHA so each
 * sandbox can deterministically reset its worktree to the run-fixed baseRef
 * — regardless of what the host HEAD is doing.
 */
export type SandboxHooksFactory = (baseSha: string) => SandboxHooks

export interface StageConfig {
  readonly agent: AgentProvider
  readonly promptFile: string
  readonly idleTimeoutSeconds?: number
  readonly maxIterations?: number
  readonly promptArgs?: PromptArgs
}

export interface ContainerStageConfig extends StageConfig {
  readonly sandbox?: SandboxProvider
  readonly hooks?: SandboxHooks | SandboxHooksFactory
}

export type SandboxFactory = (runId: string) => SandboxProvider

export interface OrchestratorOptions {
  readonly seedIssue: number
  readonly sandbox: SandboxFactory
  readonly hooks?: SandboxHooks | SandboxHooksFactory
  readonly stages: {
    readonly implement: ContainerStageConfig
    readonly review: StageConfig
    readonly merge: ContainerStageConfig
  }
  readonly tickCap?: number
  readonly attemptCap?: number
  readonly logDir?: string
}

export interface ResolvedStageConfig {
  readonly agent: AgentProvider
  readonly promptFile: string
  readonly idleTimeoutSeconds?: number
  readonly maxIterations?: number
  readonly promptArgs: PromptArgs
}

export interface ResolvedContainerStageConfig extends ResolvedStageConfig {
  readonly sandbox: SandboxProvider
  /**
   * Always normalised to a factory at config-resolution time so callers don't
   * have to branch on "static hooks vs. factory". `undefined` means no hooks
   * were configured — callers must `spreadOptional` accordingly.
   */
  readonly hooksFactory?: SandboxHooksFactory
}

export interface ResolvedConfig {
  readonly seedIssue: number
  readonly runId: string
  readonly stages: {
    readonly implement: ResolvedContainerStageConfig
    readonly review: ResolvedStageConfig
    readonly merge: ResolvedContainerStageConfig
  }
  readonly tickCap: number
  readonly attemptCap: number
  readonly logDir: string | undefined
}

const IMPLEMENT_WORKFLOW_TOKENS = [
  "ISSUE_NUMBER",
  "ISSUE_TITLE",
  "BRANCH",
  "PRIOR_ATTEMPTS",
] as const
const REVIEW_WORKFLOW_TOKENS = IMPLEMENT_WORKFLOW_TOKENS
const MERGE_WORKFLOW_TOKENS = ["BRANCH_LIST", "ISSUE_LIST", "BASE_LABEL", "PRIOR_ATTEMPTS"] as const

export const WORKFLOW_TOKENS = {
  implement: IMPLEMENT_WORKFLOW_TOKENS,
  review: REVIEW_WORKFLOW_TOKENS,
  merge: MERGE_WORKFLOW_TOKENS,
} as const

export const spreadOptional = <K extends string, V>(
  key: K,
  value: V | undefined,
): { [P in K]: V } | Record<string, never> =>
  value !== undefined ? ({ [key]: value } as { [P in K]: V }) : {}

function validateStage(
  name: string,
  config: StageConfig,
  workflowTokens: readonly string[],
): ResolvedStageConfig {
  if (!config.agent) {
    throw new Error(`stages.${name}.agent is required`)
  }
  if (!config.promptFile) {
    throw new Error(`stages.${name}.promptFile is required`)
  }

  const userArgs = config.promptArgs ?? {}
  for (const key of workflowTokens) {
    if (key in userArgs) {
      throw new Error(`stages.${name}.promptArgs: "${key}" collides with a workflow-owned token`)
    }
  }

  return {
    agent: config.agent,
    promptFile: config.promptFile,
    ...spreadOptional("idleTimeoutSeconds", config.idleTimeoutSeconds),
    ...spreadOptional("maxIterations", config.maxIterations),
    promptArgs: userArgs,
  }
}

const toHooksFactory = (
  hooks: SandboxHooks | SandboxHooksFactory | undefined,
): SandboxHooksFactory | undefined => {
  if (hooks === undefined) return undefined
  return typeof hooks === "function" ? hooks : () => hooks
}

function resolveContainerStage(
  name: string,
  config: ContainerStageConfig,
  globalSandbox: SandboxProvider,
  globalHooks: SandboxHooks | SandboxHooksFactory | undefined,
  workflowTokens: readonly string[],
): ResolvedContainerStageConfig {
  const base = validateStage(name, config, workflowTokens)
  const hooksFactory = toHooksFactory(config.hooks ?? globalHooks)
  return {
    ...base,
    sandbox: config.sandbox ?? globalSandbox,
    ...spreadOptional("hooksFactory", hooksFactory),
  }
}

export function resolveConfig(
  options: OrchestratorOptions,
  defaults: {
    tickCap: number
    attemptCap: number
  },
  runId: string,
): ResolvedConfig {
  if (!Number.isInteger(options.seedIssue) || options.seedIssue <= 0) {
    throw new Error("seedIssue must be a positive integer")
  }

  const globalSandbox = options.sandbox(runId)
  const globalHooks = options.hooks

  const implement = resolveContainerStage(
    "implement",
    options.stages.implement,
    globalSandbox,
    globalHooks,
    IMPLEMENT_WORKFLOW_TOKENS,
  )
  const review = validateStage("review", options.stages.review, REVIEW_WORKFLOW_TOKENS)
  const merge = resolveContainerStage(
    "merge",
    options.stages.merge,
    globalSandbox,
    globalHooks,
    MERGE_WORKFLOW_TOKENS,
  )

  return {
    seedIssue: options.seedIssue,
    runId,
    stages: { implement, review, merge },
    tickCap: options.tickCap ?? defaults.tickCap,
    attemptCap: options.attemptCap ?? defaults.attemptCap,
    logDir: options.logDir,
  }
}

/** Test seam — internal helpers exposed for unit tests. Not a public API. */
export const __testing = { validateStage, resolveContainerStage, toHooksFactory }
