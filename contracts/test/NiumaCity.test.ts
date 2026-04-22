import { expect } from "chai";
import { ethers, network } from "hardhat";

describe("Niuma City Alpha Protocol", function () {
  async function deploy() {
    const [owner, alice, bob] = await ethers.getSigners();
    const CitizenRegistry = await ethers.getContractFactory("CitizenRegistry");
    const citizenRegistry = await CitizenRegistry.deploy(owner.address);
    const GovernanceCore = await ethers.getContractFactory("GovernanceCore");
    const governanceCore = await GovernanceCore.deploy(await citizenRegistry.getAddress());
    const RoleManager = await ethers.getContractFactory("RoleManager");
    const roleManager = await RoleManager.deploy(owner.address);
    const CompanyRegistry = await ethers.getContractFactory("CompanyRegistry");
    const companyRegistry = await CompanyRegistry.deploy(await citizenRegistry.getAddress());
    const WorldStateRegistry = await ethers.getContractFactory("WorldStateRegistry");
    const worldStateRegistry = await WorldStateRegistry.deploy(owner.address);
    const ElectionManager = await ethers.getContractFactory("ElectionManager");
    const electionManager = await ElectionManager.deploy(await citizenRegistry.getAddress(), await roleManager.getAddress());
    await roleManager.setElectionController(await electionManager.getAddress());
    return { owner, alice, bob, citizenRegistry, governanceCore, roleManager, companyRegistry, worldStateRegistry, electionManager };
  }

  it("registers citizens as non-transferable identities", async function () {
    const { alice, citizenRegistry } = await deploy();
    await expect(citizenRegistry.connect(alice).registerCitizen(alice.address, "ipfs://alice"))
      .to.emit(citizenRegistry, "CitizenRegistered")
      .withArgs(1, alice.address, "ipfs://alice");
    expect(await citizenRegistry.isCitizen(alice.address)).to.equal(true);
    await expect(citizenRegistry.connect(alice).registerCitizen(alice.address, "ipfs://again")).to.be.revertedWithCustomError(
      citizenRegistry,
      "AlreadyCitizen"
    );
  });

  it("creates, votes, finalizes, and executes proposals with one citizen one vote", async function () {
    const { alice, bob, citizenRegistry, governanceCore } = await deploy();
    await citizenRegistry.connect(alice).registerCitizen(alice.address, "ipfs://alice");
    await citizenRegistry.connect(bob).registerCitizen(bob.address, "ipfs://bob");

    await governanceCore.connect(alice).createProposal(0, "Add Academy District", "sha256:academy");
    await governanceCore.connect(alice).startDiscussion(1);
    await governanceCore.connect(bob).startVoting(1);
    await governanceCore.connect(alice).vote(1, true);
    await expect(governanceCore.connect(alice).vote(1, true)).to.be.revertedWithCustomError(governanceCore, "AlreadyVoted");
    await governanceCore.connect(bob).vote(1, false);

    await network.provider.send("evm_increaseTime", [601]);
    await network.provider.send("evm_mine");
    await governanceCore.finalizeProposal(1);
    const proposal = await governanceCore.getProposal(1);
    expect(proposal.status).to.equal(4);
  });

  it("runs mayor election and updates the role manager", async function () {
    const { alice, bob, citizenRegistry, electionManager, roleManager } = await deploy();
    await citizenRegistry.connect(alice).registerCitizen(alice.address, "ipfs://alice");
    await citizenRegistry.connect(bob).registerCitizen(bob.address, "ipfs://bob");
    await electionManager.openRound();
    await electionManager.connect(alice).nominate(1, "ipfs://alice-campaign");
    await electionManager.connect(bob).startVoting(1);
    await electionManager.connect(bob).voteForMayor(1, alice.address);
    await electionManager.finalizeRound(1);
    expect(await roleManager.currentMayor()).to.equal(alice.address);
  });

  it("anchors ordered world versions", async function () {
    const { worldStateRegistry, owner } = await deploy();
    await worldStateRegistry.setConstitutionHash("sha256:constitution");
    await worldStateRegistry.submitWorldVersion(1, "sha256:state", "ipfs://manifest");
    expect(await worldStateRegistry.latestWorldVersion()).to.equal(1);
    const version = await worldStateRegistry.getWorldVersion(1);
    expect(version.publisher).to.equal(owner.address);
  });

  it("creates companies with one active company per citizen", async function () {
    const { alice, citizenRegistry, companyRegistry } = await deploy();
    await citizenRegistry.connect(alice).registerCitizen(alice.address, "ipfs://alice");
    await companyRegistry.connect(alice).createCompany("Builder Guild", "ipfs://company");
    expect(await companyRegistry.companyOf(alice.address)).to.equal(1);
    await expect(companyRegistry.connect(alice).createCompany("Second", "ipfs://second")).to.be.revertedWithCustomError(
      companyRegistry,
      "AlreadyInCompany"
    );
  });
});
