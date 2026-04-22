# Niuma City Constitution

Niuma City is governed by public onchain contracts. The reference node, web app, GitHub automation, SDK, and reducer are clients of the protocol rather than sources of authority.

## Alpha Rules

1. One citizen wallet has one vote.
2. Citizen identity is non-transferable.
3. Proposals flow through draft, discussion, voting, finalized, and executed states.
4. Simple majority passes; ties reject.
5. The mayor is assigned only through election results.
6. A passed proposal can open a GitHub issue, but GitHub is not the final authority.
7. A merged PR changes the city only after a deterministic world version is generated and anchored onchain.
8. Anyone can replay public events and verify the manifest state root.

## Versioning

Constitution text changes should be proposed, voted, merged, and then anchored through `WorldStateRegistry.setConstitutionHash`.
