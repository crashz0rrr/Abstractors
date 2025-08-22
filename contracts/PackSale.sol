// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
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

    struct Pack {
        PackType packType;
        uint256 price;
        uint256 ufoBonus;
        ShipReward[] shipRewards;
        StationReward[] stationRewards;
        uint256 totalSupply;
        uint256 maxSupply;
        bool isActive;
    }

    struct ShipReward {
        uint8 tier;
        uint8 level;
        uint256 basePower;
        uint8 probability; // 0-100 percentage
    }

    struct StationReward {
        uint8 tier;
        uint8 probability; // 0-100 percentage
    }

    mapping(PackType => Pack) public packs;
    mapping(address => mapping(PackType => uint256)) public userPurchases;
    mapping(address => uint256) public totalPurchases;

    event PackPurchased(address indexed user, PackType packType, uint256 price);
    event ShipsMinted(address indexed user, uint256[] tokenIds);
    event StationsMinted(address indexed user, uint256[] tokenIds);
    event PackActivated(PackType packType, bool isActive);
    event PackSupplyUpdated(PackType packType, uint256 maxSupply);

    constructor(
        address _ufoToken,
        address _shipNFT,
        address _stationNFT
    ) Ownable(msg.sender) {
        ufoToken = AbstractorsToken(_ufoToken);
        shipNFT = ShipNFT(_shipNFT);
        stationNFT = StationNFT(_stationNFT);

        // Initialize presale packs
        _initializePacks();
    }

    function _initializePacks() internal {
        // Presale Bronze Pack
        packs[PackType.PRESALE_BRONZE] = Pack({
            packType: PackType.PRESALE_BRONZE,
            price: 100 ether, // 100 UFO tokens
            ufoBonus: 50 ether, // 50 UFO bonus
            shipRewards: _createShipRewards(new uint8[](2), new uint8[](2), new uint256[](2), new uint8[](2)),
            stationRewards: new StationReward[](0),
            totalSupply: 0,
            maxSupply: 1000,
            isActive: true
        });

        // Presale Silver Pack
        packs[PackType.PRESALE_SILVER] = Pack({
            packType: PackType.PRESALE_SILVER,
            price: 250 ether, // 250 UFO tokens
            ufoBonus: 150 ether, // 150 UFO bonus
            shipRewards: _createShipRewards(new uint8[](3), new uint8[](3), new uint256[](3), new uint8[](3)),
            stationRewards: new StationReward[](0),
            totalSupply: 0,
            maxSupply: 500,
            isActive: true
        });

        // Presale Gold Pack
        packs[PackType.PRESALE_GOLD] = Pack({
            packType: PackType.PRESALE_GOLD,
            price: 500 ether, // 500 UFO tokens
            ufoBonus: 350 ether, // 350 UFO bonus
            shipRewards: _createShipRewards(new uint8[](4), new uint8[](4), new uint256[](4), new uint8[](4)),
            stationRewards: new StationReward[](1),
            totalSupply: 0,
            maxSupply: 250,
            isActive: true
        });

        // Launch Basic Pack
        packs[PackType.LAUNCH_BASIC] = Pack({
            packType: PackType.LAUNCH_BASIC,
            price: 50 ether, // 50 UFO tokens
            ufoBonus: 0,
            shipRewards: _createShipRewards(new uint8[](1), new uint8[](1), new uint256[](1), new uint8[](1)),
            stationRewards: new StationReward[](0),
            totalSupply: 0,
            maxSupply: 5000,
            isActive: false // Will be activated at launch
        });

        // Launch Premium Pack
        packs[PackType.LAUNCH_PREMIUM] = Pack({
            packType: PackType.LAUNCH_PREMIUM,
            price: 150 ether, // 150 UFO tokens
            ufoBonus: 0,
            shipRewards: _createShipRewards(new uint8[](2), new uint8[](2), new uint256[](2), new uint8[](2)),
            stationRewards: new StationReward[](1),
            totalSupply: 0,
            maxSupply: 2000,
            isActive: false
        });

        // Launch Ultimate Pack
        packs[PackType.LAUNCH_ULTIMATE] = Pack({
            packType: PackType.LAUNCH_ULTIMATE,
            price: 300 ether, // 300 UFO tokens
            ufoBonus: 0,
            shipRewards: _createShipRewards(new uint8[](3), new uint8[](3), new uint256[](3), new uint8[](3)),
            stationRewards: new StationReward[](1),
            totalSupply: 0,
            maxSupply: 1000,
            isActive: false
        });

        // Set specific rewards for each pack (simplified for example)
        _setPresaleRewards();
    }

    function _createShipRewards(
        uint8[] memory tiers,
        uint8[] memory levels,
        uint256[] memory basePowers,
        uint8[] memory probabilities
    ) internal pure returns (ShipReward[] memory) {
        ShipReward[] memory rewards = new ShipReward[](tiers.length);
        for (uint256 i = 0; i < tiers.length; i++) {
            rewards[i] = ShipReward(tiers[i], levels[i], basePowers[i], probabilities[i]);
        }
        return rewards;
    }

    function _setPresaleRewards() internal {
        // Presale Bronze - 2x Tier 1 Ships
        packs[PackType.PRESALE_BRONZE].shipRewards[0] = ShipReward(1, 1, 1000, 100); // 100% chance
        packs[PackType.PRESALE_BRONZE].shipRewards[1] = ShipReward(1, 1, 1000, 100); // 100% chance

        // Presale Silver - 3x Tier 1-2 Ships
        packs[PackType.PRESALE_SILVER].shipRewards[0] = ShipReward(1, 1, 1000, 100);
        packs[PackType.PRESALE_SILVER].shipRewards[1] = ShipReward(1, 2, 1200, 80); // 80% chance
        packs[PackType.PRESALE_SILVER].shipRewards[2] = ShipReward(2, 1, 1500, 20); // 20% chance

        // Presale Gold - 4x Tier 1-3 Ships + Station
        packs[PackType.PRESALE_GOLD].shipRewards[0] = ShipReward(1, 2, 1200, 100);
        packs[PackType.PRESALE_GOLD].shipRewards[1] = ShipReward(2, 1, 1500, 100);
        packs[PackType.PRESALE_GOLD].shipRewards[2] = ShipReward(2, 2, 1800, 50);
        packs[PackType.PRESALE_GOLD].shipRewards[3] = ShipReward(3, 1, 2000, 10);
        packs[PackType.PRESALE_GOLD].stationRewards[0] = StationReward(1, 100); // 100% chance Tier 1 Station
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

        // Mint ships and stations
        uint256[] memory shipTokenIds = _mintShips(msg.sender, pack.shipRewards);
        uint256[] memory stationTokenIds = _mintStations(msg.sender, pack.stationRewards);

        // Update pack statistics
        pack.totalSupply++;
        userPurchases[msg.sender][packType]++;
        totalPurchases[msg.sender]++;

        emit PackPurchased(msg.sender, packType, pack.price);
        if (shipTokenIds.length > 0) {
            emit ShipsMinted(msg.sender, shipTokenIds);
        }
        if (stationTokenIds.length > 0) {
            emit StationsMinted(msg.sender, stationTokenIds);
        }
    }

    function _mintShips(address to, ShipReward[] memory rewards) internal returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](rewards.length);
        uint256 mintedCount = 0;

        for (uint256 i = 0; i < rewards.length; i++) {
            ShipReward memory reward = rewards[i];
            if (_shouldMint(reward.probability)) {
                uint256 tokenId = shipNFT.mint(to, reward.tier, reward.level, reward.basePower);
                tokenIds[mintedCount] = tokenId;
                mintedCount++;
            }
        }

        // Resize array to actual minted count
        uint256[] memory actualTokenIds = new uint256[](mintedCount);
        for (uint256 i = 0; i < mintedCount; i++) {
            actualTokenIds[i] = tokenIds[i];
        }

        return actualTokenIds;
    }

    function _mintStations(address to, StationReward[] memory rewards) internal returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](rewards.length);
        uint256 mintedCount = 0;

        for (uint256 i = 0; i < rewards.length; i++) {
            StationReward memory reward = rewards[i];
            if (_shouldMint(reward.probability)) {
                uint256 tokenId = stationNFT.mint(to, reward.tier);
                tokenIds[mintedCount] = tokenId;
                mintedCount++;
            }
        }

        // Resize array to actual minted count
        uint256[] memory actualTokenIds = new uint256[](mintedCount);
        for (uint256 i = 0; i < mintedCount; i++) {
            actualTokenIds[i] = tokenIds[i];
        }

        return actualTokenIds;
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

    function updatePackRewards(
        PackType packType,
        ShipReward[] memory newShipRewards,
        StationReward[] memory newStationRewards,
        uint256 newUfoBonus
    ) external onlyOwner {
        packs[packType].shipRewards = newShipRewards;
        packs[packType].stationRewards = newStationRewards;
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
            pack.shipRewards.length,
            pack.stationRewards.length
        );
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