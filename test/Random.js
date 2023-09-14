const { expect } = require ('chai');
const { ethers } = require ('hardhat');
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}
describe('Random', () => {
    let token,
        accounts,
        deployer,
        receiver
    
    beforeEach(async () => {
        const RANDOM = await ethers.getContractFactory('Random')
        random = await RANDOM.deploy()

        gm = await random.globalModifier()
        console.log("global modifier: " + gm)

        accounts = await ethers.getSigners()
        emptyAddress = '0x0000000000000000000000000000000000000000'
        deployer = accounts[0]
        receiver = accounts[1]
        exchange = accounts[2]
    })
    
    describe('Deployment', () => {
        beforeEach(async () => {
        })
        it('returns', async () => {
        })
    })
})