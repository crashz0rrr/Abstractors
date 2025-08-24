const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.ABSTRACT_RPC_URL);

const contracts = {
  ufoToken: { address: process.env.CONTRACT_UFO, name: 'UFO Token' },
  shipNFT: { address: process.env.CONTRACT_SHIP_NFT, name: 'Ship NFT' },
  stationNFT: { address: process.env.CONTRACT_STATION_NFT, name: 'Station NFT' },
  marketplace: { address: process.env.CONTRACT_MARKETPLACE, name: 'Marketplace' },
  packSale: { address: process.env.CONTRACT_PACK_SALE, name: 'Pack Sale' },
  rewardClaim: { address: process.env.CONTRACT_REWARD_CLAIM, name: 'Reward Claim' }
};

async function checkContract(contractInfo) {
  try {
    console.log(`\n🔍 Checking ${contractInfo.name} at ${contractInfo.address}`);
    
    // Check if contract exists by getting code
    const code = await provider.getCode(contractInfo.address);
    
    if (code === '0x') {
      console.log('❌ Contract does not exist at this address');
      return false;
    }
    
    console.log('✅ Contract exists');
    
    // Try to call a simple method
    try {
      const contract = new ethers.Contract(contractInfo.address, ['function name() view returns (string)'], provider);
      const name = await contract.name();
      console.log(`✅ Contract name: ${name}`);
      return true;
    } catch (error) {
      console.log('⚠️  Could not call name() method, but contract exists');
      return true;
    }
    
  } catch (error) {
    console.log('❌ Error checking contract:', error.message);
    return false;
  }
}

async function checkAllContracts() {
  console.log('🚀 Checking all contract connections...');
  console.log(`📡 Using RPC: ${process.env.ABSTRACT_RPC_URL}`);
  
  let allGood = true;
  
  for (const [key, contractInfo] of Object.entries(contracts)) {
    const isOk = await checkContract(contractInfo);
    if (!isOk) allGood = false;
  }
  
  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('🎉 All contracts are properly deployed and accessible!');
  } else {
    console.log('❌ Some contracts have issues. Please check your deployment.');
  }
}

checkAllContracts().catch(console.error);