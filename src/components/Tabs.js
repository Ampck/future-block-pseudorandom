import Nav from 'react-bootstrap/Nav';
import { LinkContainer } from 'react-router-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const Tabs = () => {
	return(
		<Nav variant='pills' defaultActiveKey='/' className='justify-content-center my-4'>
			<LinkContainer className='px-3 mx-2' to='/'>
				<Nav.Link>
					Games
				</Nav.Link>
			</LinkContainer>
			<LinkContainer className='px-3 mx-2' to='/tools'>
				<Nav.Link>
					Tools
				</Nav.Link>
			</LinkContainer>
		</Nav>
	);
}

export default Tabs;