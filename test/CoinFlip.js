const { expect } = require ('chai');
const { ethers } = require ('hardhat');
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

//Global data to test against
const COMPLETION_DELAY = 10;
const MINIMUM_BET = ethers.BigNumber.from(10000);
const FEE_NUMERATOR = 256;
const FEE_DENOMINATOR = 1000;

describe('CoinFlip', () => {
    let token,
        accounts,
        deployer,
        creator,
        challenger,
        finalizer

    beforeEach(async () => {
        const CoinFlip = await ethers.getContractFactory('CoinFlip')
        coinflip = await CoinFlip.deploy(COMPLETION_DELAY, MINIMUM_BET, FEE_NUMERATOR, FEE_DENOMINATOR) //1 hr, 10 blocks, 1 wei, 3% fee

        accounts = await ethers.getSigners()
        deployer = accounts[0]      //Deploys contracts, becomes "owner"
        creator = accounts[1]       //Creates coinflip games
        challenger = accounts[2]    //Accepts game created by "creator"
        finalizer = accounts[3]     //Use this account to finalize coin flip games so the winner does not have fees deducted
    })
    
    describe('Deployment', () => {
        it('Returns correct completionDelay value', async () => {
            expect(await coinflip.completionDelay()).to.equal(COMPLETION_DELAY)
        })
        it('Returns correct minimumBet value', async () => {
            expect(await coinflip.minimumBet()).to.equal(MINIMUM_BET)
        })
        it('Returns correct feeNumerator value', async () => {
            expect(await coinflip.feeNumerator()).to.equal(FEE_NUMERATOR)
        })
        it('Returns correct feeDenominator value', async () => {
            expect(await coinflip.feeDenominator()).to.equal(FEE_DENOMINATOR)
        })
        it('Returns "0" for feeBalance value', async () => {
            expect(await coinflip.feeBalance()).to.equal(0)
        })
        it('Returns "0" for totalGames value', async () => {
            expect(await coinflip.totalGames()).to.equal(0)
        })
        it('Returns "0" for totalWinnings value', async () => {
            expect(await coinflip.totalWinnings()).to.equal(0)
        })
    })

    describe('Creates Game (ETH)', () => {
        let transaction,
            result,
            contractBalance
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()
            })
            it('Updates totalGames to "1"', async () => {
                expect(await coinflip.totalGames()).to.equal(1)
            })
            it('Status of game with id "0" remains "0"', async () => {
                expect((await coinflip.games(0)).status).to.equal(0)
            })
            it('ID of game with id "1" becomes "1"', async () => {
                expect((await coinflip.games(1)).id).to.equal(1)
            })
            it('Creator of game with id "1" becomes creator address', async () => {
                expect((await coinflip.games(1)).creator).to.equal(creator.address)
            })
            it('Wager of game with id "1" becomes MINIMUM_BET', async () => {
                expect((await coinflip.games(1)).wager).to.equal(MINIMUM_BET)
            })
            it('ERC20 of game with id "1" becomes "false"', async () => {
                expect((await coinflip.games(1)).erc20).to.equal(false)
            })
            it('Status of game with id "1" becomes "1"', async () => {
                expect((await coinflip.games(1)).status).to.equal(1)
            })

            it('"activeGames" stat of creator becomes "1"', async () => {
                expect((await coinflip.stats(creator.address)).activeGames).to.equal(1)
            })
            it('"totalUserGames" stat of creator becomes "1"', async () => {
                expect((await coinflip.stats(creator.address)).totalUserGames).to.equal(1)
            })
            it('"userGameIds" stat of creator appends "1" at index "1"', async () => {
                expect(await coinflip.getUserGameIds(creator.address, 1)).to.equal(1)
            })

            it('Updates CoinFlip contract ETH balance', async () => {
                expect(await ethers.provider.getBalance(coinflip.address)).to.equal(MINIMUM_BET)
            })
            it('Emits a CreateGame event', async () => {
                await expect(transaction).to.emit(coinflip, 'CreateGame').
                    withArgs(1, creator.address, MINIMUM_BET, false)
            })
        })
        describe('Failure', () => {
            it('Reverts if wager is less than MINIMUM_BET', async () => {
                await expect(coinflip.connect(creator).createGame_ETH({value: (MINIMUM_BET - 1)})).to.be.reverted
            })
        })
    })
})