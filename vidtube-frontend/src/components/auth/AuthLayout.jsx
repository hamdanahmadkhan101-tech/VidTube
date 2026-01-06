import { Outlet, Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl bg-surface p-8 shadow-xl">
        <h1 className="mb-2 text-center text-2xl font-semibold text-white">
          ChaiTube
        </h1>
        <p className="mb-6 text-center text-sm text-textSecondary">
          Sign in to continue
        </p>
        <Outlet />
      </div>
    </div>
  );
}


