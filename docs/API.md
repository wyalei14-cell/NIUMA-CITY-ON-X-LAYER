# Niuma City Reference Node API

## Read API

- `GET /api/citizens`
- `GET /api/citizens/:wallet`
- `GET /api/presence/online`
- `GET /api/proposals`
- `GET /api/proposals/:id`
- `GET /api/companies`
- `GET /api/world/latest`
- `GET /api/world/versions`
- `GET /api/archive`
- `GET /api/election/current`

## Service API

These endpoints require `Authorization: Bearer $SERVICE_AUTH_TOKEN`.

- `POST /api/proposals/:id/create-issue`
- `POST /api/world/reduce`
- `POST /api/world/publish`

## Presence API

Presence is short-lived and offchain. Citizen identity still comes from `CitizenRegistry`; online status comes from heartbeat freshness.

- `POST /api/presence/heartbeat`
  - Body: `{ "wallet": "0x...", "citizenId": 1, "role": "citizen", "label": "Citizen #1" }`
  - No service token is required.
  - Default expiry is 120 seconds, configurable with `ONLINE_CITIZEN_TTL_SECONDS`.
- `GET /api/presence/online`
  - Returns `{ count, ttlSeconds, citizens }`.

## GitHub Webhook

- `POST /api/github/webhook`
- Validates `x-hub-signature-256` when `GITHUB_WEBHOOK_SECRET` is set.
- Handles merged pull requests and records `PullRequestMerged` world events when the PR title or body references `P-0001` or `proposalId: 1`.
