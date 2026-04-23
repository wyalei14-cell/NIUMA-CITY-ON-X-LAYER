import { ethers } from "hardhat";
import fs from "node:fs";
import path from "node:path";

type DeploymentFile = {
  chainId: number;
  deployer?: string;
  contracts: Record<string, string>;
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const delaySeconds = Number(process.env.GOVERNANCE_EXECUTOR_DELAY_SECONDS || 86400);

  console.log(`Deploying GovernanceExecutor to chain ${chainId} from ${deployer.address}`);
  const GovernanceExecutor = await ethers.getContractFactory("GovernanceExecutor");
  const governanceExecutor = await GovernanceExecutor.deploy(deployer.address, delaySeconds);
  await governanceExecutor.waitForDeployment();
  const governanceExecutorAddress = await governanceExecutor.getAddress();

  const outputDir = path.resolve(process.cwd(), "..", "world", "deployments");
  const outputPath = path.join(outputDir, `${chainId}.json`);
  const deployment: DeploymentFile = fs.existsSync(outputPath)
    ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
    : { chainId, deployer: deployer.address, contracts: {} };

  deployment.chainId = chainId;
  deployment.deployer = deployment.deployer || deployer.address;
  deployment.contracts.GovernanceExecutor = governanceExecutorAddress;

  const shouldTransferTreasury = process.env.TRANSFER_TREASURY_OWNERSHIP === "true";
  if (shouldTransferTreasury) {
    const treasuryAddress = deployment.contracts.Treasury;
    if (!treasuryAddress) throw new Error("No Treasury address found in deployment file.");
    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = Treasury.attach(treasuryAddress);
    console.log(`Transferring Treasury ownership to ${governanceExecutorAddress}`);
    await (await treasury.transferOwnership(governanceExecutorAddress)).wait();
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(deployment, null, 2)}\n`);
  console.log(JSON.stringify(deployment, null, 2));
  console.log(`GovernanceExecutor saved to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
