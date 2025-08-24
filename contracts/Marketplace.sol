// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ShipNFT.sol";
import "./StationNFT.sol";
import "./AbstractorsToken.sol";

contract Marketplace is ReentrancyGuard, Ownable {
    AbstractorsToken public ufoToken;
    ShipNFT public shipNFT;
    StationNFT public stationNFT;

    enum ListingType { SHIP, STATION }
    enum ListingStatus { ACTIVE, SOLD, CANCELLED }

    struct Listing {
        address seller;
        ListingType listingType;
        uint256 tokenId;
        uint256 price;
        ListingStatus status;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public listingCount;
    mapping(address => uint256[]) public userListings;

    event Listed(
        address indexed seller,
        uint256 indexed listingId,
        ListingType listingType,
        uint256 indexed tokenId,
        uint256 price
    );
    
    event Sold(
        address indexed seller,
        address indexed buyer,
        uint256 indexed listingId,
        ListingType listingType,
        uint256 tokenId,
        uint256 price
    );
    
    event Cancelled(
        address indexed seller,
        uint256 indexed listingId
    );

    constructor(
        address _ufoToken,
        address _shipNFT,
        address _stationNFT
    ) Ownable() {
        ufoToken = AbstractorsToken(_ufoToken);
        shipNFT = ShipNFT(_shipNFT);
        stationNFT = StationNFT(_stationNFT);
    }

    // List a ship for sale
    function listShip(uint256 tokenId, uint256 price) external nonReentrant {
        require(shipNFT.ownerOf(tokenId) == msg.sender, "Not owner of ship");
        require(price > 0, "Price must be greater than 0");
        require(shipNFT.getApproved(tokenId) == address(this) || 
                shipNFT.isApprovedForAll(msg.sender, address(this)), 
                "Marketplace not approved");

        listingCount++;
        listings[listingCount] = Listing({
            seller: msg.sender,
            listingType: ListingType.SHIP,
            tokenId: tokenId,
            price: price,
            status: ListingStatus.ACTIVE
        });

        userListings[msg.sender].push(listingCount);

        emit Listed(msg.sender, listingCount, ListingType.SHIP, tokenId, price);
    }

    // List a station for sale
    function listStation(uint256 tokenId, uint256 price) external nonReentrant {
        require(stationNFT.ownerOf(tokenId) == msg.sender, "Not owner of station");
        require(price > 0, "Price must be greater than 0");
        require(stationNFT.getApproved(tokenId) == address(this) || 
                stationNFT.isApprovedForAll(msg.sender, address(this)), 
                "Marketplace not approved");

        listingCount++;
        listings[listingCount] = Listing({
            seller: msg.sender,
            listingType: ListingType.STATION,
            tokenId: tokenId,
            price: price,
            status: ListingStatus.ACTIVE
        });

        userListings[msg.sender].push(listingCount);

        emit Listed(msg.sender, listingCount, ListingType.STATION, tokenId, price);
    }

    // Buy a listed item
    function buy(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(listing.seller != msg.sender, "Cannot buy your own listing");

        uint256 price = listing.price;
        require(ufoToken.balanceOf(msg.sender) >= price, "Insufficient UFO balance");
        require(ufoToken.allowance(msg.sender, address(this)) >= price, "Insufficient allowance");

        // Transfer UFO tokens from buyer to this contract (will be burned)
        require(ufoToken.transferFrom(msg.sender, address(this), price), "UFO transfer failed");
        
        // Burn the UFO tokens (100% burn)
        ufoToken.burn(price);

        // Transfer the NFT to the buyer
        if (listing.listingType == ListingType.SHIP) {
            shipNFT.transferFrom(listing.seller, msg.sender, listing.tokenId);
        } else {
            stationNFT.transferFrom(listing.seller, msg.sender, listing.tokenId);
        }

        listing.status = ListingStatus.SOLD;

        emit Sold(listing.seller, msg.sender, listingId, listing.listingType, listing.tokenId, price);
    }

    // Cancel a listing
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");

        listing.status = ListingStatus.CANCELLED;

        emit Cancelled(msg.sender, listingId);
    }

    // Get all active listings
    function getActiveListings() external view returns (Listing[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].status == ListingStatus.ACTIVE) {
                activeCount++;
            }
        }

        Listing[] memory activeListings = new Listing[](activeCount);
        uint256 currentIndex = 0;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].status == ListingStatus.ACTIVE) {
                activeListings[currentIndex] = listings[i];
                currentIndex++;
            }
        }
        return activeListings;
    }

    // Get user's listings
    function getUserListings(address user) external view returns (Listing[] memory) {
        uint256[] storage userListingIds = userListings[user];
        Listing[] memory userListingsResult = new Listing[](userListingIds.length);
        
        for (uint256 i = 0; i < userListingIds.length; i++) {
            userListingsResult[i] = listings[userListingIds[i]];
        }
        return userListingsResult;
    }

    // Get listing details by ID
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
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