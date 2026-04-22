// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICitizenRegistry {
    function isCitizen(address owner) external view returns (bool);
    function citizenOf(address owner) external view returns (uint256);
}

contract GovernanceCore {
    enum ProposalType {
        Feature,
        Governance,
        District,
        Company
    }

    enum ProposalStatus {
        Draft,
        Discussion,
        Voting,
        Passed,
        Rejected,
        Executed
    }

    struct Proposal {
        uint256 id;
        ProposalType pType;
        ProposalStatus status;
        address proposer;
        string title;
        string contentHash;
        string executionHash;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 discussionStartAt;
        uint256 discussionEndAt;
        uint256 votingStartAt;
        uint256 votingEndAt;
        uint256 createdAt;
    }

    ICitizenRegistry public immutable citizenRegistry;
    uint256 public nextProposalId = 1;
    uint256 public discussionDuration = 10 minutes;
    uint256 public votingDuration = 10 minutes;

    mapping(uint256 => Proposal) private proposals;
    mapping(uint256 => mapping(uint256 => bool)) public hasCitizenVoted;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, ProposalType pType, string title, string contentHash);
    event ProposalDiscussionStarted(uint256 indexed proposalId, uint256 startAt, uint256 endAt);
    event ProposalVotingStarted(uint256 indexed proposalId, uint256 startAt, uint256 endAt);
    event VoteCast(uint256 indexed proposalId, uint256 indexed citizenId, address indexed voter, bool support);
    event ProposalFinalized(uint256 indexed proposalId, ProposalStatus status, uint256 yesVotes, uint256 noVotes);
    event ProposalExecuted(uint256 indexed proposalId, string executionHash);

    error OnlyCitizen();
    error InvalidStatus();
    error AlreadyVoted();
    error ProposalMissing();
    error VotingStillOpen();

    constructor(address citizenRegistry_) {
        citizenRegistry = ICitizenRegistry(citizenRegistry_);
    }

    function createProposal(ProposalType pType, string calldata title, string calldata contentHash) external onlyCitizen returns (uint256 proposalId) {
        proposalId = nextProposalId++;
        proposals[proposalId] = Proposal({
            id: proposalId,
            pType: pType,
            status: ProposalStatus.Draft,
            proposer: msg.sender,
            title: title,
            contentHash: contentHash,
            executionHash: "",
            yesVotes: 0,
            noVotes: 0,
            discussionStartAt: 0,
            discussionEndAt: 0,
            votingStartAt: 0,
            votingEndAt: 0,
            createdAt: block.timestamp
        });
        emit ProposalCreated(proposalId, msg.sender, pType, title, contentHash);
    }

    function startDiscussion(uint256 proposalId) external onlyCitizen {
        Proposal storage proposal = existingProposal(proposalId);
        if (proposal.status != ProposalStatus.Draft) revert InvalidStatus();
        proposal.status = ProposalStatus.Discussion;
        proposal.discussionStartAt = block.timestamp;
        proposal.discussionEndAt = block.timestamp + discussionDuration;
        emit ProposalDiscussionStarted(proposalId, proposal.discussionStartAt, proposal.discussionEndAt);
    }

    function startVoting(uint256 proposalId) external onlyCitizen {
        Proposal storage proposal = existingProposal(proposalId);
        if (proposal.status != ProposalStatus.Discussion) revert InvalidStatus();
        proposal.status = ProposalStatus.Voting;
        proposal.votingStartAt = block.timestamp;
        proposal.votingEndAt = block.timestamp + votingDuration;
        emit ProposalVotingStarted(proposalId, proposal.votingStartAt, proposal.votingEndAt);
    }

    function vote(uint256 proposalId, bool support) external onlyCitizen {
        Proposal storage proposal = existingProposal(proposalId);
        if (proposal.status != ProposalStatus.Voting) revert InvalidStatus();
        uint256 citizenId = citizenRegistry.citizenOf(msg.sender);
        if (hasCitizenVoted[proposalId][citizenId]) revert AlreadyVoted();
        hasCitizenVoted[proposalId][citizenId] = true;
        if (support) {
            proposal.yesVotes += 1;
        } else {
            proposal.noVotes += 1;
        }
        emit VoteCast(proposalId, citizenId, msg.sender, support);
    }

    function finalizeProposal(uint256 proposalId) external {
        Proposal storage proposal = existingProposal(proposalId);
        if (proposal.status != ProposalStatus.Voting) revert InvalidStatus();
        if (block.timestamp < proposal.votingEndAt) revert VotingStillOpen();
        proposal.status = proposal.yesVotes > proposal.noVotes ? ProposalStatus.Passed : ProposalStatus.Rejected;
        emit ProposalFinalized(proposalId, proposal.status, proposal.yesVotes, proposal.noVotes);
    }

    function markExecuted(uint256 proposalId, string calldata executionHash) external onlyCitizen {
        Proposal storage proposal = existingProposal(proposalId);
        if (proposal.status != ProposalStatus.Passed) revert InvalidStatus();
        proposal.status = ProposalStatus.Executed;
        proposal.executionHash = executionHash;
        emit ProposalExecuted(proposalId, executionHash);
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.id == 0) revert ProposalMissing();
        return proposal;
    }

    function existingProposal(uint256 proposalId) private view returns (Proposal storage proposal) {
        proposal = proposals[proposalId];
        if (proposal.id == 0) revert ProposalMissing();
    }

    modifier onlyCitizen() {
        if (!citizenRegistry.isCitizen(msg.sender)) revert OnlyCitizen();
        _;
    }
}
