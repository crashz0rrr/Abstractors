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

    uint256 public hourlyEmission = 100000 ether; // Example emission

    mapping(address => uint256) public lastClaim;

    constructor(address _shipNFT, address _stationNFT, address _ufoToken) Ownable(msg.sender) {
        shipNFT = ShipNFT(_shipNFT);
        stationNFT = StationNFT(_stationNFT);
        ufoToken = AbstractorsToken(_ufoToken);
    }

    function claimRewards() external {
        uint256 fleetPower = getFleetPower(msg.sender);
        uint256 totalFleetPower = getTotalFleetPower();
        require(totalFleetPower > 0, "No fleet power");
        uint256 share = hourlyEmission * fleetPower / totalFleetPower;
        ufoToken.transfer(msg.sender, share);
        lastClaim[msg.sender] = block.timestamp;
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
}