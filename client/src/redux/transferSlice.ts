import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../config";
import toast from "react-hot-toast";

export interface TransferPlayer {
    id: string;
    name: string;
    position: string;
    transferPrice: number;
    teamName: string;
    isOwnPlayer: boolean;
}

interface TransferListState {
    players: TransferPlayer[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    lastFetchTime: number | null;
    currentParams: string | null;
}

const initialState: TransferListState = {
    players: [],
    status: "idle",
    error: null,
    lastFetchTime: null,
    currentParams: null
};

const CACHE_DURATION = 5 * 60 * 1000;

const showErrorToast = (() => {
    let lastError: string | null = null;
    let lastToastTime = 0;

    return (error: string) => {
        const now = Date.now();
        if (error !== lastError || now - lastToastTime > 3000) {
            toast.error(error);
            lastError = error;
            lastToastTime = now;
        }
    };
})();

export const getTransferList = createAsyncThunk(
    'transfer/getTransferList',
    async (params: URLSearchParams, { getState, rejectWithValue }) => {
        try {
            const { transfer } = getState() as { transfer: TransferListState };
            const paramsString = params.toString();
            

            if (transfer.currentParams === paramsString && 
                transfer.lastFetchTime && 
                Date.now() - transfer.lastFetchTime < CACHE_DURATION) {
                return transfer.players; // Return cached data
            }
            
            const response = await api.get(`/api/transfer/getTransferList?${paramsString}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch transfer list');
        }
    }
);

export const buyPlayer = createAsyncThunk(
    'transfer/buy',
    async (playerId: string, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/transfer/buy', { playerId });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to buy player');
        }
    }
);

export const listPlayer = createAsyncThunk(
    'transfer/list',
    async ({ playerId, price }: { playerId: string; price: number }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/transfer/list', { playerId, price });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to list player');
        }
    }
);

export const unlistPlayer = createAsyncThunk(
    'transfer/unlist',
    async (playerId: string, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/transfer/unlist', { playerId });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to unlist player');
        }
    }
);

export const updateAskingPrice = createAsyncThunk(
    'transfer/price',
    async ({ playerId, newPrice }: { playerId: string; newPrice: number }, { rejectWithValue }) => {
        try {
            const response = await api.put('/api/transfer/price', { playerId, newPrice });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update price');
        }
    }
);

const transferSlice = createSlice({
    name: "transfer",
    initialState,
    reducers: {
        clearTransferError: (state) => {
            state.error = null;
        },
        resetTransferState: () => initialState,

        invalidateTransferCache: (state) => {
            state.lastFetchTime = null;
            state.currentParams = null;
        }
    },
    extraReducers: (builder) => {
        builder

            .addCase(getTransferList.pending, (state, action) => {
                const paramsString = action.meta.arg.toString();

                if (state.currentParams !== paramsString || 
                    !state.lastFetchTime || 
                    Date.now() - state.lastFetchTime >= CACHE_DURATION) {
                    state.status = 'loading';
                }
                state.error = null;
            })
            .addCase(getTransferList.fulfilled, (state, action) => {
                const paramsString = action.meta.arg.toString();

                if (state.status === 'loading') {
                    state.players = action.payload;
                    state.lastFetchTime = Date.now();
                    state.currentParams = paramsString;
                    state.status = 'succeeded';
                }
            })
            .addCase(getTransferList.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
                showErrorToast(action.payload as string);
            })


            .addCase(listPlayer.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(listPlayer.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.lastFetchTime = null;
                state.currentParams = null;
                toast.success(action.payload.message);
            })
            .addCase(listPlayer.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
                toast.error(action.payload as string || 'Failed to list player');
            })


            .addCase(unlistPlayer.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(unlistPlayer.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.lastFetchTime = null;
                state.currentParams = null;
                toast.success(action.payload.message);
            })
            .addCase(unlistPlayer.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
                toast.error(action.payload as string || 'Failed to unlist player');
            })


            .addCase(buyPlayer.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(buyPlayer.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.lastFetchTime = null;
                state.currentParams = null;
                toast.success(action.payload.message);
            })
            .addCase(buyPlayer.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
                showErrorToast(action.payload as string);
            })


            .addCase(updateAskingPrice.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateAskingPrice.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.lastFetchTime = null;
                state.currentParams = null;
                toast.success(action.payload.message);
            })
            .addCase(updateAskingPrice.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
                toast.error(action.payload as string || 'Failed to update price');
            });
    }
});

export const {
    clearTransferError,
    resetTransferState,
    invalidateTransferCache
} = transferSlice.actions;

export default transferSlice.reducer;