# Future Block Pseudorandom

This project includes a pseudorandom number generator compatible with all EVM blockchains.

The following demonstration applications are also provided:
- Coin Flip

To utilize pseudorandom functions in your smart contract, import "Random.sol" into your solidity file and create the desired contract with "is Random"

# How does it work?

The solidity pseudorandom number generator uses a combination of a given block hash, the function calldata, the caller's address, and a modifier number based on the most recent random request globally to create a seed that can be used to generate random numbers.

# Implementation

The psuedorandom magic comes when you make the user confirm a decision, then wait a number of blocks before allowing execution of the decision.

If a user decides to send a random number of ETH between 1 and 10, the user finalizes their decision, then 'x' number of blocks later the smart contract decides a number based on a blockhash created 'x' blocks AFTER the user solidified their decision, making the result unpredictable at the time of decision.

NOTE: Developer must implement an incentive mechanism to finalize undesirable outcomes.

NOTE: The block chosen must also be LESS THAN the current block, because blockhash(block.number) will always return 0 in solidity because the current block has not yet been mined.