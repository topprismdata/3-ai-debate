# 3-AI Debate

Multi-CLI deliberation council: send a prompt to three AI CLIs in parallel (Claude, Antigravity, MiniMax) and combine their responses through structured protocols. Ships as an MCP server and Claude Code skill.

[![CI](https://github.com/topprismdata/3-ai-debate/actions/workflows/ci.yml/badge.svg)](https://github.com/topprismdata/3-ai-debate/actions)

> **Fork of [rachittshah/llmcouncil](https://github.com/rachittshah/llmcouncil)** — replaced API-based providers (OpenAI/Anthropic/Gemini SDK) with CLI-based providers (`claude`, `agy`, `mmx`).

## Demo

```javascript
import { runCouncil } from "3-ai-debate";

const result = await runCouncil({
  question: "微服务架构值得采用吗？用 100 字内回答",
  config: {
    models: [
      { provider: "claude-cli", model: "claude", label: "ModelA" },
      { provider: "agy", model: "gemini-3.5-flash", label: "ModelB" },
      { provider: "mmx", model: "MiniMax-M2.7", label: "ModelC" },
    ],
    protocol: "synthesize",
  },
});
```

**Real output:**

```
=== 协议: synthesize
=== 参与模型:
  [ModelA] claude-cli/claude           - 21493ms
  [ModelB] agy/gemini-3.5-flash        - 11091ms
  [ModelC] mmx/MiniMax-M2.7            - 12426ms

=== 综合答案 ===
**Synthesized Answer:**

**共识:** 三位专家核心定义一致——404 表示服务器无法找到请求的资源。

**分歧:** 列举的成因略有差异(URL 错误 / 链接失效 / 页面删除)，
但本质相同,均为客户端请求的资源在服务器上不可用。

**最终答案(40 字):**

> HTTP 404 表示服务器未找到请求的资源,常见于 URL 错误、
> 页面已删除或链接失效。

**无显著异议。**
```

With `protocol: "debate"`, the chairman explicitly reasons about the trade-offs between opinions:

```
=== 协议: debate
=== 最终综合 ===
**合成回答：**

值得采用，但绝非银弹。**核心价值**是支持多团队并行开发与独立部署，
而非单纯解决扩容；当业务迭代快、模块边界清晰、团队具备 DevOps
能力时收益最大。**否则**应从模块化单体起步，警惕数据所有权分裂、
分布式事务等隐性成本，避免为拆而拆。

**裁决说明：**
- **三方共识**：非银弹、有条件、需匹配团队与业务成熟度。
- **采纳 B/C**：将"多团队并行 + 独立部署"定位为微服务的本质价值
- **保留 A 的关键补充**：模块化单体作为更稳妥的起点
- **显化分歧**：A 重"成本/起点"，B/C 重"组织/速度"
```

## Why CLI instead of API?

- **No API key juggling** — uses your existing CLI auth (Antigravity IDE login, MiniMax config, Claude Code session)
- **No usage cost concerns** — all three are subscription-based
- **What you see is what you get** — the same model + prompt combination your terminal would run

## The 3 CLIs

| CLI | Model | Setup |
|-----|-------|-------|
| `claude` | Claude Opus 4.7 / Sonnet 4.6 | [Claude Code](https://docs.anthropic.com/en/docs/claude-code) |
| `agy` | Gemini 3.5 Flash | [Antigravity IDE](https://antigravity.google/) — login once, CLI inherits |
| `mmx` | MiniMax-M2.7 | `mmx-cli` from npm, see below |

### Install

```bash
# Claude Code (already installed if you're using Claude Code)
npm install -g @anthropic-ai/claude-code

# Antigravity CLI (preinstalled with Antigravity IDE)
# or: https://github.com/google-antigravity/antigravity-cli

# MiniMax CLI
npm install -g mmx-cli
mmx auth login --api-key <your-key>
```

## Protocols

| Protocol | Behavior |
|----------|----------|
| `vote` | All 3 answer independently, then anonymously rank each other. Winner by first-place votes. |
| `debate` | Multi-round argumentation. Chairman synthesizes consensus. |
| `synthesize` | Fan out, then chairman produces an authoritative synthesis. |
| `critique` | Peer review of each response. |
| `redteam` | Adversarial probe for flaws, hallucinations. |
| `mav` | Model-as-Verifier cross-checks a candidate answer. |

## Quick Start

### As MCP server (Claude Code)

```bash
# Build
npm install
npm run build

# Configure
export CLAUDE_CLI_PATH=$(which claude)
export AGY_CLI_PATH="$HOME/.local/bin/agy"   # or wherever agy is
export MMX_CLI_PATH="$HOME/npm-global/bin/mmx"

# Add to Claude Code
claude mcp add three-ai-debate node /path/to/3-ai-debate/dist/server.js
```

Then in Claude Code:
```
> Use council_deliberate to answer "should we use microservices?" protocol=synthesize
```

### As a library

```javascript
import { runCouncil } from "3-ai-debate";

const result = await runCouncil({
  question: "What's the best cache eviction policy?",
  config: {
    models: [
      { provider: "claude-cli", model: "claude", label: "ModelA" },
      { provider: "agy", model: "gemini-3.5-flash", label: "ModelB" },
      { provider: "mmx", model: "MiniMax-M2.7", label: "ModelC" },
    ],
    protocol: "synthesize",
  },
});

console.log(result.synthesis);
```

## Architecture

Same as the upstream `llmcouncil`, but providers are CLI-based:

```mermaid
flowchart TD
    A[User / Claude Code] -->|MCP stdio| B[3-AI Council Server]
    B --> C{Protocol Router}
    C -->|vote| D[Parallel Query + Peer Review]
    C -->|debate| E[Multi Round Debate]
    C -->|synthesize| F[Fan Out + Chairman Synthesis]
    C -->|critique| G[Peer Critique]
    C -->|redteam| H[Adversarial Red Team]
    C -->|mav| I[MAV Verification]
    D --> J[claude CLI]
    D --> K[agy CLI]
    D --> L[mmx CLI]
    E --> J
    E --> K
    E --> L
    F --> J
    F --> K
    L
    F -->|synthesis| M[Chairman: claude]
    subgraph Providers
        J
        K
        L
    end
```

## Configuration

### CLI Paths

If your CLIs aren't on `PATH`, set the env vars:

```bash
export CLAUDE_CLI_PATH=/custom/path/to/claude
export AGY_CLI_PATH=/custom/path/to/agy
export MMX_CLI_PATH=/custom/path/to/mmx
```

Or pass to the provider constructor (advanced).

### What about the broker?

The upstream `llmcouncil` has a peer-discovery broker for cross-network council runs. This fork drops it — all 3 CLIs run on the same machine.

## Differences from upstream

| Aspect | llmcouncil (upstream) | 3-ai-debate (this fork) |
|--------|----------------------|-------------------------|
| Providers | OpenAI / Anthropic / Gemini SDK | CLI spawn (claude / agy / mmx) |
| Token tracking | Yes | No (CLIs don't expose) |
| Pricing | Yes | No (subscription-based) |
| Broker (peer discovery) | Yes | No (single-machine) |
| Models | GPT-5.4, Gemini 2.5 Pro, Claude Sonnet 4.6 | Claude, Gemini 3.5 Flash, MiniMax-M2.7 |

## License

MIT (inherited from upstream)
