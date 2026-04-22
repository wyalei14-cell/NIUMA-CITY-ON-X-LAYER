// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICitizenRegistryForElection {
    function isCitizen(address owner) external view returns (bool);
    function citizenOf(address owner) external view returns (uint256);
}

interface IRoleManagerForElection {
    function setMayor(address mayor, uint256 startAt, uint256 endAt) external;
}

contract ElectionManager {
    enum ElectionStatus {
        Nomination,
        Campaign,
        Voting,
        Finalized
    }

    struct Round {
        uint256 id;
        ElectionStatus status;
        uint256 startAt;
        uint256 endAt;
        address winner;
        address[] candidates;
    }

    ICitizenRegistryForElection public immutable citizenRegistry;
    IRoleManagerForElection public immutable roleManager;
    uint256 public roundDuration = 24 hours;
    uint256 public nextRoundId = 1;
    mapping(uint256 => Round) private rounds;
    mapping(uint256 => mapping(address => bool)) public isCandidate;
    mapping(uint256 => mapping(uint256 => bool)) public hasCitizenVoted;
    mapping(uint256 => mapping(address => uint256)) public votesByCandidate;

    event ElectionRoundOpened(uint256 indexed roundId, uint256 startAt, uint256 endAt);
    event CandidateNominated(uint256 indexed roundId, address indexed candidate, string statementURI);
    event ElectionVotingStarted(uint256 indexed roundId);
    event MayorVoteCast(uint256 indexed roundId, uint256 indexed citizenId, address indexed voter, address candidate);
    event ElectionFinalized(uint256 indexed roundId, address indexed winner, uint256 startAt, uint256 endAt);

    error OnlyCitizen();
    error RoundMissing();
    error InvalidStatus();
    error AlreadyCandidate();
    error AlreadyVoted();
    error UnknownCandidate();

    constructor(address citizenRegistry_, address roleManager_) {
        citizenRegistry = ICitizenRegistryForElection(citizenRegistry_);
        roleManager = IRoleManagerForElection(roleManager_);
    }

    function openRound() external returns (uint256 roundId) {
        roundId = nextRoundId++;
        rounds[roundId].id = roundId;
        rounds[roundId].status = ElectionStatus.Nomination;
        rounds[roundId].startAt = block.timestamp;
        rounds[roundId].endAt = block.timestamp + roundDuration;
        emit ElectionRoundOpened(roundId, rounds[roundId].startAt, rounds[roundId].endAt);
    }

    function nominate(uint256 roundId, string calldata statementURI) external onlyCitizen {
        Round storage round = existingRound(roundId);
        if (round.status != ElectionStatus.Nomination && round.status != ElectionStatus.Campaign) revert InvalidStatus();
        if (isCandidate[roundId][msg.sender]) revert AlreadyCandidate();
        isCandidate[roundId][msg.sender] = true;
        round.candidates.push(msg.sender);
        round.status = ElectionStatus.Campaign;
        emit CandidateNominated(roundId, msg.sender, statementURI);
    }

    function startVoting(uint256 roundId) external {
        Round storage round = existingRound(roundId);
        if (round.status != ElectionStatus.Campaign) revert InvalidStatus();
        round.status = ElectionStatus.Voting;
        emit ElectionVotingStarted(roundId);
    }

    function voteForMayor(uint256 roundId, address candidate) external onlyCitizen {
        Round storage round = existingRound(roundId);
        if (round.status != ElectionStatus.Voting) revert InvalidStatus();
        if (!isCandidate[roundId][candidate]) revert UnknownCandidate();
        uint256 citizenId = citizenRegistry.citizenOf(msg.sender);
        if (hasCitizenVoted[roundId][citizenId]) revert AlreadyVoted();
        hasCitizenVoted[roundId][citizenId] = true;
        votesByCandidate[roundId][candidate] += 1;
        emit MayorVoteCast(roundId, citizenId, msg.sender, candidate);
    }

    function finalizeRound(uint256 roundId) external {
        Round storage round = existingRound(roundId);
        if (round.status != ElectionStatus.Voting) revert InvalidStatus();
        address winner = address(0);
        uint256 highScore = 0;
        bool tied = false;

        for (uint256 i = 0; i < round.candidates.length; i++) {
            address candidate = round.candidates[i];
            uint256 score = votesByCandidate[roundId][candidate];
            if (score > highScore) {
                winner = candidate;
                highScore = score;
                tied = false;
            } else if (score == highScore && score != 0) {
                tied = true;
            }
        }

        if (tied || winner == address(0)) {
            uint256 runoffId = nextRoundId++;
            rounds[runoffId].id = runoffId;
            rounds[runoffId].status = ElectionStatus.Nomination;
            rounds[runoffId].startAt = block.timestamp;
            rounds[runoffId].endAt = block.timestamp + 1 hours;
            round.status = ElectionStatus.Finalized;
            emit ElectionRoundOpened(runoffId, rounds[runoffId].startAt, rounds[runoffId].endAt);
            return;
        }

        round.status = ElectionStatus.Finalized;
        round.winner = winner;
        roleManager.setMayor(winner, block.timestamp, block.timestamp + roundDuration);
        emit ElectionFinalized(roundId, winner, block.timestamp, block.timestamp + roundDuration);
    }

    function getRound(uint256 roundId) external view returns (Round memory) {
        return existingRound(roundId);
    }

    function existingRound(uint256 roundId) private view returns (Round storage round) {
        round = rounds[roundId];
        if (round.id == 0) revert RoundMissing();
    }

    modifier onlyCitizen() {
        if (!citizenRegistry.isCitizen(msg.sender)) revert OnlyCitizen();
        _;
    }
}
