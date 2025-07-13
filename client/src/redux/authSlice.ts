import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../config";
import toast from "react-hot-toast";

export interface User {
    _id: string;
    email: string;
    hasTeam: boolean;
    tokenVersion?: number;
}

export interface AuthState {
    user: User | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    isAuthenticated: boolean;
    teamCreationInProgress: boolean;
}

export interface UserCredentials {
    email: string;
    password: string;
}

const initialState: AuthState = {
    user: null,
    status: "idle",
    error: null,
    isAuthenticated: false,
    teamCreationInProgress: false
};

export const unifiedAuth = createAsyncThunk(
    'auth/unified',
    async (userData: UserCredentials, { rejectWithValue }) => {
        try {
            const res = await api.post(`${import.meta.env.VITE_API_BASE_URL}api/auth/unifiedAuth`, {
                email: userData.email,
                password: userData.password
            });
            console.log("unifiedAuth", res);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Token refresh failed');
        }
    }
);

export const refreshToken = createAsyncThunk(
    'auth/refresh',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/auth/refresh');
            console.log("refresh respone", response);

            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Token refresh failed');
        }
    }
)

export const signOut = createAsyncThunk(
    'auth/signout',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/auth/signout');
            console.log("signout response", response);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Logout failed');
        }
    }
)

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearAuthError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder

            .addCase(unifiedAuth.pending, (state) => {
                state.status = 'loading',
                    state.error = null
            })
            .addCase(unifiedAuth.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.teamCreationInProgress = action.payload.message === 'Team creation in progress';

                if (action.payload.accessToken) {
                    console.log("ACCEESS_tOKEN", action.payload.accessToken);

                    localStorage.setItem('accessToken', action.payload.accessToken);
                }

                if (action.payload.message) {
                    toast.success(action.payload.message);
                }
            })
            .addCase(unifiedAuth.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
                state.isAuthenticated = false;
                toast.error(action.payload as string || 'Authentication failed');
            })

            // Refresh Token reducers
            .addCase(refreshToken.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(refreshToken.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.isAuthenticated = true;

                if (action.payload.accessToken) {
                    localStorage.setItem('accessToken', action.payload.accessToken);
                }
            })
            .addCase(refreshToken.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
                state.isAuthenticated = false;
                localStorage.removeItem('accessToken');
            })

            // Sign Out reducers
            .addCase(signOut.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(signOut.fulfilled, (state) => {
                state.status = 'idle';
                state.user = null;
                state.isAuthenticated = false;
                localStorage.removeItem('accessToken');
                toast.success('Logged out successfully');
            })
            .addCase(signOut.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
                toast.error(action.payload as string || 'Logout failed');
            });
    }
})

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;