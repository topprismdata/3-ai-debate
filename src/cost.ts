import type { ModelConfig, ModelResponse, CostBreakdown, PricingTier } from "./types.js";
import { PRICING } from "./types.js";

const DEFAULT_PRICING: PricingTier = { inputPer1M: 2.0, outputPer1M: 10.0 };

function getPricing(model: string): PricingTier {
  return PRICING[model] ?? DEFAULT_PRICING;
}

function computeCost(pricing: PricingTier, inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * pricing.inputPer1M +
         (outputTokens / 1_000_000) * pricing.outputPer1M;
}

export class CostTracker {
  private entries: Array<{ model: string; inputTokens: number; outputTokens: number }> = [];

  track(model: string, inputTokens: number, outputTokens: number): void {
    this.entries.push({ model, inputTokens, outputTokens });
  }

  trackResponse(response: ModelResponse): void {
    this.track(response.model, response.tokens.input, response.tokens.output);
  }

  trackResponses(responses: ModelResponse[]): void {
    responses.forEach(r => this.trackResponse(r));
  }

  getBreakdown(): CostBreakdown {
    const byModel: CostBreakdown["byModel"] = {};

    for (const entry of this.entries) {
      if (!byModel[entry.model]) {
        byModel[entry.model] = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
      }
      const bucket = byModel[entry.model];
      bucket.inputTokens += entry.inputTokens;
      bucket.outputTokens += entry.outputTokens;
    }

    let totalUsd = 0;
    for (const [model, bucket] of Object.entries(byModel)) {
      const pricing = getPricing(model);
      bucket.costUsd = computeCost(pricing, bucket.inputTokens, bucket.outputTokens);
      totalUsd += bucket.costUsd;
    }

    return { totalUsd, byModel };
  }

  estimateCost(
    models: ModelConfig[],
    avgInputTokens: number,
    avgOutputTokens: number,
    rounds: number = 1,
  ): number {
    let total = 0;
    for (const m of models) {
      const pricing = getPricing(m.model);
      total += computeCost(pricing, avgInputTokens, avgOutputTokens) * rounds;
    }
    return total;
  }
}
