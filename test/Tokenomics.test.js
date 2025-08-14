const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PlayerToken Tokenomics System", function () {
  let PlayerToken;
  let playerToken;
  let owner;
  let player1;
  let player2;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, player1, player2, user1, user2] = await ethers.getSigners();
    
    PlayerToken = await ethers.getContractFactory("PlayerToken");
    playerToken = await PlayerToken.deploy();
    await playerToken.deployed();
  });

  describe("Initial Setup", function () {
    it("Should have correct initial supply", async function () {
      const totalSupply = await playerToken.totalSupply();
      expect(totalSupply).to.equal(ethers.utils.parseEther("50000000")); // 50M tokens
    });

    it("Should have correct constants", async function () {
      expect(await playerToken.NFL_WEEK_DURATION()).to.equal(7 * 24 * 60 * 60); // 7 days
      expect(await playerToken.TRADING_FEE_BPS()).to.equal(25); // 0.25%
      expect(await playerToken.STAKING_REWARD_BPS()).to.equal(50); // 0.5%
      expect(await playerToken.MAX_BURN_RATE_BPS()).to.equal(100); // 1%
      expect(await playerToken.MIN_PPR_FOR_BURN()).to.equal(1);
    });
  });

  describe("Player Management", function () {
    it("Should add players correctly", async function () {
      await playerToken.addPlayer(player1.address, "Player 1");
      
      const stats = await playerToken.getPlayerStats(player1.address);
      expect(stats.isActive).to.be.true;
      expect(stats.lastWeekPPR).to.equal(0);
      expect(stats.currentWeekPPR).to.equal(0);
      
      const activePlayers = await playerToken.getActivePlayers();
      expect(activePlayers).to.include(player1.address);
    });

    it("Should not allow duplicate players", async function () {
      await playerToken.addPlayer(player1.address, "Player 1");
      
      await expect(
        playerToken.addPlayer(player1.address, "Player 1")
      ).to.be.revertedWith("Player already exists");
    });
  });

  describe("Burn Rate Calculations", function () {
    it("Should calculate burn rate correctly for different PPR values", async function () {
      // Test burn rate formula: min(1%, (pprPoints * 10) / 1000)
      
      // 10 PPR = 0.1% burn rate
      let burnRate = await playerToken.getBurnRateForPPR(10);
      expect(burnRate).to.equal(10); // 0.1%
      
      // 50 PPR = 0.5% burn rate
      burnRate = await playerToken.getBurnRateForPPR(50);
      expect(burnRate).to.equal(50); // 0.5%
      
      // 100 PPR = 1% burn rate (capped)
      burnRate = await playerToken.getBurnRateForPPR(100);
      expect(burnRate).to.equal(100); // 1%
      
      // 200 PPR = 1% burn rate (capped at max)
      burnRate = await playerToken.getBurnRateForPPR(200);
      expect(burnRate).to.equal(100); // 1% (capped)
      
      // 0 PPR = 0% burn rate (minimum threshold)
      burnRate = await playerToken.getBurnRateForPPR(0);
      expect(burnRate).to.equal(0);
    });
  });

  describe("Weekly Updates and Tokenomics", function () {
    beforeEach(async function () {
      await playerToken.addPlayer(player1.address, "Player 1");
      await playerToken.addPlayer(player2.address, "Player 2");
      
      // Transfer some tokens to players for testing
      await playerToken.transfer(player1.address, ethers.utils.parseEther("1000000"));
      await playerToken.transfer(player2.address, ethers.utils.parseEther("1000000"));
    });

    it("Should not allow weekly updates before week duration", async function () {
      await expect(
        playerToken.updatePlayerWeek(player1.address, 20)
      ).to.be.revertedWith("Week not elapsed");
    });

    it("Should handle good week performance (token burn)", async function () {
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");
      
      const initialSupply = await playerToken.totalSupply();
      const playerBalance = await playerToken.balanceOf(player1.address);
      
      // Player improves from 0 to 20 PPR (good week)
      await playerToken.updatePlayerWeek(player1.address, 20);
      
      const finalSupply = await playerToken.totalSupply();
      const finalBalance = await playerToken.balanceOf(player1.address);
      
      // Should burn tokens (supply decreases)
      expect(finalSupply).to.be.lt(initialSupply);
      expect(finalBalance).to.be.lt(playerBalance);
      
      const stats = await playerToken.getPlayerStats(player1.address);
      expect(stats.currentWeekPPR).to.equal(20);
      expect(stats.lastWeekPPR).to.equal(0);
      expect(stats.totalBurned).to.be.gt(0);
    });

    it("Should handle bad week performance (token emission)", async function () {
      // Set initial PPR
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 30);
      
      // Fast forward another week
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");
      
      const initialSupply = await playerToken.totalSupply();
      const playerBalance = await playerToken.balanceOf(player1.address);
      
      // Player declines from 30 to 10 PPR (bad week)
      await playerToken.updatePlayerWeek(player1.address, 10);
      
      const finalSupply = await playerToken.totalSupply();
      const finalBalance = await playerToken.balanceOf(player1.address);
      
      // Should emit tokens (supply increases)
      expect(finalSupply).to.be.gt(initialSupply);
      expect(finalBalance).to.be.gt(playerBalance);
      
      const stats = await playerToken.getPlayerStats(player1.address);
      expect(stats.currentWeekPPR).to.equal(10);
      expect(stats.lastWeekPPR).to.equal(30);
      expect(stats.totalEmitted).to.be.gt(0);
    });

    it("Should not burn/emit for 0 PPR (injured player protection)", async function () {
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");
      
      const initialSupply = await playerToken.totalSupply();
      const playerBalance = await playerToken.balanceOf(player1.address);
      
      // Player has 0 PPR (injured)
      await playerToken.updatePlayerWeek(player1.address, 0);
      
      const finalSupply = await playerToken.totalSupply();
      const finalBalance = await playerToken.balanceOf(player1.address);
      
      // No supply change
      expect(finalSupply).to.equal(initialSupply);
      expect(finalBalance).to.equal(playerBalance);
      
      const stats = await playerToken.getPlayerStats(player1.address);
      expect(stats.totalBurned).to.equal(0);
      expect(stats.totalEmitted).to.equal(0);
    });

    it("Should not burn for PPR below minimum threshold", async function () {
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");
      
      const initialSupply = await playerToken.totalSupply();
      
      // Player has 0.5 PPR (below minimum threshold)
      await playerToken.updatePlayerWeek(player1.address, 0);
      
      const finalSupply = await playerToken.totalSupply();
      
      // No supply change
      expect(finalSupply).to.equal(initialSupply);
    });
  });

  describe("Staking System", function () {
    beforeEach(async function () {
      // Transfer tokens to user for staking
      await playerToken.transfer(user1.address, ethers.utils.parseEther("100000"));
    });

    it("Should allow users to stake tokens", async function () {
      const stakeAmount = ethers.utils.parseEther("10000");
      
      await playerToken.connect(user1).stake(stakeAmount);
      
      const position = await playerToken.getStakingPosition(user1.address);
      expect(position.isActive).to.be.true;
      expect(position.amount).to.equal(stakeAmount);
      expect(position.startTime).to.be.gt(0);
      expect(position.lockEndTime).to.be.gt(position.startTime);
      
      const totalStaked = await playerToken.totalStaked();
      expect(totalStaked).to.equal(stakeAmount);
    });

    it("Should not allow staking 0 tokens", async function () {
      await expect(
        playerToken.connect(user1).stake(0)
      ).to.be.revertedWith("Cannot stake 0 tokens");
    });

    it("Should not allow staking more than balance", async function () {
      const balance = await playerToken.balanceOf(user1.address);
      const excessAmount = balance.add(ethers.utils.parseEther("1000"));
      
      await expect(
        playerToken.connect(user1).stake(excessAmount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should not allow unstaking before lock period ends", async function () {
      await playerToken.connect(user1).stake(ethers.utils.parseEther("10000"));
      
      await expect(
        playerToken.connect(user1).unstake()
      ).to.be.revertedWith("Lock period not ended");
    });

    it("Should allow unstaking after lock period ends", async function () {
      await playerToken.connect(user1).stake(ethers.utils.parseEther("10000"));
      
      // Fast forward past lock period
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");
      
      const initialBalance = await playerToken.balanceOf(user1.address);
      
      await playerToken.connect(user1).unstake();
      
      const finalBalance = await playerToken.balanceOf(user1.address);
      expect(finalBalance).to.be.gt(initialBalance); // Should return staked tokens
      
      const position = await playerToken.getStakingPosition(user1.address);
      expect(position.isActive).to.be.false;
    });
  });

  describe("Trading Fee System", function () {
    it("Should collect trading fees on transfers", async function () {
      const transferAmount = ethers.utils.parseEther("1000");
      const expectedFee = transferAmount.mul(25).div(10000); // 0.25%
      
      await playerToken.transfer(user1.address, transferAmount);
      
      const totalFees = await playerToken.totalTradingFees();
      expect(totalFees).to.equal(expectedFee);
    });

    it("Should not collect fees on minting/burning", async function () {
      const initialFees = await playerToken.totalTradingFees();
      
      // Add player and update week (involves minting/burning)
      await playerToken.addPlayer(player1.address, "Player 1");
      await playerToken.transfer(player1.address, ethers.utils.parseEther("1000000"));
      
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");
      await playerToken.updatePlayerWeek(player1.address, 20);
      
      const finalFees = await playerToken.totalTradingFees();
      expect(finalFees).to.equal(initialFees); // No additional fees from minting/burning
    });
  });

  describe("Week Processing", function () {
    beforeEach(async function () {
      await playerToken.addPlayer(player1.address, "Player 1");
      await playerToken.transfer(player1.address, ethers.utils.parseEther("1000000"));
      await playerToken.transfer(user1.address, ethers.utils.parseEther("100000"));
      await playerToken.connect(user1).stake(ethers.utils.parseEther("50000"));
    });

    it("Should process week end correctly", async function () {
      // Generate some trading fees
      await playerToken.transfer(user2.address, ethers.utils.parseEther("1000"));
      
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");
      
      const initialWeek = await playerToken.currentWeek();
      
      await playerToken.processWeekEnd();
      
      const finalWeek = await playerToken.currentWeek();
      expect(finalWeek).to.equal(initialWeek.add(1));
      
      const weekData = await playerToken.getWeekData(initialWeek);
      expect(weekData.isProcessed).to.be.true;
      expect(weekData.tradingFeesCollected).to.be.gt(0);
    });

    it("Should not allow processing week before duration elapsed", async function () {
      await expect(
        playerToken.processWeekEnd()
      ).to.be.revertedWith("Week not elapsed");
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete weekly cycle with multiple players", async function () {
      // Setup
      await playerToken.addPlayer(player1.address, "Player 1");
      await playerToken.addPlayer(player2.address, "Player 2");
      await playerToken.transfer(player1.address, ethers.utils.parseEther("1000000"));
      await playerToken.transfer(player2.address, ethers.utils.parseEther("1000000"));
      await playerToken.transfer(user1.address, ethers.utils.parseEther("100000"));
      await playerToken.connect(user1).stake(ethers.utils.parseEther("50000"));
      
      // Generate trading fees
      await playerToken.transfer(user2.address, ethers.utils.parseEther("1000"));
      
      // Week 1: Update players
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");
      
      await playerToken.updatePlayerWeek(player1.address, 25); // Good week
      await playerToken.updatePlayerWeek(player2.address, 5);  // Bad week
      
      // Process week
      await playerToken.processWeekEnd();
      
      // Verify results
      const week1Data = await playerToken.getWeekData(1);
      expect(week1Data.isProcessed).to.be.true;
      expect(week1Data.totalBurnAmount).to.be.gt(0);
      expect(week1Data.totalEmissionAmount).to.be.gt(0);
      
      const stats1 = await playerToken.getPlayerStats(player1.address);
      const stats2 = await playerToken.getPlayerStats(player2.address);
      expect(stats1.totalBurned).to.be.gt(0);
      expect(stats2.totalEmitted).to.be.gt(0);
    });
  });
}); 