// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICitizenRegistryForCompany {
    function isCitizen(address owner) external view returns (bool);
}

contract CompanyRegistry {
    struct Company {
        uint256 id;
        string name;
        string metadataURI;
        address owner;
        uint256 createdAt;
        uint256 memberCount;
    }

    ICitizenRegistryForCompany public immutable citizenRegistry;
    uint256 public nextCompanyId = 1;
    mapping(uint256 => Company) private companies;
    mapping(address => uint256) private companyByCitizen;
    mapping(uint256 => mapping(address => bool)) public isCompanyMember;

    event CompanyCreated(uint256 indexed companyId, address indexed owner, string name, string metadataURI);
    event CompanyJoined(uint256 indexed companyId, address indexed member);
    event CompanyLeft(uint256 indexed companyId, address indexed member);
    event CompanyProfileUpdated(uint256 indexed companyId, string metadataURI);

    error OnlyCitizen();
    error AlreadyInCompany();
    error NotInCompany();
    error CompanyMissing();
    error OnlyCompanyOwner();

    constructor(address citizenRegistry_) {
        citizenRegistry = ICitizenRegistryForCompany(citizenRegistry_);
    }

    function createCompany(string calldata name, string calldata metadataURI) external onlyCitizen returns (uint256 companyId) {
        if (companyByCitizen[msg.sender] != 0) revert AlreadyInCompany();
        companyId = nextCompanyId++;
        companies[companyId] = Company({
            id: companyId,
            name: name,
            metadataURI: metadataURI,
            owner: msg.sender,
            createdAt: block.timestamp,
            memberCount: 1
        });
        companyByCitizen[msg.sender] = companyId;
        isCompanyMember[companyId][msg.sender] = true;
        emit CompanyCreated(companyId, msg.sender, name, metadataURI);
        emit CompanyJoined(companyId, msg.sender);
    }

    function joinCompany(uint256 companyId) external onlyCitizen {
        Company storage company = existingCompany(companyId);
        if (companyByCitizen[msg.sender] != 0) revert AlreadyInCompany();
        companyByCitizen[msg.sender] = companyId;
        isCompanyMember[companyId][msg.sender] = true;
        company.memberCount += 1;
        emit CompanyJoined(companyId, msg.sender);
    }

    function leaveCompany(uint256 companyId) external {
        Company storage company = existingCompany(companyId);
        if (companyByCitizen[msg.sender] != companyId) revert NotInCompany();
        companyByCitizen[msg.sender] = 0;
        isCompanyMember[companyId][msg.sender] = false;
        if (company.memberCount > 0) company.memberCount -= 1;
        emit CompanyLeft(companyId, msg.sender);
    }

    function updateCompanyProfile(uint256 companyId, string calldata metadataURI) external {
        Company storage company = existingCompany(companyId);
        if (company.owner != msg.sender) revert OnlyCompanyOwner();
        company.metadataURI = metadataURI;
        emit CompanyProfileUpdated(companyId, metadataURI);
    }

    function ownerOfCompany(uint256 companyId) external view returns (address) {
        return existingCompany(companyId).owner;
    }

    function companyOf(address citizenWallet) external view returns (uint256) {
        return companyByCitizen[citizenWallet];
    }

    function getCompany(uint256 companyId) external view returns (Company memory) {
        return existingCompany(companyId);
    }

    function existingCompany(uint256 companyId) private view returns (Company storage company) {
        company = companies[companyId];
        if (company.id == 0) revert CompanyMissing();
    }

    modifier onlyCitizen() {
        if (!citizenRegistry.isCitizen(msg.sender)) revert OnlyCitizen();
        _;
    }
}
