#!/usr/bin/env node

import type { Protocol } from "./types.js";
import { DEFAULT_MODELS, DEFAULT_CHAIRMAN } from "./types.js";

const BROKER_URL = "http://127.0.0.1:7899";

// ANSI colors

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
};

// Arg parsing

function getFlag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

// HTTP helper

async function brokerGet(path: string): Promise<unknown> {
  const res = await fetch(`${BROKER_URL}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Broker ${res.status}: ${text}`);
  }
  return res.json();
}

// Commands

async function cmdBroker(): Promise<void> {
  console.log(`${c.cyan}${c.bold}LLM Council Broker${c.reset}`);
  console.log(`\nStart the broker with:\n`);
  console.log(`  ${c.green}node dist/broker.js${c.reset}`);
  console.log(`  ${c.dim}# or: npm run broker${c.reset}\n`);
  console.log(`Listens on ${c.yellow}http://127.0.0.1:7899${c.reset}`);
}

async function cmdStatus(): Promise<void> {
  try {
    const data = await brokerGet("/health") as {
      ok: boolean; peers: number; uptime: number;
    };
    console.log(`${c.cyan}${c.bold}Council Broker Status${c.reset}\n`);
    console.log(`  Status:  ${data.ok ? `${c.green}online${c.reset}` : `${c.red}offline${c.reset}`}`);
    console.log(`  Peers:   ${c.yellow}${data.peers}${c.reset}`);
    console.log(`  Uptime:  ${c.dim}${formatUptime(data.uptime)}${c.reset}`);
  } catch {
    console.log(`${c.red}${c.bold}Broker offline${c.reset}. Start it with ${c.dim}node dist/broker.js${c.reset}`);
    process.exit(1);
  }
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

async function cmdPeers(args: string[]): Promise<void> {
  const scope = getFlag(args, "--scope") ?? "machine";
  try {
    const data = await brokerGet(`/peers?scope=${scope}`) as {
      peers: Array<{
        id: string; pid: number; cwd: string; gitRoot?: string;
        summary?: string; lastSeen: number; models?: string[];
      }>;
    };

    console.log(`${c.cyan}${c.bold}Council Peers${c.reset} ${c.dim}(scope: ${scope})${c.reset}\n`);

    if (data.peers.length === 0) {
      console.log(`  ${c.dim}No peers registered${c.reset}`);
      return;
    }

    // Table header
    console.log(`  ${c.bold}${"ID".padEnd(20)} ${"PID".padEnd(8)} ${"CWD".padEnd(30)} ${"Summary".padEnd(30)}${c.reset}`);
    console.log(`  ${c.dim}${"─".repeat(90)}${c.reset}`);

    for (const p of data.peers) {
      const id = p.id.length > 18 ? p.id.slice(0, 18) + ".." : p.id;
      const cwd = p.cwd.length > 28 ? ".." + p.cwd.slice(-26) : p.cwd;
      const summary = (p.summary ?? "n/a").slice(0, 28);
      console.log(`  ${c.green}${id.padEnd(20)}${c.reset} ${String(p.pid).padEnd(8)} ${cwd.padEnd(30)} ${c.dim}${summary}${c.reset}`);
    }
    console.log();
  } catch {
    console.log(`${c.red}${c.bold}Broker offline${c.reset}. Start it with ${c.dim}node dist/broker.js${c.reset}`);
    process.exit(1);
  }
}

async function cmdAsk(args: string[]): Promise<void> {
  const questionIdx = args.indexOf("ask") + 1;
  const question = args[questionIdx];
  if (!question) {
    console.error(`${c.red}Usage: llmcouncil ask "<question>" [--protocol vote|debate|synthesize|critique|redteam|mav]${c.reset}`);
    process.exit(1);
  }

  const protocol = (getFlag(args, "--protocol") ?? "synthesize") as Protocol;
  const validProtocols: Protocol[] = ["vote", "debate", "synthesize", "critique", "redteam", "mav"];
  if (!validProtocols.includes(protocol)) {
    console.error(`${c.red}Invalid protocol: ${protocol}. Must be one of: ${validProtocols.join(", ")}${c.reset}`);
    process.exit(1);
  }

  console.log(`${c.cyan}${c.bold}LLM Council${c.reset} ${c.dim}(${protocol})${c.reset}\n`);
  console.log(`  ${c.bold}Question:${c.reset} ${question}\n`);
  console.log(`  ${c.dim}Models: ${DEFAULT_MODELS.map(m => m.model).join(", ")}${c.reset}`);
  console.log(`  ${c.dim}Running...${c.reset}\n`);

  const { runCouncil } = await import("./council.js");
  const result = await runCouncil({
    question,
    config: {
      models: DEFAULT_MODELS,
      protocol,
      chairman: DEFAULT_CHAIRMAN,
      anonymize: true,
    },
  });

  // Print responses
  console.log(`${c.bold}Responses:${c.reset}\n`);
  for (const r of result.responses) {
    console.log(`  ${c.magenta}${r.label}${c.reset} ${c.dim}(${r.model}, ${r.latencyMs}ms)${c.reset}`);
    console.log(`  ${r.content.split("\n").join("\n  ")}\n`);
  }

  // Print consensus/synthesis
  if (result.synthesis) {
    console.log(`${c.cyan}${c.bold}Synthesis:${c.reset}\n`);
    console.log(`  ${result.synthesis.split("\n").join("\n  ")}\n`);
  }
  if (result.consensus) {
    console.log(`${c.green}${c.bold}Consensus:${c.reset} ${c.dim}(confidence: ${(result.consensus.confidence * 100).toFixed(0)}%)${c.reset}`);
    console.log(`  ${result.consensus.answer.split("\n")[0]}\n`);
  }
  if (result.critique) {
    console.log(`${c.yellow}${c.bold}Critique:${c.reset}\n`);
    console.log(`  ${result.critique.split("\n").join("\n  ")}\n`);
  }

  // Cost
  console.log(`${c.dim}Cost: $${result.cost.totalUsd.toFixed(4)} | Latency: ${result.metadata.totalLatencyMs}ms${c.reset}`);
}

async function cmdCost(args: string[]): Promise<void> {
  const protocol = (getFlag(args, "--protocol") ?? "synthesize") as Protocol;
  const rounds = parseInt(getFlag(args, "--rounds") ?? "1", 10);
  const { CostTracker } = await import("./cost.js");

  const tracker = new CostTracker();
  const avgInput = 500;
  const avgOutput = 1000;

  // Base model calls
  const baseCost = tracker.estimateCost(DEFAULT_MODELS, avgInput, avgOutput, 1);

  // Protocol specific multipliers
  let multiplier = 1;
  let description = "";
  switch (protocol) {
    case "vote":
      multiplier = 2; // responses + voting round
      description = "initial responses + peer voting";
      break;
    case "debate":
      multiplier = rounds + 1; // N debate rounds + synthesis
      description = `${rounds} debate round(s) + synthesis`;
      break;
    case "synthesize":
      multiplier = 1.3; // responses + chairman synthesis
      description = "initial responses + chairman synthesis";
      break;
    case "critique":
      multiplier = 2; // responses + critiques
      description = "initial responses + critiques";
      break;
    case "redteam":
      multiplier = 3; // responses + critiques + redteam
      description = "initial responses + critiques + redteam";
      break;
    case "mav":
      multiplier = 2.5; // responses + multiagent verification
      description = "initial responses + verification passes";
      break;
  }

  const estimated = baseCost * multiplier;

  console.log(`${c.cyan}${c.bold}Cost Estimate${c.reset}\n`);
  console.log(`  Protocol:    ${c.yellow}${protocol}${c.reset} ${c.dim}(${description})${c.reset}`);
  console.log(`  Models:      ${DEFAULT_MODELS.map(m => m.model).join(", ")}`);
  console.log(`  Rounds:      ${rounds}`);
  console.log(`  Avg tokens:  ${c.dim}~${avgInput} in / ~${avgOutput} out per call${c.reset}`);
  console.log();
  console.log(`  ${c.bold}Estimated cost: ${c.green}$${estimated.toFixed(4)}${c.reset} per query`);
  console.log();

  // Per model breakdown
  console.log(`  ${c.bold}${"Model".padEnd(35)} ${"$/query".padEnd(10)}${c.reset}`);
  console.log(`  ${c.dim}${"─".repeat(45)}${c.reset}`);
  for (const m of DEFAULT_MODELS) {
    const perModel = tracker.estimateCost([m], avgInput, avgOutput, 1) * multiplier;
    console.log(`  ${m.model.padEnd(35)} ${c.green}$${perModel.toFixed(4)}${c.reset}`);
  }
}

function cmdHelp(): void {
  console.log(`
${c.cyan}${c.bold}llmcouncil${c.reset} Multi LLM deliberation council

${c.bold}Usage:${c.reset}
  llmcouncil <command> [options]

${c.bold}Commands:${c.reset}
  ${c.green}broker${c.reset}                              Start the peer discovery broker
  ${c.green}status${c.reset}                              Check broker health
  ${c.green}peers${c.reset}  [--scope machine|dir|repo]   List connected peers
  ${c.green}ask${c.reset}    "<question>" [--protocol P]  Query the council
  ${c.green}cost${c.reset}   [--protocol P] [--rounds N]  Estimate query cost
  ${c.green}help${c.reset}                                Show this help

${c.bold}Protocols:${c.reset}  vote, debate, synthesize, critique, redteam, mav

${c.bold}Examples:${c.reset}
  ${c.dim}llmcouncil status${c.reset}
  ${c.dim}llmcouncil ask "What causes inflation?" --protocol vote${c.reset}
  ${c.dim}llmcouncil cost --protocol debate --rounds 3${c.reset}
`);
}

// Main

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "broker":
      await cmdBroker();
      break;
    case "status":
      await cmdStatus();
      break;
    case "peers":
      await cmdPeers(args);
      break;
    case "ask":
      await cmdAsk(args);
      break;
    case "cost":
      await cmdCost(args);
      break;
    case "help":
    case "--help":
    case "-h":
    case undefined:
      cmdHelp();
      break;
    default:
      console.error(`${c.red}Unknown command: ${command}${c.reset}\n`);
      cmdHelp();
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`${c.red}${err}${c.reset}`);
  process.exit(1);
});
