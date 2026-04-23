# Contract Roadmap

NIUMA CITY must keep its core promises onchain. Frontend and node features are useful only when they point back to durable contracts, reproducible events, and governed execution.

## Deployed Testnet Surface

X Layer Testnet deployment lives in `world/deployments/1952.json`.

- `CitizenRegistry`: citizen identity
- `GovernanceCore`: proposals and voting
- `RoleManager`: mayor role authority
- `ElectionManager`: mayor election
- `CompanyRegistry`: companies and membership
- `WorldStateRegistry`: world version anchoring
- `Treasury`: city funds and proposal-linked payouts
- `CourseRegistry`: Academy courses
- `CredentialRegistry`: Academy credentials
- `ReputationSystem`: non-transferable contribution reputation
- `CitizenDelegate`: vote delegation

## Contract Priorities

### 1. Treasury Execution

Current state:

- `Treasury` accepts native OKB and ERC-20 deposits.
- Owner can distribute funds directly.
- Proposal-linked payout queue exists with `queuePayout`, `executePayout`, and `cancelPayout`.
- `GovernanceExecutor` exists locally as the governed, delayed execution layer for proposal-approved calls.

Next steps:

- Deploy `GovernanceExecutor` to X Layer Testnet, then transfer Treasury ownership only after a passed proposal or explicit operator approval.
- Add node support for passed budget proposals to create payout queue items.
- Add frontend display for pending, executed, and canceled payouts.
- Add frontend display for queued governance executions and execution calldata review.

### 2. Reputation As Civic Power

Current state:

- Reputation is non-transferable and category-specific.
- Authorized sources can award governance, academy, and company points.

Next steps:

- Define anti-abuse reward policy for quest completion.
- Add events to the reducer and public profile view.
- Decide whether reputation affects voting directly or through separate governance rules.

### 3. Company Work Loop

Current state:

- Citizens can create or join companies.

Next steps:

- Add company project registry.
- Let companies claim quests or budget work.
- Connect company delivery to reputation and treasury payout proof.

### 4. Academy And Credentials

Current state:

- Course and credential contracts are deployed.

Next steps:

- Add mentorship contract or event path.
- Add credential review policy.
- Connect completed credentials to quest eligibility and titles.

### 5. Governance Executor

Current state:

- `GovernanceExecutor` queues target, value, calldata, proposal id, metadata URI, and earliest execution time.
- Execution is delayed, cancelable, owner-gated, and emits auditable events.
- Local tests prove it can own `Treasury` and queue proposal-linked payouts.

Next steps:

- Deploy it on X Layer Testnet when OKB is available.
- Index `ExecutionQueued`, `ExecutionCompleted`, and `ExecutionCanceled` in the node/reducer.
- Require proposal metadata to include target, value, calldata, risk notes, and an execution checklist.
- Display queued executions next to proposal timelines.

## OKB Rule

Ask for OKB only when deploying contracts or sending real X Layer transactions. Design, tests, local builds, and GitHub work do not need OKB.
