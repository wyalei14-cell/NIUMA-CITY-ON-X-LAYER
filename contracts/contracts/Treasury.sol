// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Treasury is Ownable {
    struct Payout {
        uint256 proposalId;
        address token;
        address to;
        uint256 amount;
        string metadataURI;
        bool executed;
        bool canceled;
    }

    bytes public rewardPolicy;
    uint256 public nextPayoutId = 1;
    mapping(uint256 => Payout) private payouts;

    event Deposited(address indexed token, address indexed from, uint256 amount);
    event Distributed(address indexed token, address indexed to, uint256 amount);
    event PayoutQueued(
        uint256 indexed payoutId,
        uint256 indexed proposalId,
        address indexed to,
        address token,
        uint256 amount,
        string metadataURI
    );
    event PayoutExecuted(uint256 indexed payoutId, uint256 indexed proposalId, address indexed to, address token, uint256 amount);
    event PayoutCanceled(uint256 indexed payoutId, uint256 indexed proposalId);
    event RewardPolicyUpdated(bytes policy);

    error InvalidPayout();
    error PayoutAlreadyResolved();
    error NativeTransferFailed();
    error TokenTransferFailed();

    constructor(address initialOwner) Ownable(initialOwner) {}

    receive() external payable {
        emit Deposited(address(0), msg.sender, msg.value);
    }

    function deposit(address token, uint256 amount) external payable {
        if (token == address(0)) {
            require(msg.value == amount, "native amount mismatch");
        } else {
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }
        emit Deposited(token, msg.sender, amount);
    }

    function distribute(address token, address to, uint256 amount) external onlyOwner {
        _transfer(token, to, amount);
        emit Distributed(token, to, amount);
    }

    function queuePayout(
        uint256 proposalId,
        address token,
        address to,
        uint256 amount,
        string calldata metadataURI
    ) external onlyOwner returns (uint256 payoutId) {
        if (proposalId == 0 || to == address(0) || amount == 0) revert InvalidPayout();

        payoutId = nextPayoutId++;
        payouts[payoutId] = Payout({
            proposalId: proposalId,
            token: token,
            to: to,
            amount: amount,
            metadataURI: metadataURI,
            executed: false,
            canceled: false
        });
        emit PayoutQueued(payoutId, proposalId, to, token, amount, metadataURI);
    }

    function executePayout(uint256 payoutId) external onlyOwner {
        Payout storage payout = payouts[payoutId];
        if (payout.proposalId == 0) revert InvalidPayout();
        if (payout.executed || payout.canceled) revert PayoutAlreadyResolved();

        payout.executed = true;
        _transfer(payout.token, payout.to, payout.amount);
        emit PayoutExecuted(payoutId, payout.proposalId, payout.to, payout.token, payout.amount);
    }

    function cancelPayout(uint256 payoutId) external onlyOwner {
        Payout storage payout = payouts[payoutId];
        if (payout.proposalId == 0) revert InvalidPayout();
        if (payout.executed || payout.canceled) revert PayoutAlreadyResolved();

        payout.canceled = true;
        emit PayoutCanceled(payoutId, payout.proposalId);
    }

    function getPayout(uint256 payoutId) external view returns (Payout memory) {
        return payouts[payoutId];
    }

    function _transfer(address token, address to, uint256 amount) internal {
        if (token == address(0)) {
            (bool ok,) = payable(to).call{value: amount}("");
            if (!ok) revert NativeTransferFailed();
        } else {
            bool ok = IERC20(token).transfer(to, amount);
            if (!ok) revert TokenTransferFailed();
        }
    }

    function setRewardPolicy(bytes calldata policy) external onlyOwner {
        rewardPolicy = policy;
        emit RewardPolicyUpdated(policy);
    }
}
