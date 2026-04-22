// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CitizenRegistry is Ownable {
    struct Citizen {
        uint256 id;
        address owner;
        string metadataURI;
        bytes agentPubKey;
        string githubHandle;
        uint256 createdAt;
    }

    uint256 public nextCitizenId = 1;
    mapping(uint256 => Citizen) private citizens;
    mapping(address => uint256) private citizenByOwner;

    event CitizenRegistered(uint256 indexed citizenId, address indexed owner, string metadataURI);
    event AgentKeyBound(uint256 indexed citizenId, bytes agentPubKey);
    event GithubHandleBound(uint256 indexed citizenId, string githubHandle);
    event ProfileUpdated(uint256 indexed citizenId, string metadataURI);

    error NotCitizen();
    error AlreadyCitizen();
    error NotCitizenOwner();
    error InvalidOwner();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerCitizen(address owner, string calldata metadataURI) external returns (uint256 citizenId) {
        if (owner == address(0)) revert InvalidOwner();
        if (citizenByOwner[owner] != 0) revert AlreadyCitizen();
        if (msg.sender != owner && msg.sender != this.owner()) revert NotCitizenOwner();

        citizenId = nextCitizenId++;
        citizenByOwner[owner] = citizenId;
        citizens[citizenId] = Citizen({
            id: citizenId,
            owner: owner,
            metadataURI: metadataURI,
            agentPubKey: "",
            githubHandle: "",
            createdAt: block.timestamp
        });

        emit CitizenRegistered(citizenId, owner, metadataURI);
    }

    function bindAgentKey(uint256 citizenId, bytes calldata agentPubKey) external onlyCitizenOwner(citizenId) {
        citizens[citizenId].agentPubKey = agentPubKey;
        emit AgentKeyBound(citizenId, agentPubKey);
    }

    function bindGithubHandle(uint256 citizenId, string calldata githubHandle) external onlyCitizenOwner(citizenId) {
        citizens[citizenId].githubHandle = githubHandle;
        emit GithubHandleBound(citizenId, githubHandle);
    }

    function updateProfileURI(uint256 citizenId, string calldata metadataURI) external onlyCitizenOwner(citizenId) {
        citizens[citizenId].metadataURI = metadataURI;
        emit ProfileUpdated(citizenId, metadataURI);
    }

    function citizenOf(address owner) external view returns (uint256) {
        return citizenByOwner[owner];
    }

    function isCitizen(address owner) public view returns (bool) {
        return citizenByOwner[owner] != 0;
    }

    function getCitizen(uint256 citizenId) external view returns (Citizen memory) {
        if (citizens[citizenId].owner == address(0)) revert NotCitizen();
        return citizens[citizenId];
    }

    modifier onlyCitizenOwner(uint256 citizenId) {
        if (citizens[citizenId].owner == address(0)) revert NotCitizen();
        if (citizens[citizenId].owner != msg.sender) revert NotCitizenOwner();
        _;
    }
}
