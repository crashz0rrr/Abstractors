// scripts/deploy-with-config.js
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Starting deployment of Enhanced SpaceGame contracts...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`📦 Deploying contracts with account: ${deployer.address}`);
  console.log(`💼 Account balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH\n`);

  // Configuration values
  const config = {
    initialUFOSupply: ethers.utils.parseEther("1000000"), // 1M UFO
    baseEmissionRate: ethers.utils.parseEther("1"), // 1 UFO per hour per fleet power
    battleCooldown: 4 * 60 * 60, // 4 hours in seconds
    baseBattleReward: ethers.utils.parseEther("50"), // 50 UFO base reward
    packPrices: {
      presaleBronze: ethers.utils.parseEther("100"),
      presaleSilver: ethers.utils.parseEther("250"),
      presaleGold: ethers.utils.parseEther("500")
    }
  };

  // Deploy UFO Token
  console.log("🪙 Deploying UFO Token...");
  const AbstractorsToken = await ethers.getContractFactory("AbstractorsToken");
  const ufoToken = await AbstractorsToken.deploy(config.initialUFOSupply);
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

  // Deploy RewardClaim with config
  console.log("🎯 Deploying RewardClaim...");
  const RewardClaim = await ethers.getContractFactory("RewardClaim");
  const rewardClaim = await RewardClaim.deploy(shipNFT.address, stationNFT.address, ufoToken.address);
  await rewardClaim.deployed();
  console.log(`✅ RewardClaim deployed to: ${rewardClaim.address}`);
  
  // Set emission rate
  await rewardClaim.setBaseEmissionRate(config.baseEmissionRate);
  console.log("✅ Emission rate configured");

  // Deploy BattleSystem with config
  console.log("⚔️ Deploying BattleSystem...");
  const BattleSystem = await ethers.getContractFactory("BattleSystem");
  const battleSystem = await BattleSystem.deploy(shipNFT.address, ufoToken.address);
  await battleSystem.deployed();
  console.log(`✅ BattleSystem deployed to: ${battleSystem.address}`);
  
  // Set battle cooldown and reward
  await battleSystem.setBattleCooldown(config.battleCooldown);
  await battleSystem.setBaseBattleReward(config.baseBattleReward);
  console.log("✅ Battle system configured");

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

  // Deploy Presale
  console.log("🎫 Deploying Presale...");
  const Presale = await ethers.getContractFactory("Presale");
  const presale = await Presale.deploy(ufoToken.address, shipNFT.address, stationNFT.address);
  await presale.deployed();
  console.log(`✅ Presale deployed to: ${presale.address}`);

  // Configure NFT ownership
  console.log("🔐 Configuring NFT ownership...");
  await shipNFT.transferOwnership(packSale.address);
  await stationNFT.transferOwnership(packSale.address);
  
  // Add minters for UFO token
  await ufoToken.addMinter(rewardClaim.address);
  await ufoToken.addMinter(battleSystem.address);
  console.log("✅ Minter roles configured");

  // Save addresses to config file
  const addresses = {
    ufoToken: ufoToken.address,
    shipNFT: shipNFT.address,
    stationNFT: stationNFT.address,
    rewardClaim: rewardClaim.address,
    battleSystem: battleSystem.address,
    marketplace: marketplace.address,
    packSale: packSale.address,
    presale: presale.address,
    deployer: deployer.address,
    config: config
  };

  fs.writeFileSync('deployment-config.json', JSON.stringify({
    ...addresses,
    config: {
      initialUFOSupply: config.initialUFOSupply.toString(),
      baseEmissionRate: config.baseEmissionRate.toString(),
      battleCooldown: config.battleCooldown.toString(),
      baseBattleReward: config.baseBattleReward.toString(),
      packPrices: {
        presaleBronze: config.packPrices.presaleBronze.toString(),
        presaleSilver: config.packPrices.presaleSilver.toString(),
        presaleGold: config.packPrices.presaleGold.toString()
      }
    }
  }, null, 2));
  
  console.log("\n🎉 Deployment Complete!");
  console.log("========================");
  console.log(`UFO Token: ${ufoToken.address}`);
  console.log(`ShipNFT: ${shipNFT.address}`);
  console.log(`StationNFT: ${stationNFT.address}`);
  console.log(`RewardClaim: ${rewardClaim.address}`);
  console.log(`BattleSystem: ${battleSystem.address}`);
  console.log(`Marketplace: ${marketplace.address}`);
  console.log(`PackSale: ${packSale.address}`);
  console.log(`Presale: ${presale.address}`);
  console.log("\n📄 Configuration saved to 'deployment-config.json'");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });