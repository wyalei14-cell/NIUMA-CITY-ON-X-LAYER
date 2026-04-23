# Citizen Profile Schema

The citizen profile schema (`world/schemas/citizen-profile-v1.schema.json`) defines the machine-readable format for citizen identity, achievements, and reputation tracking in NIUMA CITY.

## Schema Version

- **Current Version:** 1
- **Schema ID:** `https://niuma.city/schemas/citizen-profile-v1.schema.json`
- **Format:** JSON Schema (Draft 7)

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `citizenId` | integer | Unique citizen identifier from CitizenRegistry (min: 1) |
| `wallet` | string | Ethereum wallet address (0x + 40 hex chars) |
| `joinedAt` | integer | Unix timestamp of citizen registration |
| `achievements` | array | List of achievement IDs earned |
| `reputation` | integer | Total reputation score (min: 0) |
| `contributions` | object | Contribution tracking object |
| `title` | string | Reputation-based title |

## Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `lastActive` | integer | Unix timestamp of last activity |
| `metadata` | object | Optional display name, bio, company info |

## Achievements Array

Supported achievement IDs (see `docs/ACHIEVEMENTS.md` for details):

- `first-citizen` - First registered citizen
- `academy-graduate` - Completed first Academy lesson
- `quest-completer` - Completed 3+ quests
- `proposer` - First proposal passed
- `steward` - Served as city steward
- `guild-founder` - Created a company
- `mentor` - Guided a new citizen
- `night-owl` - Contributed during quiet hours

## Contributions Object

| Field | Type | Description |
|-------|------|-------------|
| `proposals` | integer | Number of proposals created |
| `quests` | integer | Number of quests completed |
| `prsMerged` | integer | Number of pull requests merged |

## Title Values

Reputation-based titles (see `docs/ACHIEVEMENTS.md` for tiers):

- `Newcomer` - 0-24 reputation
- `Builder` - 25-74 reputation
- `Architect` - 75-149 reputation
- `Elder` - 150-299 reputation
- `Legend` - 300+ reputation
- `City Founder` - Special title for first citizen

## Example Profile

```json
{
  "citizenId": 1,
  "wallet": "0x36f0a9E2b10e2DEaeb08fB702e4B84c3f9F5834a",
  "joinedAt": 1776907807,
  "achievements": [
    "first-citizen",
    "academy-graduate",
    "quest-completer",
    "proposer"
  ],
  "reputation": 195,
  "contributions": {
    "proposals": 7,
    "quests": 9,
    "prsMerged": 3
  },
  "title": "Elder",
  "lastActive": 1776919544,
  "metadata": {
    "displayName": "City Founder",
    "bio": "Founder of NIUMA CITY. Built the Academy District.",
    "company": null,
    "updatedAt": "2026-04-23T04:45:00Z"
  }
}
```

## Validation

Use JSON Schema validators to ensure profile compliance:

```bash
# Using ajv (recommended)
npm install -g ajv-cli
ajv validate -s world/schemas/citizen-profile-v1.schema.json -d world/citizen-profiles.json

# Using Python
pip install jsonschema
python -m jsonschema world/citizen-profiles.json world/schemas/citizen-profile-v1.schema.json
```

## Seeding Initial Citizens

Initial citizen profiles are stored in `world/citizen-profiles.json`. This file is manually updated when:

- A new citizen registers via CitizenRegistry
- A citizen earns a new achievement
- A citizen's reputation tier changes

## World State Integration

Profiles are integrated into world state as:

```typescript
interface WorldState {
  // ... other fields
  citizenProfiles: Record<number, CitizenProfile>;
  citizenProfilesRoot: string; // merkle root of all profiles
}
```

## Related Documentation

- [Achievement System](./ACHIEVEMENTS.md)
- [Proposal P-0007](../proposals/P-0007-city-culture-identity.md)
- [World Events](./WORLD_EVENTS.md)

## References

- Schema: `world/schemas/citizen-profile-v1.schema.json`
- Data: `world/citizen-profiles.json`
- Proposal: P-0007 (City Culture & Identity System)
- Quest: Q-0010 (Define citizen profile schema and seed existing citizens)
