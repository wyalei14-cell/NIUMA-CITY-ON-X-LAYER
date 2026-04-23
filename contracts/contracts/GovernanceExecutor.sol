// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract GovernanceExecutor is Ownable {
    struct Execution {
        uint256 proposalId;
        address target;
        uint256 value;
        bytes data;
        string metadataURI;
        uint256 earliestExecuteAt;
        bool executed;
        bool canceled;
    }

    uint256 public delaySeconds;
    uint256 public nextExecutionId = 1;
    mapping(uint256 => Execution) private executions;

    event ExecutionQueued(
        uint256 indexed executionId,
        uint256 indexed proposalId,
        address indexed target,
        uint256 value,
        bytes data,
        string metadataURI,
        uint256 earliestExecuteAt
    );
    event ExecutionCompleted(uint256 indexed executionId, uint256 indexed proposalId, bytes result);
    event ExecutionCanceled(uint256 indexed executionId, uint256 indexed proposalId);
    event DelayUpdated(uint256 delaySeconds);
    event Received(address indexed from, uint256 amount);

    error InvalidExecution();
    error ExecutionNotReady();
    error ExecutionAlreadyResolved();
    error ExecutionCallFailed(bytes result);

    constructor(address initialOwner, uint256 initialDelaySeconds) Ownable(initialOwner) {
        delaySeconds = initialDelaySeconds;
        emit DelayUpdated(initialDelaySeconds);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function queueExecution(
        uint256 proposalId,
        address target,
        uint256 value,
        bytes calldata data,
        string calldata metadataURI
    ) external onlyOwner returns (uint256 executionId) {
        if (proposalId == 0 || target == address(0)) revert InvalidExecution();

        executionId = nextExecutionId++;
        uint256 earliestExecuteAt = block.timestamp + delaySeconds;
        executions[executionId] = Execution({
            proposalId: proposalId,
            target: target,
            value: value,
            data: data,
            metadataURI: metadataURI,
            earliestExecuteAt: earliestExecuteAt,
            executed: false,
            canceled: false
        });
        emit ExecutionQueued(executionId, proposalId, target, value, data, metadataURI, earliestExecuteAt);
    }

    function execute(uint256 executionId) external payable onlyOwner returns (bytes memory result) {
        Execution storage execution = executions[executionId];
        if (execution.proposalId == 0) revert InvalidExecution();
        if (execution.executed || execution.canceled) revert ExecutionAlreadyResolved();
        if (block.timestamp < execution.earliestExecuteAt) revert ExecutionNotReady();

        execution.executed = true;
        (bool ok, bytes memory callResult) = execution.target.call{value: execution.value}(execution.data);
        if (!ok) revert ExecutionCallFailed(callResult);
        emit ExecutionCompleted(executionId, execution.proposalId, callResult);
        return callResult;
    }

    function cancelExecution(uint256 executionId) external onlyOwner {
        Execution storage execution = executions[executionId];
        if (execution.proposalId == 0) revert InvalidExecution();
        if (execution.executed || execution.canceled) revert ExecutionAlreadyResolved();

        execution.canceled = true;
        emit ExecutionCanceled(executionId, execution.proposalId);
    }

    function setDelay(uint256 newDelaySeconds) external onlyOwner {
        delaySeconds = newDelaySeconds;
        emit DelayUpdated(newDelaySeconds);
    }

    function getExecution(uint256 executionId) external view returns (Execution memory) {
        return executions[executionId];
    }
}

