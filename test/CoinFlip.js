const { expect } = require ('chai');
const { ethers } = require ('hardhat');
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}
describe('CoinFlip', () => {
    let token,
        accounts,
        deployer,
        receiver,
        tx
    
    beforeEach(async () => {
        const CF = await ethers.getContractFactory('CoinFlip')
        cf = await CF.deploy(3600, 1, 33, 1) //1 hr, 3%, 1 wei

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