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
    const CourseRegistry = await ethers.getContractFactory("CourseRegistry");
    const courseRegistry = await CourseRegistry.deploy(await citizenRegistry.getAddress(), owner.address);
    const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
    const credentialRegistry = await CredentialRegistry.deploy(await citizenRegistry.getAddress(), await courseRegistry.getAddress(), owner.address);
    return { owner, alice, bob, citizenRegistry, governanceCore, roleManager, companyRegistry, worldStateRegistry, electionManager, courseRegistry, credentialRegistry };
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

  it("proposes, activates, and deprecates courses in the Academy District", async function () {
    const { owner, alice, bob, citizenRegistry, courseRegistry } = await deploy();
    await citizenRegistry.connect(alice).registerCitizen(alice.address, "ipfs://alice");
    await citizenRegistry.connect(bob).registerCitizen(bob.address, "ipfs://bob");

    // Alice proposes a course
    await expect(courseRegistry.connect(alice).proposeCourse("Solidity 101", "ipfs://solidity-101", 0))
      .to.emit(courseRegistry, "CourseProposed")
      .withArgs(1, alice.address, "Solidity 101", "ipfs://solidity-101", 0);

    const course = await courseRegistry.getCourse(1);
    expect(course.proposer).to.equal(alice.address);
    expect(course.status).to.equal(0); // Draft
    expect(course.difficulty).to.equal(0); // Beginner

    // Only governor can activate
    await expect(courseRegistry.connect(bob).activateCourse(1)).to.be.revertedWithCustomError(courseRegistry, "OnlyGovernor");

    // Governor activates
    await expect(courseRegistry.connect(owner).activateCourse(1)).to.emit(courseRegistry, "CourseActivated");
    const activeCourse = await courseRegistry.getCourse(1);
    expect(activeCourse.status).to.equal(1); // Active
    expect(activeCourse.activatedAt).to.be.gt(0);

    // Record completion
    await courseRegistry.connect(bob).recordCompletion(1);
    const completed = await courseRegistry.getCourse(1);
    expect(completed.completionCount).to.equal(1);

    // Governor deprecates
    await expect(courseRegistry.connect(owner).deprecateCourse(1)).to.emit(courseRegistry, "CourseDeprecated");
    const deprecated = await courseRegistry.getCourse(1);
    expect(deprecated.status).to.equal(2); // Deprecated
  });

  it("issues soul-bound credentials for completed courses", async function () {
    const { owner, alice, citizenRegistry, courseRegistry, credentialRegistry } = await deploy();
    await citizenRegistry.connect(alice).registerCitizen(alice.address, "ipfs://alice");
    await courseRegistry.connect(alice).proposeCourse("Agent Ops", "ipfs://agent-ops", 1);
    await courseRegistry.connect(owner).activateCourse(1);

    // Only governor can issue credentials
    await expect(credentialRegistry.connect(alice).issueCredential(alice.address, 1, "sha256:evidence"))
      .to.be.revertedWithCustomError(credentialRegistry, "OnlyGovernor");

    // Governor issues credential
    await expect(credentialRegistry.connect(owner).issueCredential(alice.address, 1, "sha256:evidence"))
      .to.emit(credentialRegistry, "CredentialIssued")
      .withArgs(1, alice.address, 1, "sha256:evidence");

    const cred = await credentialRegistry.getCredential(1);
    expect(cred.citizen).to.equal(alice.address);
    expect(cred.courseId).to.equal(1);
    expect(cred.evidenceHash).to.equal("sha256:evidence");

    // Can't issue duplicate credential for same course
    await expect(credentialRegistry.connect(owner).issueCredential(alice.address, 1, "sha256:evidence2"))
      .to.be.revertedWithCustomError(credentialRegistry, "AlreadyHasCredential");

    // Can't issue for non-active course
    await courseRegistry.connect(alice).proposeCourse("Draft Course", "ipfs://draft", 2);
    await expect(credentialRegistry.connect(owner).issueCredential(alice.address, 2, "sha256:evidence"))
      .to.be.revertedWithCustomError(credentialRegistry, "CourseNotActive");

    // Check credential lookups
    const citizenCreds = await credentialRegistry.getCredentialsByCitizen(alice.address);
    expect(citizenCreds.length).to.equal(1);
    expect(citizenCreds[0]).to.equal(1);
  });
});
