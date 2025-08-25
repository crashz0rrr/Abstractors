// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AbstractorsToken is ERC20, Ownable {
    mapping(address => bool) public minters;

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    constructor(uint256 initialSupply) ERC20("Abstractors Token", "UFO") Ownable() {
        _mint(msg.sender, initialSupply);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function mint(address to, uint256 amount) external {
        require(minters[msg.sender], "Only minters can mint");
        _mint(to, amount);
    }

    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
}