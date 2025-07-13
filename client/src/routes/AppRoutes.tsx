// AppRoutes.tsx
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import RootLayout from "../layout/RootLayout";
import Home from "../pages/Home";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import AuthPage from "../pages/Register";

const AppRoutes = () => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RootLayout />}>
                    <Route index element={
                        isAuthenticated ? (user?.hasTeam ? <Home /> : <Navigate to="/team-creation" replace />)
                            : <Navigate to="/auth" replace />
                    } />

                    <Route path="/home" element={
                        isAuthenticated ? (user?.hasTeam ? <Home /> : <Navigate to="/team-creation" replace />)
                            : <Navigate to="/auth" replace />
                    } />

                    <Route path="/auth" element={
                        !isAuthenticated ? <AuthPage /> : <Navigate to={user?.hasTeam ? "/home" : "/team-creation"} replace />
                    } />

                    <Route path="*" element={<Navigate to={isAuthenticated ? (user?.hasTeam ? "/home" : "/team-creation") : "/auth"} replace />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;