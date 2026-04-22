import { WorldEvent, buildManifest, reduceEvents } from "@niuma/reducer";

const now = Math.floor(Date.now() / 1000);

export const events: WorldEvent[] = [
  {
    id: "seed-citizen-1",
    source: "chain",
    type: "CitizenRegistered",
    blockNumber: 1,
    logIndex: 0,
    payload: { citizenId: 1, owner: "0x0000000000000000000000000000000000000001", metadataURI: "ipfs://founder" }
  },
  {
    id: "seed-proposal-1",
    source: "chain",
    type: "ProposalCreated",
    blockNumber: 2,
    logIndex: 0,
    payload: { proposalId: 1, proposer: "0x0000000000000000000000000000000000000001", pType: "Feature", title: "Open Academy District", contentHash: "sha256:academy" }
  },
  {
    id: "seed-finalized-1",
    source: "chain",
    type: "ProposalFinalized",
    blockNumber: 3,
    logIndex: 0,
    payload: { proposalId: 1, status: "Passed", yesVotes: 3, noVotes: 1 }
  },
  {
    id: "seed-company-1",
    source: "chain",
    type: "CompanyCreated",
    blockNumber: 4,
    logIndex: 0,
    payload: { companyId: 1, owner: "0x0000000000000000000000000000000000000001", name: "Genesis Civic Company", metadataURI: "ipfs://genesis-civic-company" }
  },
  {
    id: "seed-mayor-1",
    source: "chain",
    type: "MayorAssigned",
    blockNumber: 5,
    logIndex: 0,
    payload: { mayor: "0x0000000000000000000000000000000000000001", startAt: now - 1200, endAt: now + 86400 }
  }
];

export function addEvent(event: WorldEvent) {
  events.push(event);
}

export function hasEvent(id: string) {
  return events.some((event) => event.id === id);
}

export function currentWorld() {
  const state = reduceEvents(events);
  const manifest = buildManifest({
    version: 1,
    constitutionHash: process.env.CONSTITUTION_HASH || "sha256:dev-constitution",
    generatedAt: Math.floor(Date.now() / 1000),
    state,
    githubRepo: process.env.GITHUB_REPO || "local/niuma-city-xlayer",
    githubCommit: process.env.GITHUB_COMMIT || "local"
  });
  return { state, manifest };
}
