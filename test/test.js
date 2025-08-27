const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🚀 SpaceGame Basic Tests", function () {
  let owner, user1, user2;
  let ufoToken, shipNFT, stationNFT, marketplace;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy basic contracts
    const AbstractorsToken = await ethers.getContractFactory("AbstractorsToken");
    ufoToken = await AbstractorsToken.deploy(ethers.utils.parseEther("1000000"));

    const ShipNFT = await ethers.getContractFactory("ShipNFT");
    shipNFT = await ShipNFT.deploy();

    const StationNFT = await ethers.getContractFactory("StationNFT");
    stationNFT = await StationNFT.deploy();

    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(ufoToken.address, shipNFT.address, stationNFT.address);

    // Distribute initial tokens
    const amount = ethers.utils.parseEther("1000");
    await ufoToken.transfer(user1.address, amount);
    await ufoToken.transfer(user2.address, amount);
  });

  describe("1. Basic Contract Functionality", function () {
    it("1.1 - UFO Token should work correctly", async function () {
      expect(await ufoToken.name()).to.equal("Abstractors Token");
      expect(await ufoToken.symbol()).to.equal("UFO");
      
      // Test burning
      const initialBalance = await ufoToken.balanceOf(user1.address);
      await ufoToken.connect(user1).burn(ethers.utils.parseEther("100"));
      expect(await ufoToken.balanceOf(user1.address)).to.equal(initialBalance.sub(ethers.utils.parseEther("100")));
    });

    it("1.2 - Should mint ships correctly", async function () {
      await shipNFT.connect(owner).mint(user1.address, 1, 1, 1000);
      expect(await shipNFT.ownerOf(1)).to.equal(user1.address);
      
      const ship = await shipNFT.ships(1);
      expect(ship.tier).to.equal(1);
      expect(ship.level).to.equal(1);
      expect(ship.basePower).to.equal(1000);
    });

    it("1.3 - Should mint stations correctly", async function () {
      await stationNFT.connect(owner).mint(user1.address, 2);
      expect(await stationNFT.ownerOf(1)).to.equal(user1.address);
      
      const station = await stationNFT.stations(1);
      expect(station.tier).to.equal(2);
      expect(station.boostPercent).to.equal(10);
    });
  });

  describe("2. Marketplace Basic Functions", function () {
    beforeEach(async function () {
      // Mint assets to user1
      await shipNFT.connect(owner).mint(user1.address, 1, 1, 1000);
      await stationNFT.connect(owner).mint(user1.address, 1);

      // Approve marketplace
      await shipNFT.connect(user1).approve(marketplace.address, 1);
      await stationNFT.connect(user1).approve(marketplace.address, 1);

      // Approve UFO tokens
      await ufoToken.connect(user2).approve(marketplace.address, ethers.utils.parseEther("1000"));
    });

    it("2.1 - Should list and buy a ship", async function () {
      // List ship
      const price = ethers.utils.parseEther("100");
      await marketplace.connect(user1).listShip(1, price);
      
      // Verify listing
      const listing = await marketplace.getListing(1);
      expect(listing.seller).to.equal(user1.address);
      expect(listing.price).to.equal(price);
      expect(listing.status).to.equal(0); // ACTIVE

      // Buy ship
      const initialBalance = await ufoToken.balanceOf(user2.address);
      await marketplace.connect(user2).buy(1);
      
      // Verify transfer
      expect(await shipNFT.ownerOf(1)).to.equal(user2.address);
      expect(await ufoToken.balanceOf(user2.address)).to.equal(initialBalance.sub(price));
    });

    it("2.2 - Should cancel a listing", async function () {
      const price = ethers.utils.parseEther("100");
      await marketplace.connect(user1).listShip(1, price);
      
      await marketplace.connect(user1).cancelListing(1);
      
      const listing = await marketplace.getListing(1);
      expect(listing.status).to.equal(2); // CANCELLED
    });
  });

  describe("3. PackSale Basic Functions", function () {
    let packSale;

    beforeEach(async function () {
      const PackSale = await ethers.getContractFactory("PackSale");
      packSale = await PackSale.deploy(ufoToken.address, shipNFT.address, stationNFT.address);
      
      // Transfer NFT ownership to packSale
      await shipNFT.transferOwnership(packSale.address);
      await stationNFT.transferOwnership(packSale.address);
      
      // Fund the PackSale contract with UFO tokens for bonuses
      await ufoToken.transfer(packSale.address, ethers.utils.parseEther("10000"));
      
      // Approve UFO tokens
      await ufoToken.connect(user1).approve(packSale.address, ethers.utils.parseEther("1000"));
    });

    it("3.1 - Should purchase a pack successfully", async function () {
      const initialBalance = await ufoToken.balanceOf(user1.address);
      const initialSupply = (await packSale.getPackInfo(0)).totalSupply; // PRESALE_BRONZE

      const tx = await packSale.connect(user1).purchasePack(0);
      
      // Check UFO balance (100 spent - 50 bonus = 50 net)
      expect(await ufoToken.balanceOf(user1.address)).to.equal(initialBalance.sub(ethers.utils.parseEther("50")));
      
      // Check supply increased
      expect((await packSale.getPackInfo(0)).totalSupply).to.equal(initialSupply + 1);
      
      // Check events
      await expect(tx).to.emit(packSale, "PackPurchased");
    });
  });

  describe("4. RewardClaim Basic Functions", function () {
    let rewardClaim;

    beforeEach(async function () {
      const RewardClaim = await ethers.getContractFactory("RewardClaim");
      rewardClaim = await RewardClaim.deploy(shipNFT.address, stationNFT.address, ufoToken.address);

      // Mint assets
      await shipNFT.connect(owner).mint(user1.address, 1, 1, 1000);
      await shipNFT.connect(owner).mint(user1.address, 2, 2, 1500);
      await stationNFT.connect(owner).mint(user1.address, 2);
      
      // Add rewardClaim as minter for UFO token
      await ufoToken.addMinter(rewardClaim.address);
    });

    // it("4.1 - Should calculate fleet power correctly", async function () {
    //   // Use a direct calculation instead of calling getStation which requires ownership
    //   const ship1Power = await shipNFT.fleetPower(1);
    //   const ship2Power = await shipNFT.fleetPower(2);
      
    //   // Station tier 2 gives 10% boost
    //   const totalFleetPower = (ship1Power + ship2Power) * 110 / 100;
      
    //   const calculatedFleetPower = await rewardClaim.getFleetPower(user1.address);
    //   expect(calculatedFleetPower).to.equal(totalFleetPower);
    // });
  });
});