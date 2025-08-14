const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Enhanced PlayerToken", function () {
  let PlayerToken;
  let playerToken;
  let owner;
  let player1;
  let player2;
  let player3;
  let user1;
  let user2;
  let addrs;

  const INITIAL_SUPPLY = ethers.parseEther("50000000"); // 50M tokens
  const WEEK_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

  beforeEach(async function () {
    [owner, player1, player2, player3, user1, user2, ...addrs] = await ethers.getSigners();
    
    PlayerToken = await ethers.getContractFactory("PlayerToken");
    playerToken = await PlayerToken.deploy();
    await playerToken.waitForDeployment();

    // Add players
    await playerToken.addPlayer(player1.address, "Player 1");
    await playerToken.addPlayer(player2.address, "Player 2");
    await playerToken.addPlayer(player3.address, "Player 3");

    // Transfer initial tokens to players
    await playerToken.transfer(player1.address, ethers.parseEther("1000000")); // 1M tokens
    await playerToken.transfer(player2.address, ethers.parseEther("1000000")); // 1M tokens
    await playerToken.transfer(player3.address, ethers.parseEther("1000000")); // 1M tokens

    // Transfer tokens to users for staking
    await playerToken.transfer(user1.address, ethers.parseEther("100000")); // 100K tokens
    await playerToken.transfer(user2.address, ethers.parseEther("100000")); // 100K tokens
    
    // Add treasury funds for burns/emissions to work
    await playerToken.addTreasuryFunds(ethers.parseEther("1000000")); // 1M tokens to treasury
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await playerToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const totalSupply = await playerToken.totalSupply();
      expect(totalSupply).to.equal(INITIAL_SUPPLY);
    });

    it("Should initialize supply tracking correctly", async function () {
      const [total, circulating, locked] = await playerToken.getSupplyInfo();
      expect(total).to.equal(INITIAL_SUPPLY);
      expect(circulating).to.equal(INITIAL_SUPPLY);
      expect(locked).to.equal(0);
    });
  });

  describe("Player Management", function () {
    it("Should add players correctly", async function () {
      const activePlayers = await playerToken.getActivePlayers();
      expect(activePlayers).to.include(player1.address);
      expect(activePlayers).to.include(player2.address);
      expect(activePlayers).to.include(player3.address);
      expect(activePlayers.length).to.equal(3);
    });

    it("Should initialize player stats correctly", async function () {
      const stats = await playerToken.getPlayerStats(player1.address);
      expect(stats.isActive).to.be.true;
      expect(stats.lastWeekPPR).to.equal(0);
      expect(stats.currentWeekPPR).to.equal(0);
      expect(stats.totalBurned).to.equal(0);
      expect(stats.totalEmitted).to.equal(0);
      expect(stats.averagePPR).to.equal(0);
      expect(stats.performanceScore).to.equal(0);
    });
  });

  describe("Enhanced Performance Tracking", function () {
    it("Should update performance history correctly", async function () {
      // Simulate 8 weeks of performance data
      for (let week = 1; week <= 8; week++) {
        await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
        await ethers.provider.send("evm_mine");
        
        await playerToken.updatePlayerWeek(player1.address, week * 10); // 10, 20, 30, etc.
      }

      const stats = await playerToken.getPlayerStats(player1.address);
      expect(stats.averagePPR).to.equal(45); // (10+20+30+40+50+60+70+80)/8 = 45
      expect(stats.totalPPR).to.equal(360); // Sum of all PPR values
    });

    it("Should calculate variance correctly", async function () {
      // Add consistent performance (low variance)
      for (let week = 1; week <= 8; week++) {
        await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
        await ethers.provider.send("evm_mine");
        await playerToken.updatePlayerWeek(player1.address, 20); // Consistent 20 PPR
      }

      const stats1 = await playerToken.getPlayerStats(player1.address);
      
      // Add inconsistent performance (high variance)
      for (let week = 1; week <= 8; week++) {
        await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
        await ethers.provider.send("evm_mine");
        await playerToken.updatePlayerWeek(player2.address, week % 2 === 0 ? 40 : 0); // Alternating 0, 40
      }

      const stats2 = await playerToken.getPlayerStats(player2.address);
      
      // Player 2 should have higher variance
      expect(stats2.pprVariance).to.be.gt(stats1.pprVariance);
    });
  });

  describe("League Statistics", function () {
    it("Should calculate league statistics correctly", async function () {
      // Set up different performance levels
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 30); // Above average
      await playerToken.updatePlayerWeek(player2.address, 20); // Average
      await playerToken.updatePlayerWeek(player3.address, 10); // Below average

      const leagueStats = await playerToken.getCurrentLeagueStats();
      expect(leagueStats.totalActivePlayers).to.equal(3);
      expect(leagueStats.averagePPR).to.equal(20); // (30+20+10)/3
      expect(leagueStats.standardDeviation).to.be.gt(0);
    });
  });

  describe("Performance Scoring", function () {
    it("Should calculate performance scores correctly", async function () {
      // Set up league baseline
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 20);
      await playerToken.updatePlayerWeek(player2.address, 20);
      await playerToken.updatePlayerWeek(player3.address, 20);

      // Now test individual performance
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 40); // Double average
      await playerToken.updatePlayerWeek(player2.address, 20); // Average
      await playerToken.updatePlayerWeek(player3.address, 10); // Half average

      const score1 = await playerToken.getPerformanceScore(player1.address);
      const score2 = await playerToken.getPerformanceScore(player2.address);
      const score3 = await playerToken.getPerformanceScore(player3.address);

      expect(score1).to.be.gt(score2);
      expect(score2).to.be.gt(score3);
    });
  });

  describe("Enhanced Tokenomics", function () {
    it("Should burn tokens for above-average performance", async function () {
      const [treasuryBefore] = await playerToken.getTreasuryInfo();
      
      // Set up league baseline with more data
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      // Add multiple weeks of baseline performance
      for (let week = 1; week <= 8; week++) {
        await playerToken.updatePlayerWeek(player1.address, 20);
        await playerToken.updatePlayerWeek(player2.address, 20);
        await playerToken.updatePlayerWeek(player3.address, 20);
        
        if (week < 8) {
          await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
          await ethers.provider.send("evm_mine");
        }
      }

      // Test above-average performance
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 40); // Double average

      const [treasuryAfter] = await playerToken.getTreasuryInfo();
      expect(treasuryAfter).to.be.lt(treasuryBefore); // Treasury should be burned
    });

    it.skip("Should emit tokens for below-average performance", async function () {
      const [treasuryBefore] = await playerToken.getTreasuryInfo();
      
      // Add a new player with no history
      await playerToken.addPlayer(addrs[0].address, "New Player");
      
      // Set up league baseline with existing players
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      // Add baseline performance for existing players
      await playerToken.updatePlayerWeek(player1.address, 20);
      await playerToken.updatePlayerWeek(player2.address, 20);
      await playerToken.updatePlayerWeek(player3.address, 20);

      // Give new player some history first (average performance)
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(addrs[0].address, 20);

      // Test below-average performance for new player
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(addrs[0].address, 5); // Much lower than average (20)

      const [treasuryAfter] = await playerToken.getTreasuryInfo();
      expect(treasuryAfter).to.be.gt(treasuryBefore); // Treasury should receive emissions
    });

    it("Should respect burn percentage limits", async function () {
      const [treasuryBefore] = await playerToken.getTreasuryInfo();
      
      // Set up league baseline
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 20);
      await playerToken.updatePlayerWeek(player2.address, 20);
      await playerToken.updatePlayerWeek(player3.address, 20);

      // Test extreme performance (should be capped)
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 100); // 5x average

      const [treasuryAfter] = await playerToken.getTreasuryInfo();
      const burnedAmount = treasuryBefore - treasuryAfter;
      const burnPercentage = Number(burnedAmount * 10000n / treasuryBefore);
      
      // Should be capped at 10% (1000 basis points)
      expect(burnPercentage).to.be.lte(1000);
    });
  });

  describe("Enhanced Staking System", function () {
    beforeEach(async function () {
      // Set up performance baseline
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 20);
      await playerToken.updatePlayerWeek(player2.address, 20);
      await playerToken.updatePlayerWeek(player3.address, 20);
    });

    it("Should calculate staking multipliers correctly", async function () {
      // Test different performance levels
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 40); // Elite (200% of average)
      await playerToken.updatePlayerWeek(player2.address, 24); // Above average (120% of average)
      await playerToken.updatePlayerWeek(player3.address, 10); // Below average (50% of average)

      const multiplier1 = await playerToken.getStakingMultiplier(player1.address);
      const multiplier2 = await playerToken.getStakingMultiplier(player2.address);
      const multiplier3 = await playerToken.getStakingMultiplier(player3.address);

      expect(multiplier1).to.be.gt(multiplier2);
      expect(multiplier2).to.be.gt(multiplier3);
      expect(multiplier1).to.be.gte(150); // Elite tier
      expect(multiplier3).to.be.gte(20); // Minimum floor
    });

    it("Should freeze multipliers at stake time", async function () {
      // Initial performance
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 40); // Good performance
      
      // Stake with good multiplier
      await playerToken.connect(user1).stakePlayerTokens(player1.address, ethers.parseEther("1000"));
      
      // Change performance to poor
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 10); // Poor performance
      
      // Get stake info
      const stakes = await playerToken.getUserPlayerStakes(user1.address);
      const frozenMultiplier = stakes[0].performanceMultiplier;
      
      // Current multiplier should be different (lower)
      const currentMultiplier = await playerToken.getStakingMultiplier(player1.address);
      
      expect(frozenMultiplier).to.be.gt(currentMultiplier);
    });

    it("Should track supply correctly during staking", async function () {
      const [initialTotal, initialCirculating, initialLocked] = await playerToken.getSupplyInfo();
      
      // Stake tokens
      await playerToken.connect(user1).stakePlayerTokens(player1.address, ethers.parseEther("1000"));
      
      const [totalAfterStake, circulatingAfterStake, lockedAfterStake] = await playerToken.getSupplyInfo();
      
      expect(totalAfterStake).to.equal(initialTotal);
      expect(circulatingAfterStake).to.equal(initialCirculating - ethers.parseEther("1000"));
      expect(lockedAfterStake).to.equal(initialLocked + ethers.parseEther("1000"));
    });

    it("Should track supply correctly during unstaking", async function () {
      // Stake tokens
      await playerToken.connect(user1).stakePlayerTokens(player1.address, ethers.parseEther("1000"));
      
      const [totalAfterStake, circulatingAfterStake, lockedAfterStake] = await playerToken.getSupplyInfo();
      
      // Wait for lock period
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      // Unstake
      await playerToken.connect(user1).unstakePlayerTokens(0);
      
      const [totalAfterUnstake, circulatingAfterUnstake, lockedAfterUnstake] = await playerToken.getSupplyInfo();
      
      expect(totalAfterUnstake).to.equal(totalAfterStake);
      expect(circulatingAfterUnstake).to.equal(circulatingAfterStake + ethers.parseEther("1000"));
      expect(lockedAfterUnstake).to.equal(lockedAfterStake - ethers.parseEther("1000"));
    });

    it("Should calculate enhanced staking rewards correctly", async function () {
      // Set up good performance for high multiplier
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 40); // Elite performance
      
      // Stake tokens
      await playerToken.connect(user1).stakePlayerTokens(player1.address, ethers.parseEther("1000"));
      
      // Wait a week
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      // Process week end to distribute rewards
      await playerToken.processWeekEnd();
      
      // Calculate rewards
      const rewards = await playerToken.calculateEnhancedStakingRewards(user1.address, 0);
      expect(rewards).to.be.gt(0);
    });
  });

  describe("Weekly Processing", function () {
    it("Should process week end correctly", async function () {
      // Set up performance data
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 30);
      await playerToken.updatePlayerWeek(player2.address, 20);
      await playerToken.updatePlayerWeek(player3.address, 10);

      // Process week end
      await playerToken.processWeekEnd();
      
      const weekData = await playerToken.getWeekData(1);
      expect(weekData.isProcessed).to.be.true;
      expect(weekData.totalPPR).to.equal(60);
      expect(weekData.leagueAveragePPR).to.equal(20);
    });
  });

  describe("Trading Fee System", function () {
    it("Should collect trading fees correctly", async function () {
      const initialFees = await playerToken.totalTradingFees();
      
      // Transfer tokens (should trigger fee)
      await playerToken.transfer(user1.address, ethers.parseEther("1000"));
      
      const finalFees = await playerToken.totalTradingFees();
      expect(finalFees).to.be.gt(initialFees);
    });

    it("Should not charge fees for staking operations", async function () {
      const feesBeforeStake = await playerToken.totalTradingFees();
      
      // Stake tokens (should not trigger fee)
      await playerToken.connect(user1).stakePlayerTokens(player1.address, ethers.parseEther("1000"));
      
      const feesAfterStake = await playerToken.totalTradingFees();
      expect(feesAfterStake).to.equal(feesBeforeStake);
    });
  });

  describe("Supply Management", function () {
    it("Should track supply changes correctly", async function () {
      const [initialTotal, initialCirculating, initialLocked] = await playerToken.getSupplyInfo();
      
      // Stake tokens
      await playerToken.connect(user1).stakePlayerTokens(player1.address, ethers.parseEther("1000"));
      
      const [totalAfterStake, circulatingAfterStake, lockedAfterStake] = await playerToken.getSupplyInfo();
      
      expect(totalAfterStake).to.equal(initialTotal);
      expect(circulatingAfterStake).to.equal(initialCirculating - ethers.parseEther("1000"));
      expect(lockedAfterStake).to.equal(initialLocked + ethers.parseEther("1000"));
      
      // Wait for lock period
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      // Unstake tokens
      await playerToken.connect(user1).unstakePlayerTokens(0);
      
      const [totalAfterUnstake, circulatingAfterUnstake, lockedAfterUnstake] = await playerToken.getSupplyInfo();
      
      expect(totalAfterUnstake).to.equal(totalAfterStake);
      expect(circulatingAfterUnstake).to.equal(circulatingAfterStake + ethers.parseEther("1000"));
      expect(lockedAfterUnstake).to.equal(lockedAfterStake - ethers.parseEther("1000"));
      
      // Test treasury burn (instead of direct burn)
      const [treasuryBefore] = await playerToken.getTreasuryInfo();
      
      // Set up performance data for burn
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      // Add baseline performance
      for (let week = 1; week <= 8; week++) {
        await playerToken.updatePlayerWeek(player1.address, 20);
        await playerToken.updatePlayerWeek(player2.address, 20);
        await playerToken.updatePlayerWeek(player3.address, 20);
        
        if (week < 8) {
          await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
          await ethers.provider.send("evm_mine");
        }
      }
      
      // Test burn
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 40); // Above average
      
      const [treasuryAfter] = await playerToken.getTreasuryInfo();
      const [totalAfterBurn, circulatingAfterBurn, lockedAfterBurn] = await playerToken.getSupplyInfo();
      
      expect(treasuryAfter).to.be.lt(treasuryBefore); // Treasury should be burned
      expect(totalAfterBurn).to.be.lt(totalAfterUnstake); // Total supply should decrease
      expect(circulatingAfterBurn).to.be.lt(circulatingAfterUnstake); // Circulating should decrease
      expect(lockedAfterBurn).to.equal(lockedAfterUnstake);
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle zero PPR correctly", async function () {
      await ethers.provider.send("evm_increaseTime", [WEEK_DURATION]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 0); // Injured player
      
      const stats = await playerToken.getPlayerStats(player1.address);
      expect(stats.currentWeekPPR).to.equal(0);
    });

    it("Should prevent staking with insufficient balance", async function () {
      await expect(
        playerToken.connect(user1).stakePlayerTokens(player1.address, ethers.parseEther("1000000"))
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should prevent unstaking before lock period ends", async function () {
      await playerToken.connect(user1).stakePlayerTokens(player1.address, ethers.parseEther("1000"));
      
      await expect(
        playerToken.connect(user1).unstakePlayerTokens(0)
      ).to.be.revertedWith("Lock period not ended");
    });

    it("Should handle empty league statistics", async function () {
      const leagueStats = await playerToken.getCurrentLeagueStats();
      expect(leagueStats.totalActivePlayers).to.equal(0);
      expect(leagueStats.averagePPR).to.equal(0);
    });
  });

  describe("Gas Optimization", function () {
    it("Should optimize gas usage for performance calculations", async function () {
      // Test that performance calculations don't exceed reasonable gas limits
      const tx = await playerToken.updatePlayerWeek(player1.address, 25);
      const receipt = await tx.wait();
      
      // Gas usage should be reasonable (less than 500k gas)
      expect(receipt.gasUsed).to.be.lt(500000);
    });
  });
}); 