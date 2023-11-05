import { createSlice } from '@reduxjs/toolkit'

export const coinflip = createSlice({
	name: 'coinflip',
	initialState: {
		contract: null,
    globals: [],
		stats: [],
		games: [],
    gamesSymbols: [],
    totalGames: 0,
    whitelisted: [],
    creating: {
      isCreating: false,
      isSucccess: false,
      transactionHash: null
    },
    accepting: {
      isAccepting: false,
      isSucccess: false,
      transactionHash: null
    },
    cancelling: {
      isCancelling: false,
      isSucccess: false,
      transactionHash: null
    },
    finalizing: {
      isFinalizing: false,
      isSucccess: false,
      transactionHash: null
    }
	},
	reducers: {
		setContract: (state, action) => {
			state.contract = action.payload
		},
		globalsLoaded: (state, action) => {
			state.globals = action.payload
		},
    statsLoaded: (state, action) => {
      state.stats = action.payload
    },
    gamesLoaded: (state, action) => {
      state.games = action.payload
    },
    gamesSymbolsLoaded: (state, action) => {
      state.gamesSymbols = action.payload
    },
    totalGamesLoaded: (state, action) => {
      state.totalGames = action.payload
    },
    whitelistedLoaded: (state, action) => {
      state.whitelisted = action.payload
    },
    createRequest: (state, action) => {
      state.creating.isCreating = true
      state.creatingcreating.isSuccess = false
      state.creating.transactionHash = null
    },
    createSuccess: (state, action) => {
      state.creating.isCreating= false
      state.creating.isSuccess = true
      state.creating.transactionHash = action.payload
    },
    createFail: (state, action) => {
      state.creating.isCreating = false
      state.creating.isSuccess = false
      state.creating.transactionHash = null
    },
    acceptRequest: (state, action) => {
      state.accepting.isAccepting = true
      state.accepting.isSuccess = false
      state.accepting.transactionHash = null
    },
    acceptSuccess: (state, action) => {
      state.accepting.isAccepting = false
      state.accepting.isSuccess = true
      state.accepting.transactionHash = action.payload
    },
    acceptFail: (state, action) => {
      state.accepting.isAccepting = false
      state.accepting.isSuccess = false
      state.accepting.transactionHash = null
    },
    cancelRequest: (state, action) => {
      state.cancelling.isCancelling = true
      state.cancelling.isSuccess = false
      state.cancelling.transactionHash = null
    },
    cancelSuccess: (state, action) => {
      state.cancelling.isCancelling = false
      state.cancelling.isSuccess = true
      state.cancelling.transactionHash = action.payload
    },
    cancelFail: (state, action) => {
      state.cancelling.isCancelling = false
      state.cancelling.isSuccess = false
      state.cancelling.transactionHash = null
    }
	}
})

export const {
  setContract,
  globalsLoaded,
  statsLoaded,
  gamesLoaded,
  gamesSymbolsLoaded,
  totalGamesLoaded,
  whitelistedLoaded,
  createRequest,
  createSuccess,
  createFail,
  acceptRequest,
  acceptSuccess,
  acceptFail,
  cancelRequest,
  cancelSuccess,
  cancelFail,
  finalizeRequest,
  finalizeSuccess,
  finalizeFail
} = coinflip.actions;

export default coinflip.reducer;