# Deployment

## Local

```bash
npm install
npm --workspace contracts run build
npm --workspace contracts test
npm run dev:node
npm run dev:web
```

## X Layer Testnet

Set:

```bash
PRIVATE_KEY=0x...
XLAYER_TESTNET_RPC=https://testrpc.xlayer.tech/terigon
```

Then:

```bash
npm run deploy:xlayer-testnet
```

The deployer wallet needs OKB for gas. After deployment, copy the addresses from `world/deployments/1952.json` into `apps/web/.env.local` as `VITE_*` variables.
