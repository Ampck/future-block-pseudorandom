import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import {ethers} from 'ethers'

import TOKEN_ABI from '../abis/Token.json';

const GamesList = () => {

	const provider = useSelector(state => state.provider.connection)
	const account = useSelector(state => state.provider.account)

	const coinflip = useSelector(state => state.coinflip.contract)
	const games = useSelector(state => state.coinflip.games)
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

	}

	return (
		<>
			<div className='text-center' style={{display: 'inline-block'}}>
				<h2>Games List</h2>
				<Table striped bordered hover responsive>
			      <thead>
			        <tr>
			          <th>id | </th>
			          <th>creator | </th>
			          <th>challenger | </th>
			          <th>winner | </th>
			          <th>wager | </th>
			          <th>erc20 | </th>
			          <th>erc20 address | </th>
			          <th>creation time | </th>
			          <th>completion time | </th>
			          <th>block accepted | </th>
			          <th>status | </th>
			          <th>accept game</th>
			        </tr>
			      </thead>
			      <tbody>
			      	{games.map((game, index) => (
				      	<tr key={index}>
				      		<td>{game.id.toString()}</td>
				      		<td>{game.creator.toString().slice(0,5)}...</td>
				      		<td>{game.challenger.toString().slice(0,5)}...</td>
				      		<td>{game.winner.toString().slice(0,5)}...</td>
				      		<td>{ethers.utils.formatUnits(game.wager, "ether")}
				      		{game.erc20 ? (
				      			' Tokens'
				      		) : (
				      			' Ether'
				      		)}</td>
				      		<td>{game.erc20.toString()}</td>
				      		<td>{game.erc20Address.toString().slice(0,5)}...</td>
				      		<td>{game.creationTime.toString()}</td>
				      		<td>{game.completionTime.toString()}</td>
				      		<td>{game.blockAccepted.toString()}</td>
				      		<td>{game.status.toString()}</td>
				      		<td>
					      		{(game.status == 1) && (
					      			<Button 
					      				variant="primary"
					      				style={{width:'100%'}}
					      				onClick={() => acceptHandler(game.id, game.wager)}
					      			>
					      				ACCEPT GAME
					      			</Button>
					      		)}
					      		{(game.status == 2) && (
					      			<Button 
					      				variant="primary"
					      				style={{width:'100%'}}
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
		</>
	);
}

export default GamesList;
