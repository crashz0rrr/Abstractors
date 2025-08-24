const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment of SpaceGame contracts...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`📦 Deploying contracts with account: ${deployer.address}`);
  console.log(`💼 Account balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH\n`);

  // Deploy UFO Token
  console.log("🪙 Deploying UFO Token...");
  const AbstractorsToken = await ethers.getContractFactory("AbstractorsToken");
  const ufoToken = await AbstractorsToken.deploy(ethers.utils.parseEther("1000000"));
  await ufoToken.deployed();
  console.log(`✅ UFO Token deployed to: ${ufoToken.address}`);

  // Deploy ShipNFT
  console.log("🚀 Deploying ShipNFT...");
  const ShipNFT = await ethers.getContractFactory("ShipNFT");
  const shipNFT = await ShipNFT.deploy();
  await shipNFT.deployed();
  console.log(`✅ ShipNFT deployed to: ${shipNFT.address}`);

  // Deploy StationNFT
  console.log("🏭 Deploying StationNFT...");
  const StationNFT = await ethers.getContractFactory("StationNFT");
  const stationNFT = await StationNFT.deploy();
  await stationNFT.deployed();
  console.log(`✅ StationNFT deployed to: ${stationNFT.address}`);

  // Deploy RewardClaim
  console.log("🎯 Deploying RewardClaim...");
  const RewardClaim = await ethers.getContractFactory("RewardClaim");
  const rewardClaim = await RewardClaim.deploy(shipNFT.address, stationNFT.address, ufoToken.address);
  await rewardClaim.deployed();
  console.log(`✅ RewardClaim deployed to: ${rewardClaim.address}`);

  // Deploy Marketplace
  console.log("🛒 Deploying Marketplace...");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(ufoToken.address, shipNFT.address, stationNFT.address);
  await marketplace.deployed();
  console.log(`✅ Marketplace deployed to: ${marketplace.address}`);

  // Deploy PackSale
  console.log("📦 Deploying PackSale...");
  const PackSale = await ethers.getContractFactory("PackSale");
  const packSale = await PackSale.deploy(ufoToken.address, shipNFT.address, stationNFT.address);
  await packSale.deployed();
  console.log(`✅ PackSale deployed to: ${packSale.address}`);

  // Transfer NFT ownership to PackSale
  console.log("🔐 Transferring NFT ownership to PackSale...");
  await shipNFT.transferOwnership(packSale.address);
  await stationNFT.transferOwnership(packSale.address);
  console.log("✅ Ownership transferred successfully");

  // Summary
  console.log("\n🎉 Deployment Complete!");
  console.log("========================");
  console.log(`UFO Token: ${ufoToken.address}`);
  console.log(`ShipNFT: ${shipNFT.address}`);
  console.log(`StationNFT: ${stationNFT.address}`);
  console.log(`RewardClaim: ${rewardClaim.address}`);
  console.log(`Marketplace: ${marketplace.address}`);
  console.log(`PackSale: ${packSale.address}`);
  console.log("\n💰 Remember to fund the PackSale contract with UFO tokens for pack sales!");

  // Save addresses to a file for easy reference
  const addresses = {
    ufoToken: ufoToken.address,
    shipNFT: shipNFT.address,
    stationNFT: stationNFT.address,
    rewardClaim: rewardClaim.address,
    marketplace: marketplace.address,
    packSale: packSale.address,
    deployer: deployer.address
  };

  const fs = require('fs');
  fs.writeFileSync('deployment-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("\n📄 Deployment addresses saved to 'deployment-addresses.json'");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });