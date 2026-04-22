import fs from "node:fs";
import path from "node:path";
import { Contract, JsonRpcProvider } from "ethers";
import { addEvent, hasEvent } from "./store.js";
import { WorldEvent } from "@niuma/reducer";

const citizenAbi = [
  "event CitizenRegistered(uint256 indexed citizenId,address indexed owner,string metadataURI)",
  "event AgentKeyBound(uint256 indexed citizenId,bytes agentPubKey)",
  "event GithubHandleBound(uint256 indexed citizenId,string githubHandle)",
  "event ProfileUpdated(uint256 indexed citizenId,string metadataURI)"
];

const governanceAbi = [
  "event ProposalCreated(uint256 indexed proposalId,address indexed proposer,uint8 pType,string title,string contentHash)",
  "event ProposalDiscussionStarted(uint256 indexed proposalId,uint256 startAt,uint256 endAt)",
  "event ProposalVotingStarted(uint256 indexed proposalId,uint256 startAt,uint256 endAt)",
  "event VoteCast(uint256 indexed proposalId,uint256 indexed citizenId,address indexed voter,bool support)",
  "event ProposalFinalized(uint256 indexed proposalId,uint8 status,uint256 yesVotes,uint256 noVotes)",
  "event ProposalExecuted(uint256 indexed proposalId,string executionHash)"
];

const companyAbi = [
  "event CompanyCreated(uint256 indexed companyId,address indexed owner,string name,string metadataURI)",
  "event CompanyJoined(uint256 indexed companyId,address indexed member)",
  "event CompanyLeft(uint256 indexed companyId,address indexed member)",
  "event CompanyProfileUpdated(uint256 indexed companyId,string metadataURI)"
];

const roleAbi = ["event MayorAssigned(address indexed mayor,uint256 startAt,uint256 endAt)"];

const proposalTypes = ["Feature", "Governance", "District", "Company"];
const proposalStatuses = ["Draft", "Discussion", "Voting", "Passed", "Rejected", "Executed"];

type Deployment = {
  chainId: number;
  contracts: Record<string, string>;
};

type ChainSyncStatus = {
  ok: boolean;
  fromBlock?: number;
  latest?: number;
  added?: number;
  syncedAt: number;
  reason?: string;
  error?: string;
};

let lastChainSync: ChainSyncStatus | null = null;

export async function syncChainEvents() {
  const deployment = loadDeployment();
  if (!deployment) {
    lastChainSync = { ok: false, reason: "deployment not found", syncedAt: Math.floor(Date.now() / 1000) };
    return lastChainSync;
  }

  try {
    const rpcUrl = process.env.XLAYER_TESTNET_RPC || "https://testrpc.xlayer.tech/terigon";
    const provider = new JsonRpcProvider(rpcUrl);
    const latest = await provider.getBlockNumber();
    const fromBlock = Number(process.env.CHAIN_START_BLOCK || Math.max(0, latest - 1000));

    const contracts = [
      { name: "CitizenRegistry", address: deployment.contracts.CitizenRegistry, abi: citizenAbi, mapper: mapCitizenEvent },
      { name: "GovernanceCore", address: deployment.contracts.GovernanceCore, abi: governanceAbi, mapper: mapGovernanceEvent },
      { name: "CompanyRegistry", address: deployment.contracts.CompanyRegistry, abi: companyAbi, mapper: mapCompanyEvent },
      { name: "RoleManager", address: deployment.contracts.RoleManager, abi: roleAbi, mapper: mapRoleEvent }
    ];

    let added = 0;
    for (const item of contracts) {
      if (!item.address) continue;
      const contract = new Contract(item.address, item.abi, provider);
      const chunkSize = Number(process.env.CHAIN_LOG_CHUNK_SIZE || 95);
      for (let start = fromBlock; start <= latest; start += chunkSize) {
        const end = Math.min(latest, start + chunkSize - 1);
        const logs = await contract.queryFilter("*", start, end);
        for (const log of logs) {
          const mapped = item.mapper(log);
          if (mapped && !hasEvent(mapped.id)) {
            addEvent(mapped);
            added += 1;
          }
        }
      }
    }

    lastChainSync = { ok: true, fromBlock, latest, added, syncedAt: Math.floor(Date.now() / 1000) };
    return lastChainSync;
  } catch (error) {
    lastChainSync = {
      ok: false,
      error: error instanceof Error ? error.message : "unknown chain sync error",
      syncedAt: Math.floor(Date.now() / 1000)
    };
    throw error;
  }
}

export function getChainSyncStatus() {
  return lastChainSync;
}

function mapCitizenEvent(log: any): WorldEvent | undefined {
  const event = log.fragment?.name;
  if (event !== "CitizenRegistered") return undefined;
  return {
    id: chainEventId(log),
    source: "chain",
    type: "CitizenRegistered",
    blockNumber: log.blockNumber,
    logIndex: log.index,
    payload: {
      citizenId: Number(log.args.citizenId),
      owner: log.args.owner,
      metadataURI: log.args.metadataURI
    }
  };
}

function mapGovernanceEvent(log: any): WorldEvent | undefined {
  const event = log.fragment?.name;
  if (event === "ProposalCreated") {
    return {
      id: chainEventId(log),
      source: "chain",
      type: "ProposalCreated",
      blockNumber: log.blockNumber,
      logIndex: log.index,
      payload: {
        proposalId: Number(log.args.proposalId),
        proposer: log.args.proposer,
        pType: proposalTypes[Number(log.args.pType)] || String(log.args.pType),
        title: log.args.title,
        contentHash: log.args.contentHash
      }
    };
  }
  if (event === "VoteCast") {
    return {
      id: chainEventId(log),
      source: "chain",
      type: "VoteCast",
      blockNumber: log.blockNumber,
      logIndex: log.index,
      payload: {
        proposalId: Number(log.args.proposalId),
        citizenId: Number(log.args.citizenId),
        voter: log.args.voter,
        support: Boolean(log.args.support)
      }
    };
  }
  if (event === "ProposalDiscussionStarted") {
    return {
      id: chainEventId(log),
      source: "chain",
      type: "ProposalDiscussionStarted",
      blockNumber: log.blockNumber,
      logIndex: log.index,
      payload: {
        proposalId: Number(log.args.proposalId),
        startAt: Number(log.args.startAt),
        endAt: Number(log.args.endAt)
      }
    };
  }
  if (event === "ProposalVotingStarted") {
    return {
      id: chainEventId(log),
      source: "chain",
      type: "ProposalVotingStarted",
      blockNumber: log.blockNumber,
      logIndex: log.index,
      payload: {
        proposalId: Number(log.args.proposalId),
        startAt: Number(log.args.startAt),
        endAt: Number(log.args.endAt)
      }
    };
  }
  if (event === "ProposalFinalized") {
    return {
      id: chainEventId(log),
      source: "chain",
      type: "ProposalFinalized",
      blockNumber: log.blockNumber,
      logIndex: log.index,
      payload: {
        proposalId: Number(log.args.proposalId),
        status: proposalStatuses[Number(log.args.status)] || String(log.args.status),
        yesVotes: Number(log.args.yesVotes),
        noVotes: Number(log.args.noVotes)
      }
    };
  }
  if (event === "ProposalExecuted") {
    return {
      id: chainEventId(log),
      source: "chain",
      type: "ProposalExecuted",
      blockNumber: log.blockNumber,
      logIndex: log.index,
      payload: {
        proposalId: Number(log.args.proposalId),
        executionHash: log.args.executionHash
      }
    };
  }
  return undefined;
}

function mapCompanyEvent(log: any): WorldEvent | undefined {
  const event = log.fragment?.name;
  if (event === "CompanyCreated") {
    return {
      id: chainEventId(log),
      source: "chain",
      type: "CompanyCreated",
      blockNumber: log.blockNumber,
      logIndex: log.index,
      payload: {
        companyId: Number(log.args.companyId),
        owner: log.args.owner,
        name: log.args.name,
        metadataURI: log.args.metadataURI
      }
    };
  }
  if (event === "CompanyJoined") {
    return {
      id: chainEventId(log),
      source: "chain",
      type: "CompanyJoined",
      blockNumber: log.blockNumber,
      logIndex: log.index,
      payload: {
        companyId: Number(log.args.companyId),
        member: log.args.member
      }
    };
  }
  if (event === "CompanyLeft") {
    return {
      id: chainEventId(log),
      source: "chain",
      type: "CompanyLeft",
      blockNumber: log.blockNumber,
      logIndex: log.index,
      payload: {
        companyId: Number(log.args.companyId),
        member: log.args.member
      }
    };
  }
  return undefined;
}

function mapRoleEvent(log: any): WorldEvent | undefined {
  if (log.fragment?.name !== "MayorAssigned") return undefined;
  return {
    id: chainEventId(log),
    source: "chain",
    type: "MayorAssigned",
    blockNumber: log.blockNumber,
    logIndex: log.index,
    payload: {
      mayor: log.args.mayor,
      startAt: Number(log.args.startAt),
      endAt: Number(log.args.endAt)
    }
  };
}

function chainEventId(log: any) {
  return `chain-${log.blockNumber}-${log.transactionIndex}-${log.index}-${log.transactionHash}`;
}

function loadDeployment(): Deployment | null {
  const configured = process.env.CITIZEN_REGISTRY
    ? {
        chainId: 1952,
        contracts: {
          CitizenRegistry: process.env.CITIZEN_REGISTRY,
          GovernanceCore: process.env.GOVERNANCE_CORE || "",
          RoleManager: process.env.ROLE_MANAGER || "",
          CompanyRegistry: process.env.COMPANY_REGISTRY || ""
        }
      }
    : null;
  if (configured) return configured;

  const candidates = [
    path.resolve(process.cwd(), "world", "deployments", "1952.json"),
    path.resolve(process.cwd(), "..", "..", "world", "deployments", "1952.json")
  ];
  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Deployment;
}
