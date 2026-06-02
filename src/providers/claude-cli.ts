import { spawn } from "node:child_process";
import type { ProviderClient, ModelConfig, CompletionResult } from "../types.js";

export class ClaudeCliProvider implements ProviderClient {
  readonly name = "claude-cli" as const;
  private cliPath: string;

  constructor(cliPath?: string) {
    this.cliPath = cliPath || process.env.CLAUDE_CLI_PATH || "claude";
  }

  isAvailable(): boolean {
    return true;
  }

  async complete(prompt: string, config: ModelConfig): Promise<CompletionResult> {
    const start = Date.now();
    return new Promise<CompletionResult>((resolve, reject) => {
      const child = spawn(
        this.cliPath,
        ["-p", prompt],
        { stdio: ["ignore", "pipe", "pipe"] }
      );

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));

      child.on("error", (err) =>
        reject(
          new Error(
            `[claude-cli] spawn failed (path=${this.cliPath}): ${err.message}. ` +
              `Set CLAUDE_CLI_PATH env var or pass cliPath to constructor.`
          )
        )
      );
      child.on("close", (code) => {
        const latencyMs = Date.now() - start;
        if (code !== 0) {
          reject(
            new Error(
              `[claude-cli] exit ${code}: ${stderr.trim() || stdout.trim()}`
            )
          );
          return;
        }
        resolve({
          content: stdout.trim(),
          model: config.model || "claude",
          provider: this.name,
          inputTokens: 0,
          outputTokens: 0,
          latencyMs,
        });
      });
    });
  }
}
