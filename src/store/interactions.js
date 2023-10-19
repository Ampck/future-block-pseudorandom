import { ethers } from 'ethers'
import { setAccount, setProvider, setNetwork } from './reducers/provider'
import { setContracts, setSymbols, balancesLoaded } from './reducers/tokens'
import {
	setContract,
  globalsLoaded,
  statsLoaded,
  gamesLoaded,
  gamesSymbolsLoaded,
  totalGamesLoaded,
  createRequest,
  createSuccess,
  createFail,
  acceptRequest,
  acceptSuccess,
  acceptFail,
  cancelRequest,
  cancelSuccess,
  cancelFail,
  finalizeRequest,
  finalizeSuccess,
  finalizeFail
} from './reducers/coinflip'

import TOKEN_ABI from '../abis/Token.json';
import COINFLIP_ABI from '../abis/CoinFlip.json';

import config from '../config.json';

export const loadProvider = (dispatch) => {
	const provider = new ethers.providers.Web3Provider(window.ethereum)
	dispatch(setProvider(provider))

	return provider
}

export const loadNetwork = async (provider, dispatch) => {
	const { chainId } = await provider.getNetwork()
	dispatch(setNetwork(chainId))
	
	return chainId
}

export const loadAccount = async (dispatch) => {
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = accounts[0]
    dispatch(setAccount(account))

    return account
}

export const loadTokens = async (provider, chainId, dispatch) => {
	//const dapp = new ethers.Contract(config[chainId].dapp.address, TOKEN_ABI, provider)
	//const usd = new ethers.Contract(config[chainId].usd.address, TOKEN_ABI, provider)

	//dispatch(setContracts([dapp, usd]))
	//dispatch(setSymbols([await dapp.symbol(), await usd.symbol()]))

	//return [dapp, usd]
}

export const loadCoinflip = async (provider, chainId, dispatch) => {
	const coinflip = new ethers.Contract(config[chainId].coinflip.address, COINFLIP_ABI, provider)
	//console.log(coinflip)

	dispatch(setContract(coinflip))

	return coinflip
}
/*
export const loadBalances = async (amm, tokens, account, dispatch) => {
	const balance1 = await tokens[0].balanceOf(account)
  const balance2 = await tokens[1].balanceOf(account)

  dispatch(balancesLoaded([
    ethers.utils.formatUnits(balance1.toString(), 'ether'),
    ethers.utils.formatUnits(balance2.toString(), 'ether')
  ]))

  const shares = await amm.shares(account)
  dispatch(sharesLoaded(ethers.utils.formatUnits(shares.toString(), 'ether')))
}

export const removeLiquidity = async (provider, amm, shares, dispatch) => {
	
	try {
		dispatch(withdrawRequest())

		let transaction
		const signer = await provider.getSigner()

		transaction = await amm.connect(signer).removeLiquidity(shares)
		await transaction.wait()

		dispatch(withdrawSuccess())

	} catch (e) {
		dispatch(withdrawFail())
	}
	
}

export const addLiquidity = async (provider, amm, tokens, amounts, dispatch) => {
	
	try {
		dispatch(depositRequest())

		let transaction
		const signer = await provider.getSigner()

		transaction = await tokens[0].connect(signer).approve(amm.address, amounts[0])
		await transaction.wait()

		transaction = await tokens[1].connect(signer).approve(amm.address, amounts[1])
		await transaction.wait()

		transaction = await amm.connect(signer).addLiquidity(amounts[0], amounts[1])
		await transaction.wait()

		dispatch(depositSuccess())

	} catch (e) {
		dispatch(depositFail())
	}
	
}

export const swap = async (provider, amm, token, symbol, amount, dispatch) => {
	
	try {
		dispatch(swapRequest())

		let transaction
		const signer = await provider.getSigner()

		transaction = await token.connect(signer).approve(amm.address, amount)
		await transaction.wait(0)

		if (symbol === "DAPP") {
			transaction = await amm.connect(signer).swapToken1(amount)
		} else {
			transaction = await amm.connect(signer).swapToken2(amount)
		}

		await transaction.wait()

		dispatch(swapSuccess(transaction.hash))
	} catch (e) {
		dispatch(swapFail())
	}
	
}

export const loadAllSwaps = async (provider, amm, dispatch) => {
	
	const block = await provider.getBlockNumber()

	const swapStream = await amm.queryFilter('Swap', 0, block)
	const swaps = swapStream.map(event => {
		return { hash: event.transactionHash, args: event.args}
	})
	console.log(swaps)

	dispatch(swapsLoaded(swaps))
	
}
*/

export const loadGames = async (provider, coinflip, dispatch) => {
	
	const count = await coinflip.totalGames()
	dispatch(totalGamesLoaded(count))

  const items = []
  const symbols = []
  for (var i = count; i > 0; i--) {
    let currentGame = await coinflip.games(i)
    if (currentGame.erc20) {
    	const token = new ethers.Contract(currentGame.erc20Address, TOKEN_ABI, provider)
    	symbols.push((await token.symbol()).toString())
    } else {
    	symbols.push("- -")
    }
    items.push(currentGame)
  }

  dispatch(gamesLoaded(items))
  dispatch(gamesSymbolsLoaded(symbols))
	
}