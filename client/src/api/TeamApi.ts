import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { getMyTeamPlayers, updateTeamName } from "../redux/teamSlice";
import { useCallback } from "react";
import toast from "react-hot-toast";

export const useTeamPlayers = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { data, status, error } = useSelector((state: RootState) => state.team);

    const fetchTeamPlayers = useCallback(async () => {
        try {
            const result = await dispatch(getMyTeamPlayers()).unwrap();
            return result;
        } catch (error) {
            const errorMessage = typeof error === 'string' ? error : 'Failed to fetch team players';
            toast.error(errorMessage);
            throw errorMessage;
        }
    }, [dispatch]);

    return {
        teamData: data,
        loading: status === 'loading',
        error,
        fetchTeamPlayers,
        hasTeam: !!data,
    };
};

export const useTeamNameUpdate = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { status } = useSelector((state: RootState) => state.team);

    const updateName = useCallback(async (teamName: string) => {
        try {
            const result = await dispatch(updateTeamName(teamName)).unwrap();
            return result;
        } catch (error) {
            const errorMessage = typeof error === 'string' ? error : 'Failed to update team name';
            toast.error(errorMessage);
            throw errorMessage;
        }
    }, [dispatch]);

    return {
        updateTeamName: updateName,
        updating: status === 'loading',
    };
};