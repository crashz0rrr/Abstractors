require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    abstractTestnet: {
      url: "https://api.testnet.abs.xyz",
      chainId: 11124,
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : []
    },
    abstractMainnet: {
      url: "https://api.mainnet.abs.xyz",
      chainId: 2741,
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : []
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : []
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
    customChains: [
      {
        network: "abstractTestnet",
        chainId: 11124,
        urls: {
          apiURL: "https://api-sepolia.abscan.org/api",
          browserURL: "https://sepolia.abscan.org"
        }
      },
      {
        network: "abstractMainnet",
        chainId: 2741,
        urls: {
          apiURL: "https://api.abscan.org/api",
          browserURL: "https://abscan.org"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD"
  }
};