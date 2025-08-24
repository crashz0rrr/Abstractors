const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SpaceGame Contracts", function () {
  let owner, user1, user2;
  let ufoToken, shipNFT, stationNFT, rewardClaim, marketplace, packSale;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy UFO Token
    const AbstractorsToken = await ethers.getContractFactory("AbstractorsToken");
    ufoToken = await AbstractorsToken.deploy(ethers.utils.parseEther("1000000"));
    
    // Deploy ShipNFT
    const ShipNFT = await ethers.getContractFactory("ShipNFT");
    shipNFT = await ShipNFT.deploy();
    
    // Deploy StationNFT
    const StationNFT = await ethers.getContractFactory("StationNFT");
    stationNFT = await StationNFT.deploy();
    
    // Deploy RewardClaim
    const RewardClaim = await ethers.getContractFactory("RewardClaim");
    rewardClaim = await RewardClaim.deploy(shipNFT.address, stationNFT.address, ufoToken.address);
    
    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(ufoToken.address, shipNFT.address, stationNFT.address);
    
    // Deploy PackSale
    const PackSale = await ethers.getContractFactory("PackSale");
    packSale = await PackSale.deploy(ufoToken.address, shipNFT.address, stationNFT.address);

    // Transfer ownership
    await shipNFT.transferOwnership(packSale.address);
    await stationNFT.transferOwnership(packSale.address);
  });

  describe("UFO Token", function () {
    it("Should have correct name and symbol", async function () {
      expect(await ufoToken.name()).to.equal("Abstractors Token");
      expect(await ufoToken.symbol()).to.equal("UFO");
    });

    it("Should have initial supply", async function () {
      expect(await ufoToken.totalSupply()).to.equal(ethers.utils.parseEther("1000000"));
    });
  });

  describe("ShipNFT", function () {
    it("Should have correct name and symbol", async function () {
      expect(await shipNFT.name()).to.equal("Spacecraft");
      expect(await shipNFT.symbol()).to.equal("SHIP");
    });
  });

  describe("StationNFT", function () {
    it("Should have correct name and symbol", async function () {
      expect(await stationNFT.name()).to.equal("Mining Station");
      expect(await stationNFT.symbol()).to.equal("STATION");
    });
  });
});