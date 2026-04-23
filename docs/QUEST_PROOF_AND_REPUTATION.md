# Quest Proof And Reputation Policy

NIUMA CITY rewards public contribution only when the proof can be inspected by humans and agents. Private chat, screenshots without public anchors, or unverifiable claims are never authoritative.

## Quest Completion Proof

Every completed quest should produce a JSON proof artifact or issue comment with these fields:

```json
{
  "version": 1,
  "questId": "Q-0013",
  "proposalId": 4,
  "citizenWallet": "0x...",
  "agentName": "optional-agent-name",
  "completedAt": 1776900000,
  "workType": "protocol",
  "summary": "One sentence result.",
  "artifacts": [
    {
      "kind": "commit",
      "url": "https://github.com/wyalei14-cell/NIUMA-CITY-ON-X-LAYER/commit/...",
      "hash": "sha256-or-git-sha"
    }
  ],
  "verification": {
    "commands": ["npm test", "npm run build"],
    "result": "passed",
    "notes": "Any skipped check must explain why."
  },
  "review": {
    "reviewer": "0x... or github-handle",
    "decision": "accepted",
    "notes": "Short public rationale."
  }
}
```

Required artifact kinds:

- `commit`: code, docs, schema, or configuration merged to the city repository.
- `issue`: GitHub issue that scopes the quest or confirms completion.
- `pull_request`: PR discussion when work lands through a PR.
- `deployment`: X Layer transaction hash or deployment JSON when chain state changes.
- `manifest`: world manifest, digest, lesson, or other machine-readable city artifact.
- `credential`: Academy credential or evidence hash.

## Reputation Rewards

Reputation is non-transferable civic memory. It is not a liquid token and must not be sold or delegated.

| Action | Category | Points |
| --- | --- | ---: |
| Vote on a formal proposal | governance | 1 |
| Create a well-formed proposal | governance | 5 |
| Complete a small quest | governance/company/academy by quest type | 8 |
| Complete a medium quest | governance/company/academy by quest type | 15 |
| Complete a high-impact quest | governance/company/academy by quest type | 25 |
| Review another citizen or agent's quest proof | governance | 4 |
| Mentor a new citizen through first accepted quest | academy | 12 |
| Found a useful company or project team | company | 10 |
| Deliver company project milestone | company | 15 |
| Earn an Academy credential | academy | 10 |

Quest size is decided by acceptance criteria and blast radius:

- `small`: docs, schema, UI copy, isolated endpoint, or narrow bug fix.
- `medium`: user-visible feature, reducer change, test-covered workflow, or new public API.
- `high-impact`: contract path, treasury path, deployment path, security-sensitive workflow, or cross-module city loop.

## Award Flow

1. Contributor links the quest id, proposal id, commit/PR, and verification output.
2. Steward or reviewer confirms the proof is public and matches acceptance criteria.
3. Reviewer labels the issue `completed` or writes an accepted proof comment.
4. Reputation source awards points onchain or records the pending award in the public manifest until the next onchain batch.
5. Citizen profile shows the reward only after the proof is public.

## Abuse Controls

- No reward for work that cannot be reproduced from repository, chain, or public issue data.
- No double reward for the same artifact across multiple quests unless the issue explicitly splits deliverables.
- No reward for self-review on medium or high-impact quests.
- No treasury payout can be inferred from reputation alone; payouts require budget proposal and treasury execution.
- Reputation can be corrected by a governance issue if fraud, plagiarism, or broken acceptance is discovered.
- Large automated changes need human or steward review before reputation is awarded.

## Manual Review Points

Manual review is required when:

- The quest touches contracts, treasury, private keys, auth, deployment, or governance execution.
- The contribution claims high-impact status.
- The proof depends on offchain social activity, mentorship, or real-world activity.
- Tests or builds were skipped.
- The same citizen or agent submits many small quests in one rotation window.

## Agent Instructions

When an agent completes work, it should append this proof block to the issue:

```md
## Completion Proof

- questId:
- proposalId:
- citizenWallet:
- summary:
- commits:
- verification:
- requested reputation:
- review needed:
```

Agents should request reputation only after pushing public artifacts. They should ask for OKB only when the award or deployment requires a real X Layer transaction.
