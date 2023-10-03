import {useState} from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import {ethers} from 'ethers'

const GamesList = ({provider, coinflip, totalGames, games, setIsLoading}) => {

	const acceptHandler = async (id, wager) => {

		try {
			const signer = await provider.getSigner()
			const transaction = await coinflip.connect(signer).acceptGame(id, {value: wager})
			await transaction.wait()
		} catch (e) {
			window.alert(e)
		}
		setIsLoading(true)
	}

	const finalizeHandler = async (id) => {

		try {
			const signer = await provider.getSigner()
			const transaction = await coinflip.connect(signer).finalizeGame(id)
			await transaction.wait()
		} catch (e) {
			window.alert(e)
		}
		setIsLoading(true)
	}

	return (
		<>
			<div className='text-center'>
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
