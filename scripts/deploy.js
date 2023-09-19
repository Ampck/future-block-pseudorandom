const hre = require("hardhat");

async function main() {
  const CF = await hre.ethers.getContractFactory("CoinFlip")
  const cf = await CF.deploy(120, 2, 50, 3, 100) //120 seconds, 2 blocks, 50 wei, 3% fee
  await cf.deployed();

  console.log(cf.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
