import { ethers } from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log(`Deploying Academy contracts to chain ${network.chainId} from ${deployer.address}`);

  // Read existing deployment to get CitizenRegistry address
  const deploymentPath = path.resolve(process.cwd(), "..", "world", "deployments", `${Number(network.chainId)}.json`);
  if (!fs.existsSync(deploymentPath)) {
    console.error(`Deployment file not found at ${deploymentPath}`);
    process.exitCode = 1;
    return;
  }
  const existing = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const citizenRegistryAddr = existing.contracts.CitizenRegistry;
  console.log(`Using CitizenRegistry at ${citizenRegistryAddr}`);

  const CourseRegistry = await ethers.getContractFactory("CourseRegistry");
  const courseRegistry = await CourseRegistry.deploy(citizenRegistryAddr, deployer.address);
  await courseRegistry.waitForDeployment();
  const courseRegistryAddr = await courseRegistry.getAddress();
  console.log(`CourseRegistry deployed to ${courseRegistryAddr}`);

  const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = await CredentialRegistry.deploy(citizenRegistryAddr, courseRegistryAddr, deployer.address);
  await credentialRegistry.waitForDeployment();
  const credentialRegistryAddr = await credentialRegistry.getAddress();
  console.log(`CredentialRegistry deployed to ${credentialRegistryAddr}`);

  // Update deployment file
  existing.contracts.CourseRegistry = courseRegistryAddr;
  existing.contracts.CredentialRegistry = credentialRegistryAddr;
  fs.writeFileSync(deploymentPath, `${JSON.stringify(existing, null, 2)}\n`);
  console.log(`Deployment updated at ${deploymentPath}`);
  console.log(JSON.stringify({ CourseRegistry: courseRegistryAddr, CredentialRegistry: credentialRegistryAddr }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
