import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

import cflogo from '../cflogo.jpeg';

function Navigation({account}) {
	return (
		<header>
	        <a href="http://localhost:3000/">
	        	<img src={cflogo} alt="Home" style={{
	        		width:'32px'
	        	}}/>
	        </a>
	        <a>
	        	<div className="dropdown">
	        		<button className="dropbtn">Games List</button>
	        		<div id="myDropdown" className="dropdown-content">
	        			<a href="#">Coin Flip</a>
	        			<a href="#">Roulette</a>
	        		</div>
	        	</div>
	        </a>
	        <a>About</a>
	        <span>{account}</span>
		</header>
	);
}

export default Navigation;