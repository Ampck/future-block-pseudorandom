import { configureStore } from '@reduxjs/toolkit'

import provider from './reducers/provider'
import tokens from './reducers/tokens'
import coinflip from './reducers/coinflip'

export const store = configureStore({
	reducer: {
		provider,
		tokens,
		coinflip
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: false
		})
})