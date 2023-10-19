import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Container } from 'react-bootstrap'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { ethers } from 'ethers'
import Form from 'react-bootstrap/Form';

import Navigation from './components/Navigation';
import Tabs from './components/Tabs';
import GameForms from './components/GameForms';
import GamesList from './components/GamesList';
import CancelGame from './components/CancelGame';
import DeveloperTools from './components/DeveloperTools';

import './App.css';

import { loadProvider, loadAccount, loadNetwork, loadTokens, loadGames, loadCoinflip, loadBalances } from './store/interactions';

import config from './config.json';
import COINFLIP_ABI from './abis/CoinFlip.json';
const NETWORKS = [31337, 5];

function App() {
  /*
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

    const coinflip = new ethers.Contract(config[NETWORKS[1]].coinflip.address, COINFLIP_ABI, provider)
    setCoinflip(coinflip)

    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)

    const count = await coinflip.totalGames()
    setTotalGames(count)
    //console.log(`total games: ${count}`)
    const items = []
    for (var i = count; i > 0; i--) {
      const currentGame = await coinflip.games(i)
      //console.log(currentGame)
      items.push(currentGame)
    }
    setGames(items)
    
    setIsLoading(false)
  }
  */

  const dispatch = useDispatch()

  const loadBlockchainData = async () => {
    
    const provider = loadProvider(dispatch)
    const chainId = await loadNetwork(provider, dispatch)
    const coinflip = await loadCoinflip(provider, chainId, dispatch)
    const games = await loadGames(provider, coinflip, dispatch)

    window.ethereum.on('accountsChanged', async () => {
      await loadAccount(dispatch)
    })

  }

  useEffect(() => {
    loadBlockchainData()
  }, []);

  return (
    <>
      <div className="App">
        <HashRouter>
          <Navigation/>
          <Routes>
            <Route exact path="/" element={
              <div style={{width:'100%', paddingLeft: '5%', paddingRight: '5%', display: 'inline-block'}} className='d-flex align-items-top justify-content-center'>
                  <GamesList/>
                  <GameForms/>
              </div>
            }/>
            <Route exact path="/tools" element={<DeveloperTools/>}/>
          </Routes>
        </HashRouter>
      </div>
    </>
  );
}

export default App;
