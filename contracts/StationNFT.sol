// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StationNFT is ERC721Enumerable, Ownable {
    struct Station {
        uint8 tier;
        uint8 boostPercent;
    }

    mapping(uint256 => Station) public stations;

    event StationMinted(address indexed to, uint256 indexed tokenId, uint8 tier, uint8 boostPercent);

    constructor() ERC721("Mining Station", "STATION") ERC721Enumerable() Ownable(msg.sender) {}

    function mint(address to, uint8 tier) external onlyOwner returns (uint256) {
        uint256 tokenId = totalSupply() + 1;
        uint8 boostPercent = getBoostPercent(tier);
        _mint(to, tokenId);
        stations[tokenId] = Station(tier, boostPercent);
        emit StationMinted(to, tokenId, tier, boostPercent);
        return tokenId;
    }

    function getBoostPercent(uint8 tier) public pure returns (uint8) {
        if (tier == 1) return 7;
        if (tier == 2) return 10;
        if (tier == 3) return 14;
        if (tier == 4) return 20;
        return 0;
    }

    function getOwnedStations(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokenIds;
    }

    function onlyOwnerOf(uint256 tokenId) internal view returns (bool) {
        return ownerOf(tokenId) == msg.sender;
    }

    function getStation(uint256 tokenId) external view returns (Station memory) {
        require(onlyOwnerOf(tokenId), "Station does not exist");
        return stations[tokenId];
    }
}