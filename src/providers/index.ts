import type { ProviderName, ProviderClient } from "../types.js";
import { ClaudeCliProvider } from "./claude-cli.js";
import { AgyCliProvider } from "./agy.js";
import { MmxCliProvider } from "./mmx.js";

const providers = new Map<ProviderName, ProviderClient>();

function ensureProvider(name: ProviderName): ProviderClient {
  let provider = providers.get(name);
  if (provider) return provider;

  switch (name) {
    case "claude-cli":
      provider = new ClaudeCliProvider();
      break;
    case "agy":
      provider = new AgyCliProvider();
      break;
    case "mmx":
      provider = new MmxCliProvider();
      break;
    default:
      throw new Error(`Unknown provider: ${name as string}`);
  }

  providers.set(name, provider);
  return provider;
}

export function getProvider(name: ProviderName): ProviderClient {
  return ensureProvider(name);
}

export function getAvailableProviders(): ProviderClient[] {
  const names: ProviderName[] = ["claude-cli", "agy", "mmx"];
  return names.map(ensureProvider).filter((p) => p.isAvailable());
}

export function getAllProviders(): Map<ProviderName, ProviderClient> {
  const names: ProviderName[] = ["claude-cli", "agy", "mmx"];
  for (const name of names) ensureProvider(name);
  return new Map(providers);
}
