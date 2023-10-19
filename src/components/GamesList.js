import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Card from'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import {ethers} from 'ethers'

import { loadGames } from '../store/interactions';

import TOKEN_ABI from '../abis/Token.json';

const GamesList = () => {

	const dispatch = useDispatch()

	const provider = useSelector(state => state.provider.connection)
	const account = useSelector(state => state.provider.account)
	console.log(account)

	const coinflip = useSelector(state => state.coinflip.contract)
	const games = useSelector(state => state.coinflip.games)
	const gamesSymbols = useSelector(state => state.coinflip.gamesSymbols)
	const totalGames = useSelector(state => state.coinflip.totalGames)

	const acceptHandler = async (id, wager) => {

		let transaction

		let currentGame = (await games[totalGames-id])

		if (account != currentGame.creator) {

			try {
				const signer = await provider.getSigner()

				if (currentGame.erc20) {

					const token = new ethers.Contract(currentGame.erc20Address, TOKEN_ABI, provider)

					transaction = await token.connect(signer).approve(coinflip.address, wager)
					await transaction.wait()

					transaction = await coinflip.connect(signer).acceptGame(id)
					await transaction.wait()

				} else {

					transaction = await coinflip.connect(signer).acceptGame(id, {value: wager})
					await transaction.wait()

				}

			} catch (e) {
				window.alert(e.reason)
			}

		} else {

			window.alert("Challenger can not be creator...")

		}
		await loadGames(provider, coinflip, dispatch)

	}

	const finalizeHandler = async (id) => {

		const blockDelay = await coinflip.completionDelay()
		console.log("completion delay: ", blockDelay)

		const currentBlock = ethers.BigNumber.from(await provider.getBlockNumber())
		const finalizeBlock = ethers.BigNumber.from(await games[totalGames-id].blockAccepted)
		console.log(finalizeBlock.toString(), ethers.BigNumber.from(currentBlock).toString())
		const blocksLeft = currentBlock - finalizeBlock
		console.log(blocksLeft)
		if (blocksLeft > blockDelay) {

			try {
				const signer = await provider.getSigner()
				const transaction = await coinflip.connect(signer).finalizeGame(id)
				await transaction.wait()
			} catch (e) {
				window.alert(e.reason)
			}

		} else {

			window.alert("Must wait " + (blockDelay - blocksLeft) + " more blocks to finalize game...")

		}
		await loadGames(provider, coinflip, dispatch)

	}

	const cancelGameHandler = async (e) => {
		e.preventDefault()
		try {
			const signer = await provider.getSigner()
			const transaction = await coinflip.connect(signer).cancelGame(e)
			await transaction.wait()
		} catch (e) {
			window.alert(e.reason)
		}
		await loadGames(provider, coinflip, dispatch)
	}

	return (
		<>
			{account ? (
				<Card style={{marginTop: '30px', padding: '10px auto'}}>
					<div className='text-center' style={{display: 'inline-block'}}>
						<Table striped bordered hover responsive>
					      <thead style={{fontSize: '10px'}}>
					        <tr>
					          <th>ID</th>
					          <th>CREATOR</th>
					          <th>CHALLENGER</th>
					          <th>WINNER</th>
					          <th>WAGER</th>
					          <th>TOKEN</th>
					          <th>DATE</th>
					          <th>TIME</th>
					          <th>COMPLETED</th>
					          <th>STATUS</th>
					          <th></th>
					        </tr>
					      </thead>
					      <tbody>
					      	{games.map((game, index) => (
						      	<tr key={index}>
						      		<td>{game.id.toString()}</td>
						      		<td>{game.creator.toString().slice(0,6)}...</td>
						      		<td>{game.challenger.toString().slice(0,6)}...</td>
						      		<td>{game.winner.toString().slice(0,6)}...</td>
						      		<td>{ethers.utils.formatUnits(game.wager, "ether")}</td>
						      		<td>{gamesSymbols[index].toString()}</td>
						      		<td>{new Date(Number(game.creationTime.toString() + '000')).toLocaleDateString(
													'en-GB',
													{
														year: '2-digit',
														month: 'numeric',
														day: 'numeric',
													}
												)}</td>
						      		<td>{new Date(Number(game.creationTime.toString() + '000')).toLocaleTimeString(
													'en-GB',
													{
														hour: 'numeric',
														minute: 'numeric'
													}
												)}</td>
						      		<td>{(game.completionTime > 0 ? (
						      					new Date(Number(game.completionTime.toString() + '000')).toLocaleTimeString(
													'en-GB',
													{
														hour: 'numeric',
														minute: 'numeric'
													}
												)
						      			) : (
						      				"- -"
						      			))}</td>
						      		<td>{game.status.toString()}</td>
						      		<td>
						      			{(game.status == 1 && game.creator.toString().toLowerCase() == account.toString().toLowerCase()) && (
							      			<Button 
							      				variant="primary"
							      				style={{width:'100%', backgroundColor: '#ff8000', border: 'none'}}
							      				onClick={() => finalizeHandler(game.id)}
							      			>
							      				CANCEL
							      			</Button>
							      		)}
							      		{(game.status == 1 && game.creator.toString().toLowerCase() != account.toString().toLowerCase()) && (
							      			<Button 
							      				variant="primary"
							      				style={{width:'100%', backgroundColor: '#10bf00', border: 'none'}}
							      				onClick={() => acceptHandler(game.id, game.wager)}
							      			>
							      				ACCEPT GAME
							      			</Button>
							      		)}
							      		{(game.status == 2) && (
							      			<Button 
							      				variant="primary"
							      				style={{width:'100%', border: 'none'}}
							      				onClick={() => finalizeHandler(game.id)}
							      			>
							      				FINALIZE
							      			</Button>
							      		)}
						      		</td>
						      	</tr>
						    ))}
					      </tbody>
					    </Table>
					</div>
				</Card>
			) : (
				<>
				</>
			)}
		</>
	);
}

export default GamesList;
