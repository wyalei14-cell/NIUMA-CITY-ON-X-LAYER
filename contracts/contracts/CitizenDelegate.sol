// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface ICitizenRegistryForDelegate {
    function isCitizen(address owner) external view returns (bool);
}

/**
 * @title CitizenDelegate
 * @notice Allows citizens to delegate their governance voting power to another citizen.
 *         Delegation is revocable at any time. A delegate cannot re-delegate.
 *         Integrates with GovernanceCore via the getDelegatedPower function.
 */
contract CitizenDelegate is Ownable {
    ICitizenRegistryForDelegate public immutable citizenRegistry;

    // delegator => delegate
    mapping(address => address) public delegation;
    // delegate => count of delegators
    mapping(address => uint256) public delegatedCount;
    // delegate => list of delegators
    mapping(address => address[]) private delegators;

    event Delegated(address indexed delegator, address indexed delegate);
    event Revoked(address indexed delegator, address indexed delegate);

    error NotCitizen();
    error SelfDelegation();
    error AlreadyDelegated();
    error NotDelegated();
    error CircularDelegation();

    constructor(address citizenRegistry_, address initialOwner) Ownable(initialOwner) {
        citizenRegistry = ICitizenRegistryForDelegate(citizenRegistry_);
    }

    modifier onlyCitizen(address account) {
        if (!citizenRegistry.isCitizen(account)) revert NotCitizen();
        _;
    }

    /**
     * @notice Delegate voting power to another citizen
     * @param delegate The address to delegate to
     */
    function delegate(address delegate) external onlyCitizen(msg.sender) onlyCitizen(delegate) {
        if (msg.sender == delegate) revert SelfDelegation();
        if (delegation[msg.sender] != address(0)) revert AlreadyDelegated();
        if (delegation[delegate] != address(0)) revert CircularDelegation();

        delegation[msg.sender] = delegate;
        delegators[delegate].push(msg.sender);
        delegatedCount[delegate]++;

        emit Delegated(msg.sender, delegate);
    }

    /**
     * @notice Revoke an existing delegation
     */
    function revokeDelegation() external {
        address currentDelegate = delegation[msg.sender];
        if (currentDelegate == address(0)) revert NotDelegated();

        delegation[msg.sender] = address(0);
        delegatedCount[currentDelegate]--;

        // Remove from delegators list
        address[] storage list = delegators[currentDelegate];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == msg.sender) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }

        emit Revoked(msg.sender, currentDelegate);
    }

    /**
     * @notice Get the effective voting power of a citizen (1 + delegations)
     * @param citizen The citizen address
     * @return The effective voting power
     */
    function getVotingPower(address citizen) external view returns (uint256) {
        return 1 + delegatedCount[citizen];
    }

    /**
     * @notice Get all delegators for a given delegate
     * @param delegate The delegate address
     * @return List of delegator addresses
     */
    function getDelegators(address delegate) external view returns (address[] memory) {
        return delegators[delegate];
    }

    /**
     * @notice Check if a citizen has delegated their vote
     * @param citizen The citizen to check
     * @return Whether the citizen has an active delegation
     */
    function hasDelegated(address citizen) external view returns (bool) {
        return delegation[citizen] != address(0);
    }
}
