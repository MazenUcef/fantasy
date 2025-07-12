import { Outlet, useLocation } from "react-router"



const RootLayout = () => {
    const location = useLocation();
    const path = location.pathname;
    return (
        <div>
            <Outlet />
        </div>
    )
}

export default RootLayout