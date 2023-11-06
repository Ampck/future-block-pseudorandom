Frontend: https://flat-base-8565.on.fleek.co/#/

Explanation Video: https://youtu.be/f6nAjYVHVis

# Future Block Pseudorandom

This project includes a pseudorandom number generator compatible with all EVM blockchains.

The following demonstration applications are also provided:
- CoinFlip.sol

To utilize pseudorandom functions in your smart contract, inherit from "Random"

# How does it work?

The solidity pseudorandom number generator uses a combination of a given block hash, the function calldata, the caller's address, and a modifier number based on the most recent random request globally to create a seed that can be used to generate random numbers.

# Implementation

The psuedorandom magic comes when you make the user confirm a decision, then wait a number of blocks before allowing execution of the decision.

If a user decides to send a random number of ETH between 1 and 10, the user finalizes their decision, then 'x' number of blocks later the smart contract decides a number based on a blockhash created 'x' blocks AFTER the user solidified their decision, making the result unpredictable at the time of decision.

NOTE: The block chosen must also be LESS THAN the current block, because "blockhash(block.number)"" will always return 0 in solidity because the current block has not yet been mined.

# Testing and Simulations

To test the validity of the pseudorandom number generator, run a simulation using the RandomGenerator hardhat test script with command "npx hardhat test test/RandomGenerator.js"

This simulates 1000 coin flips, and passes if 50% of results are heads (within a 3% tolerance)