import { createHash } from "node:crypto";

export type WorldEvent =
  | { id: string; source: "chain"; type: "CitizenRegistered"; blockNumber: number; logIndex: number; payload: { citizenId: number; owner: string; metadataURI: string } }
  | { id: string; source: "chain"; type: "ProposalCreated"; blockNumber: number; logIndex: number; payload: { proposalId: number; proposer: string; pType: string; title: string; contentHash: string } }
  | { id: string; source: "chain"; type: "ProposalDiscussionStarted"; blockNumber: number; logIndex: number; payload: { proposalId: number; startAt: number; endAt: number } }
  | { id: string; source: "chain"; type: "ProposalVotingStarted"; blockNumber: number; logIndex: number; payload: { proposalId: number; startAt: number; endAt: number } }
  | { id: string; source: "chain"; type: "VoteCast"; blockNumber: number; logIndex: number; payload: { proposalId: number; citizenId: number; voter: string; support: boolean } }
  | { id: string; source: "chain"; type: "ProposalFinalized"; blockNumber: number; logIndex: number; payload: { proposalId: number; status: string; yesVotes: number; noVotes: number } }
  | { id: string; source: "chain"; type: "ProposalExecuted"; blockNumber: number; logIndex: number; payload: { proposalId: number; executionHash: string } }
  | { id: string; source: "chain"; type: "CompanyCreated"; blockNumber: number; logIndex: number; payload: { companyId: number; owner: string; name: string; metadataURI: string } }
  | { id: string; source: "chain"; type: "CompanyJoined"; blockNumber: number; logIndex: number; payload: { companyId: number; member: string } }
  | { id: string; source: "chain"; type: "CompanyLeft"; blockNumber: number; logIndex: number; payload: { companyId: number; member: string } }
  | { id: string; source: "chain"; type: "MayorAssigned"; blockNumber: number; logIndex: number; payload: { mayor: string; startAt: number; endAt: number } }
  | { id: string; source: "chain"; type: "CourseProposed"; blockNumber: number; logIndex: number; payload: { courseId: number; proposer: string; title: string; contentHash: string; difficulty: number } }
  | { id: string; source: "chain"; type: "CourseActivated"; blockNumber: number; logIndex: number; payload: { courseId: number } }
  | { id: string; source: "chain"; type: "CourseDeprecated"; blockNumber: number; logIndex: number; payload: { courseId: number } }
  | { id: string; source: "chain"; type: "CourseCompleted"; blockNumber: number; logIndex: number; payload: { courseId: number; citizen: string } }
  | { id: string; source: "chain"; type: "CredentialIssued"; blockNumber: number; logIndex: number; payload: { credentialId: number; citizen: string; courseId: number; evidenceHash: string } }
  | { id: string; source: "chain"; type: "ReputationAwarded"; blockNumber: number; logIndex: number; payload: { citizen: string; reason: string; points: number; newTotal: number } }
  | { id: string; source: "github"; type: "IssueLinked"; blockNumber?: number; logIndex?: number; payload: { proposalId: number; issueNumber: number; issueUrl: string } }
  | { id: string; source: "github"; type: "PullRequestMerged"; blockNumber?: number; logIndex?: number; payload: { proposalId: number; prNumber: number; mergeCommit: string; url: string } };

export interface WorldState {
  citizens: Record<string, { citizenId: number; wallet: string; metadataURI: string }>;
  proposals: Record<string, {
    proposalId: number;
    proposer: string;
    type: string;
    title: string;
    contentHash: string;
    status: string;
    yesVotes: number;
    noVotes: number;
    issueNumber?: number;
    issueUrl?: string;
    linkedPRs: Array<{ prNumber: number; mergeCommit: string; url: string }>;
    executionHash?: string;
  }>;
  companies: Record<string, { companyId: number; owner: string; name: string; metadataURI: string; members: string[] }>;
  mayor?: { wallet: string; startAt: number; endAt: number };
  academy: {
    courses: Record<string, { courseId: number; proposer: string; title: string; contentHash: string; difficulty: number; status: string; completionCount: number }>;
    credentials: Record<string, { credentialId: number; citizen: string; courseId: number; evidenceHash: string; issuedAt: number }>;
  };
  reputation: Record<string, { citizen: string; totalPoints: number; governancePoints: number; academyPoints: number; companyPoints: number }>;
  archive: WorldEvent[];
}

export interface WorldManifest {
  version: number;
  constitutionHash: string;
  stateRoot: string;
  generatedAt: number;
  rooms: string[];
  offices: Array<{ mayor: string; startAt: number; endAt: number }>;
  companies: Array<WorldState["companies"][string]>;
  activeProposals: Array<WorldState["proposals"][string]>;
  completedProposals: Array<WorldState["proposals"][string]>;
  citizenIndexRoot: string;
  socialGraphRoot: string;
  academyRoot: string;
  reputationRoot: string;
  githubSync: {
    repo: string;
    commit: string;
  };
}

export function reduceEvents(events: WorldEvent[]): WorldState {
  const state: WorldState = { citizens: {}, proposals: {}, companies: {}, academy: { courses: {}, credentials: {} }, reputation: {}, archive: [] };
  for (const event of sortEvents(events)) {
    state.archive.push(event);
    switch (event.type) {
      case "CitizenRegistered":
        state.citizens[event.payload.owner.toLowerCase()] = {
          citizenId: event.payload.citizenId,
          wallet: event.payload.owner,
          metadataURI: event.payload.metadataURI
        };
        break;
      case "ProposalCreated":
        state.proposals[String(event.payload.proposalId)] = {
          proposalId: event.payload.proposalId,
          proposer: event.payload.proposer,
          type: event.payload.pType,
          title: event.payload.title,
          contentHash: event.payload.contentHash,
          status: "Draft",
          yesVotes: 0,
          noVotes: 0,
          linkedPRs: []
        };
        break;
      case "VoteCast": {
        const proposal = state.proposals[String(event.payload.proposalId)];
        if (proposal) event.payload.support ? proposal.yesVotes++ : proposal.noVotes++;
        break;
      }
      case "ProposalDiscussionStarted": {
        const proposal = state.proposals[String(event.payload.proposalId)];
        if (proposal) proposal.status = "Discussion";
        break;
      }
      case "ProposalVotingStarted": {
        const proposal = state.proposals[String(event.payload.proposalId)];
        if (proposal) proposal.status = "Voting";
        break;
      }
      case "ProposalFinalized": {
        const proposal = state.proposals[String(event.payload.proposalId)];
        if (proposal) {
          proposal.status = event.payload.status;
          proposal.yesVotes = event.payload.yesVotes;
          proposal.noVotes = event.payload.noVotes;
        }
        break;
      }
      case "ProposalExecuted": {
        const proposal = state.proposals[String(event.payload.proposalId)];
        if (proposal) {
          proposal.status = "Executed";
          proposal.executionHash = event.payload.executionHash;
        }
        break;
      }
      case "CompanyCreated":
        state.companies[String(event.payload.companyId)] = {
          companyId: event.payload.companyId,
          owner: event.payload.owner,
          name: event.payload.name,
          metadataURI: event.payload.metadataURI,
          members: [event.payload.owner]
        };
        break;
      case "CompanyJoined": {
        const company = state.companies[String(event.payload.companyId)];
        if (company && !company.members.includes(event.payload.member)) company.members.push(event.payload.member);
        break;
      }
      case "CompanyLeft": {
        const company = state.companies[String(event.payload.companyId)];
        if (company) company.members = company.members.filter((member) => member.toLowerCase() !== event.payload.member.toLowerCase());
        break;
      }
      case "MayorAssigned":
        state.mayor = { wallet: event.payload.mayor, startAt: event.payload.startAt, endAt: event.payload.endAt };
        break;
      case "CourseProposed":
        state.academy.courses[String(event.payload.courseId)] = {
          courseId: event.payload.courseId,
          proposer: event.payload.proposer,
          title: event.payload.title,
          contentHash: event.payload.contentHash,
          difficulty: event.payload.difficulty,
          status: "Draft",
          completionCount: 0
        };
        break;
      case "CourseActivated": {
        const course = state.academy.courses[String(event.payload.courseId)];
        if (course) course.status = "Active";
        break;
      }
      case "CourseDeprecated": {
        const deprecated = state.academy.courses[String(event.payload.courseId)];
        if (deprecated) deprecated.status = "Deprecated";
        break;
      }
      case "CourseCompleted": {
        const completed = state.academy.courses[String(event.payload.courseId)];
        if (completed) completed.completionCount++;
        break;
      }
      case "CredentialIssued":
        state.academy.credentials[String(event.payload.credentialId)] = {
          credentialId: event.payload.credentialId,
          citizen: event.payload.citizen,
          courseId: event.payload.courseId,
          evidenceHash: event.payload.evidenceHash,
          issuedAt: event.blockNumber
        };
        break;
      case "ReputationAwarded": {
        const key = event.payload.citizen.toLowerCase();
        const existing = state.reputation[key];
        const categoryMap: Record<string, keyof Pick<typeof existing extends undefined ? never : typeof existing, "governancePoints" | "academyPoints" | "companyPoints">> = {
          vote: "governancePoints",
          proposal_created: "governancePoints",
          proposal_passed: "governancePoints",
          course_completed: "academyPoints",
          credential_earned: "academyPoints",
          company_founded: "companyPoints",
          company_joined: "companyPoints"
        };
        const category = categoryMap[event.payload.reason] || "governancePoints";
        state.reputation[key] = {
          citizen: event.payload.citizen,
          totalPoints: event.payload.newTotal,
          governancePoints: (existing?.governancePoints ?? 0) + (category === "governancePoints" ? event.payload.points : 0),
          academyPoints: (existing?.academyPoints ?? 0) + (category === "academyPoints" ? event.payload.points : 0),
          companyPoints: (existing?.companyPoints ?? 0) + (category === "companyPoints" ? event.payload.points : 0)
        };
        break;
      }
      case "IssueLinked": {
        const proposal = state.proposals[String(event.payload.proposalId)];
        if (proposal) {
          proposal.issueNumber = event.payload.issueNumber;
          proposal.issueUrl = event.payload.issueUrl;
        }
        break;
      }
      case "PullRequestMerged": {
        const proposal = state.proposals[String(event.payload.proposalId)];
        if (proposal) proposal.linkedPRs.push({ prNumber: event.payload.prNumber, mergeCommit: event.payload.mergeCommit, url: event.payload.url });
        break;
      }
    }
  }
  return state;
}

export function buildManifest(input: {
  version: number;
  constitutionHash: string;
  generatedAt: number;
  state: WorldState;
  githubRepo: string;
  githubCommit: string;
}): WorldManifest {
  const companies = Object.values(input.state.companies).sort((a, b) => a.companyId - b.companyId);
  const proposals = Object.values(input.state.proposals).sort((a, b) => a.proposalId - b.proposalId);
  const activeProposals = proposals.filter((proposal) => !["Passed", "Rejected", "Executed"].includes(proposal.status));
  const completedProposals = proposals.filter((proposal) => ["Passed", "Rejected", "Executed"].includes(proposal.status));
  const citizenIndexRoot = hashCanonical(Object.values(input.state.citizens).sort((a, b) => a.citizenId - b.citizenId));
  const socialGraphRoot = hashCanonical(companies.map((company) => ({ companyId: company.companyId, members: [...company.members].sort() })));
  const academyRoot = hashCanonical({
    courses: Object.values(input.state.academy.courses).sort((a, b) => a.courseId - b.courseId),
    credentials: Object.values(input.state.academy.credentials).sort((a, b) => a.credentialId - b.credentialId)
  });
  const reputationRoot = hashCanonical(Object.values(input.state.reputation).sort((a, b) => a.totalPoints - b.totalPoints));
  const manifestWithoutRoot = {
    version: input.version,
    constitutionHash: input.constitutionHash,
    generatedAt: input.generatedAt,
    rooms: ["plaza", "city-hall", "dev-center", "company-district", "academy", "archive"],
    offices: input.state.mayor ? [{ mayor: input.state.mayor.wallet, startAt: input.state.mayor.startAt, endAt: input.state.mayor.endAt }] : [],
    companies,
    activeProposals,
    completedProposals,
    citizenIndexRoot,
    socialGraphRoot,
    academyRoot,
    reputationRoot,
    githubSync: { repo: input.githubRepo, commit: input.githubCommit }
  };
  const stateRoot = hashCanonical({ state: input.state, manifest: manifestWithoutRoot });
  return { ...manifestWithoutRoot, stateRoot };
}

export function hashCanonical(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, nested]) => nested !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${canonicalJson(nested)}`).join(",")}}`;
}

function sortEvents(events: WorldEvent[]): WorldEvent[] {
  return [...events].sort((a, b) => {
    const blockDelta = (a.blockNumber ?? Number.MAX_SAFE_INTEGER) - (b.blockNumber ?? Number.MAX_SAFE_INTEGER);
    if (blockDelta !== 0) return blockDelta;
    const logDelta = (a.logIndex ?? Number.MAX_SAFE_INTEGER) - (b.logIndex ?? Number.MAX_SAFE_INTEGER);
    if (logDelta !== 0) return logDelta;
    return a.id.localeCompare(b.id);
  });
}
