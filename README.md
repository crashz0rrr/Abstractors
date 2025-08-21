# Abstractors
# 🌌 Abstractors Game

**Abstractors** is a futuristic **Play-to-Earn Fleet Strategy Game** powered by a deflationary `$UFO` token economy.  
Players assemble **Stations** and **Ships (NFTs)** into Fleets, upgrade them with `$UFO`, and earn rewards in real-time based on **Fleet Power**.  
The project runs on an **EVM-compatible blockchain** with a **hybrid architecture**:  
- **On-chain** → ownership, upgrades, tokenomics, marketplace, reward claims.  
- **Off-chain** → Fleet Power calculations, hourly emissions, Merkle proof generation for scalable farming logic.  

---

## 📂 Project Structure

```
abstractors-game/
│
├── contracts/                # Solidity smart contracts
│   ├── AbstractorsToken.sol  # $UFO ERC20 with burn logic
│   ├── StationNFT.sol        # Station NFT with tiers
│   ├── ShipNFT.sol           # Ship NFT with tiers + levels
│   ├── Upgrade.sol           # Upgrade logic for NFTs
│   ├── Marketplace.sol       # Marketplace contract
│   ├── RewardClaim.sol       # Merkle-based claim contract
│   └── utils/                # Reusable contract libraries
│
├── backend/
│   ├── src/
│   │   ├── api/              # Express route handlers
│   │   ├── services/         # Business logic (Fleet, Rewards, Marketplace)
│   │   ├── workers/          # Emission worker (hourly reward distribution)
│   │   ├── utils/            # Blockchain + Merkle helpers
│   │   ├── config/           # Configuration (RPC, DB, tokenomics)
│   │   └── app.js            # Express app entry
│   ├── tests/                # Jest/Supertest backend tests
│   └── package.json
│
├── scripts/                  # Deployment scripts
│   └── deploy.js
│
├── test/                     # Hardhat smart contract tests
├── hardhat.config.js         # Hardhat setup
├── .env                      # Environment config (RPC, keys, DB, etc.)
└── README.md
```

---

## 🚀 Features

- **Fleet System**  
  - Stations (NFTs, tiers 1–4) buff Fleet Power.  
  - Ships (NFTs, tiers 1–5, levels 1–5) generate Fleet Power.  
  - Fleet Power determines emission share.  

- **Tokenomics ($UFO)**  
  - Fixed supply: 100M.  
  - ERC20 Burnable.  
  - 100% of marketplace fees are burned.  

- **Reward Farming**  
  - Hourly emissions (configurable).  
  - Player rewards = FleetPower% × Hourly Emission.  
  - Off-chain Merkle proofs ensure scalability.  

- **Marketplace**  
  - Decentralized NFT trading.  
  - `$UFO` as native currency.  
  - Fees burned → deflationary loop.  

- **Hybrid Architecture**  
  - **On-chain** → NFTs, upgrades, $UFO token, marketplace trades, claims.  
  - **Off-chain** → fleet calculations, Merkle proof generation, emission scheduling.  

---

## 🔧 Installation

### 1. Clone repo
```bash
git clone https://github.com/crashz0rrr/Abstractors.git
cd abstractors-game
```

### 2. Install Hardhat deps
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
```

### 3. Install Backend deps
```bash
cd backend
npm install express mongoose ethers dotenv config jest supertest keccak256 merkletreejs
```

---

## 🔐 Environment Setup

Create `.env` in root:

```ini
# --- Blockchain Deployment ---
PRIVATE_KEY=0xyourwalletprivatekey
RPC_URL=https://polygon-mumbai.infura.io/v3/YOUR_KEY
ETHERSCAN_API_KEY=your_polygonscan_key

# --- Backend ---
MONGO_URI=mongodb://localhost:27017/abstractors
PORT=4000
HOURLY_EMISSION=100000

# --- Contracts (auto-filled after deploy) ---
UFO_TOKEN_ADDRESS=
STATION_NFT_ADDRESS=
SHIP_NFT_ADDRESS=
REWARD_CONTRACT_ADDRESS=
MARKETPLACE_ADDRESS=
```

---

## 📜 Smart Contracts

### Compile
```bash
npx hardhat compile
```

### Deploy (example: Polygon Mumbai)
```bash
npx hardhat run scripts/deploy.js --network polygonMumbai
```

This generates `deployments.json` with contract addresses.  
Paste addresses into `.env` or `backend/src/config/default.json`.

### Verify (optional)
```bash
npx hardhat verify --network polygonMumbai <address>
```

---

## 🖥️ Backend

### Run locally
```bash
cd backend
npm run dev
```

### API Endpoints
- `GET /fleet/power/:wallet` → calculate Fleet Power.  
- `POST /rewards/claim` → claim rewards via Merkle proof.  
- `POST /stations/upgrade` → upgrade Station NFT (burn tokens).  
- `POST /ships/upgrade` → upgrade Ship NFT (burn tokens).  
- `POST /marketplace/list` → list NFT on marketplace.  

---

## ⚙️ Emissions Worker

A Node.js worker that:
- Runs hourly.  
- Calculates all Fleet Power shares.  
- Generates Merkle root + proofs.  
- Updates `RewardClaim` contract.  

Run manually:
```bash
node backend/src/workers/emissions.worker.js
```

In production, run with **cron** or **PM2**.

---

## 🧪 Testing

### Contracts (Hardhat)
```bash
npx hardhat test
```

### Backend (Jest + Supertest)
```bash
cd backend
npm run test
```

---

## 🌐 Deployment

- **Smart Contracts**: Deploy to Polygon / BNB Chain / Ethereum L2.  
- **Backend**:  
  - Deploy via Docker or PM2 on AWS/GCP/Render.  
  - Requires connection to MongoDB (Atlas or local).  
- **Worker**: Run as a cron job or separate PM2 process.  

---

## 📈 Roadmap

- ✅ Core Fleet + Stations + $UFO token.  
- ✅ Emission + Rewards system.  
- 🚧 Marketplace contract & APIs.  
- 🚧 PvE exploration + bonuses.  
- 🚧 PvP combat + staking tournaments.  

---

## 📜 License

MIT © 2025 Abstractors Team

