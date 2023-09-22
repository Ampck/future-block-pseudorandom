import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

import logo from '../logo.png';

const Navigation = ({ account, accountString }) => {
  return (
    <div style={{padding: '7px 0px 7px 0px', background:'black', display: 'block', width: '100vw'
  }}>
      <Navbar className='text-center' style={{margin:'0px 10% 0px 10%', color:'white'}}>
        <div style={{width: '10%'}}>
          <img
            alt="logo"
            src={logo}
            width="40"
            height="40"
            className=""
          />
        </div>
        <Nav className="justify-content-center flex-grow-1 text-center" style={{}}>
          <Nav.Link href="#action1" style={{fontSize: '20px', fontWeight: 'bold', margin: '0 5% 0 5%', color:'white'}}>Games</Nav.Link>
          <Nav.Link href="#action1" style={{fontSize: '20px', fontWeight: 'bold', margin: '0 5% 0 5%', color:'white'}}>Stats</Nav.Link>
          <Nav.Link href="#action1" style={{fontSize: '20px', fontWeight: 'bold', margin: '0 5% 0 5%', color:'white'}}>About</Nav.Link>
        </Nav>
        <Nav.Link href="#action1" className="justify-content-end" style={{width: '10%', color:'white'}}>{(accountString)}...</Nav.Link>
      </Navbar>
    </div>
  );
}

export default Navigation;
