const hre = require("hardhat");

async function main() {
  const CF = await hre.ethers.getContractFactory("CoinFlip")
  const cf = await CF.deploy(10, 100000000000000, 3, 100) //2 blocks, 100000000000000 wei, 3% fee
  await cf.deployed();

  console.log(cf.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
