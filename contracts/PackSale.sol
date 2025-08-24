// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ShipNFT.sol";
import "./StationNFT.sol";
import "./AbstractorsToken.sol";

contract PackSale is Ownable, ReentrancyGuard {
    AbstractorsToken public ufoToken;
    ShipNFT public shipNFT;
    StationNFT public stationNFT;

    enum PackType { 
        PRESALE_BRONZE, 
        PRESALE_SILVER, 
        PRESALE_GOLD, 
        LAUNCH_BASIC, 
        LAUNCH_PREMIUM, 
        LAUNCH_ULTIMATE 
    }

    struct ShipReward {
        uint8 tier;
        uint8 level;
        uint256 basePower;
        uint8 probability;
    }

    struct StationReward {
        uint8 tier;
        uint8 probability;
    }

    struct Pack {
        PackType packType;
        uint256 price;
        uint256 ufoBonus;
        uint256 totalSupply;
        uint256 maxSupply;
        bool isActive;
        uint256 shipRewardsCount;
        uint256 stationRewardsCount;
        mapping(uint256 => ShipReward) shipRewards;
        mapping(uint256 => StationReward) stationRewards;
    }

    mapping(PackType => Pack) public packs;
    mapping(address => mapping(PackType => uint256)) public userPurchases;
    mapping(address => uint256) public totalPurchases;

    event PackPurchased(address indexed user, PackType packType, uint256 price);
    event ShipsMinted(address indexed user, uint256[] tokenIds);
    event StationsMinted(address indexed user, uint256[] tokenIds);
    event PackActivated(PackType packType, bool isActive);
    event PackSupplyUpdated(PackType packType, uint256 maxSupply);

    constructor(address _ufoToken, address _shipNFT, address _stationNFT) {
        ufoToken = AbstractorsToken(_ufoToken);
        shipNFT = ShipNFT(_shipNFT);
        stationNFT = StationNFT(_stationNFT);
        _transferOwnership(msg.sender);

        // Initialize presale packs
        _initializePacks();
    }

    function _initializePacks() internal {
        // Presale Bronze Pack - 2 ships
        Pack storage bronze = packs[PackType.PRESALE_BRONZE];
        bronze.packType = PackType.PRESALE_BRONZE;
        bronze.price = 100 ether;
        bronze.ufoBonus = 50 ether;
        bronze.totalSupply = 0;
        bronze.maxSupply = 1000;
        bronze.isActive = true;
        bronze.shipRewardsCount = 2;
        bronze.stationRewardsCount = 0;
        
        bronze.shipRewards[0] = ShipReward(1, 1, 1000, 100);
        bronze.shipRewards[1] = ShipReward(1, 1, 1000, 100);

        // Presale Silver Pack - 3 ships
        Pack storage silver = packs[PackType.PRESALE_SILVER];
        silver.packType = PackType.PRESALE_SILVER;
        silver.price = 250 ether;
        silver.ufoBonus = 150 ether;
        silver.totalSupply = 0;
        silver.maxSupply = 500;
        silver.isActive = true;
        silver.shipRewardsCount = 3;
        silver.stationRewardsCount = 0;
        
        silver.shipRewards[0] = ShipReward(1, 1, 1000, 100);
        silver.shipRewards[1] = ShipReward(1, 2, 1200, 80);
        silver.shipRewards[2] = ShipReward(2, 1, 1500, 20);

        // Presale Gold Pack - 4 ships + 1 station
        Pack storage gold = packs[PackType.PRESALE_GOLD];
        gold.packType = PackType.PRESALE_GOLD;
        gold.price = 500 ether;
        gold.ufoBonus = 350 ether;
        gold.totalSupply = 0;
        gold.maxSupply = 250;
        gold.isActive = true;
        gold.shipRewardsCount = 4;
        gold.stationRewardsCount = 1;
        
        gold.shipRewards[0] = ShipReward(1, 2, 1200, 100);
        gold.shipRewards[1] = ShipReward(2, 1, 1500, 100);
        gold.shipRewards[2] = ShipReward(2, 2, 1800, 50);
        gold.shipRewards[3] = ShipReward(3, 1, 2000, 10);
        gold.stationRewards[0] = StationReward(1, 100);

        // Launch Basic Pack - 1 ship
        Pack storage basic = packs[PackType.LAUNCH_BASIC];
        basic.packType = PackType.LAUNCH_BASIC;
        basic.price = 50 ether;
        basic.ufoBonus = 0;
        basic.totalSupply = 0;
        basic.maxSupply = 5000;
        basic.isActive = false;
        basic.shipRewardsCount = 1;
        basic.stationRewardsCount = 0;
        
        basic.shipRewards[0] = ShipReward(1, 1, 1000, 100);

        // Launch Premium Pack - 2 ships + 1 station
        Pack storage premium = packs[PackType.LAUNCH_PREMIUM];
        premium.packType = PackType.LAUNCH_PREMIUM;
        premium.price = 150 ether;
        premium.ufoBonus = 0;
        premium.totalSupply = 0;
        premium.maxSupply = 2000;
        premium.isActive = false;
        premium.shipRewardsCount = 2;
        premium.stationRewardsCount = 1;
        
        premium.shipRewards[0] = ShipReward(1, 1, 1000, 100);
        premium.shipRewards[1] = ShipReward(1, 2, 1200, 80);
        premium.stationRewards[0] = StationReward(1, 100);

        // Launch Ultimate Pack - 3 ships + 1 station
        Pack storage ultimate = packs[PackType.LAUNCH_ULTIMATE];
        ultimate.packType = PackType.LAUNCH_ULTIMATE;
        ultimate.price = 300 ether;
        ultimate.ufoBonus = 0;
        ultimate.totalSupply = 0;
        ultimate.maxSupply = 1000;
        ultimate.isActive = false;
        ultimate.shipRewardsCount = 3;
        ultimate.stationRewardsCount = 1;
        
        ultimate.shipRewards[0] = ShipReward(1, 2, 1200, 100);
        ultimate.shipRewards[1] = ShipReward(2, 1, 1500, 80);
        ultimate.shipRewards[2] = ShipReward(2, 2, 1800, 50);
        ultimate.stationRewards[0] = StationReward(2, 100);
    }

    function purchasePack(PackType packType) external nonReentrant {
        Pack storage pack = packs[packType];
        require(pack.isActive, "Pack not active");
        require(pack.totalSupply < pack.maxSupply, "Pack sold out");
        require(ufoToken.balanceOf(msg.sender) >= pack.price, "Insufficient UFO balance");
        require(ufoToken.allowance(msg.sender, address(this)) >= pack.price, "Insufficient allowance");

        // Transfer UFO tokens
        require(ufoToken.transferFrom(msg.sender, address(this), pack.price), "UFO transfer failed");
        
        // Burn the UFO tokens (100% burn)
        ufoToken.burn(pack.price);

        // Mint bonus UFO if any
        if (pack.ufoBonus > 0) {
            ufoToken.transfer(msg.sender, pack.ufoBonus);
        }

        // Mint ships
        uint256[] memory shipTokenIds = new uint256[](pack.shipRewardsCount);
        uint256 shipMintedCount = 0;
        
        for (uint256 i = 0; i < pack.shipRewardsCount; i++) {
            ShipReward storage reward = pack.shipRewards[i];
            if (_shouldMint(reward.probability)) {
                uint256 tokenId = shipNFT.mint(msg.sender, reward.tier, reward.level, reward.basePower);
                shipTokenIds[shipMintedCount] = tokenId;
                shipMintedCount++;
            }
        }

        // Mint stations
        uint256[] memory stationTokenIds = new uint256[](pack.stationRewardsCount);
        uint256 stationMintedCount = 0;
        
        for (uint256 i = 0; i < pack.stationRewardsCount; i++) {
            StationReward storage reward = pack.stationRewards[i];
            if (_shouldMint(reward.probability)) {
                uint256 tokenId = stationNFT.mint(msg.sender, reward.tier);
                stationTokenIds[stationMintedCount] = tokenId;
                stationMintedCount++;
            }
        }

        // Update pack statistics
        pack.totalSupply++;
        userPurchases[msg.sender][packType]++;
        totalPurchases[msg.sender]++;

        emit PackPurchased(msg.sender, packType, pack.price);
        
        // Emit events with properly sized arrays
        if (shipMintedCount > 0) {
            uint256[] memory actualShipTokenIds = new uint256[](shipMintedCount);
            for (uint256 i = 0; i < shipMintedCount; i++) {
                actualShipTokenIds[i] = shipTokenIds[i];
            }
            emit ShipsMinted(msg.sender, actualShipTokenIds);
        }
        
        if (stationMintedCount > 0) {
            uint256[] memory actualStationTokenIds = new uint256[](stationMintedCount);
            for (uint256 i = 0; i < stationMintedCount; i++) {
                actualStationTokenIds[i] = stationTokenIds[i];
            }
            emit StationsMinted(msg.sender, actualStationTokenIds);
        }
    }

    function _shouldMint(uint8 probability) internal view returns (bool) {
        if (probability == 100) return true;
        if (probability == 0) return false;
        
        // Generate pseudo-random number between 0-99
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 100;
        return random < probability;
    }

    // Admin functions
    function setPackActive(PackType packType, bool isActive) external onlyOwner {
        packs[packType].isActive = isActive;
        emit PackActivated(packType, isActive);
    }

    function setPackMaxSupply(PackType packType, uint256 maxSupply) external onlyOwner {
        require(maxSupply >= packs[packType].totalSupply, "Max supply cannot be less than current supply");
        packs[packType].maxSupply = maxSupply;
        emit PackSupplyUpdated(packType, maxSupply);
    }

    function updatePackPrice(PackType packType, uint256 newPrice) external onlyOwner {
        packs[packType].price = newPrice;
    }

    function updateShipReward(PackType packType, uint256 rewardIndex, ShipReward memory newReward) external onlyOwner {
        require(rewardIndex < packs[packType].shipRewardsCount, "Invalid reward index");
        packs[packType].shipRewards[rewardIndex] = newReward;
    }

    function updateStationReward(PackType packType, uint256 rewardIndex, StationReward memory newReward) external onlyOwner {
        require(rewardIndex < packs[packType].stationRewardsCount, "Invalid reward index");
        packs[packType].stationRewards[rewardIndex] = newReward;
    }

    function updatePackUfoBonus(PackType packType, uint256 newUfoBonus) external onlyOwner {
        packs[packType].ufoBonus = newUfoBonus;
    }

    function getPackInfo(PackType packType) external view returns (
        uint256 price,
        uint256 ufoBonus,
        uint256 totalSupply,
        uint256 maxSupply,
        bool isActive,
        uint256 shipRewardCount,
        uint256 stationRewardCount
    ) {
        Pack storage pack = packs[packType];
        return (
            pack.price,
            pack.ufoBonus,
            pack.totalSupply,
            pack.maxSupply,
            pack.isActive,
            pack.shipRewardsCount,
            pack.stationRewardsCount
        );
    }

    function getShipReward(PackType packType, uint256 index) external view returns (ShipReward memory) {
        require(index < packs[packType].shipRewardsCount, "Invalid index");
        return packs[packType].shipRewards[index];
    }

    function getStationReward(PackType packType, uint256 index) external view returns (StationReward memory) {
        require(index < packs[packType].stationRewardsCount, "Invalid index");
        return packs[packType].stationRewards[index];
    }

    function getUserPackPurchases(address user) external view returns (uint256[6] memory) {
        return [
            userPurchases[user][PackType.PRESALE_BRONZE],
            userPurchases[user][PackType.PRESALE_SILVER],
            userPurchases[user][PackType.PRESALE_GOLD],
            userPurchases[user][PackType.LAUNCH_BASIC],
            userPurchases[user][PackType.LAUNCH_PREMIUM],
            userPurchases[user][PackType.LAUNCH_ULTIMATE]
        ];
    }

    // Emergency function to rescue any accidentally sent tokens (except UFO)
    function rescueTokens(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(ufoToken), "Cannot rescue UFO tokens");
        IERC20(tokenAddress).transfer(owner(), amount);
    }

    // Emergency function to rescue any accidentally sent ETH
    function rescueETH(uint256 amount) external onlyOwner {
        payable(owner()).transfer(amount);
    }
}