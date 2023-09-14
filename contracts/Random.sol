// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Random {
    uint256 public globalModifier = 0;
    /*
    globalModifier is used to seed random numbers based
    on previous global events. With current implementation,
    globalModifier is equal to the previous random number
    created by the contract. The number is added to random
    seed before hashing to ensure that random number is unique.
    */

    //Return random seed from blockhash, calldata, and globalModifier
    function _random(uint256 _blockNum)
        internal
        returns (uint256)
    {
        uint256 _output =
            uint256(keccak256(abi.encodePacked((((_uint256SeedFromBlock(_blockNum) / 16) + (_uint256SeedFromCalldata() / 16))
            / 2)
            + (globalModifier) + uint256(uint160(msg.sender)))));
            //Seed from blockhash, calldata, and globalModifier

        globalModifier = _output / 16;
        //Include current output in seed for next output

        return(_output);
    }

    //Returns uint256 seed from current transaction calldata
    function _uint256SeedFromCalldata()
        pure
        internal
        returns (uint256)
    {
        return(uint256(keccak256(msg.data)));
        //Hash calldata and convert to uint256
    }

    //Returns uint256 seed from given blockhash
    function _uint256SeedFromBlock(uint256 _blockNum)
        view
        internal
        returns (uint256)
    {
        require(_blockNum < block.number, "Block number too high...");
        //The hash of the current block is always zero
        //Require that block number is less than current block

        return(uint256(blockhash(_blockNum)));
        //Convert block hash of seeded block number to uint256
    }
}
