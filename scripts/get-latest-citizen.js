import { ethers } from "ethers";
import { citizenRegistryAbi } from "@niuma/sdk";

const rpcUrl = "https://testrpc.xlayer.tech/terigon";
const provider = new ethers.JsonRpcProvider(rpcUrl);
const registryAddress = "0xa77279811987c36F6191F553bfDf299fdcfa0E57";
const registry = new ethers.Contract(registryAddress, citizenRegistryAbi, provider);

async function main() {
  const currentBlock = await provider.getBlockNumber();
  const startBlock = Math.max(0, currentBlock - 100);
  
  console.log("Current block:", currentBlock);
  console.log("Querying from block:", startBlock);
  
  const filter = registry.filters.CitizenRegistered();
  const events = await registry.queryFilter(filter, startBlock, currentBlock);
  
  console.log("\n👥 Recent registered citizens:");
  if (events.length === 0) {
    console.log("  No recent registrations in last 100 blocks");
  } else {
    events.forEach((event, i) => {
      console.log(`  ${i+1}. Address: ${event.args[1]}`);
      console.log(`     Citizen ID: ${event.args[0].toString()}`);
      console.log(`     Metadata: ${event.args[2]}`);
      console.log(`     Block: ${event.blockNumber}`);
    });
  }
}

main().catch(console.error);
