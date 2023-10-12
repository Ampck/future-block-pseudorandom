import {useState} from 'react';
import * as React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import {ethers} from 'ethers'

import config from '../config.json';
import TOKEN_ABI from '../abis/Token.json';

const NETWORKS = [31337, 5];

const  GameForms = ({provider, coinflip, setIsLoading}) => {
	const [wager, setWager] = useState(0)
	const [erc20, setErc20] = useState(false)
	const [erc20Address, setErc20Address] = useState('')
	const [cancelId, setCancelId] = useState(0)
	const [isWaiting, setIsWaiting] = useState(false)

	const createGameHandler = async (e) => {
		e.preventDefault()
		setIsWaiting(true)
		let transaction
		console.log(erc20, ethers.utils.getAddress(erc20Address))
		try {

			if (erc20 == true) {

				const signer = await provider.getSigner()
				const formattedWager = ethers.utils.parseUnits(wager.toString(), 'ether')

				const token = new ethers.Contract(erc20Address, TOKEN_ABI, provider)

				//if ((await token.allowance(signer.address, coinflip.address)) < formattedWager) {

					transaction = await token.connect(signer).approve(coinflip.address, formattedWager)
					await transaction.wait()

				//}

				transaction = await coinflip.connect(signer).createGame_ERC20(ethers.utils.getAddress(erc20Address), formattedWager)
				await transaction.wait()

			} else {

				const signer = await provider.getSigner()
				const formattedWager = ethers.utils.parseUnits(wager.toString(), 'ether')
				transaction = await coinflip.connect(signer).createGame_ETH({value: formattedWager})
				await transaction.wait()

			}

		} catch (e) {
			window.alert(e)
		}
		setIsWaiting(false)
		setIsLoading(true)
	}

	const cancelGameHandler = async (e) => {
		e.preventDefault()
		setIsWaiting(true)
		try {
			const signer = await provider.getSigner()
			const transaction = await coinflip.connect(signer).cancelGame(cancelId)
			await transaction.wait()
		} catch (e) {
			window.alert(e)
		}
		setIsWaiting(false)
		setIsLoading(true)
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
			window.alert(e)
		}
	}

	return(
		<>	
			<div style={{margin:'50px', display: 'inline-block'}}>
				<h2>Create Game</h2>
				<Form onSubmit={createGameHandler}>
					<Form.Group className="text-center" style={{maxWidth:'450px', margin: '5px auto'}}>
						<Form.Control style={{width:'100%'}} type='number' step='0.0000001' placeholder='Enter wager' className='my-2' onChange={(e) => setWager(e.target.value)}/>
						<br/>
						<div>
							<Form.Control type='checkbox' placeholder='erc20?' className='my-2' onChange={erc20BooleanHandler}/>
							<Form.Control type='text' placeholder='ERC20 Address' className='my-2' onChange={(e) => setErc20Address(e.target.value)}/>
						</div>
						<br/>
						{isWaiting? (
							<>
								<Spinner animation='border'/>
								<p>Loading...</p>
							</>
						) : (
							<>
								<Button
									variant='primary'
									type='submit'
								>
									Create Game
								</Button>
								<br/>
								<br/>
								<strong>DEVELOPER TOOLS</strong>
								<br/>
								<Button
									onClick={whitelistHandler}
								>
									Whitelist Address
								</Button>
							</>
						)}					
					</Form.Group>
				</Form>
			</div>
			<div style={{margin:'50px', display: 'inline-block'}}>
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
		</>
	);
}

export default GameForms;