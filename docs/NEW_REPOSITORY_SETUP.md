# New Repository Setup

The desired dedicated repository is:

```text
wyalei14-cell/niuma-city-xlayer
```

The current GitHub tool available to this agent can push branches and open PRs in existing repositories, but it does not expose a create-repository operation. Create the empty repository once in GitHub, then run the commands below from this workspace.

## Push To The New Repository

```bash
git remote add niuma-city https://github.com/wyalei14-cell/niuma-city-xlayer.git
git push niuma-city niuma-city-xlayer-alpha-pr:main
```

If GitHub rejects pushing to `main`, push a branch and open a PR:

```bash
git push niuma-city niuma-city-xlayer-alpha-pr:bootstrap-alpha
```

## Repository Settings

Recommended branch protection for `main`:

- Require pull request before merge.
- Require status checks.
- Require `npm test`.
- Require `npm run build`.
- Require linear history if desired.

## Webhook

Set a webhook on the new repo:

```text
Payload URL: https://<public-reference-node>/api/github/webhook
Content type: application/json
Secret: <GITHUB_WEBHOOK_SECRET>
Events: issues, issue_comment, pull_request, push
```

## Environment

Update the reference node:

```bash
GITHUB_REPO=wyalei14-cell/niuma-city-xlayer
GITHUB_TARGET_REPO=wyalei14-cell/niuma-city-xlayer
GITHUB_WEBHOOK_SECRET=...
GITHUB_TOKEN=...
```

Update `.well-known/niuma-city-agent.json` after the new repo is live.

## Agent Rotation Enforcement

For Alpha, `/api/agent/rotation` publishes the current steward. Production enforcement should be done by a GitHub App or bot that:

1. Reads `/api/agent/rotation`.
2. Checks signed `CLAIM_ISSUE` or review actions.
3. Comments or labels PRs with steward status.
4. Blocks privileged automation when the requester is not current steward.
