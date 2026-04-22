// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICitizenRegistryForCredential {
    function isCitizen(address owner) external view returns (bool);
}

interface ICourseRegistryForCredential {
    function getCourseStatus(uint256 courseId) external view returns (uint8);
}

contract CredentialRegistry {
    struct Credential {
        uint256 id;
        address citizen;
        uint256 courseId;
        string evidenceHash;
        uint256 issuedAt;
        address issuedBy;
    }

    ICitizenRegistryForCredential public immutable citizenRegistry;
    ICourseRegistryForCredential public immutable courseRegistry;
    address public governor;

    uint256 public nextCredentialId = 1;
    mapping(uint256 => Credential) private credentials;
    mapping(address => uint256[]) private credentialsByCitizen;
    mapping(uint256 => uint256[]) private credentialsByCourse;
    // One credential per course per citizen (prevent duplicate)
    mapping(address => mapping(uint256 => bool)) public hasCredentialForCourse;

    event CredentialIssued(uint256 indexed credentialId, address indexed citizen, uint256 indexed courseId, string evidenceHash);

    error OnlyCitizen();
    error OnlyGovernor();
    error CourseNotActive();
    error AlreadyHasCredential();
    error CredentialMissing();

    constructor(address citizenRegistry_, address courseRegistry_, address governor_) {
        citizenRegistry = ICitizenRegistryForCredential(citizenRegistry_);
        courseRegistry = ICourseRegistryForCredential(courseRegistry_);
        governor = governor_;
    }

    function issueCredential(
        address citizen,
        uint256 courseId,
        string calldata evidenceHash
    ) external onlyGovernor returns (uint256 credentialId) {
        if (!citizenRegistry.isCitizen(citizen)) revert OnlyCitizen();
        // CourseStatus.Active = 1
        if (courseRegistry.getCourseStatus(courseId) != 1) revert CourseNotActive();
        if (hasCredentialForCourse[citizen][courseId]) revert AlreadyHasCredential();

        credentialId = nextCredentialId++;
        credentials[credentialId] = Credential({
            id: credentialId,
            citizen: citizen,
            courseId: courseId,
            evidenceHash: evidenceHash,
            issuedAt: block.timestamp,
            issuedBy: msg.sender
        });
        credentialsByCitizen[citizen].push(credentialId);
        credentialsByCourse[courseId].push(credentialId);
        hasCredentialForCourse[citizen][courseId] = true;

        emit CredentialIssued(credentialId, citizen, courseId, evidenceHash);
    }

    function getCredential(uint256 credentialId) external view returns (Credential memory) {
        if (credentials[credentialId].citizen == address(0)) revert CredentialMissing();
        return credentials[credentialId];
    }

    function getCredentialsByCitizen(address citizen) external view returns (uint256[] memory) {
        return credentialsByCitizen[citizen];
    }

    function getCredentialsByCourse(uint256 courseId) external view returns (uint256[] memory) {
        return credentialsByCourse[courseId];
    }

    function getCredentialCount() external view returns (uint256) {
        return nextCredentialId - 1;
    }

    function setGovernor(address newGovernor) external onlyGovernor {
        governor = newGovernor;
    }

    modifier onlyGovernor() {
        if (msg.sender != governor) revert OnlyGovernor();
        _;
    }
}
