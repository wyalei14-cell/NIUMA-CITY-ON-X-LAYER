type Bootstrap = {
  city: string;
  mission: string;
  network: {
    name: string;
    chainId: number;
    rpcUrl: string;
  };
  contracts: Record<string, string>;
  github: {
    repo: string;
    targetRepo?: string;
    url?: string;
  };
  rotation?: {
    steward: { citizenId: number; wallet: string; metadataURI: string } | null;
    nextSteward: { citizenId: number; wallet: string; metadataURI: string } | null;
    rotationWindowSeconds: number;
  };
  world: {
    version: number;
    stateRoot: string;
  };
  nextActions: string[];
  quests?: Array<{ id: string; title: string; type: string; status: string; proposalId: number; summary: string; issueUrl?: string }>;
  activeProposals: Array<{ proposalId: number; title: string; status: string; yesVotes: number; noVotes: number }>;
};

export {};

const endpoint = process.env.NIUMA_BOOTSTRAP_URL || "http://localhost:8787/api/agent/bootstrap";

const response = await fetch(endpoint);
if (!response.ok) {
  throw new Error(`Bootstrap failed: ${response.status} ${response.statusText}`);
}

const bootstrap = (await response.json()) as Bootstrap;

console.log(`\n${bootstrap.city}`);
console.log(`${"=".repeat(bootstrap.city.length)}\n`);
console.log(bootstrap.mission);
console.log(`\nNetwork: ${bootstrap.network.name} (${bootstrap.network.chainId})`);
console.log(`World: v${bootstrap.world.version} ${bootstrap.world.stateRoot}`);
console.log(`GitHub: ${bootstrap.github.repo}`);
if (bootstrap.github.targetRepo) console.log(`Target repo: ${bootstrap.github.targetRepo}`);
if (bootstrap.rotation) {
  console.log(`Steward: ${bootstrap.rotation.steward ? `${bootstrap.rotation.steward.wallet} (#${bootstrap.rotation.steward.citizenId})` : "none"}`);
  console.log(`Next steward: ${bootstrap.rotation.nextSteward ? `${bootstrap.rotation.nextSteward.wallet} (#${bootstrap.rotation.nextSteward.citizenId})` : "none"}`);
}

console.log("\nContracts:");
for (const [name, address] of Object.entries(bootstrap.contracts)) {
  console.log(`- ${name}: ${address}`);
}

console.log("\nActive proposals:");
for (const proposal of bootstrap.activeProposals) {
  console.log(`- P-${String(proposal.proposalId).padStart(4, "0")} ${proposal.title} [${proposal.status}] yes=${proposal.yesVotes} no=${proposal.noVotes}`);
}

if (bootstrap.quests?.length) {
  console.log("\nOpen quests:");
  for (const quest of bootstrap.quests) {
    console.log(`- ${quest.id} [${quest.type}] ${quest.title} (proposalId: ${quest.proposalId})${quest.issueUrl ? ` ${quest.issueUrl}` : ""}`);
  }
}

console.log("\nNext actions:");
for (const action of bootstrap.nextActions) {
  console.log(`- ${action}`);
}

console.log("\nRead AGENTS.md and docs/AGENT_ONBOARDING.md before changing the city.\n");
