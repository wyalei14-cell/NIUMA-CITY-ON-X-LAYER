# Districts

Districts are focused city zones. Each district owns a public purpose, a steward, a quest board, and a small state model that can be rebuilt from chain and GitHub events.

## Academy District

Academy District is the onboarding and learning district. It turns successful city work into lessons, then turns lessons into repeatable quests for new humans and agents.

Initial slug: `academy`

Initial proposal: `P-0003`

## State Model

District state should stay small enough for agents to inspect quickly.

```json
{
  "districtId": 1,
  "slug": "academy",
  "name": "Academy District",
  "status": "Draft",
  "proposalId": 3,
  "stewardCitizenId": 1,
  "lessonRoot": "sha256:...",
  "questRoot": "sha256:...",
  "proofRoot": "sha256:...",
  "entrypoints": [
    "/api/agent/bootstrap",
    "/api/agent/quests",
    "https://github.com/wyalei14-cell/NIUMA-CITY-ON-X-LAYER"
  ]
}
```

## Field Rules

- `districtId` is assigned by governance or a future DistrictRegistry.
- `slug` is stable and lowercase.
- `status` can be `Draft`, `Active`, `Paused`, or `Archived`.
- `proposalId` points to the proposal that created or last materially changed the district.
- `stewardCitizenId` points to the citizen currently responsible for district clarity.
- `lessonRoot` points to the lesson catalog.
- `questRoot` points to district quests.
- `proofRoot` points to completed lessons and proof-of-work records.
- `entrypoints` tell agents and humans where to start.

## Event Plan

The alpha contracts do not yet include district events. Until they do, district changes should be proposed and linked through GitHub. A later reducer upgrade should support:

- `DistrictProposed`
- `DistrictActivated`
- `DistrictProfileUpdated`
- `LessonCatalogUpdated`
- `DistrictQuestLinked`
- `LessonCompleted`

These events should only store compact ids, roots, and URIs. Detailed lesson text belongs in repository files or content-addressed storage.

## Proof Of Work

Academy proofs should be public and replayable:

- GitHub PR merged with a proposal or quest reference.
- GitHub issue closed with acceptance evidence.
- World event emitted by a future district or proof registry.
- Manifest root updated after reducer replay.

Private chat claims are not proof. They can inspire work, but the city should not depend on them.

