import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { buyPlayer, getTransferList, listPlayer, unlistPlayer, updateAskingPrice } from "../redux/transferSlice";
import { useCallback } from "react";
import { useTeamPlayers } from "./TeamApi";

export const useTransferList = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { players, status, error } = useSelector((state: RootState) => state.transfer);

    const fetchTransferList = useCallback(async (filters?: {
        position?: string;
        minPrice?: number;
        maxPrice?: number;
        search?: string;
        teamName?: string;
    }) => {
        try {
            const params = new URLSearchParams();
            if (filters?.position) params.append('position', filters.position);
            if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
            if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
            if (filters?.search) params.append('search', filters.search);
            if (filters?.teamName) params.append('teamName', filters.teamName);

            await dispatch(getTransferList(params)).unwrap();
        } catch (error) {
            throw typeof error === 'string' ? error : 'Failed to fetch transfer list';
        }
    }, [dispatch]);

    return {
        transferList: players,
        loading: status === 'loading',
        error,
        fetchTransferList
    };
};


export const usePlayerListing = () => {
    const dispatch = useDispatch<AppDispatch>();

    const listPlayerForTransfer = async (playerId: string, price: number) => {
        try {
            await dispatch(listPlayer({ playerId, price })).unwrap();
        } catch (error) {
            throw typeof error === 'string' ? error : 'Failed to list player';
        }
    };

    const unlistPlayerFromTransfer = async (playerId: string) => {
        try {
            await dispatch(unlistPlayer(playerId)).unwrap();
        } catch (error) {
            throw typeof error === 'string' ? error : 'Failed to unlist player';
        }
    };

    return {
        listPlayer: listPlayerForTransfer,
        unlistPlayer: unlistPlayerFromTransfer
    };
};



export const usePlayerPurchase = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { fetchTeamPlayers } = useTeamPlayers();

    const purchasePlayer = useCallback(async (playerId: string) => {
        try {
            await dispatch(buyPlayer(playerId)).unwrap();
            await fetchTeamPlayers();
        } catch (error) {
            throw typeof error === 'string' ? error : 'Failed to buy player';
        }
    }, [dispatch, fetchTeamPlayers]);

    return {
        buyPlayer: purchasePlayer
    };
};





export const usePriceUpdate = () => {
    const dispatch = useDispatch<AppDispatch>();

    const updatePlayerPrice = async (playerId: string, newPrice: number) => {
        try {
            await dispatch(updateAskingPrice({ playerId, newPrice })).unwrap();
        } catch (error) {
            throw typeof error === 'string' ? error : 'Failed to update price';
        }
    };

    return {
        updatePrice: updatePlayerPrice
    };
};