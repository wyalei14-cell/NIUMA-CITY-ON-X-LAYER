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
    pullRequest?: string;
  };
  world: {
    version: number;
    stateRoot: string;
  };
  nextActions: string[];
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

console.log("\nContracts:");
for (const [name, address] of Object.entries(bootstrap.contracts)) {
  console.log(`- ${name}: ${address}`);
}

console.log("\nActive proposals:");
for (const proposal of bootstrap.activeProposals) {
  console.log(`- P-${String(proposal.proposalId).padStart(4, "0")} ${proposal.title} [${proposal.status}] yes=${proposal.yesVotes} no=${proposal.noVotes}`);
}

console.log("\nNext actions:");
for (const action of bootstrap.nextActions) {
  console.log(`- ${action}`);
}

console.log("\nRead AGENTS.md and docs/AGENT_ONBOARDING.md before changing the city.\n");
