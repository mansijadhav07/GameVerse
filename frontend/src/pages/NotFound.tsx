import { Link, useLocation } from "react-router-dom"; // Use Link for consistency
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Keep the console error logging
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    // Apply dark theme background and center content vertically and horizontally
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white p-4">
      <div className="text-center animate-fade-in">
        {/* Style 404 heading */}
        <h1 data-font-orbitron className="mb-4 text-7xl md:text-9xl font-bold text-blue-400 text-glow-blue">
          404
        </h1>
        {/* Style message */}
        <p className="mb-8 text-xl md:text-2xl text-gray-400">
          Oops! Page not found
        </p>
        {/* Style link as a neon button */}
        <Link to="/" className="neon-button inline-flex items-center">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

/* Add to index.css if not already added:
[data-font-orbitron] { font-family: 'Orbitron', sans-serif; }
.text-glow-blue { text-shadow: 0 0 8px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3); }
.neon-button {
    @apply inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-md shadow-sm transition-all duration-300 ease-in-out bg-purple-600 text-white hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-950 hover:shadow-lg hover:shadow-purple-500/40;
}
.animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
*/
