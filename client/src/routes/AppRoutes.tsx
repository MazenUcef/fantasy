import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import RootLayout from "../layout/RootLayout";
import Home from "../pages/Home";
import AuthRoutes from "../components/AuthRoutes";
import Register from "../pages/Register";

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RootLayout />}>
                    <Route index element={<Home />} />
                    <Route path="/home" element={<Home />} />

                    {/* Protected auth routes */}
                    <Route path="/register" element={
                        <AuthRoutes>
                            <Register />
                        </AuthRoutes>
                    } />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};



export default AppRoutes;