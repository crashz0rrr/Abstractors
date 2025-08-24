// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ShipNFT is ERC721, ERC721Enumerable, Ownable {
    struct Ship {
        uint8 tier;
        uint8 level;
        uint256 basePower;
    }

    mapping(uint256 => Ship) public ships;

    event ShipMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint8 tier,
        uint8 level,
        uint256 basePower
    );
    event ShipUpgraded(uint256 indexed tokenId, uint8 newLevel);

    constructor() ERC721("Spacecraft", "SHIP") ERC721Enumerable() Ownable() {}

    function mint(
        address to,
        uint8 tier,
        uint8 level,
        uint256 basePower
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = totalSupply() + 1;
        _safeMint(to, tokenId);
        ships[tokenId] = Ship(tier, level, basePower);
        emit ShipMinted(to, tokenId, tier, level, basePower);
        return tokenId;
    }

    function upgrade(uint256 tokenId) public onlyOwner {
        require(ships[tokenId].level < 5, "Max level reached");
        ships[tokenId].level += 1;
        emit ShipUpgraded(tokenId, ships[tokenId].level);
    }

    function fleetPower(uint256 tokenId) public view returns (uint256) {
        Ship memory ship = ships[tokenId];
        uint256 multiplier = 100 + (ship.level - 1) * 25; // Level multipliers: 100, 125, 150, 175, 200
        return (ship.basePower * multiplier) / 100;
    }

    function getOwnedShips(
        address owner
    ) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokenIds;
    }

    // Only one _beforeTokenTransfer function
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    // Only one supportsInterface function
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
