const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PlayerToken", function () {
  let playerToken;
  let owner;
  let addr1;
  let addr2;
  let player1;
  let player2;

  beforeEach(async function () {
    [owner, addr1, addr2, player1, player2] = await ethers.getSigners();
    
    const PlayerToken = await ethers.getContractFactory("PlayerToken");
    playerToken = await PlayerToken.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await playerToken.owner()).to.equal(owner.address);
    });

    it("Should have correct initial supply", async function () {
      const expectedSupply = ethers.parseEther("50000000");
      expect(await playerToken.totalSupply()).to.equal(expectedSupply);
    });

    it("Should start at week 1", async function () {
      expect(await playerToken.currentWeek()).to.equal(1);
    });
  });

  describe("Player Management", function () {
    it("Should add a new player", async function () {
      await playerToken.addPlayer(player1.address, "Test Player 1");
      const stats = await playerToken.getPlayerStats(player1.address);
      expect(stats.isActive).to.be.true;
      expect(stats.lastWeekPPR).to.equal(0);
      expect(stats.currentWeekPPR).to.equal(0);
    });

    it("Should not allow adding duplicate players", async function () {
      await playerToken.addPlayer(player1.address, "Test Player 1");
      await expect(
        playerToken.addPlayer(player1.address, "Test Player 1")
      ).to.be.revertedWith("Player already exists");
    });

    it("Should track active players", async function () {
      await playerToken.addPlayer(player1.address, "Test Player 1");
      await playerToken.addPlayer(player2.address, "Test Player 2");
      
      const activePlayers = await playerToken.getActivePlayers();
      expect(activePlayers).to.include(player1.address);
      expect(activePlayers).to.include(player2.address);
      expect(activePlayers.length).to.equal(2);
    });
  });

  describe("Improved Tokenomics", function () {
    beforeEach(async function () {
      await playerToken.addPlayer(player1.address, "Test Player 1");
      // Transfer some tokens to player1 for testing
      await playerToken.transfer(player1.address, ethers.parseEther("1000000"));
    });

    it("Should not change supply for 0 PPR (injured players)", async function () {
      const initialBalance = await playerToken.balanceOf(player1.address);
      
      // Advance time by 7 days
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 0);
      
      const finalBalance = await playerToken.balanceOf(player1.address);
      expect(finalBalance).to.equal(initialBalance);
    });

    it("Should burn tokens for good performance", async function () {
      const initialBalance = await playerToken.balanceOf(player1.address);
      
      // First week: 10 PPR
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 10);
      
      // Second week: 25 PPR (improvement of 15)
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 25);
      
      const finalBalance = await playerToken.balanceOf(player1.address);
      expect(finalBalance).to.be.lt(initialBalance); // Should be burned
      
      const stats = await playerToken.getPlayerStats(player1.address);
      expect(stats.totalBurned).to.be.gt(0);
    });

    it("Should emit tokens for bad performance", async function () {
      const initialBalance = await playerToken.balanceOf(player1.address);
      
      // First week: 100 PPR (very high performance)
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 100);
      
      // Second week: 10 PPR (large decline of 90)
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 10);
      
      const stats = await playerToken.getPlayerStats(player1.address);
      
      // Check that tokens were emitted (even if small amount)
      expect(stats.totalEmitted).to.be.gt(0);
    });

    it("Should scale burn/emission based on performance change", async function () {
      const initialBalance = await playerToken.balanceOf(player1.address);
      
      // First week: 10 PPR
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 10);
      
      // Small improvement: 15 PPR (5 point improvement)
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 15);
      const balanceAfterSmall = await playerToken.balanceOf(player1.address);
      
      // Large improvement: 100 PPR (85 point improvement)
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 100);
      const balanceAfterLarge = await playerToken.balanceOf(player1.address);
      
      // Both should burn tokens (good performance)
      expect(balanceAfterSmall).to.be.lt(initialBalance);
      expect(balanceAfterLarge).to.be.lt(balanceAfterSmall);
    });
  });

  describe("Player-Specific Staking", function () {
    beforeEach(async function () {
      await playerToken.addPlayer(player1.address, "Test Player 1");
      await playerToken.addPlayer(player2.address, "Test Player 2");
      
      // Transfer tokens to test users
      await playerToken.transfer(addr1.address, ethers.parseEther("1000000"));
      await playerToken.transfer(addr2.address, ethers.parseEther("1000000"));
    });

    it("Should allow staking player tokens", async function () {
      const stakeAmount = ethers.parseEther("1000");
      
      await playerToken.connect(addr1).stakePlayerTokens(player1.address, stakeAmount);
      
      const userStakes = await playerToken.getUserPlayerStakes(addr1.address);
      expect(userStakes.length).to.equal(1);
      expect(userStakes[0].player).to.equal(player1.address);
      expect(userStakes[0].amount).to.equal(stakeAmount);
      expect(userStakes[0].isActive).to.be.true;
      
      const playerTotalStaked = await playerToken.getPlayerTotalStaked(player1.address);
      expect(playerTotalStaked).to.equal(stakeAmount);
    });

    it("Should not allow staking for inactive players", async function () {
      const stakeAmount = ethers.parseEther("1000");
      
      await expect(
        playerToken.connect(addr1).stakePlayerTokens(addr2.address, stakeAmount)
      ).to.be.revertedWith("Player not found");
    });

    it("Should calculate performance multipliers correctly", async function () {
      // New player should have base multiplier
      let multiplier = await playerToken.getPerformanceMultiplier(player1.address);
      expect(multiplier).to.equal(100);
      
      // Good performance should increase multiplier
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 25);
      multiplier = await playerToken.getPerformanceMultiplier(player1.address);
      expect(multiplier).to.be.gt(100);
      
      // Bad performance should decrease multiplier
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 10);
      multiplier = await playerToken.getPerformanceMultiplier(player1.address);
      expect(multiplier).to.be.lt(100);
    });

    it("Should calculate staking rewards with performance multiplier", async function () {
      const stakeAmount = ethers.parseEther("1000");
      await playerToken.connect(addr1).stakePlayerTokens(player1.address, stakeAmount);
      
      // Set good performance
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 25);
      
      // Advance week
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.processWeekEnd();
      
      const rewards = await playerToken.calculatePlayerStakingRewards(addr1.address, 0);
      expect(rewards).to.be.gt(0);
    });

    it("Should not allow unstaking before lock period ends", async function () {
      const stakeAmount = ethers.parseEther("1000");
      await playerToken.connect(addr1).stakePlayerTokens(player1.address, stakeAmount);
      
      await expect(
        playerToken.connect(addr1).unstakePlayerTokens(0)
      ).to.be.revertedWith("Lock period not ended");
    });

    it("Should allow unstaking after lock period ends", async function () {
      const stakeAmount = ethers.parseEther("1000");
      const initialBalance = await playerToken.balanceOf(addr1.address);
      
      await playerToken.connect(addr1).stakePlayerTokens(player1.address, stakeAmount);
      
      // Advance time past lock period
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]); // 8 days
      await ethers.provider.send("evm_mine");
      
      await playerToken.connect(addr1).unstakePlayerTokens(0);
      
      const finalBalance = await playerToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance); // Should get tokens back
      
      const userStakes = await playerToken.getUserPlayerStakes(addr1.address);
      expect(userStakes[0].isActive).to.be.false;
    });

    it("Should allow claiming rewards", async function () {
      const stakeAmount = ethers.parseEther("1000");
      await playerToken.connect(addr1).stakePlayerTokens(player1.address, stakeAmount);
      
      // Advance week
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.processWeekEnd();
      
      const initialBalance = await playerToken.balanceOf(addr1.address);
      await playerToken.connect(addr1).claimPlayerRewards(0);
      const finalBalance = await playerToken.balanceOf(addr1.address);
      
      expect(finalBalance).to.be.gt(initialBalance); // Should receive rewards
    });
  });

  describe("Trading Fees", function () {
    beforeEach(async function () {
      await playerToken.addPlayer(player1.address, "Test Player 1");
      await playerToken.transfer(addr1.address, ethers.parseEther("1000000"));
    });

    it("Should collect 0.25% trading fee", async function () {
      const transferAmount = ethers.parseEther("1000");
      const expectedFee = transferAmount * 25n / 10000n; // 0.25%
      
      const initialFees = await playerToken.totalTradingFees();
      
      await playerToken.connect(addr1).transfer(addr2.address, transferAmount);
      
      const finalFees = await playerToken.totalTradingFees();
      expect(finalFees - initialFees).to.equal(expectedFee);
    });

    it("Should not charge fees for minting/burning", async function () {
      const initialFees = await playerToken.totalTradingFees();
      
      // Advance time and update player (this will mint tokens)
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 25);
      
      const feesAfterMinting = await playerToken.totalTradingFees();
      expect(feesAfterMinting).to.equal(initialFees);
    });
  });

  describe("Week Processing", function () {
    beforeEach(async function () {
      await playerToken.addPlayer(player1.address, "Test Player 1");
      await playerToken.addPlayer(player2.address, "Test Player 2");
    });

    it("Should not allow week updates before week duration", async function () {
      await expect(
        playerToken.updatePlayerWeek(player1.address, 25)
      ).to.be.revertedWith("Week not elapsed");
    });

    it("Should process week end correctly", async function () {
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 25);
      
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player2.address, 15);
      
      // Advance time
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.processWeekEnd();
      
      expect(await playerToken.currentWeek()).to.equal(2);
      
      const weekData = await playerToken.getWeekData(1);
      expect(weekData.isProcessed).to.be.true;
      expect(weekData.totalPPR).to.equal(40); // 25 + 15
    });

    it("Should not allow processing same week twice", async function () {
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 25);
      
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.processWeekEnd();
      
      // Check that we're now in week 2
      expect(await playerToken.currentWeek()).to.equal(2);
      
      // Try to process week 2 immediately - should fail because week hasn't elapsed
      await expect(
        playerToken.processWeekEnd()
      ).to.be.revertedWith("Week not elapsed");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to pause/unpause", async function () {
      await playerToken.pause();
      expect(await playerToken.paused()).to.be.true;
      
      await playerToken.unpause();
      expect(await playerToken.paused()).to.be.false;
    });

    it("Should allow owner to update market cap", async function () {
      await playerToken.addPlayer(player1.address, "Test Player 1");
      
      const newMarketCap = ethers.parseEther("1000000");
      await playerToken.updateMarketCap(player1.address, newMarketCap);
      
      const stats = await playerToken.getPlayerStats(player1.address);
      expect(stats.marketCap).to.equal(newMarketCap);
    });

    it("Should not allow non-owner to call admin functions", async function () {
      await expect(
        playerToken.connect(addr1).pause()
      ).to.be.revertedWithCustomError(playerToken, "OwnableUnauthorizedAccount");
      
      await expect(
        playerToken.connect(addr1).addPlayer(addr1.address, "Test")
      ).to.be.revertedWithCustomError(playerToken, "OwnableUnauthorizedAccount");
    });
  });
}); 