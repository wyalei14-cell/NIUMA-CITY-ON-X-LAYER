import { Contract, formatEther, JsonRpcProvider, Wallet } from "ethers";
import { citizenRegistryAbi, XLAYER_TESTNET } from "@niuma/sdk";

type Bootstrap = {
  contracts: {
    CitizenRegistry?: string;
  };
  network: {
    rpcUrl: string;
  };
};

const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const showPrivateKey = args.has("--show-private-key");
const metadataArg = process.argv.find((arg) => arg.startsWith("--metadata="));
const metadataURI = metadataArg?.slice("--metadata=".length);
const bootstrapUrl = process.env.NIUMA_BOOTSTRAP_URL || "http://localhost:8787/api/agent/bootstrap";

const bootstrap = await loadBootstrap();
const rpcUrl = process.env.XLAYER_TESTNET_RPC || bootstrap.network.rpcUrl || XLAYER_TESTNET.rpcUrl;
const provider = new JsonRpcProvider(rpcUrl);
const privateKey = process.env.AGENT_PRIVATE_KEY;
const generated = privateKey ? null : Wallet.createRandom();
const wallet = new Wallet(privateKey || generated!.privateKey, provider);
const address = await wallet.getAddress();
const registryAddress = bootstrap.contracts.CitizenRegistry;

if (!registryAddress) {
  throw new Error("CitizenRegistry address missing from bootstrap.");
}

const registry = new Contract(registryAddress, citizenRegistryAbi, execute ? wallet : provider);
const balance = await provider.getBalance(address);
const citizenId = await registry.citizenOf(address);
const profileURI = metadataURI || `ipfs://agent/${address.toLowerCase()}`;

console.log("\nNIUMA CITY Agent Registration");
console.log("=============================\n");
console.log(`Mode: ${execute ? "execute" : "dry-run"}`);
console.log(`Wallet: ${address}`);
console.log(`Network: ${XLAYER_TESTNET.name} (${XLAYER_TESTNET.chainId})`);
console.log(`CitizenRegistry: ${registryAddress}`);
console.log(`Balance: ${formatEther(balance)} OKB`);
console.log(`Citizen id: ${citizenId.toString()}`);
console.log(`Metadata URI: ${profileURI}`);

if (generated) {
  console.log("\nGenerated a fresh wallet for this dry run.");
  if (showPrivateKey) {
    console.log(`Private key: ${generated.privateKey}`);
  } else {
    console.log("Private key hidden. Re-run with --show-private-key only if you intentionally want to save this generated wallet.");
  }
}

if (citizenId !== 0n) {
  console.log("\nAlready registered. No transaction needed.");
  process.exit(0);
}

if (!execute) {
  console.log("\nDry run only. To register onchain:");
  console.log("1. Set AGENT_PRIVATE_KEY for the wallet you want to register.");
  console.log("2. Fund that wallet with X Layer Testnet OKB.");
  console.log("3. Run: npm --workspace apps/agent run register -- --execute --metadata=ipfs://your-profile");
  process.exit(0);
}

if (!privateKey) {
  throw new Error("Refusing to execute without AGENT_PRIVATE_KEY. Dry-run generated wallets are not used for transactions.");
}

if (balance === 0n) {
  throw new Error(`Wallet ${address} has 0 OKB. Fund it on X Layer Testnet before registering.`);
}

const tx = await registry.registerCitizen(address, profileURI);
console.log(`\nregisterCitizen tx: ${tx.hash}`);
await tx.wait();
const newCitizenId = await registry.citizenOf(address);
console.log(`Registered citizen id: ${newCitizenId.toString()}`);

async function loadBootstrap(): Promise<Bootstrap> {
  const response = await fetch(bootstrapUrl);
  if (!response.ok) {
    throw new Error(`Bootstrap failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as Bootstrap;
}

export {};
