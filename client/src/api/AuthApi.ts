import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { refreshToken, signOut, unifiedAuth, type UserCredentials } from "../redux/authSlice";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";



// In your AuthApi.ts
export const useUnifiedAuth = () => {
    const dispatch = useDispatch<AppDispatch>()
    const { user, status, error, teamCreationInProgress } = useSelector((state: RootState) => state.auth)
    const [isCheckingTeamStatus, setIsCheckingTeamStatus] = useState(false)

    const checkTeamStatus = useCallback(async (email: string, password: string) => {
        setIsCheckingTeamStatus(true)
        try {
            const result = await dispatch(unifiedAuth({ email, password })).unwrap()
            if (result.user?.hasTeam) {
                return true
            }
            return false
        } catch (error) {
            console.error('Error checking team status:', error)
            return false
        } finally {
            setIsCheckingTeamStatus(false)
        }
    }, [dispatch])

    const Register = async (userData: UserCredentials) => {
        try {
            const result = await dispatch(unifiedAuth(userData)).unwrap()
            if (result.message === 'Team creation in progress') {
                let attempts = 0
                const maxAttempts = 10
                const interval = 3000

                const checkInterval = setInterval(async () => {
                    attempts++
                    const hasTeam = await checkTeamStatus(userData.email, userData.password)

                    if (hasTeam || attempts >= maxAttempts) {
                        clearInterval(checkInterval)
                        if (hasTeam) {
                            toast.success('Team created successfully!')
                        } else {
                            toast.error('Team creation is taking longer than expected. Please check back later.')
                        }
                    }
                }, interval)

                return () => clearInterval(checkInterval)
            }

            return result
        } catch (error) {
            throw typeof error === 'string' ? error : 'Signup failed'
        }
    }

    return {
        user,
        authStatus: status,
        error,
        teamCreationStatus: isCheckingTeamStatus ? 'checking' :
            teamCreationInProgress ? 'in-progress' :
                user?.hasTeam ? 'completed' : 'idle',
        Register,
        checkTeamStatus
    }
}



export const useRefreshToken = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthenticated, status } = useSelector((state: RootState) => state.auth);

    const refresh = async () => {
        try {
            const result = await dispatch(refreshToken()).unwrap();
            return result;
        } catch (error) {
            throw typeof error === 'string' ? error : 'Failed to refresh token';
        }
    };

    return {
        refresh,
        isRefreshing: status === 'loading',
        isAuthenticated
    };
};

export const useSignOut = () => {
    const dispatch = useDispatch<AppDispatch>();

    const signOutUser = async () => {
        try {
            await dispatch(signOut()).unwrap();
        } catch (error) {
            console.error('Logout failed:', error);
            throw typeof error === 'string' ? error : 'Logout failed';
        }
    };

    return {
        signOut: signOutUser
    };
};


