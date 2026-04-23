import { ethers } from "ethers";
import { citizenRegistryAbi } from "@niuma/sdk";

const rpcUrl = "https://testrpc.xlayer.tech/terigon";
const provider = new ethers.JsonRpcProvider(rpcUrl);
const registryAddress = "0xa77279811987c36F6191F553bfDf299fdcfa0E57";
const deployerAddress = "0x36f0a9E2b10e2DEaeb08fB702e4B84c3f9F5834a";

const registry = new ethers.Contract(registryAddress, citizenRegistryAbi, provider);

async function main() {
  const citizenId = await registry.citizenOf(deployerAddress);
  
  console.log("🔍 Checking Niuma City Citizen Status");
  console.log("=====================================");
  console.log("Deployer address:", deployerAddress);
  console.log("Citizen ID:", citizenId.toString());
  console.log("Is citizen:", citizenId.toString() !== "0" ? "✅ YES" : "❌ NO");
  
  // Query all CitizenRegistered events
  const filter = registry.filters.CitizenRegistered();
  const events = await registry.queryFilter(filter, 0, "latest");
  
  console.log("\n📊 Total registered citizens:", events.length);
  
  if (events.length > 0) {
    console.log("\n👥 Registered citizens:");
    events.forEach((event, i) => {
      console.log(`  ${i+1}. ${event.args[1]} -> Citizen ID: ${event.args[1].toString()}`);
      console.log(`     Metadata: ${event.args[2]}`);
    });
  }
}

main().catch(console.error);
