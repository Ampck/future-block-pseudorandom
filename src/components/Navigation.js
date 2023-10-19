import { useSelector, useDispatch } from 'react-redux';
import Navbar from 'react-bootstrap/Navbar';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Blockies from 'react-blockies';

import { loadAccount } from '../store/interactions';

import Tabs from './Tabs';

import config from '../config.json'
import logo from '../logo.png';

const Navigation = () => {
  const dispatch = useDispatch()

  const chainId = useSelector(state => state.provider.chainId)
  const account = useSelector(state => state.provider.account)

  const connectHandler = async () => {
    const account = await loadAccount(dispatch)
    //await loadBalances(amm, tokens, account, dispatch)
  }

  const networkHandler = async (e) => {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: e.target.value }],
    })
  }

  return (
  	<>
	    <Navbar className='align-contents-center' style={{display: 'flex', backgroundColor: 'white', height: '80px', width: '100%', margin: '0px auto', paddingLeft: '10%', paddingRight: '10%'}} expand='lg'>
	      <img
	        alt="logo"
	        src={logo}
	        width="40"
	        height="40"
	        className="d-inline-block align-top mx-3"
	      />
	      <Navbar.Brand href="#">TM Casino</Navbar.Brand>
	      <Navbar.Collapse className="justify-content-end">
	      	<div className='d-flex align-items-center mx-5'>
		      	<Tabs/>
		      </div>
	        <div className="d-flex justify-content-end">
	          <Form.Select
	            aria-label="Network Selector"
	            value={config[chainId] ? `0x${chainId.toString(16)}` : `0`}
	            onChange={networkHandler}
	            style={{ maxWidth: '175px', minWidth: '125px', marginRight: '20px' }}
	          >
	            <option value="0" disabled>Select Network</option>
	            <option value="0x7A69">Localhost</option>
	            <option value="0x5">Goerli</option>
	          </Form.Select>
	          {account ? (
	            <Navbar.Text className='d-flex align-items-center'>
	              {account.slice(0, 6) + '...' + account.slice(38, 42)}
	              <Blockies
	                seed={account}
	                size={10}
	                scale={3}
	                className="identicon mx-2"
	              />
	            </Navbar.Text>
	          ) : (
	            <Button onClick={connectHandler}>
	              Connect
	            </Button>
	          )}
	        </div>
	      </Navbar.Collapse>
	    </Navbar>
	</>
  );
}

export default Navigation;
