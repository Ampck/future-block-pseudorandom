// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Uncomment this line to use console.log
import "hardhat/console.sol";
import "./Random.sol";

contract RandomGenerator is Random {
    
    uint256 public result;

    function generateRandom()
    	public
    {
    	result = (_random(block.number - 1)) % 2;
    }
}
