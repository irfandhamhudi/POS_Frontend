import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../context/AuthContext';
interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRole: UserRole;
}
/**
 * Redirects to /login if not authenticated.
 * Redirects to the correct route if the user's role doesn't match.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
                <div className="w-full max-w-4xl space-y-8">
                    {/* Skeleton for Header/Nav */}
                    <div className="flex items-center justify-between">
                        <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                        <div className="flex gap-4">
                            <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
                            <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
                        </div>
                    </div>
                    
                    {/* Skeleton for Main Content Area */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Sidebar/Left Column */}
                        <div className="col-span-1 space-y-4">
                            <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            <div className="h-40 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            <div className="h-40 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                        </div>
                        
                        {/* Main/Right Column */}
                        <div className="col-span-1 md:col-span-2 space-y-4">
                            <div className="h-48 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-32 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                <div className="h-32 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            </div>
                            <div className="h-64 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    if (user?.role !== allowedRole) {
        return <Navigate to={user?.role === 'admin' ? '/admin' : '/pos'} replace />;
    }
    return <>{children}</>;
};