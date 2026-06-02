// Provider & Model Types

export type ProviderName = "claude-cli" | "agy" | "mmx";

export interface ModelConfig {
  provider: ProviderName;
  model: string;
  label?: string; // anonymous label for peer review
  maxTokens?: number;
  temperature?: number;
}

export interface ProviderClient {
  name: ProviderName;
  complete(prompt: string, config: ModelConfig): Promise<CompletionResult>;
  isAvailable(): boolean;
}

export interface CompletionResult {
  content: string;
  model: string;
  provider: ProviderName;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

// Council Types

export type Protocol = "vote" | "debate" | "synthesize" | "critique" | "redteam" | "mav";

export interface CouncilConfig {
  models: ModelConfig[];
  protocol: Protocol;
  chairman?: ModelConfig; // synthesizer model
  maxRounds?: number; // for debate (default: 1, research says dont add rounds)
  anonymize?: boolean; // hide model identities in peer review
  adaptiveStop?: boolean; // KS-statistic based early stopping
  ksEpsilon?: number; // KS threshold (default: 0.05)
  ksPatience?: number; // consecutive rounds below epsilon (default: 2)
}

export interface CouncilRequest {
  question: string;
  context?: string;
  config: CouncilConfig;
}

export interface ModelResponse {
  label: string; // anonymized or real
  provider: ProviderName;
  model: string;
  content: string;
  tokens: { input: number; output: number };
  latencyMs: number;
}

export interface Vote {
  voter: string;
  rankings: string[]; // ordered labels, best first
  reasoning: string;
}

export interface DebateRound {
  round: number;
  responses: ModelResponse[];
  ksStatistic?: number; // for adaptive stopping
  converged?: boolean;
}

export interface CouncilResult {
  protocol: Protocol;
  question: string;
  responses: ModelResponse[];
  votes?: Vote[];
  debateRounds?: DebateRound[];
  synthesis?: string;
  critique?: string;
  consensus?: {
    answer: string;
    confidence: number;
    dissent: string[];
  };
  cost: CostBreakdown;
  metadata: {
    totalLatencyMs: number;
    modelsUsed: string[];
    stoppedEarly?: boolean;
  };
}

// Cost Tracking

export interface CostBreakdown {
  totalUsd: number;
  byModel: Record<string, { inputTokens: number; outputTokens: number; costUsd: number }>;
}

export interface PricingTier {
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M?: number;
}

// Broker / Peer Discovery

export interface Peer {
  id: string;
  pid: number;
  cwd: string;
  gitRoot?: string;
  summary?: string;
  lastSeen: number;
  models?: string[]; // models this peer is configured to use
}

export interface BrokerMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  delivered: boolean;
}

// Default Configs

export const DEFAULT_MODELS: ModelConfig[] = [
  { provider: "claude-cli", model: "claude", label: "ModelA" },
  { provider: "agy", model: "gemini-3.5-flash", label: "ModelB" },
  { provider: "mmx", model: "MiniMax-M2.7", label: "ModelC" },
];

export const DEFAULT_CHAIRMAN: ModelConfig = {
  provider: "claude-cli",
  model: "claude",
  label: "Chairman",
};

// CLI-based providers don't expose token counts or pricing
export const PRICING: Record<string, PricingTier> = {
  "claude": { inputPer1M: 0, outputPer1M: 0 },
  "gemini-3.5-flash": { inputPer1M: 0, outputPer1M: 0 },
  "MiniMax-M2.7": { inputPer1M: 0, outputPer1M: 0 },
};
