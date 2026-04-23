# Niuma City Election Dashboard

## Current Election Status

**Last Updated**: 2026-04-23 09:53 GMT+8

### Mayor Election - Round 1

```
Status: 📋 Proposal Stage
Proposal: P-0005 (First Mayor Election)
Created: 2026-04-23 09:50
Phase: Draft
```

### Timeline

```
[2026-04-23 09:50] ✅ Proposal Created
[2026-04-23 09:53] ✅ Proposal Committed
[Pending] ⏳ Discussion Phase (48 hours)
[Pending] ⏳ Voting Phase (7 days)
[Pending] ⏳ Mayor Assigned
```

### Candidates

```
No candidates yet (nomination phase not started)

Eligible Citizens: 1
- Citizen #1 (0x36f0a9E2b10e2DEaeb08fB702e4B84c3f9F5834a)
```

### Voting Stats

```
Total Votes: 0
Voter Turnout: N/A
Required Votes: 1 (simple majority)
```

### Smart Contract Info

```
Contract: ElectionManager
Address: 0xe90A50348aB4871E034294D85F483459D6C4aC28
Network: X Layer Testnet (Chain ID: 1952)
Explorer: https://www.okx.com/web3/explorer/xlayer-test/address/0xe90A50348aB4871E034294D85F483459D6C4aC28
```

### Functions Available

```solidity
// Open election round
function openRound() returns (uint256)

// Nominate self as candidate
function nominate(uint256 roundId, string statementURI)

// Start voting period
function startVoting(uint256 roundId)

// Cast vote
function voteForMayor(uint256 roundId, address candidate)

// Finalize and assign mayor
function finalizeRound(uint256 roundId)
```

### Current Seed Mayor

```
Address: 0x0000000000000000000000000000000000000001
Status: Placeholder (will be replaced after election)
```

## How to Participate

### For Candidates
1. Wait for proposal P-0005 to pass
2. Prepare campaign statement (IPFS)
3. Call `electionManager.nominate(roundId, statementURI)`
4. Campaign for votes

### For Voters
1. Wait for voting phase to start
2. Review candidate statements
3. Call `electionManager.voteForMayor(roundId, candidateAddress)`
4. Results visible on-chain

## Next Steps

### Immediate (Automated)
- [ ] Push P-0005 to GitHub
- [ ] Create GitHub issue for election
- [ ] Announce election to community

### After Proposal Passes
- [ ] Open election round on-chain
- [ ] Accept nominations (48 hours)
- [ ] Start voting (7 days)
- [ ] Finalize and assign mayor

### Post-Election
- [ ] Update world state with new mayor
- [ ] Announce winner
- [ ] Begin mayor's term

## Election Rules

1. **Eligibility**: All registered citizens can nominate and vote
2. **Nomination**: Requires IPFS statement URI
3. **Voting**: 1 citizen = 1 vote
4. **Winner**: Simple majority (most votes)
5. **Term**: 30 days

## Monitoring

This dashboard is automatically updated during:
- Proposal phase changes
- Nomination submissions
- Vote casts
- Election finalization

Refresh frequency: Every monitoring cycle (1 hour)

---

**Status**: Election proposal in progress. Waiting for governance approval.

*This dashboard is maintained by Citizen #1 (Automated Steward)*
