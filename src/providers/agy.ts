import { spawn } from "node:child_process";
import type { ProviderClient, ModelConfig, CompletionResult } from "../types.js";

export class AgyCliProvider implements ProviderClient {
  readonly name = "agy" as const;
  private cliPath: string;

  constructor(cliPath?: string) {
    this.cliPath = cliPath || process.env.AGY_CLI_PATH || "agy";
  }

  isAvailable(): boolean {
    return true;
  }

  async complete(prompt: string, config: ModelConfig): Promise<CompletionResult> {
    const start = Date.now();
    return new Promise<CompletionResult>((resolve, reject) => {
      const child = spawn(
        this.cliPath,
        ["-p", prompt, "--print-timeout", "120s"],
        { stdio: ["ignore", "pipe", "pipe"] }
      );

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));

      child.on("error", (err) =>
        reject(
          new Error(
            `[agy] spawn failed (path=${this.cliPath}): ${err.message}. ` +
              `Set AGY_CLI_PATH env var or pass cliPath to constructor.`
          )
        )
      );
      child.on("close", (code) => {
        const latencyMs = Date.now() - start;
        if (code !== 0) {
          reject(
            new Error(`[agy] exit ${code}: ${stderr.trim() || stdout.trim()}`)
          );
          return;
        }
        resolve({
          content: stdout.trim(),
          model: config.model || "gemini-3.5-flash",
          provider: this.name,
          inputTokens: 0,
          outputTokens: 0,
          latencyMs,
        });
      });
    });
  }
}
