FROM node:22-bookworm

# System deps. git is required so the agent can `git commit` inside the worktree.
# gh is required so prompt-preprocessor shell snippets like `gh issue view ...`
# work — they execute inside this container, not on the host.
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
 && install -m 0755 -d /etc/apt/keyrings \
 && curl -fsSL -o /etc/apt/keyrings/githubcli-archive-keyring.gpg \
      https://cli.github.com/packages/githubcli-archive-keyring.gpg \
 && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
 && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends gh \
 && rm -rf /var/lib/apt/lists/*

# Rename the base image's "node" user (UID 1000) to "agent".
# Keeps UID 1000 so `--user 1000:1000` maps to the right home directory owner.
RUN usermod -d /home/agent -m -l agent node
USER agent

# Install Claude Code CLI
RUN curl -fsSL https://claude.ai/install.sh | bash

# Add Claude + Corepack shims to PATH. $PNPM_HOME is also on PATH so binaries
# from `pnpm add -g` (e.g. typescript-language-server) are reachable by the
# LSP tool inside the sandbox.
ENV PNPM_HOME="/home/agent/.local/share/pnpm"
ENV PATH="$PNPM_HOME:/home/agent/.local/bin:$PATH"

# Enable pnpm via Corepack. Version pinned in the host's package.json
# ("packageManager" field) and activated automatically on first invocation.
RUN corepack enable --install-directory /home/agent/.local/bin \
 && corepack prepare pnpm@10.31.0 --activate

# LSP backend for the typescript-lsp Claude plugin. The plugin's
# marketplace.json declares `command: "typescript-language-server --stdio"`,
# so the binary must be on PATH inside the sandbox. Paired with
# ENABLE_LSP_TOOL=1 (set by .sandcastle/agent.ts) this lights up the LSP tool
# and the <new-diagnostics> push reminder for the agent.
RUN pnpm add -g typescript-language-server typescript

# Install the typescript-lsp plugin into the image so Claude Code knows which
# LSP server to spawn for .ts/.tsx files. The marketplace is public so this
# does not require auth, only network during `docker build`.
RUN claude plugin marketplace add anthropics/claude-plugins-official \
 && claude plugin install typescript-lsp@claude-plugins-official

WORKDIR /home/agent

# Sandcastle bind-mounts the git worktree at /home/agent/workspace and overrides
# the working directory there at container start.
ENTRYPOINT ["sleep", "infinity"]
