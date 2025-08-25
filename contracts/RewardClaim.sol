// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ShipNFT.sol";
import "./StationNFT.sol";
import "./AbstractorsToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardClaim is Ownable {
    ShipNFT public shipNFT;
    StationNFT public stationNFT;
    AbstractorsToken public ufoToken;

    // Mining configuration
    uint256 public baseEmissionRate = 1000000000000000000; // 1 UFO per hour per fleet power
    uint256 public lastEmissionUpdate;
    uint256 public totalEmitted;
    
    // User mining data
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public totalClaimed;

    event RewardsClaimed(address indexed user, uint256 amount);
    event EmissionRateUpdated(uint256 newRate);

    constructor(address _shipNFT, address _stationNFT, address _ufoToken) {
        shipNFT = ShipNFT(_shipNFT);
        stationNFT = StationNFT(_stationNFT);
        ufoToken = AbstractorsToken(_ufoToken);
        lastEmissionUpdate = block.timestamp;
        _transferOwnership(msg.sender);
    }

    function claimRewards() external {
        uint256 userFleetPower = getFleetPower(msg.sender);
        require(userFleetPower > 0, "No fleet power to mine");
        
        uint256 timeSinceLastClaim = block.timestamp - lastClaimTime[msg.sender];
        require(timeSinceLastClaim >= 1 hours, "Can only claim once per hour");
        
        uint256 rewards = calculateRewards(msg.sender, timeSinceLastClaim);
        require(rewards > 0, "No rewards to claim");
        
        // Mint new tokens to user
        ufoToken.mint(msg.sender, rewards);
        
        lastClaimTime[msg.sender] = block.timestamp;
        totalClaimed[msg.sender] += rewards;
        totalEmitted += rewards;
        
        emit RewardsClaimed(msg.sender, rewards);
    }

    function calculateRewards(address user, uint256 timeElapsed) public view returns (uint256) {
        uint256 fleetPower = getFleetPower(user);
        uint256 baseRewards = (fleetPower * baseEmissionRate * timeElapsed) / 1 hours;
        return baseRewards;
    }

    function getFleetPower(address user) public view returns (uint256) {
        uint256[] memory shipIds = shipNFT.getOwnedShips(user);
        uint256 fleetPower = 0;
        
        for (uint256 i = 0; i < shipIds.length; i++) {
            fleetPower += shipNFT.fleetPower(shipIds[i]);
        }

        uint256[] memory stationIds = stationNFT.getOwnedStations(user);
        uint256 totalBoost = 0;
        
        for (uint256 i = 0; i < stationIds.length; i++) {
            StationNFT.Station memory station = stationNFT.getStation(stationIds[i]);
            totalBoost += station.boostPercent;
        }

        if (totalBoost > 0) {
            fleetPower = fleetPower + (fleetPower * totalBoost) / 100;
        }
        
        return fleetPower;
    }

    function getTotalFleetPower() public view returns (uint256) {
        uint256 totalFleetPower = 0;
        uint256 totalSupply = shipNFT.totalSupply();
        
        for (uint256 i = 1; i <= totalSupply; i++) {
            address owner = shipNFT.ownerOf(i);
            totalFleetPower += getFleetPower(owner);
        }
        
        return totalFleetPower;
    }

    function setBaseEmissionRate(uint256 newRate) external onlyOwner {
        baseEmissionRate = newRate;
        emit EmissionRateUpdated(newRate);
    }

    function getUserMiningStats(address user) external view returns (
        uint256 fleetPower,
        uint256 pendingRewards,
        uint256 nextClaimTime,
        uint256 totalEarned
    ) {
        fleetPower = getFleetPower(user);
        uint256 timeSinceLastClaim = block.timestamp - lastClaimTime[user];
        pendingRewards = calculateRewards(user, timeSinceLastClaim);
        nextClaimTime = lastClaimTime[user] + 1 hours;
        totalEarned = totalClaimed[user];
    }
}