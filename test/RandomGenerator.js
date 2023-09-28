const { expect } = require ('chai');
const { ethers } = require ('hardhat');
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}


function waitTime(millisec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, millisec);
    })
}

describe('RandomGenerator', () => {
    let token,
        accounts,
        deployer,
        receiver
    
    beforeEach(async () => {
        const RandomGenerator = await ethers.getContractFactory('RandomGenerator')
        rg = await RandomGenerator.deploy() //1 hr, 10 blocks, 1 wei, 3% fee

        accounts = await ethers.getSigners()
        deployer = accounts[0]
    })
    
    describe('Coin Flip is 50/50 after 1000', () => {
        let transaction,
            result,
            randomResult,
            combinedResults
        beforeEach(async () => {

            combinedResults = ethers.BigNumber.from(0)
            console.log("\nSimulating random numbers...\n")
            for (let i = 0; i < 1000; i++) {
                transaction = await rg.connect(deployer).generateRandom();
                result = await transaction.wait()
                randomResult = ethers.BigNumber.from(await rg.result())
                combinedResults = combinedResults.add(randomResult)
                process.stdout.write(`${randomResult}`)
                //await waitTime(1000)
            }

            console.log(`\nFinal results: ${combinedResults}`)
        })
        it('Even coin flip within 3%', async () => {
            expect(combinedResults).to.be.within(470, 530)
        })
    })
})