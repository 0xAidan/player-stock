const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PlayerToken", function () {
  let playerToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
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
  });

  describe("Player Management", function () {
    it("Should add a new player", async function () {
      await playerToken.addPlayer(addr1.address, "Test Player");
      const stats = await playerToken.getPlayerStats(addr1.address);
      expect(stats.isActive).to.be.true;
    });

    it("Should not allow adding duplicate players", async function () {
      await playerToken.addPlayer(addr1.address, "Test Player");
      await expect(
        playerToken.addPlayer(addr1.address, "Test Player")
      ).to.be.revertedWith("Player already exists");
    });
  });

  describe("Week Updates", function () {
    beforeEach(async function () {
      await playerToken.addPlayer(addr1.address, "Test Player");
    });

    it("Should update player stats", async function () {
      await playerToken.updatePlayerWeek(addr1.address, 25);
      const stats = await playerToken.getPlayerStats(addr1.address);
      expect(stats.currentWeekPPR).to.equal(25);
    });
  });
}); 