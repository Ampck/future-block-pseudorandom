// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Uncomment this line to use console.log
import "hardhat/console.sol";
import "./Random.sol";

contract RandomGenerator is Random {
    uint256 public testint;

    function testRandom()
        public
    {
        /*
        In solidity, current block hash is always zero
        (because it has not been finalized yet)
        so we must only use block numbers LESS THAN current block number.
        in hardhat, the first transaction in a test script is mined
        in block number 2 so I am using the hash of block 1 for testing
        purposes. The hash on block 1 will still change due to the unix
        timestamp being included in block hash.
        */

        uint256 seed = 1; //block number 1
        uint256 range = 10; //numbers between 0-9

        testint = random(seed) % range; //generate random number
        console.log("Random 0-9: ", testint);
    }

    function random(uint256 _seed)
        view
        internal
        returns (uint256)
    {
        //convert block hash of seeded block number to uint256 and return
        return(uint256(blockhash(_seed)));
    }
}
