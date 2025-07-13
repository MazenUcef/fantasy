import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../config";
import toast from "react-hot-toast";

interface Player {
    id: string;
    name: string;
    position: string;
    isOnTransferList: boolean;
    transferPrice?: number;
}

interface TeamData {
    teamId: string;
    teamName: string;
    budget: number;
    players: Player[];
    version: number;
}

interface TeamState {
    data: TeamData | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    lastFetchTime: number | null;
    forceRefresh: boolean;
}

const initialState: TeamState = {
    data: null,
    status: "idle",
    error: null,
    lastFetchTime: null,
    forceRefresh: false
};

const CACHE_DURATION = 2 * 60 * 1000;

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

export const getMyTeamPlayers = createAsyncThunk<
    TeamData,
    boolean | undefined,
    { state: { team: TeamState }, rejectValue: string }
>(
    'team/getMyTeamPlayers',
    async (forceRefresh = false, { getState, rejectWithValue }) => {
        try {
            const { team } = getState() as { team: TeamState };
            
            
            if (!forceRefresh && 
                !team.forceRefresh &&
                team.lastFetchTime && 
                Date.now() - team.lastFetchTime < CACHE_DURATION &&
                team.data) {
                return team.data;
            }
            
            const response = await api.get('/api/transfer/getMyTeamPlayers');
            return {
                ...response.data,
                version: team.data?.version ? team.data.version + 1 : 1
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch team players');
        }
    }
);

export const updateTeamName = createAsyncThunk(
    'team/updateName',
    async (teamName: string, { rejectWithValue }) => {
        try {
            if (!teamName || teamName.trim().length < 3 || teamName.trim().length > 30) {
                throw new Error('Team name must be between 3-30 characters');
            }

            const response = await api.post('/api/team/updateTeamName', { teamName });
            return {
                ...response.data,
                version: response.data.version || Date.now()
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update team name');
        }
    }
);

const teamSlice = createSlice({
    name: "team",
    initialState,
    reducers: {
        clearTeamError: (state) => {
            state.error = null;
        },
        resetTeamState: () => initialState,
        invalidateTeamCache: (state) => {
            state.lastFetchTime = null;
            state.forceRefresh = true;
        },
        // Action to manually update player data
        updateTeamPlayers: (state, action) => {
            if (state.data) {
                state.data.players = action.payload.players;
                state.data.version = action.payload.version || Date.now();
                state.lastFetchTime = null;
                state.forceRefresh = true;
            }
        },
        // Action to clear force refresh flag
        clearForceRefresh: (state) => {
            state.forceRefresh = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getMyTeamPlayers.pending, (state, action) => {
                if (action.meta.arg ||
                    state.forceRefresh ||
                    !state.lastFetchTime || 
                    Date.now() - state.lastFetchTime >= CACHE_DURATION) {
                    state.status = 'loading';
                }
                state.error = null;
            })
            .addCase(getMyTeamPlayers.fulfilled, (state, action) => {
                state.data = action.payload;
                state.lastFetchTime = Date.now();
                state.status = 'succeeded';
                state.forceRefresh = false;
            })
            .addCase(getMyTeamPlayers.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
                state.forceRefresh = false;
                showErrorToast(action.payload as string);
            })
            .addCase(updateTeamName.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateTeamName.fulfilled, (state, action) => {
                state.status = 'succeeded';
                if (state.data) {
                    state.data.teamName = action.payload.teamName;
                    state.data.budget = action.payload.budget || state.data.budget;
                    state.data.version = action.payload.version;
                    state.lastFetchTime = null;
                    state.forceRefresh = true;
                }
            })
            .addCase(updateTeamName.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
                showErrorToast(action.payload as string);
            });
    }
});

export const { 
    clearTeamError, 
    resetTeamState, 
    invalidateTeamCache,
    updateTeamPlayers,
    clearForceRefresh
} = teamSlice.actions;

export default teamSlice.reducer;