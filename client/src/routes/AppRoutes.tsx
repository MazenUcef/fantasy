import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import RootLayout from "../layout/RootLayout";
import Home from "../pages/Home";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import AuthPage from "../pages/Register";


const AppRoutes = () => {
    const { user } = useSelector((state: RootState) => state.auth);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RootLayout />}>
                    <Route
                        index
                        element={
                            user?.hasTeam ? (
                                <Home />
                            ) : (
                                <Navigate to="/auth" replace />
                            )
                        }
                    />
                    <Route
                        path="/home"
                        element={
                            user?.hasTeam ? (
                                <Home />
                            ) : (
                                <Navigate to="/auth" replace />
                            )
                        }
                    />
                    <Route
                        path="/auth"
                        element={
                            !user?.hasTeam ? (
                                <AuthPage />
                            ) : (
                                <Navigate to={user?.hasTeam ? "/home" : "/auth"} replace />
                            )
                        }
                    />
                    {/* Catch-all route */}
                    <Route
                        path="*"
                        element={
                            <Navigate
                                to={user?.hasTeam ? "/home" : "/auth"}
                                replace
                            />
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;