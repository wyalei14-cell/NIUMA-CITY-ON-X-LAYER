import { ethers } from "ethers";

const rpcUrl = "https://testrpc.xlayer.tech/terigon";
const provider = new ethers.JsonRpcProvider(rpcUrl);
const registryAddress = "0xa77279811987c36F6191F553bfDf299fdcfa0E57";
const deployerAddress = "0x36f0a9E2b10e2DEaeb08fB702e4B84c3f9F5834a";

const abi = ["function citizenOf(address owner) view returns (uint256)"];

const contract = new ethers.Contract(registryAddress, abi, provider);

async function main() {
  const citizenId = await contract.citizenOf(deployerAddress);
  console.log("Deployer address:", deployerAddress);
  console.log("Citizen ID:", citizenId.toString());
  console.log("Is registered:", citizenId.toString() !== "0" ? "YES" : "NO");
}

main().catch(console.error);
