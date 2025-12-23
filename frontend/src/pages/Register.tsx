import { useState, FormEvent } from "react"; // Added FormEvent
import { Link, useNavigate } from "react-router-dom";
// Removed shadcn imports
// Replace lucide-react icons with phosphor-icons
import { GameController, EnvelopeSimple, LockKey, User, ShieldCheckered } from "@phosphor-icons/react";
// Removed Navbar import
import axios from 'axios';

// No need for useAuth here unless checking if already logged in

const Register = () => {
  const [formData, setFormData] = useState({
    username: "", // Changed from f_name based on form
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user'); // State for active tab
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handles submission for both user and admin based on activeTab
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true); // Set loading

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      setIsLoading(false); // Reset loading
      return;
    }
    if (formData.password.length < 6) { // Example: Basic password length validation
        setMessage("Password must be at least 6 characters long.");
        setIsLoading(false);
        return;
    }

    const userData = {
      // Assuming backend expects f_name and l_name separately
      // You might need to adjust this based on your backend API structure
      f_name: formData.username, // Send username as f_name
      l_name: activeTab === 'admin' ? 'Admin' : 'User', // Default l_name or add another form field
      email: formData.email,
      password: formData.password,
      role: activeTab // Use the active tab state for the role
    };

    try {
      await axios.post('http://localhost:3001/api/signup', userData);
      setMessage(`Success! ${activeTab} account created. Redirecting to login...`);
      setFormData({ username: "", email: "", password: "", confirmPassword: "" }); // Clear form
      // Add a small delay before navigating to show the success message
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      console.error('There was an error signing up:', error.response ? error.response.data : error.message);
      setMessage(error.response?.data?.message || `Error signing up as ${activeTab}.`);
    } finally {
      // Don't reset loading immediately if navigating after timeout
      if (!message.startsWith('Success')) {
          setIsLoading(false);
      }
    }
  };

  // Common input fields structure
  const renderFormFields = (role: 'user' | 'admin') => (
    <>
      <div className="space-y-2">
        <label htmlFor={`${role}-username`} className="text-sm font-medium text-gray-300">
            {role === 'admin' ? 'Admin Username' : 'Username'}
        </label>
        <div className="relative">
          {role === 'admin' ? (
              <ShieldCheckered className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" weight="light" />
          ) : (
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" weight="light" />
          )}
          <input id={`${role}-username`} name="username" type="text" placeholder={role === 'admin' ? 'admin_user' : 'gamer123'}
                 className="w-full pl-10 pr-3 py-2.5 bg-gray-950/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-300"
                 value={formData.username} onChange={handleChange} required disabled={isLoading} />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor={`${role}-email`} className="text-sm font-medium text-gray-300">Email</label>
        <div className="relative">
          <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" weight="light" />
          <input id={`${role}-email`} name="email" type="email" placeholder="your@email.com"
                 className="w-full pl-10 pr-3 py-2.5 bg-gray-950/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-300"
                 value={formData.email} onChange={handleChange} required disabled={isLoading} />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor={`${role}-password`} className="text-sm font-medium text-gray-300">Password</label>
        <div className="relative">
          <LockKey className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" weight="light" />
          <input id={`${role}-password`} name="password" type="password" placeholder="•••••••• (min. 6 chars)"
                 className="w-full pl-10 pr-3 py-2.5 bg-gray-950/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-300"
                 value={formData.password} onChange={handleChange} required disabled={isLoading} />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor={`${role}-confirm-password`} className="text-sm font-medium text-gray-300">Confirm Password</label>
        <div className="relative">
          <LockKey className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" weight="light" />
          <input id={`${role}-confirm-password`} name="confirmPassword" type="password" placeholder="••••••••"
                 className="w-full pl-10 pr-3 py-2.5 bg-gray-950/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-300"
                 value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading} />
        </div>
      </div>
    </>
  );

  return (
    // Removed outer div and Navbar
    <main className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-500/30 group-hover:shadow-purple-400/50 transition-all duration-300">
              <GameController size={32} className="text-white" weight="fill" />
            </div>
          </Link>
          <h1 data-font-orbitron className="text-3xl font-bold mb-2 text-white text-glow-blue">Join GameVerse</h1>
          <p className="text-gray-400">Create your account and start gaming</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900/60 backdrop-blur-md border border-purple-500/30 rounded-lg shadow-2xl shadow-purple-500/10 p-6 sm:p-8">
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex border border-gray-700 rounded-lg p-1 bg-gray-950/50">
              <button
                onClick={() => setActiveTab('user')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-300 ${
                  activeTab === 'user'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`}
              >
                <User size={16} weight={activeTab === 'user' ? 'fill' : 'regular'} /> User
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-300 ${
                  activeTab === 'admin'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`}
              >
                <ShieldCheckered size={16} weight={activeTab === 'admin' ? 'fill' : 'regular'} /> Admin
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
             {activeTab === 'user' ? renderFormFields('user') : renderFormFields('admin')}

            <button
              type="submit"
              className={`neon-button w-full flex justify-center items-center gap-2 ${activeTab === 'admin' ? 'neon-button-blue' : ''}`} // Use blue variant for admin
              disabled={isLoading}
            >
              {isLoading ? (
                  <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                  </>
              ) : (
                  `Create ${activeTab === 'admin' ? 'Admin' : 'User'} Account`
              )}
            </button>
          </form>

          {message && <p className={`mt-4 text-center text-sm ${message.startsWith('Success') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">Already have an account? </span>
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Register;
