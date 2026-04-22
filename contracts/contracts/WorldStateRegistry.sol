// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract WorldStateRegistry is Ownable {
    struct WorldVersion {
        uint256 version;
        string stateHash;
        string manifestURI;
        address publisher;
        uint256 createdAt;
    }

    bytes32 public constant STATE_PUBLISHER_ROLE = keccak256("STATE_PUBLISHER_ROLE");
    string public constitutionHash;
    uint256 private latestVersion;
    mapping(uint256 => WorldVersion) private versions;
    mapping(address => bool) public statePublishers;

    event ConstitutionHashUpdated(string constitutionHash);
    event StatePublisherUpdated(address indexed publisher, bool allowed);
    event WorldVersionSubmitted(uint256 indexed version, string stateHash, string manifestURI);

    error NotPublisher();
    error VersionOutOfOrder();
    error VersionMissing();

    constructor(address initialOwner) Ownable(initialOwner) {
        statePublishers[initialOwner] = true;
    }

    function setConstitutionHash(string calldata constitutionHash_) external onlyOwner {
        constitutionHash = constitutionHash_;
        emit ConstitutionHashUpdated(constitutionHash_);
    }

    function setStatePublisher(address publisher, bool allowed) external onlyOwner {
        statePublishers[publisher] = allowed;
        emit StatePublisherUpdated(publisher, allowed);
    }

    function submitWorldVersion(uint256 version, string calldata stateHash, string calldata manifestURI) external {
        if (!statePublishers[msg.sender]) revert NotPublisher();
        if (version != latestVersion + 1) revert VersionOutOfOrder();
        versions[version] = WorldVersion({
            version: version,
            stateHash: stateHash,
            manifestURI: manifestURI,
            publisher: msg.sender,
            createdAt: block.timestamp
        });
        latestVersion = version;
        emit WorldVersionSubmitted(version, stateHash, manifestURI);
    }

    function latestWorldVersion() external view returns (uint256) {
        return latestVersion;
    }

    function getWorldVersion(uint256 version) external view returns (WorldVersion memory) {
        if (versions[version].version == 0) revert VersionMissing();
        return versions[version];
    }
}
