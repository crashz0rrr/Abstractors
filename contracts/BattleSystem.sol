// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// BattleSystem.sol - New contract for spacecraft battles
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ShipNFT.sol";
import "./AbstractorsToken.sol";

contract BattleSystem is Ownable, ReentrancyGuard {
    ShipNFT public shipNFT;
    AbstractorsToken public ufoToken;
    
    enum BattleResult { WIN, LOSE, DRAW }
    enum BattleType { PVP, PVE }
    
    struct Battle {
        address attacker;
        address defender;
        uint256[] attackerShips;
        uint256[] defenderShips;
        uint256 battleTime;
        BattleResult result;
        uint256 reward;
        BattleType battleType;
        bool resolved;
    }
    
    mapping(uint256 => Battle) public battles;
    mapping(address => uint256) public lastBattleTime;
    mapping(address => uint256) public totalBattlesWon;
    mapping(address => uint256) public totalBattlesLost;
    
    uint256 public battleCooldown = 4 hours;
    uint256 public battleIdCounter;
    uint256 public baseBattleReward = 50 ether; // 50 UFO base reward
    
    event BattleStarted(uint256 battleId, address attacker, address defender, BattleType battleType);
    event BattleResolved(uint256 battleId, address winner, address loser, uint256 reward);
    
    constructor(address _shipNFT, address _ufoToken) {
        shipNFT = ShipNFT(_shipNFT);
        ufoToken = AbstractorsToken(_ufoToken);
    }
    
    function startPvPBattle(address defender, uint256[] calldata attackerShipIds) 
        external nonReentrant returns (uint256) {
        require(defender != msg.sender, "Cannot battle yourself");
        require(block.timestamp >= lastBattleTime[msg.sender] + battleCooldown, "Cooldown active");
        require(attackerShipIds.length > 0, "No ships selected");
        
        // Verify ownership of attacker ships
        for (uint i = 0; i < attackerShipIds.length; i++) {
            require(shipNFT.ownerOf(attackerShipIds[i]) == msg.sender, "Not ship owner");
        }
        
        battleIdCounter++;
        battles[battleIdCounter] = Battle({
            attacker: msg.sender,
            defender: defender,
            attackerShips: attackerShipIds,
            defenderShips: new uint256[](0), // Will be set by defender or system
            battleTime: block.timestamp,
            result: BattleResult.DRAW,
            reward: 0,
            battleType: BattleType.PVP,
            resolved: false
        });
        
        lastBattleTime[msg.sender] = block.timestamp;
        emit BattleStarted(battleIdCounter, msg.sender, defender, BattleType.PVP);
        
        return battleIdCounter;
    }
    
    function resolveBattle(uint256 battleId, uint256[] calldata defenderShipIds, uint256 attackerPower, uint256 defenderPower) 
        external onlyOwner {
        Battle storage battle = battles[battleId];
        require(!battle.resolved, "Battle already resolved");
        
        battle.defenderShips = defenderShipIds;
        battle.resolved = true;
        
        if (attackerPower > defenderPower) {
            battle.result = BattleResult.WIN;
            battle.reward = calculateBattleReward(attackerPower, defenderPower);
            
            // Award UFO tokens to winner
            ufoToken.mint(battle.attacker, battle.reward);
            
            totalBattlesWon[battle.attacker]++;
            totalBattlesLost[battle.defender]++;
            
            emit BattleResolved(battleId, battle.attacker, battle.defender, battle.reward);
        } else if (defenderPower > attackerPower) {
            battle.result = BattleResult.LOSE;
            
            totalBattlesWon[battle.defender]++;
            totalBattlesLost[battle.attacker]++;
            
            emit BattleResolved(battleId, battle.defender, battle.attacker, 0);
        } else {
            battle.result = BattleResult.DRAW;
            emit BattleResolved(battleId, address(0), address(0), 0);
        }
    }
    
    function calculateBattleReward(uint256 attackerPower, uint256 defenderPower) 
        internal view returns (uint256) {
        // Reward based on power difference with base reward
        uint256 powerDifference = attackerPower > defenderPower 
            ? attackerPower - defenderPower 
            : defenderPower - attackerPower;
            
        uint256 powerRatio = (powerDifference * 100) / (attackerPower + defenderPower);
        
        return baseBattleReward + (baseBattleReward * powerRatio) / 100;
    }
    
    function setBattleCooldown(uint256 newCooldown) external onlyOwner {
        battleCooldown = newCooldown;
    }
    
    function setBaseBattleReward(uint256 newReward) external onlyOwner {
        baseBattleReward = newReward;
    }
    
    function getUserBattleStats(address user) external view returns (
        uint256 wins, 
        uint256 losses, 
        uint256 nextBattleTime
    ) {
        wins = totalBattlesWon[user];
        losses = totalBattlesLost[user];
        nextBattleTime = lastBattleTime[user] + battleCooldown;
    }
}