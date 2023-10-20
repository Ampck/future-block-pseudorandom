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
		if (erc20) {console.log(erc20, ethers.utils.getAddress(erc20Address))}
		try {

			if (erc20 == true) {

				const signer = await provider.getSigner()
				const formattedWager = ethers.utils.parseUnits(wager.toString(), 'ether')

				const token = new ethers.Contract(erc20Address, TOKEN_ABI, provider)

				transaction = await token.connect(signer).approve(coinflip.address, formattedWager)
				await transaction.wait()

				transaction = await coinflip.connect(signer).createGame_ERC20(ethers.utils.getAddress(erc20Address), formattedWager)
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
											<Form.Control style={{height: '30px', width: '30px'}} type='checkbox' placeholder='erc20?' className='form-check-input my-2' onChange={erc20BooleanHandler}/>
											<Form.Control style={{height: '30px', width: '200px'}} type='text' placeholder='ERC20 Address' className='my-2' onChange={(e) => setErc20Address(e.target.value)}/>
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
												<div style={{display: 'none'}}>
													<br/>
													<br/>
													<strong>DEVELOPER TOOLS</strong>
													<br/>
													<Button
														onClick={whitelistHandler}
													>
														Whitelist Address
													</Button>
												</div>
											</>
										)}					
									</Form.Group>
								</Form>
							</div>

							<div style={{marginBottom:'50px', display: 'none'}}>
								<h2>Cancel Game</h2>
								<Form onSubmit={cancelGameHandler}>
									<Form.Group className="text-center" style={{maxWidth:'450px', margin: '5px auto'}}>
										<Form.Control type='number' placeholder='Enter game id to cancel' className='my-2' onChange={(e) => setCancelId(e.target.value)}/>
					
										{isWaiting? (
											<Spinner animation='border'/>
										) : (
											<Button
												variant='primary'
												type='submit'
											>
												Cancel Game
											</Button>
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