const { expect } = require ('chai');
const { ethers } = require ('hardhat');
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

//Global data to test against
const COMPLETION_DELAY = 1;
const MINIMUM_BET = ethers.BigNumber.from(10000);
const FEE_NUMERATOR = 256;
const FEE_DENOMINATOR = 1000;
const BALANCE_AFTER_FEE_HARDCODED = 15120 //THIS MUST BE MANUALLY UPDATED IF FEE_NUMERATOR OR FEE_DENOMINATOR ARE UPDATED
    //UPDATE FORMULA: ((MINIMUM_BET) + (((MINIMUM_BET * 2) * FEE_NUMERATOR) / FEE_DENOMINATOR))

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

        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy('TOKEN', 'TKN', '1000000')
        brokenToken = await Token.deploy('BROKEN', 'BKN', '1000000')

        accounts = await ethers.getSigners()
        deployer = accounts[0]      //Deploys contracts, becomes "owner"
        creator = accounts[1]       //Creates coinflip games
        challenger = accounts[2]    //Accepts game created by "creator"
        finalizer = accounts[3]     //Use this account to finalize coin flip games so the winner does not have fees deducted

        transaction = await coinflip.connect(deployer).addERC20Whitelist(token.address)
        result = await transaction.wait()

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
        it('Returns "0" for totalWinningsETH value', async () => {
            expect(await coinflip.totalWinningsETH()).to.equal(0)
        })
    })

    describe('Updates Fees', () => {
        let transaction,
            result
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await coinflip.connect(deployer).updateFee(1, 100);
                result = await transaction.wait()
            })
            it('Changes feeNumerator to 1', async () => {
                expect(await coinflip.feeNumerator()).to.equal(1)
            })
            it('Changes feeDenominator to 100', async () => {
                expect(await coinflip.feeDenominator()).to.equal(100)
            })
            it('Emits an UpdateFee event', async () => {
                await expect(transaction).to.emit(coinflip, 'UpdateFee').
                    withArgs(
                        1,
                        100
                    )
            })
        })
        describe('Failure', () => {
            it('Rejects non-owners from updating', async () => {
                await expect(coinflip.connect(creator).updateFee(1, 100)).to.be.reverted
            })
        })
    })

    describe('Adds ERC20 Whitelist', () => {
        let transaction,
            result
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await coinflip.connect(deployer).addERC20Whitelist(brokenToken.address);
                result = await transaction.wait()
            })
            it('Allows game with whitelisted erc20 address to be created', async () => {
                await expect(coinflip.connect(deployer).createGame_ERC20(brokenToken.address, MINIMUM_BET))
            })
        })
        describe('Failure', () => {
            it('Rejects non-owners from updating', async () => {
                await expect(coinflip.connect(creator).addERC20Whitelist(brokenToken.address)).to.be.reverted
            })
        })
    })

    describe('Removes ERC20 Whitelist', () => {
        let transaction,
            result
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await coinflip.connect(deployer).removeERC20Whitelist(token.address);
                result = await transaction.wait()
            })
            it('Does not allow creation of game with removed erc20 address', async () => {
                await expect(coinflip.connect(deployer).createGame_ERC20(brokenToken.address, MINIMUM_BET)).to.be.reverted
            })
        })
        describe('Failure', () => {
            it('Rejects non-owners from updating', async () => {
                await expect(coinflip.connect(creator).removeERC20Whitelist(token.address)).to.be.reverted
            })
        })
    })

    describe('Withdraws ETH', () => {
        let transaction,
            result
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()
                creatorBal = await ethers.provider.getBalance(creator.address)

                transaction = await coinflip.connect(challenger).acceptGame(1, {value: MINIMUM_BET})
                result = await transaction.wait()
                challengerBal = await ethers.provider.getBalance(challenger.address)


                //Create useless game to increment block number before finalizing
                transaction = await coinflip.connect(finalizer).createGame_ETH({value: MINIMUM_BET})
                result = await transaction.wait()

                transaction = await coinflip.connect(finalizer).finalizeGame(1)
                result = await transaction.wait()
            })
            it('Witholds exact fees', async () => {
                expect(await ethers.provider.getBalance(coinflip.address)).to.equal(BALANCE_AFTER_FEE_HARDCODED)
            })
        })
        describe('Failure', () => {
            it('Rejects non-owners from withdrawing', async () => {
                await expect(coinflip.connect(creator).withdrawETH()).to.be.reverted
            })
        })
    })
    describe('Liquidates ETH', () => {
        let transaction,
            result
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET})
                result = await transaction.wait()
            })
            it('Withdraws all ETH from contract', async () => {
                expect(await ethers.provider.getBalance(coinflip.address)).to.equal(MINIMUM_BET)
                transaction = await coinflip.connect(deployer).liquidateETH()
                result = await transaction.wait()
                expect(await ethers.provider.getBalance(coinflip.address)).to.equal(0)
            })
        })
        describe('Failure', () => {
            it('Rejects non-owners from liquidating', async () => {
                await expect(coinflip.connect(creator).liquidateETH()).to.be.reverted
            })
        })
    })

    describe('Withdraws ERC20', () => {
        let transaction,
            result
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET * 2)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET * 2)
                result = await transaction.wait()
                transaction = await token.connect(deployer).transfer(challenger.address, MINIMUM_BET * 2)
                result = await transaction.wait()
                transaction = await token.connect(challenger).approve(coinflip.address, MINIMUM_BET * 2)
                result = await transaction.wait()

                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()
                creatorBal = await ethers.provider.getBalance(creator.address)

                transaction = await coinflip.connect(challenger).acceptGame(1, {value: MINIMUM_BET})
                result = await transaction.wait()
                challengerBal = await ethers.provider.getBalance(challenger.address)


                //Create useless game to increment block number before finalizing
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()

                transaction = await coinflip.connect(finalizer).finalizeGame(1)
                result = await transaction.wait()
            })
            it('Witholds exact fees', async () => {
                expect(await token.balanceOf(coinflip.address)).to.equal(BALANCE_AFTER_FEE_HARDCODED)
            })
        })
        describe('Failure', () => {
            it('Rejects non-owners from withdrawing', async () => {
                await expect(coinflip.connect(creator).withdrawETH()).to.be.reverted
            })
        })
    })

    describe('Liquidates ERC20', () => {
        let transaction,
            result
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET)
                result = await transaction.wait()
            })
            it('Withdraws all ETH from contract', async () => {
                expect(await token.balanceOf(coinflip.address)).to.equal(MINIMUM_BET)
                transaction = await coinflip.connect(deployer).liquidateERC20(token.address)
                result = await transaction.wait()
                expect(await token.balanceOf(coinflip.address)).to.equal(0)
            })
        })
        describe('Failure', () => {
            it('Rejects non-owners from liquidating', async () => {
                await expect(coinflip.connect(creator).liquidateERC20(token.address)).to.be.reverted
            })
        })
    })

    describe('Creates Game (ETH)', () => {
        let transaction,
            result
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
                    withArgs(
                        1,
                        creator.address,
                        MINIMUM_BET,
                        false,
                        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
                    )
            })
        })
        describe('Failure', () => {
            it('Reverts if wager is less than MINIMUM_BET', async () => {
                await expect(coinflip.connect(creator).createGame_ETH({value: (MINIMUM_BET - 1)})).to.be.reverted
            })
        })
    })

    describe('Creates Game (ERC20)', () => {
        let transaction,
            result
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
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
            it('ERC20 of game with id "1" becomes "true"', async () => {
                expect((await coinflip.games(1)).erc20).to.equal(true)
            })
            it('Retrieves ERC20 token from creator', async () => {
                expect(await token.balanceOf(coinflip.address)).to.equal(MINIMUM_BET)
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

            it('Updates CoinFlip contract ERC20 balance', async () => {
                expect(await token.balanceOf(coinflip.address)).to.equal(MINIMUM_BET)
            })
            it('Emits a CreateGame event', async () => {
                await expect(transaction).to.emit(coinflip, 'CreateGame').
                    withArgs(
                        1,
                        creator.address,
                        MINIMUM_BET,
                        true,
                        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
                    )
            })
        })
        describe('Failure', () => {
            it('Reverts if wager is less than MINIMUM_BET', async () => {
                await expect(coinflip.connect(creator).createGame_ERC20(token.address, 0)).to.be.reverted
            })
            it('Reverts if given address is not a whitelisted ERC20 token', async () => {
                await expect(coinflip.connect(creator).createGame_ERC20(brokenToken.address, MINIMUM_BET)).to.be.reverted
            })
        })
    })

    describe('Accepts Game (ETH)', () => {
        let transaction,
            result,
            blockAccepted,
            challengerTxValue
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()

                transaction = await coinflip.connect(challenger).acceptGame(1, {value: ethers.utils.parseUnits("5000")});
                result = await transaction.wait()
                blockAccepted = await result.blockNumber
            })

            it('Challenger of game with id "1" becomes challenger', async () => {
                expect((await coinflip.games(1)).challenger).to.equal(challenger.address)
            })
            it('Block Accepted of game with id "1" becomes correct', async () => {
                expect((await coinflip.games(1)).blockAccepted).to.equal(blockAccepted)
            })
            it('Status of game with id "1" becomes "2"', async () => {
                expect((await coinflip.games(1)).status).to.equal(2)
            })

            it('"activeGames" stat of creator becomes "0"', async () => {
                expect((await coinflip.stats(creator.address)).activeGames).to.equal(0)
            })
            it('"totalAcceptedUserGames" stat of challenger becomes "1"', async () => {
                expect((await coinflip.stats(creator.address)).totalUserGames).to.equal(1)
            })
            it('"userAcceptedGameIds" stat of challenger appends "1" at index "1"', async () => {
                expect(await coinflip.getUserAcceptedGameIds(challenger.address, 1)).to.equal(1)
            })

            it('Updates CoinFlip contract ETH balance', async () => {
                expect(await ethers.provider.getBalance(coinflip.address)).to.equal(MINIMUM_BET * 2)
            })
            it('Sends challenger excess balance', async () => {
                expect(await ethers.provider.getBalance(challenger.address)).to.greaterThan(ethers.utils.parseUnits("9999"))
            })

            it('Emits an AcceptGame event', async () => {
                await expect(transaction).to.emit(coinflip, 'AcceptGame').
                    withArgs(
                        1,
                        challenger.address,
                        blockAccepted
                    )
            })
        })
        describe('Failure', () => {
            it('Reverts if challenger is creator', async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()

                await expect(coinflip.connect(creator).acceptGame(1, {value: (MINIMUM_BET)})).to.be.reverted
            })
            it('Reverts if transaction value is less than wager', async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()

                await expect(coinflip.connect(challenger).acceptGame(1, {value: (MINIMUM_BET - 1)})).to.be.reverted
            })
            it('Reverts if game is not active', async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()
                transaction = await coinflip.connect(challenger).acceptGame(1, {value: (MINIMUM_BET)})
                result = await transaction.wait()
                blockAccepted = await result.blockNumber
                await expect(transaction).to.emit(coinflip, 'AcceptGame').
                    withArgs(
                        1,
                        challenger.address,
                        blockAccepted
                    )
                await expect(coinflip.connect(finalizer).acceptGame(1)).to.be.reverted
            })
        })
    })

    describe('Accepts Game (ERC20)', () => {
        let transaction,
            result,
            blockAccepted,
            challengerTxValue
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(deployer).transfer(challenger.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(challenger).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()

                transaction = await coinflip.connect(challenger).acceptGame(1);
                result = await transaction.wait()
                blockAccepted = await result.blockNumber
            })

            it('Challenger of game with id "1" becomes challenger', async () => {
                expect((await coinflip.games(1)).challenger).to.equal(challenger.address)
            })
            it('Block Accepted of game with id "1" becomes correct', async () => {
                expect((await coinflip.games(1)).blockAccepted).to.equal(blockAccepted)
            })
            it('Status of game with id "1" becomes "2"', async () => {
                expect((await coinflip.games(1)).status).to.equal(2)
            })

            it('"activeGames" stat of creator becomes "0"', async () => {
                expect((await coinflip.stats(creator.address)).activeGames).to.equal(0)
            })
            it('"totalAcceptedUserGames" stat of challenger becomes "1"', async () => {
                expect((await coinflip.stats(creator.address)).totalUserGames).to.equal(1)
            })
            it('"userAcceptedGameIds" stat of challenger appends "1" at index "1"', async () => {
                expect(await coinflip.getUserAcceptedGameIds(challenger.address, 1)).to.equal(1)
            })

            it('Updates CoinFlip contract ERC20 balance', async () => {
                expect(await token.balanceOf(coinflip.address)).to.equal(MINIMUM_BET * 2)
            })

            it('Emits an AcceptGame event', async () => {
                await expect(transaction).to.emit(coinflip, 'AcceptGame').
                    withArgs(
                        1,
                        challenger.address,
                        blockAccepted
                    )
            })
        })
        describe('Failure', () => {
            it('Reverts if challenger is creator', async () => {
                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET * 2)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET * 2)
                result = await transaction.wait()
                
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()

                await expect(coinflip.connect(creator).acceptGame(1)).to.be.reverted
            })
            it('Reverts if unable to transfer wager from user', async () => {
                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(deployer).transfer(challenger.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(challenger).approve(coinflip.address, MINIMUM_BET - 1)
                result = await transaction.wait()
                
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()

                await expect(coinflip.connect(challenger).acceptGame(1)).to.be.reverted
            })
            it('Reverts if game is not active', async () => {
                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(deployer).transfer(challenger.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(challenger).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()

                transaction = await coinflip.connect(challenger).acceptGame(1);
                result = await transaction.wait()
                blockAccepted = await result.blockNumber
                await expect(transaction).to.emit(coinflip, 'AcceptGame').
                    withArgs(
                        1,
                        challenger.address,
                        blockAccepted
                    )
                await expect(coinflip.connect(finalizer).acceptGame(1, {value: (MINIMUM_BET)})).to.be.reverted
            })
        })
    })

    describe('Cancels Game (ETH)', () => {
        let transaction,
            result
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()

                transaction = await coinflip.connect(creator).cancelGame(1);
                result = await transaction.wait()
            })

            it('Status of game with id "1" becomes "4"', async () => {
                expect((await coinflip.games(1)).status).to.equal(4)
            })

            it('"activeGames" stat of creator becomes "0"', async () => {
                expect((await coinflip.stats(creator.address)).activeGames).to.equal(0)
            })

            it('Sends initial wager back to creator', async () => {

                expect(await ethers.provider.getBalance(coinflip.address)).to.equal(0)
            })
            
            it('Emits a CancelGame event', async () => {
                await expect(transaction).to.emit(coinflip, 'CancelGame').
                    withArgs(1)
            })
        })
        describe('Failure', () => {
            it('Reverts if canceller is not creator', async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()

                await expect(coinflip.connect(challenger).cancelGame(1)).to.be.reverted
            })
            it('Reverts if game is no longer active', async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()

                transaction = await coinflip.connect(challenger).acceptGame(1, {value: MINIMUM_BET})
                result = transaction.wait()

                await expect(coinflip.connect(creator).cancelGame(1)).to.be.reverted
            })
        })
    })

    describe('Cancels Game (ERC20)', () => {
        let transaction,
            result
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()
                transaction = await coinflip.connect(creator).cancelGame(1);
                result = await transaction.wait()
            })

            it('Status of game with id "1" becomes "4"', async () => {
                expect((await coinflip.games(1)).status).to.equal(4)
            })

            it('"activeGames" stat of creator becomes "0"', async () => {
                expect((await coinflip.stats(creator.address)).activeGames).to.equal(0)
            })

            it('Sends initial wager back to creator', async () => {

                expect(await token.balanceOf(coinflip.address)).to.equal(0)
            })
            
            it('Emits a CancelGame event', async () => {
                await expect(transaction).to.emit(coinflip, 'CancelGame').
                    withArgs(1)
            })
        })
        describe('Failure', () => {
            it('Reverts if canceller is not creator', async () => {
                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()

                await expect(coinflip.connect(challenger).cancelGame(1)).to.be.reverted
            })
            it('Reverts if game is no longer active', async () => {
                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(deployer).transfer(challenger.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(challenger).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()

                transaction = await coinflip.connect(challenger).acceptGame(1);
                result = await transaction.wait()

                await expect(coinflip.connect(creator).cancelGame(1)).to.be.reverted
            })
        })
    })

    describe('Cancels All Games', () => {
        let transaction,
            result
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()
                transaction = await coinflip.connect(challenger).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()

                /*
                let _activeGames = ((await coinflip.stats(creator.address)).activeGames)
                let _totaluserGames = ((await coinflip.stats(creator.address)).totalUserGames)
                while (_activeGames > 0) {
                    let currentValue = await coinflip.getUserGameIds(creator.address, _totaluserGames)
                    console.log(`index: ${_totaluserGames} - value: ${currentValue} || _activeGames: ${_activeGames}`)
                    _totaluserGames--
                    _activeGames--
                }*/
                transaction = await coinflip.connect(creator).cancelAllGames();
                result = await transaction.wait()
            })

            it('Status of game with ids "1", "2", and "4" become "4"', async () => {
                expect((await coinflip.games(1)).status).to.equal(4)
                expect((await coinflip.games(2)).status).to.equal(4)
                expect((await coinflip.games(4)).status).to.equal(4)
            })
            it('Challenger game with id "3" remains active', async () => {
                expect((await coinflip.games(3)).status).to.equal(1)
            })

            it('"activeGames" stat of creator becomes "0"', async () => {
                expect((await coinflip.stats(creator.address)).activeGames).to.equal(0)
            })

            it('Sends all initial wagers back to creator', async () => {

                expect(await ethers.provider.getBalance(coinflip.address)).to.equal(MINIMUM_BET)
            })
        })
        describe('Failure', () => {
            it('Reverts if canceller has no games', async () => {
                await expect(coinflip.connect(creator).cancelAllGames()).to.be.reverted
            })
        })
    })

    describe('Finalizes Game', () => {
        let transaction,
            result,
            winner,
            loser,
            creatorBal,
            challengerBal
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()
                creatorBal = await ethers.provider.getBalance(creator.address)

                transaction = await coinflip.connect(challenger).acceptGame(1, {value: MINIMUM_BET})
                result = await transaction.wait()
                challengerBal = await ethers.provider.getBalance(challenger.address)


                //Create useless game to increment block number before finalizing
                transaction = await coinflip.connect(finalizer).createGame_ETH({value: MINIMUM_BET})
                result = await transaction.wait()

                transaction = await coinflip.connect(finalizer).finalizeGame(1)
                result = await transaction.wait()

                if ((await coinflip.games(1)).winner == creator.address) {
                    winner = creator.address;
                    loser = challenger.address;
                } else if ((await coinflip.games(1)).winner == challenger.address) {
                    winner = challenger.address;
                    loser = creator.address;
                }
            })
            it('Status of game with id "1" becomes "3"', async () => {
                expect((await coinflip.games(1)).status).to.equal(3)
            })
            it('Updates winner of game with id "1" to be one of the player addresses', async () => {
                if ((await coinflip.games(1)).winner == creator.address) {
                    expect(true).to.equal(true)
                } else if ((await coinflip.games(1)).winner == challenger.address) {
                    expect(true).to.equal(true)
                }
                else {
                    expect(false).to.equal(true)
                }
            })
            it('Win and loss stats updated', async () => {
                expect((await coinflip.stats(winner)).wins).to.equal(1)
                expect((await coinflip.stats(loser)).losses).to.equal(1)
            })
            it('Sends payout to winner', async () => {
                if ((await coinflip.games(1)).winner == creator.address) {
                    expect(await ethers.provider.getBalance(creator.address)).to.be.greaterThan(creatorBal)
                } else if ((await coinflip.games(1)).winner == challenger.address) {
                    expect(await ethers.provider.getBalance(challenger.address)).to.be.greaterThan(challengerBal)
                }
            })
            it('Withholds fees', async () => {
                expect(await ethers.provider.getBalance(coinflip.address)).to.equal(BALANCE_AFTER_FEE_HARDCODED)
            })
            it('Emits a FinalizeGame event', async () => {
                await expect(transaction).to.emit(coinflip, 'FinalizeGame').
                    withArgs(1,
                        winner,
                        MINIMUM_BET * 2,
                        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
                    )
            })
        })
        describe('Failure', () => {
            it('Reverts if game is not pending', async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()

                //Create useless game to increment block number before finalizing
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()

                await expect(coinflip.connect(finalizer).finalizeGame(1)).to.be.reverted
            })
            it('Reverts if COMPLETION_DELAY blocks have not passed', async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET});
                result = await transaction.wait()

                transaction = await coinflip.connect(challenger).acceptGame(1, {value: MINIMUM_BET});
                result = await transaction.wait()

                await expect(coinflip.connect(finalizer).finalizeGame(1)).to.be.reverted
            })
            it('Reverts if winner is neither the creator nor the challenger', async () => {
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET})
                result = await transaction.wait()

                transaction = await coinflip.connect(challenger).acceptGame(1, {value: MINIMUM_BET})
                result = await transaction.wait()

                //Create useless game to increment block number before finalizing
                transaction = await coinflip.connect(creator).createGame_ETH({value: MINIMUM_BET})
                result = await transaction.wait()

                transaction = await coinflip.connect(finalizer).finalizeGame(1);
                result = await transaction.wait()

                winner = (await coinflip.games(1)).winner
                let winnerIsPlayer

                if (winner == creator.address || winner == challenger.address) {
                    winnerIsPlayer = true
                }

                expect(winnerIsPlayer).to.equal(true)

            })
        })
    })

    describe('Finalizes Game ERC20', () => {
        let transaction,
            result,
            winner,
            loser,
            creatorBal,
            challengerBal
        describe('Success', () => {
            beforeEach(async () => {
                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(deployer).transfer(challenger.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(challenger).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()
                creatorBal = await token.balanceOf(creator.address)

                transaction = await coinflip.connect(challenger).acceptGame(1);
                result = await transaction.wait()
                challengerBal = await token.balanceOf(challenger.address)



                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(deployer).transfer(challenger.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(challenger).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()



                transaction = await coinflip.connect(finalizer).finalizeGame(1)
                result = await transaction.wait()

                if ((await coinflip.games(1)).winner == creator.address) {
                    winner = creator.address;
                    loser = challenger.address;
                } else if ((await coinflip.games(1)).winner == challenger.address) {
                    winner = challenger.address;
                    loser = creator.address;
                }
            })
            it('Status of game with id "1" becomes "3"', async () => {
                expect((await coinflip.games(1)).status).to.equal(3)
            })
            it('Updates winner of game with id "1" to be one of the player addresses', async () => {
                if ((await coinflip.games(1)).winner == creator.address) {
                    expect(true).to.equal(true)
                } else if ((await coinflip.games(1)).winner == challenger.address) {
                    expect(true).to.equal(true)
                }
                else {
                    expect(false).to.equal(true)
                }
            })
            it('Win and loss stats updated', async () => {
                expect((await coinflip.stats(winner)).wins).to.equal(1)
                expect((await coinflip.stats(loser)).losses).to.equal(1)
            })
            it('Sends payout to winner', async () => {
                if ((await coinflip.games(1)).winner == creator.address) {
                    expect(await token.balanceOf(creator.address)).to.be.greaterThan(creatorBal)
                } else if ((await coinflip.games(1)).winner == challenger.address) {
                    expect(await token.balanceOf(challenger.address)).to.be.greaterThan(challengerBal)
                }
            })
            it('Withholds fees', async () => {
                expect(await token.balanceOf(coinflip.address)).to.equal(BALANCE_AFTER_FEE_HARDCODED)
            })
            it('Emits a FinalizeGame event', async () => {
                await expect(transaction).to.emit(coinflip, 'FinalizeGame').
                    withArgs(1,
                        winner,
                        MINIMUM_BET * 2,
                        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
                    )
            })
        })
        describe('Failure', () => {
            it('Reverts if game is not pending', async () => {


                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(deployer).transfer(challenger.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(challenger).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()
                creatorBal = await token.balanceOf(creator.address)



                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(deployer).transfer(challenger.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(challenger).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()



                await expect(coinflip.connect(finalizer).finalizeGame(1)).to.be.reverted
            })
            it('Reverts if COMPLETION_DELAY blocks have not passed', async () => {
                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(deployer).transfer(challenger.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(challenger).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()                

                await expect(coinflip.connect(finalizer).finalizeGame(1)).to.be.reverted
            })
            it('Reverts if winner is neither the creator nor the challenger', async () => {
                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(deployer).transfer(challenger.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(challenger).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()
                creatorBal = await token.balanceOf(creator.address)

                transaction = await coinflip.connect(challenger).acceptGame(1);
                result = await transaction.wait()
                challengerBal = await token.balanceOf(challenger.address)



                transaction = await token.connect(deployer).transfer(creator.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(creator).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(deployer).transfer(challenger.address, MINIMUM_BET)
                result = await transaction.wait()
                transaction = await token.connect(challenger).approve(coinflip.address, MINIMUM_BET)
                result = await transaction.wait()
                
                transaction = await coinflip.connect(creator).createGame_ERC20(token.address, MINIMUM_BET);
                result = await transaction.wait()



                transaction = await coinflip.connect(finalizer).finalizeGame(1)
                result = await transaction.wait()


                

                winner = (await coinflip.games(1)).winner
                let winnerIsPlayer

                if (winner == creator.address || winner == challenger.address) {
                    winnerIsPlayer = true
                }

                expect(winnerIsPlayer).to.equal(true)

            })
        })
    })
})