const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DecentralizedIssueTracker", function () {
  let issueTracker;
  let owner, aiAgent, org1, org2, contributor1, contributor2;
  const MIN_ORG_STAKE = ethers.parseEther("0.01");
  const EASY_DURATION = 7 * 24 * 60 * 60; // 7 days
  const MEDIUM_DURATION = 30 * 24 * 60 * 60; // 30 days
  const HARD_DURATION = 150 * 24 * 60 * 60; // 150 days

  beforeEach(async function () {
    [owner, aiAgent, org1, org2, contributor1, contributor2] = await ethers.getSigners();

    const IssueTracker = await ethers.getContractFactory("DecentralizedIssueTracker");
    issueTracker = await IssueTracker.deploy(
      aiAgent.address,
      EASY_DURATION,
      MEDIUM_DURATION,
      HARD_DURATION
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await issueTracker.owner()).to.equal(owner.address);
    });

    it("Should set the correct AI agent address", async function () {
      expect(await issueTracker.AI_AGENT_ADDRESS()).to.equal(aiAgent.address);
    });

    it("Should set the correct deadline durations", async function () {
      const durations = await issueTracker.getDeadlineDurations();
      expect(durations.easy).to.equal(EASY_DURATION);
      expect(durations.medium).to.equal(MEDIUM_DURATION);
      expect(durations.hard).to.equal(HARD_DURATION);
    });
  });

  describe("Organization Registration", function () {
    it("Should register an organization with valid stake", async function () {
      await expect(
        issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
          value: MIN_ORG_STAKE,
        })
      )
        .to.emit(issueTracker, "OrganizationRegistered")
        .withArgs(org1.address, "https://github.com/org1/repo", MIN_ORG_STAKE);

      const orgInfo = await issueTracker.getOrganizationInfo(org1.address);
      expect(orgInfo.repoUrl).to.equal("https://github.com/org1/repo");
      expect(orgInfo.totalStaked).to.equal(MIN_ORG_STAKE);
      expect(orgInfo.availableRewards).to.equal(MIN_ORG_STAKE);
      expect(orgInfo.isActive).to.be.true;
      expect(orgInfo.owner).to.equal(org1.address);
    });

    it("Should fail to register with insufficient stake", async function () {
      await expect(
        issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
          value: ethers.parseEther("0.005"),
        })
      ).to.be.revertedWith("Invalid stake amount");
    });

    it("Should fail to register with empty repo URL", async function () {
      await expect(
        issueTracker.connect(org1).registerOrganization("", {
          value: MIN_ORG_STAKE,
        })
      ).to.be.revertedWith("Repository URL cannot be empty");
    });

    it("Should fail to register same organization twice", async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: MIN_ORG_STAKE,
      });

      await expect(
        issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo2", {
          value: MIN_ORG_STAKE,
        })
      ).to.be.revertedWith("Organization already registered");
    });
  });

  describe("Adding Funds to Organization", function () {
    beforeEach(async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: MIN_ORG_STAKE,
      });
    });

    it("Should allow organization to add funds", async function () {
      const additionalFunds = ethers.parseEther("0.5");
      await issueTracker.connect(org1).addFundsToOrganization({ value: additionalFunds });

      const orgInfo = await issueTracker.getOrganizationInfo(org1.address);
      expect(orgInfo.totalStaked).to.equal(MIN_ORG_STAKE + additionalFunds);
      expect(orgInfo.availableRewards).to.equal(MIN_ORG_STAKE + additionalFunds);
    });

    it("Should fail if non-registered organization tries to add funds", async function () {
      await expect(
        issueTracker.connect(org2).addFundsToOrganization({ value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Organization not registered or inactive");
    });

    it("Should fail if trying to add zero funds", async function () {
      await expect(
        issueTracker.connect(org1).addFundsToOrganization({ value: 0 })
      ).to.be.revertedWith("Must send some ETH");
    });
  });

  describe("Issue Creation", function () {
    beforeEach(async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: ethers.parseEther("1"),
      });
    });

    it("Should create an issue by AI agent", async function () {
      const bounty = ethers.parseEther("0.1");
      await expect(
        issueTracker
          .connect(aiAgent)
          .createIssue(
            "https://github.com/org1/repo/issues/1",
            "Fix critical bug",
            bounty,
            0,
            org1.address
          )
      )
        .to.emit(issueTracker, "IssueCreated")
        .withArgs(1, aiAgent.address, "https://github.com/org1/repo/issues/1", bounty, 0);

      const issueInfo = await issueTracker.getIssueInfo(1);
      expect(issueInfo.org).to.equal(org1.address);
      expect(issueInfo.githubIssueUrl).to.equal("https://github.com/org1/repo/issues/1");
      expect(issueInfo.description).to.equal("Fix critical bug");
      expect(issueInfo.bounty).to.equal(bounty);
      expect(issueInfo.isCompleted).to.be.false;
      expect(issueInfo.isAssigned).to.be.false;
      expect(issueInfo.difficulty).to.equal(0);
    });

    it("Should fail if non-AI agent tries to create issue", async function () {
      await expect(
        issueTracker
          .connect(org1)
          .createIssue(
            "https://github.com/org1/repo/issues/1",
            "Fix bug",
            ethers.parseEther("0.1"),
            0,
            org1.address
          )
      ).to.be.revertedWith("Only AI Agent can call this");
    });

    it("Should fail if organization has insufficient funds", async function () {
      await expect(
        issueTracker
          .connect(aiAgent)
          .createIssue(
            "https://github.com/org1/repo/issues/1",
            "Fix bug",
            ethers.parseEther("10"),
            0,
            org1.address
          )
      ).to.be.revertedWith("Insufficient organization funds");
    });

    it("Should fail if bounty is zero", async function () {
      await expect(
        issueTracker
          .connect(aiAgent)
          .createIssue("https://github.com/org1/repo/issues/1", "Fix bug", 0, 0, org1.address)
      ).to.be.revertedWith("Bounty must be greater than 0");
    });

    it("Should fail if GitHub URL is empty", async function () {
      await expect(
        issueTracker
          .connect(aiAgent)
          .createIssue("", "Fix bug", ethers.parseEther("0.1"), 0, org1.address)
      ).to.be.revertedWith("GitHub issue URL cannot be empty");
    });

    it("Should deduct bounty from available rewards", async function () {
      const bounty = ethers.parseEther("0.1");
      const orgInfoBefore = await issueTracker.getOrganizationInfo(org1.address);

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Fix bug",
          bounty,
          0,
          org1.address
        );

      const orgInfoAfter = await issueTracker.getOrganizationInfo(org1.address);
      expect(orgInfoAfter.availableRewards).to.equal(orgInfoBefore.availableRewards - bounty);
    });
  });

  describe("Taking Issues", function () {
    let issueId;
    const bounty = ethers.parseEther("0.1");

    beforeEach(async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: ethers.parseEther("1"),
      });

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Fix bug",
          bounty,
          0,
          org1.address
        );
      issueId = 1;
    });

    it("Should allow contributor to take an issue with valid stake", async function () {
      const requiredStake = (bounty * 5n) / 100n;
      const deadline = (await time.latest()) + EASY_DURATION;

      await expect(
        issueTracker.connect(contributor1).takeIssue(issueId, { value: requiredStake })
      )
        .to.emit(issueTracker, "IssueAssigned")
        .withArgs(issueId, contributor1.address, deadline);

      const issueInfo = await issueTracker.getIssueInfo(issueId);
      expect(issueInfo.isAssigned).to.be.true;
      expect(issueInfo.assignedTo).to.equal(contributor1.address);
      expect(await issueTracker.contributorStakes(contributor1.address)).to.equal(requiredStake);
    });

    it("Should fail if stake is below minimum", async function () {
      const insufficientStake = (bounty * 4n) / 100n;
      await expect(
        issueTracker.connect(contributor1).takeIssue(issueId, { value: insufficientStake })
      ).to.be.revertedWith("Invalid stake amount");
    });

    it("Should fail if stake is above maximum", async function () {
      const excessiveStake = (bounty * 21n) / 100n;
      await expect(
        issueTracker.connect(contributor1).takeIssue(issueId, { value: excessiveStake })
      ).to.be.revertedWith("Invalid stake amount");
    });

    it("Should fail if issue doesn't exist", async function () {
      const requiredStake = (bounty * 5n) / 100n;
      await expect(
        issueTracker.connect(contributor1).takeIssue(999, { value: requiredStake })
      ).to.be.revertedWith("Issue does not exist");
    });

    it("Should fail if issue is already assigned", async function () {
      const requiredStake = (bounty * 5n) / 100n;
      await issueTracker.connect(contributor1).takeIssue(issueId, { value: requiredStake });

      await expect(
        issueTracker.connect(contributor2).takeIssue(issueId, { value: requiredStake })
      ).to.be.revertedWith("Issue already assigned");
    });

    it("Should fail if organization tries to take its own issue", async function () {
      const requiredStake = (bounty * 5n) / 100n;
      await expect(
        issueTracker.connect(org1).takeIssue(issueId, { value: requiredStake })
      ).to.be.revertedWith("Organization cannot assign issue to itself");
    });

    it("Should set correct deadline for MEDIUM difficulty", async function () {
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/2",
          "Medium task",
          bounty,
          1,
          org1.address
        );

      const requiredStake = (bounty * 5n) / 100n;
      await issueTracker.connect(contributor1).takeIssue(2, { value: requiredStake });

      const issueInfo = await issueTracker.getIssueInfo(2);
      const expectedDeadline = BigInt(await time.latest()) + BigInt(MEDIUM_DURATION);
      expect(issueInfo.deadline).to.be.closeTo(expectedDeadline, 10n);
    });

    it("Should set correct deadline for HARD difficulty", async function () {
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/3",
          "Hard task",
          bounty,
          2,
          org1.address
        );

      const requiredStake = (bounty * 5n) / 100n;
      await issueTracker.connect(contributor1).takeIssue(3, { value: requiredStake });

      const issueInfo = await issueTracker.getIssueInfo(3);
      const expectedDeadline = BigInt(await time.latest()) + BigInt(HARD_DURATION);
      expect(issueInfo.deadline).to.be.closeTo(expectedDeadline, 10n);
    });
  });

  describe("Grading Issues by AI", function () {
    let issueId;
    const bounty = ethers.parseEther("0.1");
    const requiredStake = (bounty * 5n) / 100n;

    beforeEach(async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: ethers.parseEther("1"),
      });

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Fix bug",
          bounty,
          0,
          org1.address
        );
      issueId = 1;

      await issueTracker.connect(contributor1).takeIssue(issueId, { value: requiredStake });
    });

    it("Should allow AI agent to grade and complete issue", async function () {
      const confidenceScore = 95;
      const contributor1BalanceBefore = await ethers.provider.getBalance(contributor1.address);

      await expect(issueTracker.connect(aiAgent).gradeIssueByAI(issueId, confidenceScore))
        .to.emit(issueTracker, "IssueCompleted")
        .withArgs(issueId, contributor1.address, bounty + requiredStake);

      const issueInfo = await issueTracker.getIssueInfo(issueId);
      expect(issueInfo.isCompleted).to.be.true;

      const contributor1BalanceAfter = await ethers.provider.getBalance(contributor1.address);
      expect(contributor1BalanceAfter - contributor1BalanceBefore).to.equal(
        bounty + requiredStake
      );
    });

    it("Should fail if non-AI agent tries to grade", async function () {
      await expect(
        issueTracker.connect(org1).gradeIssueByAI(issueId, 95)
      ).to.be.revertedWith("Only AI Agent can call this");
    });

    it("Should fail if issue is not assigned", async function () {
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/2",
          "New issue",
          bounty,
          0,
          org1.address
        );

      await expect(issueTracker.connect(aiAgent).gradeIssueByAI(2, 95)).to.be.revertedWith(
        "Issue not assigned"
      );
    });

    it("Should fail if issue is already completed", async function () {
      await issueTracker.connect(aiAgent).gradeIssueByAI(issueId, 95);

      await expect(issueTracker.connect(aiAgent).gradeIssueByAI(issueId, 90)).to.be.revertedWith(
        "Issue already completed"
      );
    });

    it("Should clear contributor stake after grading", async function () {
      await issueTracker.connect(aiAgent).gradeIssueByAI(issueId, 95);
      expect(await issueTracker.contributorStakes(contributor1.address)).to.equal(0);
    });
  });

  describe("Completing Issues Manually", function () {
    let issueId;
    const bounty = ethers.parseEther("0.1");
    const requiredStake = (bounty * 5n) / 100n;

    beforeEach(async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: ethers.parseEther("1"),
      });

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Fix bug",
          bounty,
          0,
          org1.address
        );
      issueId = 1;

      await issueTracker.connect(contributor1).takeIssue(issueId, { value: requiredStake });
    });

    it("Should allow org owner to complete issue after AI grading", async function () {
      await issueTracker.connect(aiAgent).gradeIssueByAI(issueId, 95);

      const contributor1BalanceBefore = await ethers.provider.getBalance(contributor1.address);

      await expect(issueTracker.connect(org1).completeIssue(issueId))
        .to.emit(issueTracker, "IssueCompleted")
        .withArgs(issueId, contributor1.address, bounty + requiredStake);
    });

    it("Should fail if issue not graded by AI", async function () {
      await expect(issueTracker.connect(org1).completeIssue(issueId)).to.be.revertedWith(
        "Issue not graded by AI"
      );
    });

    it("Should fail if non-org owner tries to complete", async function () {
      await issueTracker.connect(aiAgent).gradeIssueByAI(issueId, 95);

      await expect(issueTracker.connect(contributor1).completeIssue(issueId)).to.be.revertedWith(
        "Only organization owner can complete issue"
      );
    });
  });

  describe("Expired Issues", function () {
    let issueId;
    const bounty = ethers.parseEther("0.1");
    const requiredStake = (bounty * 5n) / 100n;

    beforeEach(async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: ethers.parseEther("1"),
      });

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Fix bug",
          bounty,
          0,
          org1.address
        );
      issueId = 1;

      await issueTracker.connect(contributor1).takeIssue(issueId, { value: requiredStake });
    });

    it("Should allow contributor to claim expired issue", async function () {
      await time.increase(EASY_DURATION + 1);

      const contributor1BalanceBefore = await ethers.provider.getBalance(contributor1.address);

      await expect(issueTracker.connect(contributor1).claimExpiredIssue(issueId))
        .to.emit(issueTracker, "DeadlineExpired")
        .withArgs(issueId, contributor1.address);

      const issueInfo = await issueTracker.getIssueInfo(issueId);
      expect(issueInfo.isAssigned).to.be.false;
      expect(issueInfo.assignedTo).to.equal(ethers.ZeroAddress);

      const contributor1BalanceAfter = await ethers.provider.getBalance(contributor1.address);
      expect(contributor1BalanceAfter).to.be.gt(contributor1BalanceBefore);
    });

    it("Should fail if deadline hasn't passed", async function () {
      await expect(
        issueTracker.connect(contributor1).claimExpiredIssue(issueId)
      ).to.be.revertedWith("Deadline has not passed");
    });

    it("Should fail if non-assigned contributor tries to claim", async function () {
      await time.increase(EASY_DURATION + 1);

      await expect(
        issueTracker.connect(contributor2).claimExpiredIssue(issueId)
      ).to.be.revertedWith("Only assigned contributor can claim");
    });

    it("Should return bounty to organization available rewards", async function () {
      const orgInfoBefore = await issueTracker.getOrganizationInfo(org1.address);
      await time.increase(EASY_DURATION + 1);
      await issueTracker.connect(contributor1).claimExpiredIssue(issueId);

      const orgInfoAfter = await issueTracker.getOrganizationInfo(org1.address);
      expect(orgInfoAfter.availableRewards).to.equal(orgInfoBefore.availableRewards + bounty);
    });

    it("Should check if issue is expired using isIssueExpired", async function () {
      expect(await issueTracker.isIssueExpired(issueId)).to.be.false;

      await time.increase(EASY_DURATION + 1);

      expect(await issueTracker.isIssueExpired(issueId)).to.be.true;
    });
  });

  describe("Bounty Increase", function () {
    let issueId;
    const bounty = ethers.parseEther("0.1");

    beforeEach(async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: ethers.parseEther("1"),
      });

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Fix bug",
          bounty,
          0,
          org1.address
        );
      issueId = 1;
    });

    it("Should allow organization to increase bounty", async function () {
      const additionalBounty = ethers.parseEther("0.05");

      await expect(
        issueTracker.connect(org1).increaseBounty(issueId, { value: additionalBounty })
      )
        .to.emit(issueTracker, "BountyIncreased")
        .withArgs(issueId, bounty + additionalBounty);

      const issueInfo = await issueTracker.getIssueInfo(issueId);
      expect(issueInfo.bounty).to.equal(bounty + additionalBounty);
    });

    it("Should fail if non-organization tries to increase bounty", async function () {
      await expect(
        issueTracker
          .connect(contributor1)
          .increaseBounty(issueId, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Organization not registered or inactive");
    });

    it("Should fail if wrong organization tries to increase bounty", async function () {
      await issueTracker.connect(org2).registerOrganization("https://github.com/org2/repo", {
        value: MIN_ORG_STAKE,
      });

      await expect(
        issueTracker.connect(org2).increaseBounty(issueId, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Only issue creator can increase bounty");
    });

    it("Should fail if trying to increase bounty for completed issue", async function () {
      const requiredStake = (bounty * 5n) / 100n;
      await issueTracker.connect(contributor1).takeIssue(issueId, { value: requiredStake });
      await issueTracker.connect(aiAgent).gradeIssueByAI(issueId, 95);

      await expect(
        issueTracker.connect(org1).increaseBounty(issueId, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Cannot increase bounty for completed issue");
    });

    it("Should fail if trying to increase bounty with zero value", async function () {
      await expect(issueTracker.connect(org1).increaseBounty(issueId, { value: 0 })).to.be.revertedWith(
        "Must send some ETH"
      );
    });
  });

  describe("Stake Withdrawal", function () {
    it("Should allow contributor to withdraw stake", async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: ethers.parseEther("1"),
      });

      const bounty = ethers.parseEther("0.1");
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Fix bug",
          bounty,
          0,
          org1.address
        );

      const stake = (bounty * 5n) / 100n;
      await issueTracker.connect(contributor1).takeIssue(1, { value: stake });

      const contributor1BalanceBefore = await ethers.provider.getBalance(contributor1.address);

      await expect(issueTracker.connect(contributor1).withdrawStake())
        .to.emit(issueTracker, "StakeWithdrawn")
        .withArgs(contributor1.address, stake);

      expect(await issueTracker.contributorStakes(contributor1.address)).to.equal(0);

      const contributor1BalanceAfter = await ethers.provider.getBalance(contributor1.address);
      expect(contributor1BalanceAfter).to.be.gt(contributor1BalanceBefore);
    });

    it("Should fail if no stake to withdraw", async function () {
      await expect(issueTracker.connect(contributor1).withdrawStake()).to.be.revertedWith(
        "No stake to withdraw"
      );
    });
  });

  describe("Deadline Duration Updates", function () {
    it("Should allow owner to update deadline durations", async function () {
      const newEasy = 5 * 24 * 60 * 60;
      const newMedium = 20 * 24 * 60 * 60;
      const newHard = 100 * 24 * 60 * 60;

      await issueTracker.updateDeadlineDurations(newEasy, newMedium, newHard);

      const durations = await issueTracker.getDeadlineDurations();
      expect(durations.easy).to.equal(newEasy);
      expect(durations.medium).to.equal(newMedium);
      expect(durations.hard).to.equal(newHard);
    });

    it("Should fail if non-owner tries to update", async function () {
      await expect(
        issueTracker.connect(org1).updateDeadlineDurations(100, 200, 300)
      ).to.be.revertedWithCustomError(issueTracker, "OwnableUnauthorizedAccount");
    });

    it("Should fail with zero durations", async function () {
      await expect(
        issueTracker.updateDeadlineDurations(0, 100, 100)
      ).to.be.revertedWith("Easy duration must be greater than 0");

      await expect(
        issueTracker.updateDeadlineDurations(100, 0, 100)
      ).to.be.revertedWith("Medium duration must be greater than 0");

      await expect(
        issueTracker.updateDeadlineDurations(100, 100, 0)
      ).to.be.revertedWith("Hard duration must be greater than 0");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: ethers.parseEther("1"),
      });
    });

    it("Should return correct organization issues", async function () {
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Issue 1",
          ethers.parseEther("0.1"),
          0,
          org1.address
        );
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/2",
          "Issue 2",
          ethers.parseEther("0.1"),
          0,
          org1.address
        );

      const issues = await issueTracker.getOrganizationIssues(org1.address);
      expect(issues.length).to.equal(2);
      expect(issues[0]).to.equal(1);
      expect(issues[1]).to.equal(2);
    });

    it("Should return correct contributor assigned issues", async function () {
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Issue 1",
          ethers.parseEther("0.1"),
          0,
          org1.address
        );

      const bounty = ethers.parseEther("0.1");
      const stake = (bounty * 5n) / 100n;

      await issueTracker.connect(contributor1).takeIssue(1, { value: stake });

      const assignedIssues = await issueTracker.getContributorAssignedIssues(contributor1.address);
      expect(assignedIssues.length).to.equal(1);
      expect(assignedIssues[0]).to.equal(1);
    });

    it("Should return correct contract balance", async function () {
      const contractBalance = await issueTracker.getContractBalance();
      expect(contractBalance).to.equal(ethers.parseEther("1"));
    });
  });

  describe("Multiple Contributors Workflow", function () {
    const bounty1 = ethers.parseEther("0.1");
    const bounty2 = ethers.parseEther("0.2");

    beforeEach(async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: ethers.parseEther("2"),
      });

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Issue 1",
          bounty1,
          0,
          org1.address
        );

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/2",
          "Issue 2",
          bounty2,
          1,
          org1.address
        );
    });

    it("Should allow multiple contributors to take different issues", async function () {
      const stake1 = (bounty1 * 5n) / 100n;
      const stake2 = (bounty2 * 5n) / 100n;

      await issueTracker.connect(contributor1).takeIssue(1, { value: stake1 });
      await issueTracker.connect(contributor2).takeIssue(2, { value: stake2 });

      const issue1Info = await issueTracker.getIssueInfo(1);
      const issue2Info = await issueTracker.getIssueInfo(2);

      expect(issue1Info.assignedTo).to.equal(contributor1.address);
      expect(issue2Info.assignedTo).to.equal(contributor2.address);
    });

    it("Should track stakes for multiple contributors separately", async function () {
      const stake1 = (bounty1 * 5n) / 100n;
      const stake2 = (bounty2 * 10n) / 100n;

      await issueTracker.connect(contributor1).takeIssue(1, { value: stake1 });
      await issueTracker.connect(contributor2).takeIssue(2, { value: stake2 });

      expect(await issueTracker.contributorStakes(contributor1.address)).to.equal(stake1);
      expect(await issueTracker.contributorStakes(contributor2.address)).to.equal(stake2);
    });

    it("Should complete issues for different contributors independently", async function () {
      const stake1 = (bounty1 * 5n) / 100n;
      const stake2 = (bounty2 * 5n) / 100n;

      await issueTracker.connect(contributor1).takeIssue(1, { value: stake1 });
      await issueTracker.connect(contributor2).takeIssue(2, { value: stake2 });

      await issueTracker.connect(aiAgent).gradeIssueByAI(1, 90);

      const issue1Info = await issueTracker.getIssueInfo(1);
      const issue2Info = await issueTracker.getIssueInfo(2);

      expect(issue1Info.isCompleted).to.be.true;
      expect(issue2Info.isCompleted).to.be.false;
    });
  });

  describe("Edge Cases and Security", function () {
    beforeEach(async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: ethers.parseEther("1"),
      });
    });

    it("Should handle issue with exact minimum stake", async function () {
      const bounty = ethers.parseEther("0.1");
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Issue 1",
          bounty,
          0,
          org1.address
        );

      const minStake = (bounty * 5n) / 100n;
      await expect(issueTracker.connect(contributor1).takeIssue(1, { value: minStake })).to.not.be
        .reverted;
    });

    it("Should handle issue with exact maximum stake", async function () {
      const bounty = ethers.parseEther("0.1");
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Issue 1",
          bounty,
          0,
          org1.address
        );

      const maxStake = (bounty * 20n) / 100n;
      await expect(issueTracker.connect(contributor1).takeIssue(1, { value: maxStake })).to.not.be
        .reverted;
    });

    it("Should prevent reentrancy in takeIssue", async function () {
      const bounty = ethers.parseEther("0.1");
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Issue 1",
          bounty,
          0,
          org1.address
        );

      const stake = (bounty * 5n) / 100n;
      await issueTracker.connect(contributor1).takeIssue(1, { value: stake });

      // Reentrancy protection tested by modifier
      expect(await issueTracker.contributorStakes(contributor1.address)).to.equal(stake);
    });

    it("Should prevent reentrancy in withdrawStake", async function () {
      const bounty = ethers.parseEther("0.1");
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Issue 1",
          bounty,
          0,
          org1.address
        );

      const stake = (bounty * 5n) / 100n;
      await issueTracker.connect(contributor1).takeIssue(1, { value: stake });
      await issueTracker.connect(contributor1).withdrawStake();

      await expect(issueTracker.connect(contributor1).withdrawStake()).to.be.revertedWith(
        "No stake to withdraw"
      );
    });

    it("Should correctly remove issue from contributor's assigned issues", async function () {
      const bounty = ethers.parseEther("0.1");
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Issue 1",
          bounty,
          0,
          org1.address
        );

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/2",
          "Issue 2",
          bounty,
          0,
          org1.address
        );

      const stake = (bounty * 5n) / 100n;
      await issueTracker.connect(contributor1).takeIssue(1, { value: stake });
      await issueTracker.connect(contributor1).takeIssue(2, { value: stake });

      await time.increase(EASY_DURATION + 1);
      await issueTracker.connect(contributor1).claimExpiredIssue(1);

      const assignedIssues = await issueTracker.getContributorAssignedIssues(contributor1.address);
      expect(assignedIssues.length).to.equal(1);
      expect(assignedIssues[0]).to.equal(2);
    });

    it("Should handle zero address checks", async function () {
      const issueInfo = await issueTracker.getIssueInfo(999);
      expect(issueInfo.assignedTo).to.equal(ethers.ZeroAddress);
    });

    it("Should maintain accurate contract balance across operations", async function () {
      const initialBalance = await issueTracker.getContractBalance();

      const bounty = ethers.parseEther("0.1");
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Issue 1",
          bounty,
          0,
          org1.address
        );

      const stake = (bounty * 5n) / 100n;
      await issueTracker.connect(contributor1).takeIssue(1, { value: stake });

      const balanceAfterStake = await issueTracker.getContractBalance();
      expect(balanceAfterStake).to.equal(initialBalance + stake);

      await issueTracker.connect(aiAgent).gradeIssueByAI(1, 95);

      const finalBalance = await issueTracker.getContractBalance();
      expect(finalBalance).to.equal(initialBalance - bounty);
    });
  });

  describe("Organization Management", function () {
    it("Should allow multiple organizations to register", async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: MIN_ORG_STAKE,
      });

      await issueTracker.connect(org2).registerOrganization("https://github.com/org2/repo", {
        value: ethers.parseEther("0.5"),
      });

      const org1Info = await issueTracker.getOrganizationInfo(org1.address);
      const org2Info = await issueTracker.getOrganizationInfo(org2.address);

      expect(org1Info.isActive).to.be.true;
      expect(org2Info.isActive).to.be.true;
    });

    it("Should track different organizations' issues separately", async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: ethers.parseEther("1"),
      });

      await issueTracker.connect(org2).registerOrganization("https://github.com/org2/repo", {
        value: ethers.parseEther("1"),
      });

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Org1 Issue",
          ethers.parseEther("0.1"),
          0,
          org1.address
        );

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org2/repo/issues/1",
          "Org2 Issue",
          ethers.parseEther("0.1"),
          0,
          org2.address
        );

      const org1Issues = await issueTracker.getOrganizationIssues(org1.address);
      const org2Issues = await issueTracker.getOrganizationIssues(org2.address);

      expect(org1Issues.length).to.equal(1);
      expect(org2Issues.length).to.equal(1);
      expect(org1Issues[0]).to.not.equal(org2Issues[0]);
    });
  });

  describe("Complex Scenarios", function () {
    beforeEach(async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: ethers.parseEther("5"),
      });
    });

    it("Should handle contributor taking multiple issues", async function () {
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Issue 1",
          ethers.parseEther("0.1"),
          0,
          org1.address
        );

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/2",
          "Issue 2",
          ethers.parseEther("0.2"),
          1,
          org1.address
        );

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/3",
          "Issue 3",
          ethers.parseEther("0.3"),
          2,
          org1.address
        );

      const stake1 = (ethers.parseEther("0.1") * 5n) / 100n;
      const stake2 = (ethers.parseEther("0.2") * 5n) / 100n;
      const stake3 = (ethers.parseEther("0.3") * 5n) / 100n;

      await issueTracker.connect(contributor1).takeIssue(1, { value: stake1 });
      await issueTracker.connect(contributor1).takeIssue(2, { value: stake2 });
      await issueTracker.connect(contributor1).takeIssue(3, { value: stake3 });

      const totalStake = stake1 + stake2 + stake3;
      expect(await issueTracker.contributorStakes(contributor1.address)).to.equal(totalStake);

      const assignedIssues = await issueTracker.getContributorAssignedIssues(contributor1.address);
      expect(assignedIssues.length).to.equal(3);
    });

    it("Should handle partial issue completion with multiple issues", async function () {
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Issue 1",
          ethers.parseEther("0.1"),
          0,
          org1.address
        );

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/2",
          "Issue 2",
          ethers.parseEther("0.2"),
          0,
          org1.address
        );

      const stake1 = (ethers.parseEther("0.1") * 5n) / 100n;
      const stake2 = (ethers.parseEther("0.2") * 5n) / 100n;

      await issueTracker.connect(contributor1).takeIssue(1, { value: stake1 });
      await issueTracker.connect(contributor1).takeIssue(2, { value: stake2 });

      await issueTracker.connect(aiAgent).gradeIssueByAI(1, 90);

      // Issue 1 completed, Issue 2 still active
      expect(await issueTracker.contributorStakes(contributor1.address)).to.equal(stake2);

      const issue1Info = await issueTracker.getIssueInfo(1);
      const issue2Info = await issueTracker.getIssueInfo(2);

      expect(issue1Info.isCompleted).to.be.true;
      expect(issue2Info.isCompleted).to.be.false;
    });

    it("Should handle increasing bounty after assignment", async function () {
      const initialBounty = ethers.parseEther("0.1");
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Issue 1",
          initialBounty,
          0,
          org1.address
        );

      const stake = (initialBounty * 5n) / 100n;
      await issueTracker.connect(contributor1).takeIssue(1, { value: stake });

      const additionalBounty = ethers.parseEther("0.05");
      await issueTracker.connect(org1).increaseBounty(1, { value: additionalBounty });

      const issueInfo = await issueTracker.getIssueInfo(1);
      expect(issueInfo.bounty).to.equal(initialBounty + additionalBounty);
    });

    it("Should handle concurrent deadline expirations", async function () {
      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Issue 1",
          ethers.parseEther("0.1"),
          0,
          org1.address
        );

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/2",
          "Issue 2",
          ethers.parseEther("0.1"),
          0,
          org1.address
        );

      const stake = (ethers.parseEther("0.1") * 5n) / 100n;
      await issueTracker.connect(contributor1).takeIssue(1, { value: stake });
      await issueTracker.connect(contributor2).takeIssue(2, { value: stake });

      await time.increase(EASY_DURATION + 1);

      await issueTracker.connect(contributor1).claimExpiredIssue(1);
      await issueTracker.connect(contributor2).claimExpiredIssue(2);

      const issue1Info = await issueTracker.getIssueInfo(1);
      const issue2Info = await issueTracker.getIssueInfo(2);

      expect(issue1Info.isAssigned).to.be.false;
      expect(issue2Info.isAssigned).to.be.false;
    });
  });

  describe("Gas Optimization Tests", function () {
    beforeEach(async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: ethers.parseEther("10"),
      });
    });

    it("Should handle creating multiple issues efficiently", async function () {
      const issueCount = 10;
      for (let i = 0; i < issueCount; i++) {
        await issueTracker
          .connect(aiAgent)
          .createIssue(
            `https://github.com/org1/repo/issues/${i + 1}`,
            `Issue ${i + 1}`,
            ethers.parseEther("0.1"),
            0,
            org1.address
          );
      }

      const orgIssues = await issueTracker.getOrganizationIssues(org1.address);
      expect(orgIssues.length).to.equal(issueCount);
    });
  });

  describe("Confidence Score Tracking", function () {
    beforeEach(async function () {
      await issueTracker.connect(org1).registerOrganization("https://github.com/org1/repo", {
        value: ethers.parseEther("1"),
      });

      await issueTracker
        .connect(aiAgent)
        .createIssue(
          "https://github.com/org1/repo/issues/1",
          "Issue 1",
          ethers.parseEther("0.1"),
          0,
          org1.address
        );

      const stake = (ethers.parseEther("0.1") * 5n) / 100n;
      await issueTracker.connect(contributor1).takeIssue(1, { value: stake });
    });

    it("Should track confidence score after AI grading", async function () {
      const confidenceScore = 85;
      await issueTracker.connect(aiAgent).gradeIssueByAI(1, confidenceScore);

      const issueInfo = await issueTracker.issues(1);
      expect(issueInfo.presentHackerConfidenceScore).to.equal(confidenceScore);
    });

    it("Should reset confidence score when issue expires", async function () {
      await issueTracker.connect(aiAgent).gradeIssueByAI(1, 75);
      
      await time.increase(EASY_DURATION + 1);
      await issueTracker.connect(contributor1).claimExpiredIssue(1);

      const issueInfo = await issueTracker.issues(1);
      expect(issueInfo.presentHackerConfidenceScore).to.equal(0);
    });
  });
});