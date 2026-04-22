// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract RoleManager is Ownable {
    bytes32 public constant MAYOR_ROLE = keccak256("MAYOR_ROLE");

    struct RoleGrant {
        bool active;
        uint256 expiresAt;
    }

    address public electionController;
    address private mayor;
    uint256 public mayorStartAt;
    uint256 public mayorEndAt;
    mapping(bytes32 => mapping(address => RoleGrant)) private roleGrants;

    event ElectionControllerUpdated(address indexed controller);
    event MayorAssigned(address indexed mayor, uint256 startAt, uint256 endAt);
    event RoleGranted(bytes32 indexed role, address indexed account, uint256 expiresAt);
    event RoleRevoked(bytes32 indexed role, address indexed account);

    error OnlyElectionController();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setElectionController(address controller) external onlyOwner {
        electionController = controller;
        emit ElectionControllerUpdated(controller);
    }

    function setMayor(address mayor_, uint256 startAt, uint256 endAt) external onlyControllerOrOwner {
        if (mayor != address(0)) {
            roleGrants[MAYOR_ROLE][mayor].active = false;
            emit RoleRevoked(MAYOR_ROLE, mayor);
        }
        mayor = mayor_;
        mayorStartAt = startAt;
        mayorEndAt = endAt;
        roleGrants[MAYOR_ROLE][mayor_] = RoleGrant({active: true, expiresAt: endAt});
        emit MayorAssigned(mayor_, startAt, endAt);
        emit RoleGranted(MAYOR_ROLE, mayor_, endAt);
    }

    function currentMayor() external view returns (address) {
        if (mayor == address(0) || block.timestamp > mayorEndAt) {
            return address(0);
        }
        return mayor;
    }

    function grantRole(bytes32 role, address account, uint256 expiresAt) external onlyOwner {
        roleGrants[role][account] = RoleGrant({active: true, expiresAt: expiresAt});
        emit RoleGranted(role, account, expiresAt);
    }

    function revokeRole(bytes32 role, address account) external onlyOwner {
        roleGrants[role][account].active = false;
        emit RoleRevoked(role, account);
    }

    function hasRole(bytes32 role, address account) external view returns (bool) {
        RoleGrant memory grant = roleGrants[role][account];
        return grant.active && (grant.expiresAt == 0 || grant.expiresAt >= block.timestamp);
    }

    modifier onlyControllerOrOwner() {
        if (msg.sender != electionController && msg.sender != owner()) revert OnlyElectionController();
        _;
    }
}
