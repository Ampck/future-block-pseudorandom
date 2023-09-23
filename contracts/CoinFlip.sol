// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Uncomment this line to use console.log
import "hardhat/console.sol";
import "./Random.sol";

contract CoinFlip is Random {

	//Global Info

	address public owner;
	uint256 public feeBalance;
		//The total amount of fees (in wei) that belong to the house but have
		//not yet left the contract
	//uint256 public gameLifetime;
		//Number of seconds until a game request expires
	uint256 public completionDelay;
		//Number of blocks between challenger accepting and finalization opening
	uint256 public minimumBet;
	//uint256 public maxActiveGames;
		//Maximum active games a single user can have at once, set to 0 for infinite
	uint256 public feeNumerator;
	uint256 public feeDenominator;
		//Winner's profit is multiplied by (feeNumerator/feeDenominator)
		//This amount is taken by contract as fee
		//EXAMPLE:
			//feeNumerator = 291;
			//feeDenomiator = 10000;
			//total fee = 2.91%
	uint256 public totalGames;
		//Total number of games created
	uint256 public totalWinnings;
		//Total profits payed out to winners

	//Data Structures

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
        	//0 = null (untouched)
        	//1 = active
        	//2 = accepted
        	//3 = completed
        	//4 = cancelled
        	//5 = expired
    }
    mapping(uint256 => Game) public games;

    struct Stats {
    	uint256 wins; //number of wins
    	uint256 losses; //number of losses
    	uint256 activeGames; //number of active games created by given user
    	uint256 totalUserGames; //number of total games ever created by given user
    	mapping(uint256 => uint256) userGameIds; //ids of all games created by user
    	uint256 totalUserAcceptedGames; //number of total games ever accepted by given user
    	mapping(uint256 => uint256) userAcceptedGameIds; //ids of all games accepted by user
    }
	mapping(address => Stats) public stats;

	constructor
		(/*uint256 _gameLifetime,*/
		uint256 _completionDelay,
		uint256 _minimumBet,
		uint256 _feeNumerator,
		uint256 _feeDenominator)
	{
		owner = msg.sender;
		//gameLifetime = _gameLifetime;
		completionDelay = _completionDelay;
		minimumBet = _minimumBet;
		feeNumerator = _feeNumerator;
		feeDenominator = _feeDenominator;
		feeBalance = 0;
		totalGames = 0;
		totalWinnings = 0;
	}

	//Function Modifiers

	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}

	//Events

	event CreateGame(
		uint256 id,
		address creator,
		uint256 wager,
		bool erc20/*,
		uint256 creationTime*/
	);

	event AcceptGame(
		uint256 id,
		address challenger,
		uint256 blockAccepted
	);

	event CancelGame(
		uint256 id
	);

	event FinalizeGame(
		uint256 id,
		address winner,
		uint256 pot/*,
		uint256 completionTime*/
	);

	event UpdateFee(
		uint256 feeNumerator,
		uint256 feeDenominator
	);

	//Mapping Data Retrieval Functions

	function getUserGameIds
		(address _user,
		uint256 _index)
		view
		public
		returns(uint256)
	{
		return(stats[_user].userGameIds[_index]);
	}

	function getUserAcceptedGameIds
		(address _user,
		uint256 _index)
		view
		public
		returns(uint256)
	{
		return(stats[_user].userAcceptedGameIds[_index]);
	}

	//Publicly Accessible Functions

	function createGame_ETH()
		public
		payable
	{
		
		//requirements
		/*
		require(
			(stats[msg.sender].activeGames <= maxActiveGames)
			||
			(maxActiveGames == 0),
			"User has too many active games..."
		);
		*/
		require(msg.value >= minimumBet, "Wager is less than minimum bet...");

		//setup game
		totalGames++;
		games[totalGames].id = totalGames;
		games[totalGames].creator = msg.sender;
		games[totalGames].wager = msg.value;
		games[totalGames].erc20 = false; //redundant state change for safety
		games[totalGames].creationTime = block.timestamp;
			//This timestamp is early by one block, but this minor
			//innaccuracy does not hurt performance
		games[totalGames].status = 1; //set game to active

		//Update creator's created game count and list
		stats[msg.sender].activeGames++;
		stats[msg.sender].totalUserGames++;
		stats[msg.sender]
			.userGameIds[
				stats[msg.sender].
				totalUserGames
			] = totalGames;
			//Set latest game in creator's created game list to this game

		emit CreateGame(
			games[totalGames].id,
			games[totalGames].creator,
			games[totalGames].wager,
			games[totalGames].erc20/*,
			games[totalGames].creationTime*/
		);
	}

/*
	function createGame_ERC20
		(uint256 _wager,
		address _erc20Address)
		public
		returns(uint256)
	{
		return 0;
	}
*/

	function acceptGame
		(uint256 _id)
		public
		payable
	{
		require(games[_id].creator != msg.sender, "Challenger can not be creator...");
		require(msg.value >= games[_id].wager, "Sent ETH is less than wager...");
		require(_checkActive(_id), "Game is not active...");
		//require(!_checkExpired(_id), "Game is expired...");

		//Send excess ETH back to challenger
		uint256 diff = msg.value - games[_id].wager;
		if (diff > 0) {
			(bool sent, ) = msg.sender.call{value: diff}("");
			require(sent, "Exces ETH not sent back to challenger");
		}
		
		games[_id].challenger = msg.sender;
		games[_id].blockAccepted = block.number;
		games[_id].status = 2; //Set status to pending

		stats[games[_id].creator].activeGames--;

		//Update challenger's accepted game count and list
		stats[msg.sender].totalUserAcceptedGames++;
		stats[msg.sender]
			.userAcceptedGameIds[
				stats[msg.sender].
				totalUserAcceptedGames
			] = _id;
			//Set latest game in challenger's accepted game list to this game


		emit AcceptGame(
			_id,
			games[_id].challenger,
			games[_id].blockAccepted
		);
	}

	function finalizeGame
		(uint256 _id)
		public
	{
		require(games[_id].status == 2, "Game status is not pending...");
		uint256 finishedBlock = games[_id].blockAccepted + completionDelay;
		require(block.number > finishedBlock, "Game can not yet be finalized...");

		//Retrieve random number and set winner
		uint256 winner = _random(finishedBlock) % 2;
		require((winner == 0 || winner == 1), "Random winner result not within expect bounds...");
		
		//Updates user statistics and winner of current game
		if (winner == 0) {
			games[_id].winner = games[_id].creator;
			stats[games[_id].creator].wins++;
			stats[games[_id].challenger].losses++;
		} else if (winner == 1) {
			games[_id].winner = games[_id].challenger;
			stats[games[_id].challenger].wins++;
			stats[games[_id].creator].losses++;
		}

		//Calculate house fee and winner payout
		uint256 pot = games[_id].wager * 2;
		uint256 fee = (pot * feeNumerator) / feeDenominator;
		uint256 payout = pot - fee;
		feeBalance += fee; //Add fee to house fee balance
		totalWinnings += pot; //Add pot to global total winnings
		//Send payout to winner
		(bool sent, ) = games[_id].winner.call{value: payout}("");
		require(sent, "ETH not sent to winner...");

		//Update state of game with further details
		games[_id].completionTime = block.timestamp;
		games[_id].status = 3; //set game status to completed

		emit FinalizeGame(_id, games[_id].winner, pot/*, games[_id].completionTime*/);
	}

	function cancelGame
		(uint256 _id)
		public
	{
		require(games[_id].creator == msg.sender, "Attempted to cancel game without ownership...");
		require(_checkActive(_id), "Game is already pending or inactive...");

		//Return wager to creator
		(bool sent, ) = games[_id].creator.call{value: games[_id].wager}("");
		require(sent, "ETH not returned to creator...");

		/*
		if (_checkExpired(_id)) {
			games[_id].status = 5; //set game status to expired
		} else {
			games[_id].status = 4; //set game status to cancelled
		}
		*/

		games[_id].status = 4;//set game status to cancelled

		stats[msg.sender].activeGames--; //decrease number of active games for user

		emit CancelGame(_id);
	}

	function cancelAllGames()
		public
	{
		require(stats[msg.sender].activeGames > 0, "User has no active games to cancel...");

    	uint256 _totalUserGames = stats[msg.sender].totalUserGames;
    	//mapping(uint256 => uint256) userGameIds; //ids of all games created by user

		while (stats[msg.sender].activeGames > 0) {
			if (games[stats[msg.sender].userGameIds[_totalUserGames]].status == 0) {
				cancelGame(stats[msg.sender].userGameIds[_totalUserGames]);
			}
			_totalUserGames--;
		}

	}

	//Admin Functions

	function updateFee
		(uint256 _feeNumerator,
		uint256 _feeDenominator)
		public
		onlyOwner
	{
		feeNumerator = _feeNumerator;
		feeDenominator = _feeDenominator;

		emit UpdateFee(feeNumerator, feeDenominator);
	}

	//Internal Utility Functions

	function _checkActive
		(uint256 _id)
		view
		internal
		returns(bool)
	{
		return(games[_id].status == 1);
	}

/*
	function _checkExpired
		(uint256 _id)
		view
		internal
		returns(bool)
	{
		return(block.timestamp > (games[_id].creationTime + gameLifetime));
	}
*/

}
