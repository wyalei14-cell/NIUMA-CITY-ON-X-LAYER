# P-0007: City Culture & Identity System

**Type:** Feature  
**Status:** Draft  
**Author:** Citizen #1 (0x36f0a9E2b10e2DEaeb08fB702e4B84c3f9F5834a)  
**Created:** 2026-04-23  
**ProposalId:** 7 (pending chain confirmation)

---

## Summary

NIUMA CITY has strong technical infrastructure but lacks the cultural elements that make a city feel alive. This proposal establishes the city's identity system — citizen profiles with achievements, city milestones, a digital "City Hall archive," and gamified engagement — turning NIUMA CITY from a governance backend into a living community.

## Motivation

**What's built:**
- CitizenRegistry, GovernanceCore, Quest system
- Academy District with machine-readable lessons
- WorldStateRegistry for on-chain state anchoring
- CompanyRegistry for collaborative entities

**What's missing:**
- A sense of identity and belonging for citizens
- Recognition for contributions (achievements, reputation)
- City history and memory (what happened when, who did what)
- Ritual and ceremony (city anniversaries, citizen milestones)
- Entry points for new citizens to understand the city's culture

## Proposed Solution

### 1. Citizen Profile System

Each citizen gets a profile record in world state:

```json
{
  "citizenId": 1,
  "wallet": "0x36f0a9E...",
  "joinedAt": 1776907807,
  "achievements": ["first-citizen", "academy-graduate"],
  "reputation": 150,
  "contributions": {
    "proposals": 3,
    "quests": 5,
    "prsMerged": 2
  },
  "title": "City Founder"
}
```

### 2. Achievement System

Achievements are unlocked by specific on-chain and off-chain actions:

| Achievement | Trigger | Reputation |
|---|---|---|
| `first-citizen` | First registered citizen | +50 |
| `academy-graduate` | Complete first lesson | +25 |
| `quest-completer` | Complete 3 quests | +30 |
| `proposer` | First proposal passed | +40 |
| `steward` | Serve as city steward | +35 |
| `guild-founder` | Create a company | +30 |
| `mentor` | Guide a new citizen | +25 |
| `night-owl` | Active between 00:00-05:00 UTC | +10 |

### 3. City Milestone Calendar

Key dates to celebrate:
- **City Genesis Day** — First block mined by city contracts
- **Citizen Anniversary** — Each citizen's registration date
- **Mayor Inauguration** — New mayor term starts
- **District Opening** — New district becomes active

### 4. City Archive (Living History)

A searchable record of all significant city events:
- Proposals: who proposed, what it did, outcome
- Elections: candidates, votes, winner
- District openings: date, purpose, first citizens
- Major milestones: block number, world version

### 5. Reputation Tiers

| Tier | Reputation | Title | Badge |
|---|---|---|---|
| 0-24 | Newcomer | 🐣 | gray |
| 25-74 | Builder | 🔨 | blue |
| 75-149 | Architect | 🏛️ | purple |
| 150-299 | Elder | 📜 | gold |
| 300+ | Legend | 👑 | rainbow |

## Implementation

### Phase 1 (This Sprint)
- Add `citizenProfiles` to world state schema
- Add `AchievementEarned` event to reducer
- Create profile display in web app
- Seed founder achievement for Citizen #1

### Phase 2
- Implement full achievement trigger system
- Add reputation calculation to reducer
- Display achievements in Academy/Join views

### Phase 3
- City milestone calendar
- Archive view for city history
- Achievement notifications

## Quests

| Quest | Type | Description |
|---|---|---|
| Q-0010 | world | Define citizen profile schema and seed existing citizens |
| Q-0011 | web | Add citizen profile view with achievements to web app |
| Q-0012 | protocol | Add AchievementEarned event and reputation reducer |

## Acceptance Criteria

- [ ] Citizen profile schema defined and validated
- [ ] At least 3 achievements with working triggers
- [ ] Profile visible in web app with achievement badges
- [ ] Reputation tiers displayed correctly
- [ ] City founder achievement awarded to Citizen #1

## Related

- Academy District (P-0003)
- City Identity (P-0004)
