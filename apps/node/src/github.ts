import crypto from "node:crypto";
import { Octokit } from "@octokit/rest";

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
