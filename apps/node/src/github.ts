import crypto from "node:crypto";
import { Octokit } from "@octokit/rest";
import type { WorldState } from "@niuma/reducer";

export function verifyGithubSignature(secret: string | undefined, body: Buffer, signature: string | undefined) {
  if (!secret) return true;
  if (!signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function createProposalIssue(input: {
  proposalId: number;
  title: string;
  type: string;
  contentHash: string;
  txHash?: string;
}) {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) {
    return { issueNumber: 0, issueUrl: "local://github-not-configured" };
  }
  const [owner, repoName] = repo.split("/");
  const octokit = new Octokit({ auth: token });
  const issue = await octokit.issues.create({
    owner,
    repo: repoName,
    title: `[${input.type}][P-${String(input.proposalId).padStart(4, "0")}] ${input.title}`,
    labels: ["proposal", input.type.toLowerCase(), "city-build"],
    body: [
      `proposalId: ${input.proposalId}`,
      `contentHash: ${input.contentHash}`,
      `tx: ${input.txHash || "pending-index"}`,
      "",
      "Acceptance:",
      "- Implementation links back to this proposal.",
      "- CI passes.",
      "- Merge triggers a world version manifest."
    ].join("\n")
  });
  return { issueNumber: issue.data.number, issueUrl: issue.data.html_url };
}

/**
 * Q-0003: Auto-link passed/executed proposals that don't yet have a GitHub issue.
 * Idempotent: skips proposals that already have an issueNumber.
 * Returns the list of newly linked proposals.
 */
export async function autoLinkPassedProposals(
  state: WorldState,
  addEventFn: (event: import("@niuma/reducer").WorldEvent) => void
): Promise<Array<{ proposalId: number; issueNumber: number; issueUrl: string }>> {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) {
    return [];
  }

  const passedProposals = Object.values(state.proposals).filter(
    (p) => (p.status === "Passed" || p.status === "Executed") && !p.issueNumber
  );

  if (passedProposals.length === 0) {
    return [];
  }

  const [owner, repoName] = repo.split("/");
  const octokit = new Octokit({ auth: token });
  const linked: Array<{ proposalId: number; issueNumber: number; issueUrl: string }> = [];

  for (const proposal of passedProposals) {
    // Idempotency: search for existing issue before creating
    const existing = await octokit.search.issuesAndPullRequests({
      q: `repo:${owner}/${repoName} label:proposal "P-${String(proposal.proposalId).padStart(4, "0")}" is:issue`,
      per_page: 1
    });
    if (existing.data.total_count > 0) {
      const existingIssue = existing.data.items[0];
      const event: import("@niuma/reducer").WorldEvent = {
        id: `github-issue-${proposal.proposalId}-${existingIssue.number}`,
        source: "github",
        type: "IssueLinked",
        payload: {
          proposalId: proposal.proposalId,
          issueNumber: existingIssue.number,
          issueUrl: existingIssue.html_url
        }
      };
      addEventFn(event);
      linked.push({ proposalId: proposal.proposalId, issueNumber: existingIssue.number, issueUrl: existingIssue.html_url });
      continue;
    }

    // Create new issue
    const issue = await octokit.issues.create({
      owner,
      repo: repoName,
      title: `[${proposal.type}][P-${String(proposal.proposalId).padStart(4, "0")}] ${proposal.title}`,
      labels: ["proposal", proposal.type.toLowerCase(), "city-build"],
      body: [
        `proposalId: ${proposal.proposalId}`,
        `chainId: 1952`,
        `contentHash: ${proposal.contentHash}`,
        `status: ${proposal.status}`,
        `yesVotes: ${proposal.yesVotes} | noVotes: ${proposal.noVotes}`,
        `proposer: ${proposal.proposer}`,
        "",
        "Acceptance:",
        "- Implementation links back to this proposal.",
        "- CI passes.",
        "- Merge triggers a world version manifest."
      ].join("\n")
    });

    const event: import("@niuma/reducer").WorldEvent = {
      id: `github-issue-${proposal.proposalId}-${issue.data.number}`,
      source: "github",
      type: "IssueLinked",
      payload: {
        proposalId: proposal.proposalId,
        issueNumber: issue.data.number,
        issueUrl: issue.data.html_url
      }
    };
    addEventFn(event);
    linked.push({ proposalId: proposal.proposalId, issueNumber: issue.data.number, issueUrl: issue.data.html_url });
  }

  return linked;
}
