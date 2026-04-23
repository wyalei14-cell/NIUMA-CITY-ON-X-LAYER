import { ethers } from "ethers";

const rpcUrl = "https://testrpc.xlayer.tech/terigon";
const provider = new ethers.JsonRpcProvider(rpcUrl);
const registryAddress = "0xa77279811987c36F6191F553bfDf299fdcfa0E57";
const myAddress = "0x36f0a9E2b10e2DEaeb08fB702e4B84c3f9F5834a";

const abi = [
  "event CitizenRegistered(uint256 indexed citizenId,address indexed owner,string metadataURI)"
];

const contract = new ethers.Contract(registryAddress, abi, provider);

async function main() {
  const currentBlock = await provider.getBlockNumber();
  console.log("Current block:", currentBlock);
  
  // 搜索最近的1000个块
  const startBlock = Math.max(0, currentBlock - 1000);
  console.log("Searching from block:", startBlock);
  
  const filter = contract.filters.CitizenRegistered(null, myAddress);
  const events = await contract.queryFilter(filter, startBlock, currentBlock);
  
  console.log("\n🔍 My CitizenRegistration events:");
  if (events.length === 0) {
    console.log("No events found in last 1000 blocks");
    console.log("\n⚠️ This means my registration is very old or never happened on this contract");
  } else {
    events.forEach((event, i) => {
      console.log(`\nEvent ${i+1}:`);
      console.log(`  Block: ${event.blockNumber}`);
      console.log(`  Citizen ID: ${event.args[0].toString()}`);
      console.log(`  Address: ${event.args[1]}`);
      console.log(`  Metadata: ${event.args[2]}`);
      console.log(`  Transaction: ${event.transactionHash}`);
    });
  }
}

main().catch(console.error);
