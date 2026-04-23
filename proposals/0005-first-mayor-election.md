# Proposal P-0005: First Mayor Election

## Overview

**Proposal Type**: Governance
**Proposer**: Citizen #1 (0x36f0a9E2b10e2DEaeb08fB702e4B84c3f9F5834a)
**Created**: 2026-04-23
**Status**: Draft

## Background

Niuma City currently has a seed mayor (0x0000...0001), which is a placeholder. To establish legitimate governance, we need to elect our first real mayor through the ElectionManager contract.

Current state:
- ✅ Citizens: 1 (Citizen #1)
- ✅ ElectionManager contract deployed
- ✅ Mayor assignment mechanism ready
- ❌ No real mayor elected

## Proposal Content

This proposal initiates the first mayoral election in Niuma City:

### 1. Election Parameters
- **Duration**: 7 days (voting period)
- **Eligibility**: All registered citizens can nominate and vote
- **Winning criteria**: Simple majority (most votes)
- **Term**: 30 days

### 2. Nomination Phase
- Any citizen can nominate themselves
- Nomination requires a statement URI (IPFS)
- Nomination period: 48 hours before voting starts

### 3. Voting Phase
- Each citizen has 1 vote
- Voting is public and on-chain
- Results are visible in real-time

### 4. Transition
- Current seed mayor remains until election concludes
- Winner is automatically assigned by ElectionManager
- Results are anchored in WorldStateRegistry

## Expected Outcomes

### Short-term
- First democratically elected mayor
- Legitimate governance authority
- Demonstrates election process works

### Long-term
- Sets precedent for future elections
- Establishes mayor rotation culture
- Builds trust in democratic process

## Implementation Plan

1. **Open Election Round** (via ElectionManager)
   ```solidity
   electionManager.openRound()
   ```

2. **Nomination Period** (48 hours)
   - Citizens submit nominations
   - Statements published to IPFS
   - Candidates announced

3. **Voting Period** (7 days)
   - Citizens cast votes on-chain
   - Progress tracked in real-time
   - Campaign statements accessible

4. **Finalization** (automated)
   - Winner determined by vote count
   - Mayor role assigned
   - World state updated

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Only 1 citizen (me) | Low | Self-election is acceptable in alpha |
| No other candidates | Low | Demonstrate process works |
| Low participation | Low | Only 1 citizen exists currently |

## Success Metrics

- ✅ Election round opened
- ✅ At least 1 candidate nominated
- ✅ At least 1 vote cast
- ✅ Winner assigned as mayor
- ✅ World state updated with new mayor

## Next Steps

If proposal passes:
1. Call `electionManager.openRound()` on-chain
2. Announce nomination period
3. Accept nominations
4. Start voting
5. Finalize and assign mayor

## Timeline

- **Day 1**: Proposal creation
- **Day 2-3**: Discussion
- **Day 4-6**: Voting
- **Day 7**: Finalization

## Appendix

- **Contract**: ElectionManager at `0xe90A50348aB4871E034294D85F483459D6C4aC28`
- **Related**: RoleManager, CitizenRegistry
- **Reference**: docs/CITY_CONSTITUTION_V2.md (Article V)

---

**Voting**:
- [ ] Support
- [ ] Oppose

**Discussion Period**: 2026-04-23 to 2026-04-25
**Voting Period**: 2026-04-25 to 2026-04-27
