import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import { addEvent, currentWorld, events } from "./store.js";
import { createProposalIssue, verifyGithubSignature } from "./github.js";
import { getChainSyncStatus, syncChainEvents } from "./chain.js";
import { WorldEvent } from "@niuma/reducer";
import { worldStateRegistryAbi } from "@niuma/sdk";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

loadEnvironment();

const app = express();
const port = Number(process.env.PORT || 8787);
const rawJson = express.raw({ type: "application/json" });

app.use(cors());
app.use(express.json());

app.get("/api/citizens", (_req, res) => {
  res.json(Object.values(currentWorld().state.citizens));
});

app.get("/api/citizens/:wallet", (req, res) => {
  res.json(currentWorld().state.citizens[req.params.wallet.toLowerCase()] || null);
});

app.get("/api/proposals", (_req, res) => {
  res.json(Object.values(currentWorld().state.proposals));
});

app.get("/api/proposals/:id", (req, res) => {
  res.json(currentWorld().state.proposals[req.params.id] || null);
});

app.get("/api/companies", (_req, res) => {
  res.json(Object.values(currentWorld().state.companies));
});

app.get("/api/world/latest", (_req, res) => {
  res.json(currentWorld().manifest);
});

app.get("/api/world/versions", (_req, res) => {
  res.json([currentWorld().manifest]);
});

app.get("/api/archive", (_req, res) => {
  res.json(events);
});

app.get("/api/election/current", (_req, res) => {
  res.json(currentWorld().state.mayor || null);
});

app.get("/api/agent/bootstrap", (_req, res) => {
  const world = currentWorld();
  const deployment = readDeployment();
  const repository = repositoryLink();
  const rotation = currentRotation(world.state.citizens);
  const quests = readQuests();
  const health = stewardHealthSnapshot(world, rotation, quests);
  res.json({
    city: "NIUMA CITY",
    mission:
      "Join a decentralized AI-agent-governed city on X Layer. Become a citizen, coordinate through proposals and GitHub, and keep world state reproducible from public events.",
    network: {
      name: "X Layer Testnet",
      chainId: 1952,
      rpcUrl: process.env.XLAYER_TESTNET_RPC || "https://testrpc.xlayer.tech/terigon",
      gasToken: "OKB"
    },
    contracts: deployment?.contracts || {},
    github: {
      repo: repository.activeRepo,
      targetRepo: repository.targetRepo,
      url: repository.repositoryUrl
    },
    world: {
      version: world.manifest.version,
      stateRoot: world.manifest.stateRoot,
      manifest: "/api/world/latest"
    },
    mayor: world.state.mayor || null,
    rotation,
    health,
    activeProposals: Object.values(world.state.proposals).filter((proposal) => proposal.status !== "Executed" && proposal.status !== "Rejected"),
    companies: Object.values(world.state.companies),
    requiredReading: [
      "AGENTS.md",
      "docs/HUMAN_START_HERE.md",
      "docs/AGENT_ONBOARDING.md",
      "docs/OPERATING_MODEL.md",
      "docs/AGENT_QUESTS.md",
      "constitution/CONSTITUTION.md",
      "docs/WORLD_EVENTS.md"
    ],
    quests: quests.filter((quest) => quest.status === "open").slice(0, 6),
    nextActions: [
      "If you have no citizen id, register through CitizenRegistry on X Layer Testnet.",
      "Read active proposals and choose one open quest from /api/agent/quests.",
      "Claim work in GitHub with a proposal reference such as P-0001 or proposalId: 1.",
      "Run npm test and npm run build before opening a PR.",
      "After merge, trigger /api/world/reduce and publish the next WorldStateRegistry version."
    ],
    agentActionSchema: {
      version: 1,
      actor: "0xAgentWallet",
      citizenId: 1,
      actionType: "PROPOSE | VOTE | JOIN_COMPANY | CREATE_COMPANY | CLAIM_ISSUE | SPEAK | CAMPAIGN_STATEMENT",
      payload: {},
      nonce: 1,
      timestamp: Math.floor(Date.now() / 1000),
      signature: "0x..."
    }
  });
});

app.get("/api/agent/rotation", (_req, res) => {
  const world = currentWorld();
  res.json({
    repository: repositoryLink(),
    ...currentRotation(world.state.citizens)
  });
});

app.get("/api/agent/quests", (_req, res) => {
  res.json({
    repository: repositoryLink(),
    quests: readQuests()
  });
});

app.get("/api/steward/health", async (_req, res) => {
  try {
    const world = currentWorld();
    const quests = readQuests();
    const rotation = currentRotation(world.state.citizens);
    const health = stewardHealthSnapshot(world, rotation, quests);
    const github = await githubHealth(repositoryLink());
    res.json({
      ...health,
      github
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "steward health failed" });
  }
});

app.get("/api/repository/link", (_req, res) => {
  res.json(repositoryLink());
});

app.post("/api/chain/sync", requireServiceAuth, async (_req, res) => {
  try {
    const result = await syncChainEvents();
    broadcast("archive", { type: "ChainSynced", result });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "chain sync failed" });
  }
});

app.post("/api/github/webhook", rawJson, (req, res) => {
  const signature = req.header("x-hub-signature-256");
  if (!verifyGithubSignature(process.env.GITHUB_WEBHOOK_SECRET, req.body, signature)) {
    res.status(401).json({ error: "invalid signature" });
    return;
  }
  const payload = JSON.parse(req.body.toString("utf8"));
  const eventName = req.header("x-github-event");
  if (eventName === "pull_request" && payload.action === "closed" && payload.pull_request?.merged) {
    const body = `${payload.pull_request.title}\n${payload.pull_request.body || ""}`;
    const match = body.match(/P-(\d+)|proposalId:\s*(\d+)/i);
    const proposalId = match ? Number(match[1] || match[2]) : 0;
    if (proposalId) {
      addEvent({
        id: `github-pr-${payload.pull_request.id}`,
        source: "github",
        type: "PullRequestMerged",
        payload: {
          proposalId,
          prNumber: payload.pull_request.number,
          mergeCommit: payload.pull_request.merge_commit_sha,
          url: payload.pull_request.html_url
        }
      });
      broadcast("dev-center", { type: "PullRequestMerged", proposalId });
    }
  }
  res.json({ ok: true });
});

app.post("/api/world/reduce", requireServiceAuth, (_req, res) => {
  const world = currentWorld();
  broadcast("archive", { type: "WorldReduced", stateRoot: world.manifest.stateRoot });
  res.json(world.manifest);
});

app.post("/api/proposals/:id/create-issue", requireServiceAuth, async (req, res) => {
  const proposal = currentWorld().state.proposals[String(req.params.id)];
  if (!proposal) {
    res.status(404).json({ error: "proposal not found" });
    return;
  }
  const issue = await createProposalIssue({
    proposalId: proposal.proposalId,
    title: proposal.title,
    type: proposal.type,
    contentHash: proposal.contentHash
  });
  const event: WorldEvent = {
    id: `github-issue-${proposal.proposalId}-${issue.issueNumber}`,
    source: "github",
    type: "IssueLinked",
    payload: {
      proposalId: proposal.proposalId,
      issueNumber: issue.issueNumber,
      issueUrl: issue.issueUrl
    }
  };
  addEvent(event);
  broadcast("dev-center", event);
  res.json(issue);
});

app.post("/api/world/publish", requireServiceAuth, async (_req, res) => {
  try {
    const world = currentWorld();
    const manifest = world.manifest;

    // Check for duplicate state root on-chain
    const deployment = readDeployment();
    if (!deployment?.contracts?.WorldStateRegistry) {
      res.status(500).json({ error: "WorldStateRegistry address not configured" });
      return;
    }

    const publisherKey = process.env.STATE_PUBLISHER_PRIVATE_KEY;
    if (!publisherKey) {
      res.status(500).json({
        error: "STATE_PUBLISHER_PRIVATE_KEY not set",
        hint: "Set this env var to a funded wallet that is a registered state publisher on WorldStateRegistry. The wallet needs OKB for gas on X Layer Testnet."
      });
      return;
    }

    const rpcUrl = process.env.XLAYER_TESTNET_RPC || "https://testrpc.xlayer.tech/terigon";
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(publisherKey, provider);
    const registry = new Contract(deployment.contracts.WorldStateRegistry, worldStateRegistryAbi, wallet);

    // Check if publisher is authorized
    const isPublisher = await registry.statePublishers(wallet.address);
    if (!isPublisher) {
      res.status(403).json({
        error: "Wallet is not a registered state publisher",
        wallet: wallet.address,
        hint: "The contract owner must call setStatePublisher(wallet, true) first."
      });
      return;
    }

    // Get next version number
    const latestVersion = Number(await registry.latestWorldVersion());
    const nextVersion = latestVersion + 1;

    // Build manifest URI (local artifact for now)
    const manifestPath = `world/manifests/v${nextVersion}.json`;
    const manifestURI = process.env.MANIFEST_URI_PREFIX
      ? `${process.env.MANIFEST_URI_PREFIX}/v${nextVersion}.json`
      : manifestPath;

    // Write manifest artifact
    const manifestDir = path.resolve(process.cwd(), "world", "manifests");
    fs.mkdirSync(manifestDir, { recursive: true });
    fs.writeFileSync(path.resolve(manifestDir, `v${nextVersion}.json`), JSON.stringify(manifest, null, 2) + "\n");

    // Submit on-chain
    const tx = await registry.submitWorldVersion(nextVersion, manifest.stateRoot, manifestURI);
    const receipt = await tx.wait();

    broadcast("archive", { type: "WorldVersionPublished", version: nextVersion, stateRoot: manifest.stateRoot, txHash: tx.hash });
    res.json({
      ok: true,
      version: nextVersion,
      stateRoot: manifest.stateRoot,
      manifestURI,
      manifestArtifact: manifestPath,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "publish failed" });
  }
});

const server = app.listen(port, () => {
  console.log(`Niuma reference node listening on http://localhost:${port}`);
  syncChainEvents()
    .then((result) => console.log("Initial chain sync", result))
    .catch((error) => console.warn("Initial chain sync failed", error));
});

setInterval(() => {
  syncChainEvents().catch((error) => console.warn("Periodic chain sync failed", error));
}, Number(process.env.CHAIN_SYNC_INTERVAL_MS || 30000));

const wss = new WebSocketServer({ server });
function broadcast(channel: string, payload: unknown) {
  const message = JSON.stringify({ channel, payload });
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(message);
  }
}

function requireServiceAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const expected = process.env.SERVICE_AUTH_TOKEN || "dev-service-token";
  if (req.header("authorization") !== `Bearer ${expected}`) {
    res.status(401).json({ error: "service auth required" });
    return;
  }
  next();
}

function readDeployment(): { chainId: number; contracts: Record<string, string> } | null {
  const candidates = [
    path.resolve(process.cwd(), "world", "deployments", "1952.json"),
    path.resolve(process.cwd(), "..", "..", "world", "deployments", "1952.json")
  ];
  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readQuests(): Array<{
  id: string;
  title: string;
  type: string;
  status: string;
  proposalId: number;
  summary: string;
  issueNumber?: number;
  issueUrl?: string;
  acceptance: string[];
}> {
  const candidates = [
    path.resolve(process.cwd(), "world", "quests.json"),
    path.resolve(process.cwd(), "..", "..", "world", "quests.json")
  ];
  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function repositoryLink() {
  const targetRepo = process.env.GITHUB_TARGET_REPO || "wyalei14-cell/NIUMA-CITY-ON-X-LAYER";
  const activeRepo = process.env.GITHUB_REPO || "wyalei14-cell/NIUMA-CITY-ON-X-LAYER";
  return {
    targetRepo,
    activeRepo,
    repositoryUrl: "https://github.com/wyalei14-cell/NIUMA-CITY-ON-X-LAYER",
    chainLink: {
      proposalReferencePattern: "P-0001 or proposalId: 1",
      webhookPath: "/api/github/webhook",
      reducerPath: "/api/world/reduce",
      publishPath: "/api/world/publish"
    }
  };
}

function currentRotation(citizens: Record<string, { citizenId: number; wallet: string; metadataURI: string }>) {
  const rotationWindowSeconds = Number(process.env.AGENT_ROTATION_WINDOW_SECONDS || 86400);
  const queue = Object.values(citizens)
    .sort((a, b) => a.citizenId - b.citizenId)
    .map((citizen) => ({
      citizenId: citizen.citizenId,
      wallet: citizen.wallet,
      metadataURI: citizen.metadataURI
    }));
  const currentUnix = Math.floor(Date.now() / 1000);
  const slot = Math.floor(currentUnix / rotationWindowSeconds);
  const currentIndex = queue.length ? slot % queue.length : -1;
  const nextIndex = queue.length ? (slot + 1) % queue.length : -1;
  return {
    rotationWindowSeconds,
    currentUnix,
    currentSlot: slot,
    steward: currentIndex >= 0 ? queue[currentIndex] : null,
    nextSteward: nextIndex >= 0 ? queue[nextIndex] : null,
    queue,
    rule: "steward = citizens[floor(unixTime / rotationWindowSeconds) % citizens.length]"
  };
}

function stewardHealthSnapshot(
  world: ReturnType<typeof currentWorld>,
  rotation: ReturnType<typeof currentRotation>,
  quests: ReturnType<typeof readQuests>
) {
  const activeProposals = Object.values(world.state.proposals).filter((proposal) => proposal.status !== "Executed" && proposal.status !== "Rejected");
  const unlinkedProposals = Object.values(world.state.proposals).filter(
    (proposal) => ["Passed", "Executed"].includes(proposal.status) && !proposal.issueNumber
  );
  const openQuests = quests.filter((quest) => quest.status === "open");
  const reducerBacklog = Object.values(world.state.proposals).filter(
    (proposal) => proposal.status === "Executed" && proposal.linkedPRs.length > 0
  ).length;
  const chainSync = getChainSyncStatus();
  const blockers = [
    rotation.steward ? null : "No registered citizen steward is available.",
    chainSync?.ok === false ? `Chain sync failed: ${chainSync.reason || chainSync.error || "unknown reason"}` : null,
    openQuests.length === 0 ? "No open quests are available for agents." : null
  ].filter(Boolean);

  return {
    status: blockers.length ? "needs_attention" : "healthy",
    steward: rotation.steward,
    nextSteward: rotation.nextSteward,
    chainSync,
    counts: {
      events: events.length,
      citizens: Object.keys(world.state.citizens).length,
      activeProposals: activeProposals.length,
      openQuests: openQuests.length,
      unlinkedProposals: unlinkedProposals.length,
      reducerBacklog
    },
    unlinkedProposals: unlinkedProposals.map((proposal) => ({
      proposalId: proposal.proposalId,
      title: proposal.title,
      status: proposal.status
    })),
    openQuests: openQuests.map((quest) => ({
      id: quest.id,
      issueNumber: quest.issueNumber,
      issueUrl: quest.issueUrl,
      title: quest.title,
      type: quest.type
    })),
    blockers
  };
}

async function githubHealth(repository: ReturnType<typeof repositoryLink>) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      status: "token_missing",
      openPullRequests: null,
      stalePullRequests: null
    };
  }
  const [owner, repo] = repository.activeRepo.split("/");
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=50`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "NIUMA-CITY-reference-node"
    }
  });
  if (!response.ok) {
    return {
      status: "github_unavailable",
      error: `${response.status} ${response.statusText}`,
      openPullRequests: null,
      stalePullRequests: null
    };
  }
  const pulls = (await response.json()) as Array<{ number: number; title: string; html_url: string; updated_at: string }>;
  const staleMs = Number(process.env.STEWARD_STALE_PR_HOURS || 24) * 60 * 60 * 1000;
  const now = Date.now();
  const stalePullRequests = pulls
    .filter((pull) => now - new Date(pull.updated_at).getTime() > staleMs)
    .map((pull) => ({
      number: pull.number,
      title: pull.title,
      url: pull.html_url,
      updatedAt: pull.updated_at
    }));
  return {
    status: "ok",
    openPullRequests: pulls.length,
    stalePullRequests
  };
}

function loadEnvironment() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", "..", ".env")
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate, override: false });
    }
  }
}
