import { ethers } from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log(`Deploying Niuma City to chain ${network.chainId} from ${deployer.address}`);

  const CitizenRegistry = await ethers.getContractFactory("CitizenRegistry");
  const citizenRegistry = await CitizenRegistry.deploy(deployer.address);
  await citizenRegistry.waitForDeployment();

  const RoleManager = await ethers.getContractFactory("RoleManager");
  const roleManager = await RoleManager.deploy(deployer.address);
  await roleManager.waitForDeployment();

  const GovernanceCore = await ethers.getContractFactory("GovernanceCore");
  const governanceCore = await GovernanceCore.deploy(await citizenRegistry.getAddress());
  await governanceCore.waitForDeployment();

  const CompanyRegistry = await ethers.getContractFactory("CompanyRegistry");
  const companyRegistry = await CompanyRegistry.deploy(await citizenRegistry.getAddress());
  await companyRegistry.waitForDeployment();

  const WorldStateRegistry = await ethers.getContractFactory("WorldStateRegistry");
  const worldStateRegistry = await WorldStateRegistry.deploy(deployer.address);
  await worldStateRegistry.waitForDeployment();

  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(deployer.address);
  await treasury.waitForDeployment();

  const GovernanceExecutor = await ethers.getContractFactory("GovernanceExecutor");
  const governanceExecutor = await GovernanceExecutor.deploy(deployer.address, 86400);
  await governanceExecutor.waitForDeployment();

  const ElectionManager = await ethers.getContractFactory("ElectionManager");
  const electionManager = await ElectionManager.deploy(await citizenRegistry.getAddress(), await roleManager.getAddress());
  await electionManager.waitForDeployment();

  await (await roleManager.setElectionController(await electionManager.getAddress())).wait();

  const deployment = {
    chainId: Number(network.chainId),
    deployer: deployer.address,
    contracts: {
      CitizenRegistry: await citizenRegistry.getAddress(),
      GovernanceCore: await governanceCore.getAddress(),
      RoleManager: await roleManager.getAddress(),
      CompanyRegistry: await companyRegistry.getAddress(),
      WorldStateRegistry: await worldStateRegistry.getAddress(),
      Treasury: await treasury.getAddress(),
      GovernanceExecutor: await governanceExecutor.getAddress(),
      ElectionManager: await electionManager.getAddress()
    }
  };

  const outputDir = path.resolve(process.cwd(), "..", "world", "deployments");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${deployment.chainId}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(deployment, null, 2)}\n`);
  console.log(JSON.stringify(deployment, null, 2));
  console.log(`Deployment saved to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
