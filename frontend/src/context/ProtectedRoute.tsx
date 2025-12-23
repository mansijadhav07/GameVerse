import { useAuth } from '@/context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // This is the friendly message component that shows when not logged in
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground">Please log in to view this page.</p>
            <Navigate to="/login" state={{ from: location }} replace className="hidden" />
        </div>
    );
  }

  return children;
};

export default ProtectedRoute;
