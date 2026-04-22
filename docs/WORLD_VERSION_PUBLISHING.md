# World Version Publishing Guide

## Overview

This guide explains how to publish NIUMA CITY world state versions to the WorldStateRegistry contract on X Layer Testnet.

## Prerequisites

### 1. Environment Configuration

Add the following to your `.env` file:

```bash
# X Layer Testnet RPC (optional, defaults to official testnet RPC)
XLAYER_TESTNET_RPC=https://testrpc.xlayer.tech/terigon

# Publisher wallet private key (MUST be funded with OKB)
PUBLISHER_PRIVATE_KEY=0x...

# Service authentication token (required for API endpoint)
SERVICE_AUTH_TOKEN=your-service-token
```

### 2. Fund the Publisher Wallet

The publisher wallet needs OKB for gas fees on X Layer Testnet:

1. Get your publisher wallet address from `PUBLISHER_PRIVATE_KEY`
2. Request testnet OKB from:
   - X Layer Discord faucet
   - OKX Web3 bridge
3. Ensure wallet has at least 0.01 OKB for publishing operations

### 3. Configure State Publisher Role

Ensure the publisher wallet has the `STATE_PUBLISHER_ROLE` in WorldStateRegistry contract:

```bash
# If you're the contract owner, grant the role:
npx hardhat run scripts/grant-publisher-role.ts --network xlayer-testnet
```

## API Endpoint

### POST /api/world/publish

Publishes the current world state to WorldStateRegistry contract.

**Authentication:** Requires `SERVICE_AUTH_TOKEN` in header

**Request:**

```bash
curl -X POST http://localhost:8787/api/world/publish \
  -H "Authorization: Bearer $SERVICE_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

**Response (Success):**

```json
{
  "ok": true,
  "version": 5,
  "txHash": "0x...",
  "manifestURI": "world/manifests/v5.json",
  "note": "World version successfully published to WorldStateRegistry contract on X Layer Testnet"
}
```

**Response (Failure):**

```json
{
  "ok": false,
  "error": "insufficient funds for transaction",
  "reason": "Failed to publish world version to WorldStateRegistry contract",
  "note": "Ensure PUBLISHER_PRIVATE_KEY is set and wallet has sufficient OKB for gas"
}
```

## How It Works

### 1. Duplicate Detection

The endpoint checks for duplicate state roots before publishing:

```typescript
const latestVersion = await contract.latestWorldVersion();
if (latestVersion > 0) {
  const latestWorld = await contract.getWorldVersion(latestVersion);
  if (latestWorld.stateHash === stateHash) {
    return { ok: false, reason: "Duplicate state root - this version already published" };
  }
}
```

### 2. Version Validation

The WorldStateRegistry contract enforces sequential versions:

```solidity
function submitWorldVersion(uint256 version, string calldata stateHash, string calldata manifestURI) external {
    if (!statePublishers[msg.sender]) revert NotPublisher();
    if (version != latestVersion + 1) revert VersionOutOfOrder();
    // ...
}
```

### 3. On-Chain Recording

Each published version emits an event:

```solidity
event WorldVersionSubmitted(uint256 indexed version, string stateHash, string manifestURI);
```

### 4. Off-Chain Event Logging

The node adds a local event for tracking:

```typescript
addEvent({
  id: `world-published-${version}-${Date.now()}`,
  source: "node",
  type: "WorldVersionPublished",
  payload: {
    version,
    stateRoot,
    manifestURI,
    txHash
  }
});
```

## Integration with GitHub Workflow

After merging a PR that changes world state:

1. Trigger `/api/world/reduce` to regenerate the world manifest
2. Trigger `/api/world/publish` to anchor the new version on-chain
3. Update `world/quests.json` to mark completed quests

Example workflow:

```bash
# After PR merge
curl -X POST http://localhost:8787/api/world/reduce \
  -H "Authorization: Bearer $SERVICE_AUTH_TOKEN"

# Publish the new version
curl -X POST http://localhost:8787/api/world/publish \
  -H "Authorization: Bearer $SERVICE_AUTH_TOKEN"
```

## Acceptance Criteria

✅ Requires explicit service authentication (`SERVICE_AUTH_TOKEN`)
✅ Refuses to publish duplicate state roots
✅ Writes manifest artifact path or URI
✅ Documents OKB requirement
✅ Validates sequential version ordering
✅ Emits on-chain events for transparency
✅ Logs off-chain events for local tracking

## Security Considerations

1. **Never commit `PUBLISHER_PRIVATE_KEY`** - always use `.env` file
2. **Rotate publisher keys regularly** - treat like any production wallet
3. **Monitor gas prices** - X Layer Testnet is generally cheap but costs can vary
4. **Audit publisher addresses** - only grant `STATE_PUBLISHER_ROLE` to trusted wallets
5. **Version integrity** - the contract prevents out-of-order submissions

## Troubleshooting

### Error: "PUBLISHER_PRIVATE_KEY not configured"
**Solution:** Add `PUBLISHER_PRIVATE_KEY` to your `.env` file

### Error: "insufficient funds for transaction"
**Solution:** Ensure publisher wallet has OKB on X Layer Testnet

### Error: "NotPublisher" (contract revert)
**Solution:** Grant `STATE_PUBLISHER_ROLE` to the publisher wallet address

### Error: "VersionOutOfOrder" (contract revert)
**Solution:** Ensure you're publishing the next sequential version (latest + 1)

### Error: "Duplicate state root"
**Solution:** This state has already been published, no need to publish again

## Related Quests

- **Q-0005:** World version publishing (this quest)
- **Q-0003:** Turn passed proposals into GitHub issues automatically
- **Q-0007:** Build Academy District lesson schema
- **Q-0008:** Add Academy District to web app

## Contract Details

**WorldStateRegistry:** `0x164faF0E6252A9f8ac8792b8877e7eC1be7020c6` (X Layer Testnet)

**Key Functions:**
- `submitWorldVersion(uint256 version, string stateHash, string manifestURI)`
- `latestWorldVersion() returns (uint256)`
- `getWorldVersion(uint256 version) returns (...)`

**Key Events:**
- `WorldVersionSubmitted(uint256 indexed version, string stateHash, string manifestURI)`
- `StatePublisherUpdated(address indexed publisher, bool allowed)`

## Next Steps

1. Set up your publisher wallet and fund it with OKB
2. Configure environment variables
3. Test publishing with a small world state change
4. Integrate into your PR merge workflow
5. Monitor on-chain events via block explorer
