import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

import Navigation from './components/Navigation';
import GameForms from './components/GameForms';
import GamesList from './components/GamesList';

import './App.css';

import config from './config.json';
import COINFLIP_ABI from './abis/CoinFlip.json'
const NETWORK = 31337

function App() {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)

  const [coinflip, setCoinflip] = useState(null)
  const [totalGames, setTotalGames] = useState(null)
  const [games, setGames] = useState([])

  const [isLoading, setIsLoading] = useState(true)

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    const coinflip = new ethers.Contract(config[NETWORK].coinflip.address, COINFLIP_ABI, provider)
    setCoinflip(coinflip)

    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)

    const count = await coinflip.totalGames()
    setTotalGames(count)
    console.log(`total games: ${count}`)
    const items = []
    for (var i = count; i > 0; i--) {
      const currentGame = await coinflip.games(i)
      console.log(currentGame)
      items.push(currentGame)
    }
    setGames(items)

    setIsLoading(false)
  }

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading]);

  return ( 
    <div className="App">
      <Navigation/>
      <main>
          <div style={{width:'100%'}}>
              <div className='card'>
                <GameForms
                  provider={provider}
                  coinflip={coinflip}
                  setIsLoading={setIsLoading}
                />
              </div>
              <div className='card'>
                <GamesList
                  provider={provider}
                  coinflip={coinflip}
                  totalGames={totalGames}
                  games={games}
                  setIsLoading={setIsLoading}
                />
              </div>
          </div>
        </main>
    </div>
  );
}

export default App;
