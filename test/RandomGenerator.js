const { expect } = require ('chai');
const { ethers } = require ('hardhat');
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}
describe('RandomGenerator', () => {
    let token,
        accounts,
        deployer,
        receiver
    
    beforeEach(async () => {
        const RG = await ethers.getContractFactory('RandomGenerator')
        rg = await RG.deploy()

        accounts = await ethers.getSigners()
        emptyAddress = '0x0000000000000000000000000000000000000000'
        deployer = accounts[0]
        receiver = accounts[1]
        exchange = accounts[2]
    })
    
    describe('Deployment', () => {
        beforeEach(async () => {
            tx = await rg.connect(deployer).testRandom()
            result = await tx.wait()
            //console.log(result)
        })
        it('returns', async () => {
            //console.log(result)
            const latestBlockNumber = await hre.ethers.provider.getBlockNumber()
            const latestBlock = await hre.ethers.provider.getBlock(latestBlockNumber - 1)
            //console.log(latestBlock)
        })
    })
})