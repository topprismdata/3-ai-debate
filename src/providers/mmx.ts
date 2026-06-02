import { spawn } from "node:child_process";
import type { ProviderClient, ModelConfig, CompletionResult } from "../types.js";

export class MmxCliProvider implements ProviderClient {
  readonly name = "mmx" as const;
  private cliPath: string;

  constructor(cliPath?: string) {
    this.cliPath = cliPath || process.env.MMX_CLI_PATH || "mmx";
  }

  isAvailable(): boolean {
    return true;
  }

  async complete(prompt: string, config: ModelConfig): Promise<CompletionResult> {
    const start = Date.now();
    return new Promise<CompletionResult>((resolve, reject) => {
      // mmx text chat --message "user:<prompt>" --output text --quiet
      const child = spawn(
        this.cliPath,
        [
          "text",
          "chat",
          "--message",
          `user:${prompt}`,
          "--output",
          "text",
          "--quiet",
        ],
        { stdio: ["ignore", "pipe", "pipe"] }
      );

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));

      child.on("error", (err) =>
        reject(
          new Error(
            `[mmx] spawn failed (path=${this.cliPath}): ${err.message}. ` +
              `Set MMX_CLI_PATH env var or pass cliPath to constructor.`
          )
        )
      );
      child.on("close", (code) => {
        const latencyMs = Date.now() - start;
        if (code !== 0) {
          reject(
            new Error(`[mmx] exit ${code}: ${stderr.trim() || stdout.trim()}`)
          );
          return;
        }
        resolve({
          content: stdout.trim(),
          model: config.model || "MiniMax-M2.7",
          provider: this.name,
          inputTokens: 0,
          outputTokens: 0,
          latencyMs,
        });
      });
    });
  }
}
