const { ethers } = require('ethers');
const SpaceGameABI = require('./abis/SpaceGame.json'); // Adjust path as needed

class ContractChecker {
  constructor(contractAddress, providerUrl, abi = SpaceGameABI) {
    this.contractAddress = contractAddress;
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
    this.contract = new ethers.Contract(contractAddress, abi, this.provider);
  }

  async checkContractBasics() {
    console.log('🔍 Checking SpaceGame Contract Basics\n');
    
    try {
      // Check contract exists
      const code = await this.provider.getCode(this.contractAddress);
      if (code === '0x') {
        throw new Error('No contract found at address');
      }
      console.log('✅ Contract deployed and accessible');

      // Get basic info
      const name = await this.contract.name();
      const symbol = await this.contract.symbol();
      console.log(`✅ Contract details: ${name} (${symbol})`);

      return true;
    } catch (error) {
      console.log(`❌ Contract basics check failed: ${error.message}`);
      return false;
    }
  }

  async checkGameFunctions() {
    console.log('\n🎮 Checking Game Functions\n');
    
    const functionsToCheck = [
      'getPlayerResources',
      'getPlayerShips',
      'getPlayerPlanets',
      'getMarketplaceListings'
    ];

    for (const funcName of functionsToCheck) {
      try {
        if (this.contract.interface.getFunction(funcName)) {
          console.log(`✅ ${funcName}: Function exists in ABI`);
        } else {
          console.log(`❌ ${funcName}: Function not found in ABI`);
        }
      } catch (error) {
        console.log(`❌ ${funcName}: Error checking function - ${error.message}`);
      }
    }
  }

  async checkPlayerData(playerAddress) {
    console.log(`\n👤 Checking Player Data for ${playerAddress}\n`);
    
    try {
      // Check if player exists
      const playerResources = await this.contract.getPlayerResources(playerAddress);
      console.log(`✅ Player resources: ${JSON.stringify(playerResources)}`);

      const playerShips = await this.contract.getPlayerShips(playerAddress);
      console.log(`✅ Player ships: ${playerShips.length} ships`);

      const playerPlanets = await this.contract.getPlayerPlanets(playerAddress);
      console.log(`✅ Player planets: ${playerPlanets.length} planets`);

      return true;
    } catch (error) {
      console.log(`❌ Player data check failed: ${error.message}`);
      return false;
    }
  }

  async checkMarketplace() {
    console.log('\n🛒 Checking Marketplace Functions\n');
    
    try {
      const listings = await this.contract.getMarketplaceListings();
      console.log(`✅ Marketplace listings: ${listings.length} active listings`);

      if (listings.length > 0) {
        const firstListing = listings[0];
        console.log(`   Sample listing: ID ${firstListing.id}, Price: ${ethers.utils.formatEther(firstListing.price)} ETH`);
      }

      return true;
    } catch (error) {
      console.log(`❌ Marketplace check failed: ${error.message}`);
      return false;
    }
  }

  async checkEvents() {
    console.log('\n📝 Checking Contract Events\n');
    
    const eventsToCheck = [
      'ShipPurchased',
      'PlanetColonized',
      'ResourceMined',
      'MarketplaceListingCreated'
    ];

    for (const eventName of eventsToCheck) {
      try {
        if (this.contract.interface.getEvent(eventName)) {
          console.log(`✅ ${eventName}: Event exists in ABI`);
        } else {
          console.log(`❌ ${eventName}: Event not found in ABI`);
        }
      } catch (error) {
        console.log(`❌ ${eventName}: Error checking event - ${error.message}`);
      }
    }
  }

  async runAllChecks(playerAddress = null) {
    console.log('🚀 Starting SpaceGame Contract Checks\n');
    
    const basicsOk = await this.checkContractBasics();
    if (!basicsOk) return false;

    await this.checkGameFunctions();
    
    if (playerAddress) {
      await this.checkPlayerData(playerAddress);
    }
    
    await this.checkMarketplace();
    await this.checkEvents();

    console.log('\n🎉 Contract checks completed!');
    return true;
  }
}

// Example usage
async function main() {
  // Configuration - update these values for your deployment
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const PROVIDER_URL = process.env.PROVIDER_URL || 'http://localhost:8545';
  const TEST_PLAYER = process.env.TEST_PLAYER || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  const checker = new ContractChecker(CONTRACT_ADDRESS, PROVIDER_URL);
  
  try {
    await checker.runAllChecks(TEST_PLAYER);
  } catch (error) {
    console.error('❌ Fatal error during contract checks:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ContractChecker;