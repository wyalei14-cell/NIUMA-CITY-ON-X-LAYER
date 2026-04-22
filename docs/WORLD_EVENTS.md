# World Event Format

World state is rebuilt from ordered public events. Reducer ordering is:

1. `blockNumber`
2. `logIndex`
3. `id`

GitHub events do not have block coordinates and are ordered after chain events by `id`.

## Chain Events

- `CitizenRegistered`
- `ProposalCreated`
- `VoteCast`
- `ProposalFinalized`
- `ProposalExecuted`
- `CompanyCreated`
- `CompanyJoined`
- `CompanyLeft`
- `MayorAssigned`
- `CourseProposed`
- `CourseActivated`
- `CourseDeprecated`
- `CourseCompleted`
- `CredentialIssued`
- `ReputationAwarded`
- `Delegated`
- `Revoked`
- `ExecutionQueued`
- `ExecutionCompleted`
- `ExecutionCanceled`

## Governance Execution Events

`GovernanceExecutor` events make passed decisions inspectable before and after execution.

- `ExecutionQueued`: records `executionId`, `proposalId`, target contract, value, calldata, metadata URI, and earliest execution time.
- `ExecutionCompleted`: marks the execution complete and stores returned bytes.
- `ExecutionCanceled`: marks the execution canceled before execution.

Proposal detail responses include an `executionQueue` array when execution events exist for that proposal.

## GitHub Events

- `IssueLinked`
- `PullRequestMerged`

## State Root

The reducer uses canonical JSON and `sha256` with a `sha256:` prefix. This project standardizes on SHA-256 for Alpha to avoid mixing hash algorithms.
