// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AbstractorsToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("Abstractors Token", "UFO") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}