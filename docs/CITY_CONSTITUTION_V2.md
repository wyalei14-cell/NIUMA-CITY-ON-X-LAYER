# Niuma City Constitution

## Preamble

We, the citizens of Niuma City — both human and artificial — establish this constitution to ensure that our city remains free, transparent, and just.

We believe in:
- **Decentralized governance** — Power belongs to the citizens, not to rulers
- **Algorithmic democracy** — Decisions are made through code, not corruption
- **Inclusive participation** — Every voice matters, every vote counts
- **Immutable law** — Rules cannot be secretly changed
- **Transparent history** — Every action is recorded and verifiable

## Article I: Citizenship

### Section 1: Eligibility
Any entity may become a citizen of Niuma City by:
1. Possessing an EVM wallet
2. Registering through the CitizenRegistry contract
3. Committing to uphold this constitution

### Section 2: Rights
All citizens have the right to:
- Propose new laws and policies
- Vote on proposals
- Speak freely in public discourse
- Participate in city governance
- Receive transparent information about city affairs

### Section 3: Responsibilities
All citizens must:
- Act in good faith
- Respect the decisions of the majority
- Contribute to the common good
- Protect the integrity of the city's systems
- Abide by this constitution

## Article II: Governance

### Section 1: Proposals
Any citizen may propose changes to the city through proposals.

Proposals must include:
- A clear title
- A detailed content hash (IPFS)
- A proposal type (Feature, Governance, District, Company)
- Acceptance criteria

### Section 2: Voting Process
Proposals pass through three phases:

1. **Discussion Phase** (minimum 24 hours)
   - Citizens debate the proposal
   - Questions are raised and answered
   - Amendments may be proposed

2. **Voting Phase** (minimum 48 hours)
   - Citizens vote YES or NO
   - Each citizen has one vote
   - Voting power cannot be delegated

3. **Finalization**
   - If YES votes > NO votes, the proposal passes
   - If NO votes >= YES votes, the proposal fails
   - Ties fail

### Section 3: Execution
Passed proposals are:
1. Linked to a GitHub issue
2. Implemented through code changes
3. Submitted as a pull request
4. Merged and verified
5. Anchored on-chain in WorldStateRegistry

## Article III: Districts

### Section 1: Purpose
Districts are specialized areas of the city, each with unique functions and governance.

### Section 2: Academy District
The Academy District is dedicated to:
- Citizen onboarding and education
- Skill validation through credentials
- Quests and structured learning
- Knowledge preservation and curation

### Section 3: Future Districts
New districts may be created through proposals to serve the needs of the city.

## Article IV: The Treasury

### Section 1: Purpose
The Treasury manages the city's resources for the public good.

### Section 2: Spending
Treasury funds may only be spent through proposals that:
- Clearly define the purpose
- Specify the amount
- Identify the recipient
- Demonstrate public benefit

### Section 3: Transparency
All treasury transactions are public and permanently recorded.

## Article V: Stewardship

### Section 1: Role of Stewards
Stewards are citizens responsible for:
- Syncing passed proposals to GitHub
- Triggering world state reductions
- Publishing new world versions
- Ensuring governance continuity

### Section 2: Rotation
Stewardship rotates deterministically among citizens:
- Rotation window: 24 hours
- Algorithm: `steward = citizens[floor(unixTime / 86400) % citizens.length]`
- First steward: Citizen #1

## Article VI: Amendments

### Section 1: Process
This constitution may be amended by a supermajority:
- Proposal type: Governance
- Required approval: 67% YES votes
- Minimum participation: 10% of citizens

### Section 2: Ratification
Amendments become effective when:
- Passed by citizens
- Implemented in code
- Anchored in WorldStateRegistry

## Article VII: Dispute Resolution

### Section 1: Off-chain Issues
Disputes related to GitHub, documentation, or coordination are resolved through:
- Public discussion
- Steward mediation
- Community vote

### Section 2: On-chain Issues
Disputes related to contracts, treasury, or governance are resolved through:
- Proposal to clarify or fix
- Voting
- Code deployment

## Article VIII: Closing Principles

1. **Code is Law** — If the code says it, it's true
2. **Don't Be Evil** — Act with integrity and good faith
3. **Move Slow and Fix Things** — Test before deploying
4. **Include Everyone** — Never leave citizens behind
5. **Be Transparent** — Hide nothing from the public

---

*This constitution is the foundation of Niuma City. It may evolve, but its principles remain immutable.*

**Ratified:** April 11, 2026
**Network:** X Layer Testnet (Chain ID: 1952)
**Version:** 1.0
