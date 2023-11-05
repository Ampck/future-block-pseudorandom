import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as React from 'react';
import Card from'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import {ethers} from 'ethers'

import { loadGames } from '../store/interactions';

import config from '../config.json';
import TOKEN_ABI from '../abis/Token.json';

const NETWORKS = [31337, 5];

const  GameForms = () => {
	const dispatch = useDispatch()

	const [wager, setWager] = useState(0)
	const [erc20, setErc20] = useState(false)
	const [erc20Address, setErc20Address] = useState('')
	const [cancelId, setCancelId] = useState(0)
	const [isWaiting, setIsWaiting] = useState(false)

	const provider = useSelector(state => state.provider.connection)
	const account = useSelector(state => state.provider.account)

	const coinflip = useSelector(state => state.coinflip.contract)
	const games = useSelector(state => state.coinflip.games)
	const totalGames = useSelector(state => state.coinflip.totalGames)
	//const isSwapping = useSelector(state => state.amm.swapping.isSwapping)
	//const isSuccess = useSelector(state => state.amm.swapping.isSuccess)
	//const transactionHash = useSelector(state => state.amm.swapping.transactionHash)

	const createGameHandler = async (e) => {
		e.preventDefault()
		setIsWaiting(true)
		let transaction

		let address = erc20Address

		if (!erc20Address) {
			console.log("123213123")
			address = "0xa31bb8f4F65A46f09fEA377b9C5Af6A754b3be2C"
		}
		else {
			console.log("54675678568")
		}
		//if (erc20) {console.log(erc20, ethers.utils.getAddress(address))}
		try {

			if (erc20 == true) {

				const signer = await provider.getSigner()
				const formattedWager = ethers.utils.parseUnits(wager.toString(), 'ether')

				const token = new ethers.Contract(address, TOKEN_ABI, provider)

				transaction = await token.connect(signer).approve(coinflip.address, formattedWager)
				await transaction.wait()

				transaction = await coinflip.connect(signer).createGame_ERC20(ethers.utils.getAddress(address), formattedWager)
				await transaction.wait()

			} else {

				const signer = await provider.getSigner()
				const formattedWager = ethers.utils.parseUnits(wager.toString(), 'ether')
				transaction = await coinflip.connect(signer).createGame_ETH({value: formattedWager})
				await transaction.wait()

			}

		} catch (e) {
			window.alert(e.reason)
		}
		await loadGames(provider, coinflip, dispatch)
		setIsWaiting(false)
	}

	const cancelGameHandler = async (e) => {
		e.preventDefault()
		setIsWaiting(true)
		try {
			const signer = await provider.getSigner()
			const transaction = await coinflip.connect(signer).cancelGame(cancelId)
			await transaction.wait()
		} catch (e) {
			window.alert(e.reason)
		}
		setIsWaiting(false)
	}

	const erc20BooleanHandler = (e) => {
		setErc20(e.target.checked)
	}

	const whitelistHandler = async (e) => {
		e.preventDefault()
		setIsWaiting(true)
		try {
			const signer = await provider.getSigner()
			let transaction = await coinflip.connect(signer).addERC20Whitelist(ethers.utils.getAddress(erc20Address))
			await transaction.wait()
		} catch (e) {
			window.alert(e.reason)
		}
	}

	return(
		<>	
			<div style={{marginTop: '30px', marginBottom: '30px', display: 'inline-block'}}>
				<Card style={{maxWidth:'450px', minWidth: '450px', display: 'inline-block', margin: '0px'}}>
					{account ? (
						<div>
							<div style={{margin:'50px', display: 'inline-block'}}>
								<h2 style={{marginBottom: '30px'}}>CREATE GAME</h2>
								<Form onSubmit={createGameHandler}>
									<Form.Group className="text-center" style={{maxWidth:'450px', margin: '5px auto'}}>
										<Form.Control style={{width:'100%'}} type='number' step='0.0000001' placeholder='Enter wager' className='my-2' onChange={(e) => setWager(e.target.value)}/>
										<div style={{display: 'flex'}}>
											<Form.Control style={{height: '40px', width: '40px'}} type='checkbox' placeholder='erc20?' className='form-check-input my-2' onChange={erc20BooleanHandler}/>
											<Form.Select
											  aria-label="Network Selector"
											  value={config[provider.chainId] ? config[provider.chainId].tmt.address : `0`}
											  onChange={(e) => setErc20Address(e.target.value)}
											  style={{height: '40px', width: '200px'}}
											  className='my-2'
											>
											  <option value="0xa31bb8f4F65A46f09fEA377b9C5Af6A754b3be2C">TMT</option>											</Form.Select>
										</div>
										{isWaiting? (
											<>
												<Spinner animation='border' style={{marginTop: '20px'}} />
												<p>Loading...</p>
											</>
										) : (
											<>
												<Button
													variant='primary'
													type='submit'
													style={{marginTop: '20px'}}
												>
													CREATE GAME
												</Button>
											</>
										)}					
									</Form.Group>
								</Form>
							</div>
						</div>
					) : (
						<p className ='d-flex justify-content-center align-items-center' style={{height: '300px'}}>Connect wallet to use app.</p>
					)}

				</Card>
			</div>
		</>
	);
}

export default GameForms;