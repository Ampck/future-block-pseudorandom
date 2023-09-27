import {useState} from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import {ethers} from 'ethers'

const  GameForms = ({provider, coinflip, setIsLoading}) => {
	const [wager, setWager] = useState(0)
	const [cancelId, setCancelId] = useState(0)
	const [isWaiting, setIsWaiting] = useState(false)

	const createGameHandler = async (e) => {
		e.preventDefault()
		setIsWaiting(true)
		try {
			const signer = await provider.getSigner()
			const formattedWager = ethers.utils.parseUnits(wager.toString(), 'ether')
			const transaction = await coinflip.connect(signer).createGame_ETH({value: formattedWager})
			await transaction.wait()
		} catch (e) {
			window.alert(e)
		}
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
		setIsLoading(true)
	}

	return(
		<>	
			<h2>Create Game</h2>
			<Form onSubmit={createGameHandler}>
				<Form.Group className="text-center" style={{maxWidth:'450px', margin: '50px auto'}}>
					<Form.Control type='number' placeholder='Enter wager' className='my-2' onChange={(e) => setWager(e.target.value)}/>
					{isWaiting? (
						<Spinner animation='border' style={{display: 'block', margin: '0 auto'}} />
					) : (
						<Button
							variant='primary'
							type='submit'
							style={{width:'100%'}}
						>
							Create Game
						</Button>
					)}					
				</Form.Group>
			</Form>
			<h2>CancelGame</h2>
			<Form onSubmit={cancelGameHandler}>
				<Form.Group className="text-center" style={{maxWidth:'450px', margin: '50px auto'}}>
					<Form.Control type='number' placeholder='Enter game id to cancel' className='my-2' onChange={(e) => setCancelId(e.target.value)}/>
					{isWaiting? (
						<Spinner animation='border' style={{display: 'block', margin: '0 auto'}} />
					) : (
						<Button
							variant='primary'
							type='submit'
							style={{width:'100%'}}
						>
							Cancel Game
						</Button>
					)}					
				</Form.Group>
			</Form>
		</>
	);
}

export default GameForms;