import { useEffect, useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
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
  const [accountString, setAccountString] = useState(null)
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
    setAccountString(account.toString().slice(0,7))

    setIsLoading(false)
  }

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading]);

  return(
    <>
    <div style={{flex: 1, flexDirection: 'column', background: 'gray'}}>
      <Navigation account={account} accountString={accountString}/>
      <Container style={{background: 'red', textAlignVertical: 'center'}}>
        {isLoading ? (
          <Loading />
        ) : (
          <Row className="text-center" style={{background: 'blue', height: '100%'}}>
            <Col style={{background: 'blue', height: '100%'}}>
              test
            </Col>
            <Col style={{background: 'green'}}>
              test2
            </Col>
          </Row>
        )}
      </Container>
    </div>
    </>
  )
}

export default App;
