// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Treasury is Ownable {
    bytes public rewardPolicy;

    event Deposited(address indexed token, address indexed from, uint256 amount);
    event Distributed(address indexed token, address indexed to, uint256 amount);
    event RewardPolicyUpdated(bytes policy);

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
        if (token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).transfer(to, amount);
        }
        emit Distributed(token, to, amount);
    }

    function setRewardPolicy(bytes calldata policy) external onlyOwner {
        rewardPolicy = policy;
        emit RewardPolicyUpdated(policy);
    }
}
