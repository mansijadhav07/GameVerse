import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GameController, EnvelopeSimple, LockKey } from "@phosphor-icons/react";
import axios from 'axios';
import { useAuth } from "../context/AuthContext";

// --- DYNAMIC API URL CONFIGURATION ---
// This uses the Railway variable if it exists, otherwise falls back to your local port
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    try {
      // UPDATED: Now uses the dynamic API_URL variable
      const response = await axios.post(`${API_URL}/api/login`, formData);
      
      login(response.data.token);
      console.log('Login successful');
      navigate('/'); 
    } catch (error: any) {
      console.error('Login error:', error.response ? error.response.data : error.message);
      setMessage(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="relative z-10 w-full max-w-md animate-fade-in">
             <div className="text-center mb-8">
               <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
                 <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-500/30 group-hover:shadow-purple-400/50 transition-all duration-300">
                   <GameController size={32} className="text-white" weight="fill"/>
                 </div>
               </Link>
               <h1 data-font-orbitron className="text-3xl font-bold mb-2 text-white text-glow-blue">Welcome Back</h1>
               <p className="text-gray-400">Log in to your GameVerse account</p>
             </div>

            <div className="bg-gray-900/60 backdrop-blur-md border border-purple-500/30 rounded-lg shadow-2xl shadow-purple-500/10 p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
                  <div className="relative">
                    <EnvelopeSimple
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                        weight="light"
                    />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-950/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-300"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
                  <div className="relative">
                    <LockKey
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                        weight="light"
                    />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-950/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-300"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="neon-button w-full flex justify-center items-center gap-2"
                  disabled={isLoading}
                >
                   {isLoading ? (
                       <>
                         <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         Logging in...
                       </>
                   ) : (
                       'Log In'
                   )}
                </button>
              </form>

              {message && <p className="mt-4 text-center text-sm text-red-400">{message}</p>}

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-400">Don't have an account? </span>
                <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                  Sign Up
                </Link>
              </div>
            </div>
        </div>
    </main>
  );
};

export default Login;