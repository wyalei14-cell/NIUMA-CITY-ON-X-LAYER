import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { addEvent, currentWorld, events } from "./store.js";
import { createProposalIssue, verifyGithubSignature } from "./github.js";
import { syncChainEvents } from "./chain.js";
import { WorldEvent } from "@niuma/reducer";

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

app.post("/api/world/publish", requireServiceAuth, (_req, res) => {
  res.status(202).json({
    ok: true,
    note: "Wire this endpoint to WorldStateRegistry.submitWorldVersion with a funded publisher wallet.",
    manifest: currentWorld().manifest
  });
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
