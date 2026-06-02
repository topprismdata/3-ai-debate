---
name: three-ai-debate
description: Consult a 3-CLI council (claude + agy + mmx) for deliberation, debate, voting, critique, or verification. Use when the user asks "review with multiple AIs", "多 AI 评审", "3-AI 辩论", "用别的 AI 审一下", or wants cross-verification from multiple models. Triggers on `/3-ai-debate`, `/council`.
user_invocable: true
---

# 3-AI Debate Skill

You have access to the 3-AI Debate MCP tools. Use them to orchestrate multi-CLI deliberation across **claude**, **agy** (Antigravity / Gemini), and **mmx** (MiniMax).

## Available Tools

1. **council_deliberate**. Full council deliberation with configurable protocol
2. **council_vote**. Quick voting: all CLIs answer, then anonymously rank each other
3. **council_debate**. Structured debate with adaptive stopping
4. **council_critique**. Peer critique or adversarial redteaming
5. **council_verify** (MAV). Multi-agent verification of an answer
6. **council_estimate_cost**. Estimate cost before running (always 0 — CLI-based)
7. **council_status**. Check which providers are available
8. **council_configure**. Update default council composition

## Usage Patterns

### Quick consensus
Use `council_vote` for straightforward questions where you want the best answer selected by peer review.

### Deep analysis
Use `council_debate` with `adaptiveStop: true` for complex questions that benefit from iterative refinement. Set `maxRounds: 3` for thorough analysis.

### Verification
Use `council_verify` to cross-check a candidate answer against multiple models. Best for "important decisions" per Anthropic's Claude Code best practices.

### Synthesis
Use `council_synthesize` (or `council_deliberate` with `protocol: "synthesize"`) to fan out the question and get an authoritative chairman-synthesized answer.

## Providers

| Provider | CLI | Model |
|----------|-----|-------|
| `claude-cli` | `claude -p "<prompt>"` | Claude Opus 4.7 / Sonnet 4.6 |
| `agy` | `agy -p "<prompt>"` | Gemini 3.5 Flash |
| `mmx` | `mmx text chat --message "user:<prompt>"` | MiniMax-M2.7 |

## CLI Path Configuration

If a CLI isn't on PATH, set the env var:
```bash
export CLAUDE_CLI_PATH=/custom/path/to/claude
export AGY_CLI_PATH=/custom/path/to/agy
export MMX_CLI_PATH=/custom/path/to/mmx
```

## Setup

1. Build: `npm install && npm run build`
2. Configure paths: see above
3. Register with Claude Code: `claude mcp add three-ai-debate node /path/to/dist/server.js`

## When to Use This Skill

- The user wants a second/third opinion on an important decision
- A claim is high-stakes and should be cross-verified
- The user explicitly asks for multi-AI review ("让别的 AI 也看看", "交叉验证", "council")
- A design choice has multiple defensible options and you want to see how different models would reason about it

## When NOT to Use This Skill

- Simple, low-stakes questions (just answer directly)
- Tasks requiring private/local data the CLIs don't have access to
- Real-time operations (3-AI deliberation takes seconds-to-minutes)
