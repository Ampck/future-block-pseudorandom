import Nav from 'react-bootstrap/Nav';
import { LinkContainer } from 'react-router-bootstrap';

const Tabs = () => {
	return(
		<Nav variant='pills' defaultActiveKey='/' className='justify-content-center my-4'>
			<LinkContainer to='/'>
				<Nav.Link>
					Games
				</Nav.Link>
			</LinkContainer>
			<LinkContainer to='/cancel'>
				<Nav.Link>
					Cancel
				</Nav.Link>
			</LinkContainer>
			<LinkContainer to='/tools'>
				<Nav.Link>
					Tools
				</Nav.Link>
			</LinkContainer>
		</Nav>
	);
}

export default Tabs;