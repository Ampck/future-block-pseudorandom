import { createSlice } from '@reduxjs/toolkit'

export const provider = createSlice({
	name: 'provider',
	initialState: {
		connection: null,
		chainId: null,
		account: null
	},
	reducers: {
		setProvider: (state, action) => {
			state.connection = action.payload
		},
		setAccount: (state, action) => {
			state.account = action.payload
		},
		setNetwork: (state, action) => {
			state.chainId = action.payload
		}
	}
})

export const { setProvider, setAccount, setNetwork } = provider.actions;

export default provider.reducer;