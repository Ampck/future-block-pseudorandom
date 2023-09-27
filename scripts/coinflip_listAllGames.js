const hre = require("hardhat");

async function main() {
    let totalGames

    const cf = await hre.ethers.getContractAt("CoinFlip", "0x5FbDB2315678afecb367f032d93F642f64180aa3")
    console.log(cf.address)

    totalGames = await cf.totalGames();

    for (let i = totalGames; i > 0; i--) {
        console.log(await cf.games(i))
    }
    console.log(`\n\n\nTotal Games: ${totalGames}`);
    console.log(`Contract balance: ${await ethers.provider.getBalance("0x5FbDB2315678afecb367f032d93F642f64180aa3")}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
