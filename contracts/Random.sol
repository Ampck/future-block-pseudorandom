// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Random {
    uint256 public globalModifier = 0;

    function _random(uint256 _blockNum)
        internal
        returns (uint256)
    {
        require(_blockNum < block.number);
        uint256 _output =
            uint256(keccak256(abi.encodePacked((((_uint256SeedFromBlock(_blockNum) / 16) + (_uint256SeedFromCalldata() / 16))
            / 2)
            + (globalModifier))));
            //seed from block hash and call data

        globalModifier = _output / 16;

        return(_output);
    }

    function _uint256SeedFromCalldata() 
        pure
        internal
        returns (uint256)
    {
        return(uint256(keccak256(msg.data)));
    }

    function _uint256SeedFromBlock(uint256 _blockNum)
        view
        internal
        returns (uint256)
    {
        //convert block hash of seeded block number to uint256 and return
        return(uint256(blockhash(_blockNum)));
    }
}
