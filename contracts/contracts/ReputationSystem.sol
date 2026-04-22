// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface ICitizenRegistryForReputation {
    function isCitizen(address owner) external view returns (bool);
}

/**
 * @title ReputationSystem
 * @notice Tracks citizen reputation points from governance participation,
 *         course completion, and company contributions. Reputation is
 *         non-transferable and can only be modified by authorized sources.
 */
contract ReputationSystem is Ownable {
    struct ReputationEntry {
        uint256 totalPoints;
        uint256 governancePoints;
        uint256 academyPoints;
        uint256 companyPoints;
        uint256 lastUpdatedAt;
    }

    ICitizenRegistryForReputation public immutable citizenRegistry;

    mapping(address => ReputationEntry) private reputation;
    address public governanceSource;
    address public academySource;
    address public companySource;

    // Point values per action
    uint256 public constant VOTE_POINTS = 10;
    uint256 public constant PROPOSAL_CREATED_POINTS = 25;
    uint256 public constant PROPOSAL_PASSED_POINTS = 50;
    uint256 public constant COURSE_COMPLETED_POINTS = 30;
    uint256 public constant CREDENTIAL_EARNED_POINTS = 40;
    uint256 public constant COMPANY_FOUNDED_POINTS = 20;
    uint256 public constant COMPANY_JOINED_POINTS = 10;

    event ReputationAwarded(address indexed citizen, string reason, uint256 points, uint256 newTotal);
    event ReputationPenalized(address indexed citizen, string reason, uint256 points, uint256 newTotal);
    event SourceUpdated(string category, address indexed source);

    error NotCitizen();
    error NotAuthorizedSource();

    constructor(address citizenRegistry_, address initialOwner) Ownable(initialOwner) {
        citizenRegistry = ICitizenRegistryForReputation(citizenRegistry_);
    }

    modifier onlyCitizen(address account) {
        if (!citizenRegistry.isCitizen(account)) revert NotCitizen();
        _;
    }

    modifier onlyGovernance() {
        if (msg.sender != governanceSource && msg.sender != owner()) revert NotAuthorizedSource();
        _;
    }

    modifier onlyAcademy() {
        if (msg.sender != academySource && msg.sender != owner()) revert NotAuthorizedSource();
        _;
    }

    modifier onlyCompany() {
        if (msg.sender != companySource && msg.sender != owner()) revert NotAuthorizedSource();
        _;
    }

    // --- Source setters ---

    function setGovernanceSource(address source) external onlyOwner {
        governanceSource = source;
        emit SourceUpdated("governance", source);
    }

    function setAcademySource(address source) external onlyOwner {
        academySource = source;
        emit SourceUpdated("academy", source);
    }

    function setCompanySource(address source) external onlyOwner {
        companySource = source;
        emit SourceUpdated("company", source);
    }

    // --- Governance actions ---

    function awardVote(address citizen) external onlyGovernance onlyCitizen(citizen) {
        _addPoints(citizen, VOTE_POINTS, "governance", "vote");
    }

    function awardProposalCreated(address citizen) external onlyGovernance onlyCitizen(citizen) {
        _addPoints(citizen, PROPOSAL_CREATED_POINTS, "governance", "proposal_created");
    }

    function awardProposalPassed(address citizen) external onlyGovernance onlyCitizen(citizen) {
        _addPoints(citizen, PROPOSAL_PASSED_POINTS, "governance", "proposal_passed");
    }

    // --- Academy actions ---

    function awardCourseCompleted(address citizen) external onlyAcademy onlyCitizen(citizen) {
        _addPoints(citizen, COURSE_COMPLETED_POINTS, "academy", "course_completed");
    }

    function awardCredentialEarned(address citizen) external onlyAcademy onlyCitizen(citizen) {
        _addPoints(citizen, CREDENTIAL_EARNED_POINTS, "academy", "credential_earned");
    }

    // --- Company actions ---

    function awardCompanyFounded(address citizen) external onlyCompany onlyCitizen(citizen) {
        _addPoints(citizen, COMPANY_FOUNDED_POINTS, "company", "company_founded");
    }

    function awardCompanyJoined(address citizen) external onlyCompany onlyCitizen(citizen) {
        _addPoints(citizen, COMPANY_JOINED_POINTS, "company", "company_joined");
    }

    // --- View ---

    function getReputation(address citizen) external view returns (ReputationEntry memory) {
        return reputation[citizen];
    }

    function getTotalPoints(address citizen) external view returns (uint256) {
        return reputation[citizen].totalPoints;
    }

    // --- Internal ---

    function _addPoints(address citizen, uint256 points, string memory category, string memory reason) internal {
        ReputationEntry storage entry = reputation[citizen];
        entry.totalPoints += points;
        entry.lastUpdatedAt = block.timestamp;

        if (keccak256(bytes(category)) == keccak256("governance")) {
            entry.governancePoints += points;
        } else if (keccak256(bytes(category)) == keccak256("academy")) {
            entry.academyPoints += points;
        } else if (keccak256(bytes(category)) == keccak256("company")) {
            entry.companyPoints += points;
        }

        emit ReputationAwarded(citizen, reason, points, entry.totalPoints);
    }
}
