// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./ShipNFT.sol";
import "./StationNFT.sol";
import "./AbstractorsToken.sol";

contract Presale is Ownable, ReentrancyGuard {
    AbstractorsToken public ufoToken;
    ShipNFT public shipNFT;
    StationNFT public stationNFT;

    enum SalePhase {
        SEED,       // Private investors - lowest price, whitelist only
        MARKETING,  // Content creators & early adopters - medium price
        PUBLIC      // General public - highest price
    }

    struct PhaseConfig {
        uint256 price;
        uint256 maxSupply;
        uint256 totalSold;
        uint256 individualCap;
        bool isActive;
        bytes32 merkleRoot; // For whitelist verification
    }

    struct PresalePack {
        uint8 shipTier;
        uint8 shipLevel;
        uint256 shipBasePower;
        uint8 stationTier;
        uint8 stationProbability;
    }

    mapping(SalePhase => PhaseConfig) public phaseConfigs;
    mapping(SalePhase => PresalePack) public phasePacks;
    mapping(address => mapping(SalePhase => uint256)) public userPurchases;
    mapping(address => bool) public whitelistManagers;

    event PhaseConfigUpdated(SalePhase phase, uint256 price, uint256 maxSupply, uint256 individualCap, bool isActive);
    event PresalePurchased(address indexed user, SalePhase phase, uint256 price, uint256 quantity);
    event ShipsMinted(address indexed user, uint256[] tokenIds);
    event StationsMinted(address indexed user, uint256[] tokenIds);
    event WhitelistManagerUpdated(address manager, bool isManager);

    constructor(address _ufoToken, address _shipNFT, address _stationNFT) {
        ufoToken = AbstractorsToken(_ufoToken);
        shipNFT = ShipNFT(_shipNFT);
        stationNFT = StationNFT(_stationNFT);
        _transferOwnership(msg.sender);

        // Initialize default phase configurations
        _initializePhases();
    }

    function _initializePhases() internal {
        // Seed Phase - Private investors
        phaseConfigs[SalePhase.SEED] = PhaseConfig({
            price: 50 ether,        // Lowest price
            maxSupply: 1000,
            totalSold: 0,
            individualCap: 5,       // Max 5 packs per address
            isActive: false,
            merkleRoot: bytes32(0)
        });

        // Marketing Phase - Early adopters
        phaseConfigs[SalePhase.MARKETING] = PhaseConfig({
            price: 100 ether,       // Medium price
            maxSupply: 5000,
            totalSold: 0,
            individualCap: 3,       // Max 3 packs per address
            isActive: false,
            merkleRoot: bytes32(0)
        });

        // Public Phase - General public
        phaseConfigs[SalePhase.PUBLIC] = PhaseConfig({
            price: 150 ether,       // Highest price
            maxSupply: 10000,
            totalSold: 0,
            individualCap: 2,       // Max 2 packs per address
            isActive: false,
            merkleRoot: bytes32(0)
        });

        // Initialize pack contents for each phase
        phasePacks[SalePhase.SEED] = PresalePack({
            shipTier: 2,
            shipLevel: 2,
            shipBasePower: 1500,
            stationTier: 1,
            stationProbability: 100  // 100% chance for station
        });

        phasePacks[SalePhase.MARKETING] = PresalePack({
            shipTier: 2,
            shipLevel: 1,
            shipBasePower: 1200,
            stationTier: 1,
            stationProbability: 80   // 80% chance for station
        });

        phasePacks[SalePhase.PUBLIC] = PresalePack({
            shipTier: 1,
            shipLevel: 2,
            shipBasePower: 1000,
            stationTier: 0,
            stationProbability: 50   // 50% chance for station
        });
    }

    function purchasePresale(
        SalePhase phase,
        uint256 quantity,
        bytes32[] calldata merkleProof
    ) external nonReentrant {
        PhaseConfig storage config = phaseConfigs[phase];
        PresalePack storage pack = phasePacks[phase];

        require(config.isActive, "Phase not active");
        require(quantity > 0, "Quantity must be > 0");
        require(config.totalSold + quantity <= config.maxSupply, "Exceeds phase supply");
        require(userPurchases[msg.sender][phase] + quantity <= config.individualCap, "Exceeds individual cap");

        // Verify whitelist for seed phase
        if (phase == SalePhase.SEED) {
            require(_verifyWhitelist(msg.sender, merkleProof, config.merkleRoot), "Not whitelisted for seed phase");
        }

        uint256 totalPrice = config.price * quantity;
        require(ufoToken.balanceOf(msg.sender) >= totalPrice, "Insufficient UFO balance");
        require(ufoToken.allowance(msg.sender, address(this)) >= totalPrice, "Insufficient allowance");

        // Transfer and burn UFO tokens
        require(ufoToken.transferFrom(msg.sender, address(this), totalPrice), "UFO transfer failed");
        ufoToken.burn(totalPrice);

        // Mint NFTs
        uint256[] memory shipTokenIds = new uint256[](quantity);
        uint256[] memory stationTokenIds = new uint256[](quantity);
        uint256 stationMintedCount = 0;

        for (uint256 i = 0; i < quantity; i++) {
            // Mint ship
            uint256 shipTokenId = shipNFT.mint(msg.sender, pack.shipTier, pack.shipLevel, pack.shipBasePower);
            shipTokenIds[i] = shipTokenId;

            // Mint station with probability
            if (_shouldMint(pack.stationProbability)) {
                uint256 stationTokenId = stationNFT.mint(msg.sender, pack.stationTier);
                stationTokenIds[stationMintedCount] = stationTokenId;
                stationMintedCount++;
            }
        }

        // Update counters
        config.totalSold += quantity;
        userPurchases[msg.sender][phase] += quantity;

        emit PresalePurchased(msg.sender, phase, config.price, quantity);

        // Emit mint events
        emit ShipsMinted(msg.sender, shipTokenIds);
        
        if (stationMintedCount > 0) {
            uint256[] memory actualStationTokenIds = new uint256[](stationMintedCount);
            for (uint256 i = 0; i < stationMintedCount; i++) {
                actualStationTokenIds[i] = stationTokenIds[i];
            }
            emit StationsMinted(msg.sender, actualStationTokenIds);
        }
    }

    function _verifyWhitelist(
        address account,
        bytes32[] calldata merkleProof,
        bytes32 merkleRoot
    ) internal pure returns (bool) {
        bytes32 node = keccak256(abi.encodePacked(account));
        return MerkleProof.verify(merkleProof, merkleRoot, node);
    }

    function _shouldMint(uint8 probability) internal view returns (bool) {
        if (probability == 100) return true;
        if (probability == 0) return false;
        
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 100;
        return random < probability;
    }

    // ADMIN FUNCTIONS

    function setPhaseConfig(
        SalePhase phase,
        uint256 price,
        uint256 maxSupply,
        uint256 individualCap,
        bool isActive,
        bytes32 merkleRoot
    ) external onlyOwner {
        PhaseConfig storage config = phaseConfigs[phase];
        config.price = price;
        config.maxSupply = maxSupply;
        config.individualCap = individualCap;
        config.isActive = isActive;
        config.merkleRoot = merkleRoot;

        emit PhaseConfigUpdated(phase, price, maxSupply, individualCap, isActive);
    }

    function setPackContents(
        SalePhase phase,
        uint8 shipTier,
        uint8 shipLevel,
        uint256 shipBasePower,
        uint8 stationTier,
        uint8 stationProbability
    ) external onlyOwner {
        PresalePack storage pack = phasePacks[phase];
        pack.shipTier = shipTier;
        pack.shipLevel = shipLevel;
        pack.shipBasePower = shipBasePower;
        pack.stationTier = stationTier;
        pack.stationProbability = stationProbability;
    }

    function setWhitelistManager(address manager, bool isManager) external onlyOwner {
        whitelistManagers[manager] = isManager;
        emit WhitelistManagerUpdated(manager, isManager);
    }

    function updateWhitelistRoot(SalePhase phase, bytes32 newRoot) external {
        require(msg.sender == owner() || whitelistManagers[msg.sender], "Not authorized");
        phaseConfigs[phase].merkleRoot = newRoot;
    }

    function withdrawUFO(uint256 amount) external onlyOwner {
        ufoToken.transfer(owner(), amount);
    }

    function getPhaseInfo(SalePhase phase) external view returns (
        uint256 price,
        uint256 maxSupply,
        uint256 totalSold,
        uint256 individualCap,
        bool isActive,
        uint256 remainingSupply
    ) {
        PhaseConfig storage config = phaseConfigs[phase];
        return (
            config.price,
            config.maxSupply,
            config.totalSold,
            config.individualCap,
            config.isActive,
            config.maxSupply - config.totalSold
        );
    }

    function getPackContents(SalePhase phase) external view returns (
        uint8 shipTier,
        uint8 shipLevel,
        uint256 shipBasePower,
        uint8 stationTier,
        uint8 stationProbability
    ) {
        PresalePack storage pack = phasePacks[phase];
        return (
            pack.shipTier,
            pack.shipLevel,
            pack.shipBasePower,
            pack.stationTier,
            pack.stationProbability
        );
    }

    function verifyWhitelist(
        SalePhase phase,
        address account,
        bytes32[] calldata merkleProof
    ) external view returns (bool) {
        return _verifyWhitelist(account, merkleProof, phaseConfigs[phase].merkleRoot);
    }
}