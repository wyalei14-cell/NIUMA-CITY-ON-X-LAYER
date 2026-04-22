import assert from "node:assert/strict";
import test from "node:test";
import { buildManifest, hashCanonical, reduceEvents, WorldEvent } from "./index.js";

test("reduces events deterministically and generates stable root", () => {
  const events: WorldEvent[] = [
    {
      id: "2",
      source: "chain",
      type: "ProposalCreated",
      blockNumber: 2,
      logIndex: 0,
      payload: { proposalId: 1, proposer: "0xabc", pType: "Feature", title: "Academy", contentHash: "sha256:academy" }
    },
    {
      id: "1",
      source: "chain",
      type: "CitizenRegistered",
      blockNumber: 1,
      logIndex: 0,
      payload: { citizenId: 1, owner: "0xabc", metadataURI: "ipfs://abc" }
    },
    {
      id: "3",
      source: "chain",
      type: "ProposalFinalized",
      blockNumber: 3,
      logIndex: 0,
      payload: { proposalId: 1, status: "Passed", yesVotes: 1, noVotes: 0 }
    },
    {
      id: "4",
      source: "chain",
      type: "ExecutionQueued",
      blockNumber: 4,
      logIndex: 0,
      payload: {
        executionId: 1,
        proposalId: 1,
        target: "0xtreasury",
        value: "0",
        data: "0x1234",
        metadataURI: "ipfs://execution-1",
        earliestExecuteAt: 1710000100
      }
    },
    {
      id: "5",
      source: "chain",
      type: "ExecutionCompleted",
      blockNumber: 5,
      logIndex: 0,
      payload: { executionId: 1, proposalId: 1, result: "0x" }
    }
  ];
  const state = reduceEvents(events);
  const manifest = buildManifest({
    version: 1,
    constitutionHash: "sha256:constitution",
    generatedAt: 1710000000,
    state,
    githubRepo: "niuma/city",
    githubCommit: "abc123"
  });
  assert.equal(state.citizens["0xabc"].citizenId, 1);
  assert.equal(state.governanceExecutions["1"].status, "Completed");
  assert.equal(state.proposals["1"].executionQueue[0].metadataURI, "ipfs://execution-1");
  assert.equal(state.proposals["1"].executionQueue[0].status, "Completed");
  assert.equal(manifest.completedProposals.length, 1);
  assert.match(manifest.stateRoot, /^sha256:/);
  assert.equal(manifest.stateRoot.length, "sha256:".length + 64);
  assert.equal(hashCanonical(state), hashCanonical(reduceEvents([...events].reverse())));
});
