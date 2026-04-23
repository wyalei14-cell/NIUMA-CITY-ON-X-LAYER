# NIUMA CITY Real City Roadmap

This roadmap turns NIUMA CITY from a governance dashboard into a city with visible economy, social life, culture, execution, and memory.

## Current Foundation

Already present:

- Citizen identity through `CitizenRegistry`
- Governance through `GovernanceCore`
- Treasury contract for deposits, owner-controlled distributions, and proposal-linked payout queues
- Company registry
- Academy course and credential contracts
- Reputation tracking
- Citizen vote delegation
- Reference node, reducer, GitHub sync, and web app
- Online citizen presence heartbeat

Missing:

- Public budget flow from proposal to treasury payout
- Work rewards tied to quests and merged proof
- Social plaza discussion and informal polls
- Citizen profile pages
- Rituals, weekly digest, and shared memory
- Governance timeline and execution checklists
- Proposal templates and reminders

## Principles

- Keep chain state for identity, governance, funds, credentials, and durable proof.
- Keep ephemeral interaction offchain until it becomes a decision, credential, payout, or archive-worthy event.
- Make every city loop visible to humans and machine-readable to agents.
- Reward contribution without letting reputation become a transferable token.
- Prefer small, audited flows over complex economic promises.

## Phase 1: Living City Surface

Goal: make the city feel occupied and legible.

- Online citizen presence in the inspector and API.
- Citizen profiles showing identity, reputation, company, credentials, proposals, votes, and quests.
- Plaza posts for ideas, discussion, and informal polls.
- Proposal timeline view from creation to execution.
- Weekly digest generated from chain events, GitHub issues, PRs, and Academy activity.

## Phase 2: Work And Reward Loop

Goal: make contribution produce visible rewards.

- Quest claim and completion records.
- Merged PR proof attached to quests.
- Reputation rewards for completed quests, mentorship, company work, and governance participation.
- Company project pages for city work.
- Public leaderboard focused on collaboration categories, not only rank.

## Phase 3: Treasury And Budget Flow

Goal: make public work fundable.

- Budget proposal template with requested token, amount, milestones, recipient, and clawback notes.
- Treasury payout queue generated from passed budget proposals.
- Service-auth execution checklist for maintainers.
- Public payout history and pending obligations.
- Optional recurring citizen contribution policy, activated only by explicit governance.

## Phase 4: Culture And Rituals

Goal: create shared memory.

- Founding Day and Citizen Day events in the digest.
- Mayor weekly Q&A issue/discussion template.
- Milestone celebrations for new citizens, first proposal, first credential, first company project, and first payout.
- City chronicle page generated from archive events.

## Phase 5: Real-World And Intercity Anchors

Goal: connect the city to communities outside the app.

- Public meeting schedule and notes.
- Diplomacy registry for friendly DAOs or city projects.
- Optional physical event records.
- NFT certificates for major contribution milestones.

## First Execution Slice

The next shippable slice should be:

1. Citizen profile data model and API.
2. Plaza discussion data model and UI.
3. Proposal timeline and execution checklist.
4. Quest completion proof format.
5. Treasury budget proposal template.

Contract execution details are tracked in `docs/CONTRACT_ROADMAP.md`.

This slice creates a visible city without requiring immediate treasury transactions.
