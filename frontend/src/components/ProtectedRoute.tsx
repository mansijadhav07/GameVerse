import { Navigate } from 'react-router-dom';
// FIXED: Corrected the import path using the '@/' alias
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import Navbar from './Navbar';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();

  // If the authentication state is still loading, show a full-page loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      </div>
    );
  }

  // After loading, if there is no user, redirect to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If loading is finished and there is a user, render the requested page
  return children;
};

export default ProtectedRoute;

