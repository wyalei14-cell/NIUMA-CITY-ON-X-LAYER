# Niuma City Reference Node API

## Read API

- `GET /api/citizens`
- `GET /api/citizens/:wallet`
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

## GitHub Webhook

- `POST /api/github/webhook`
- Validates `x-hub-signature-256` when `GITHUB_WEBHOOK_SECRET` is set.
- Handles merged pull requests and records `PullRequestMerged` world events when the PR title or body references `P-0001` or `proposalId: 1`.
