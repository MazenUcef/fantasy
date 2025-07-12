import React from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { Navigate } from 'react-router'

const AuthRoutes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth)
    if (isAuthenticated) {
        return <Navigate to="/home" replace />;
    }

    return children
}

export default AuthRoutes