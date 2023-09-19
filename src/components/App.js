import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Loading from './Loading';

// ABIs: Import your contract ABIs here
import COINFLIP_ABI from '../abis/CoinFlip.json'

// Config: Import your network config here
import config from '../config.json';

const NETWORK_ID = 31337;

function App() {
  const [account, setAccount] = useState(null)
  const [coinflip, setCoinflip] = useState(null)
  const [provider, setProvider] = useState(null)

  const [isLoading, setIsLoading] = useState(true)

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    const coinflip = new ethers.Contract(config[NETWORK_ID].coinflip.address, COINFLIP_ABI, provider)
    setCoinflip(coinflip)
    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)

    setIsLoading(false)
  }

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading]);

  return(
    <Container>
      <Navigation account={account} />

      <h1 className='my-4 text-center'>Defi-Dice</h1>
      <hr/>
      {isLoading ? (
        <Loading />
      ) : (
        <>
        </>
      )}
    </Container>
  )
}

export default App;
