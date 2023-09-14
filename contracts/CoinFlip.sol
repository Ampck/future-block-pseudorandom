// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Uncomment this line to use console.log
import "hardhat/console.sol";
import "./Random.sol";

contract CoinFlip is Random {

	//Global Info
	uint256 public gameLifetime;
		//Number of seconds until a game request expires
	uint256 public minimumBet;
	uint256 public maxActiveGames;
		//Maximum active games a single user can have at once, set to 0 for infinite
	uint256 public feeNumerator;
	uint256 public feeDenominator;
		//Winner's profit is multiplied by (feeNumerator/feeDenominator)
		//This amount is taken by contract as fee
		//EXAMPLE:
			//feeNumerator = 3;
			//feeDenomiator = 100;
			//total fee = 3%
	uint256 public totalGames;
		//Total number of games created



	//Custom Data Structures

	struct Game {
        uint256 id; //id of game
        address creator; //address of creator
        address challenger; //address of challenger
        address winner; //address of winner
        uint256 wager; //amount for each player to send
        bool erc20; //if false, use ETH, if true
        address erc20Address; //address of desired erc20 token
        uint256 creationTime; //unix time (seconds) when game was created
        uint256 completionTime; //unix time (seconds) when completed and paid out
        uint256 blockAccepted; //block number when challenger accepted
        uint256 status;
        	//0 = active
        	//1 = accepted
        	//2 = completed
        	//3 = cancelled
    }
    mapping(uint256 => Game) public games;

    struct Stats {
    	uint256 wins; //number of wins
    	uint256 losses; //number of losses
    	uint256 activeGames; //number of active games created by given user
    	uint256 totalUserGames; //number of total games ever created by given user
    	mapping(uint256 => uint256) userGameIds; //ids of all games created by user
    }
	mapping(address => Stats) public stats;



	constructor
		(uint256 _gameLifetime,
		uint256 _feeNumerator,
		uint256 _feeDenominator,
		uint256 _minimumBet)
	{
		gameLifetime = _gameLifetime;
		feeNumerator = _feeNumerator;
		feeDenominator = _feeDenominator;
		minimumBet = _minimumBet;
		totalGames = 0;
	}



	//Publicly Accessible Functions

	function createGame_ETH
		(uint256 _wager)
		public
		payable
		returns(uint256)
	{
		
		//requirements
		require(
			(stats[msg.sender].activeGames <= maxActiveGames)
			||
			(maxActiveGames == 0),
			"User has too many active games..."
		);
		require(msg.value >= minimumBet, "Wager is less than minimum bet");

		//setup game
		totalGames++;
		games[totalGames].creator = msg.sender;
		games[totalGames].wager = msg.value;
		games[totalGames].erc20 = false; //redundant state change for safety
		games[totalGames].creationTime = block.timestamp;
			//This timestamp is early by one block, but this minor
			//innaccuracy does not hurt performance
		games[totalGames].status = 0; //redundant state change for safety

		//update data
		stats[msg.sender].activeGames++;
		stats[msg.sender].totalUserGames++;
		stats[msg.sender]
			.userGameIds[
				stats[msg.sender].
				totalUserGames
			] = totalGames;
			//Set latest game in user stats to this game
		return totalGames; //return id of game
	}

	function createGame_ERC20
		(uint256 _wager,
		address _erc20Address)
		public
		returns(uint256)
	{
		return 0;
	}
/*
	function acceptGame
		(uint256 _id)
		public
	{

	}
*/
	function cancelGame
		(uint256 _id)
		public
	{
		require(games[_id].creator == msg.sender, "Attempted to cancel game without ownership...");
		require(_checkActive(_id), "Game is already pending or inactive...");
		
		stats[msg.sender].activeGames--; //decrease number of active games for user
		games[_id].status = 3; //set game status to cancelled
	}



	//Internal Utility Functions

	function _checkActive
		(uint256 _id)
		view
		internal
		returns(bool)
	{
		return(games[_id].status == 0 && !_checkExpired(_id));
	}

	function _checkExpired
		(uint256 _id)
		view
		internal
		returns(bool)
	{
		return(block.timestamp > (games[_id].creationTime + gameLifetime));
	}

}
