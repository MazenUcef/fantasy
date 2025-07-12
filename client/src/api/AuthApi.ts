import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { unifiedAuth, type UserCredentials } from "../redux/authSlice";


export const useUnifiedAuth = () => {
    const dispatch = useDispatch<AppDispatch>()
    const { user, status, error } = useSelector((state: RootState) => state.auth)


    const Register = async (userData: UserCredentials) => {
        try {
            const result = await dispatch(unifiedAuth(userData)).unwrap();
            return result;
        } catch (error) {
            throw typeof error === 'string' ? error : 'Signup failed';
        }
    };



    return {
        user,
        authStatus: status,
        error,
        Register,
    };
}