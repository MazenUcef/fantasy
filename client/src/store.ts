import type { PersistPartial } from 'redux-persist/es/persistReducer';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer, { type AuthState } from './redux/authSlice';
import teamReducer from './redux/teamSlice';
import transferReducer from './redux/transferSlice';



const persistConfig = {
    key: "root",
    storage
}

const rootReducer = combineReducers({
    auth: authReducer,
    team: teamReducer,
    transfer:transferReducer
})


const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export const persistor = persistStore(store);

export interface RootState extends PersistPartial {
    auth: AuthState;
    team: ReturnType<typeof teamReducer>;
    transfer: ReturnType<typeof transferReducer>;
}
export type AppDispatch = typeof store.dispatch;

export default store;