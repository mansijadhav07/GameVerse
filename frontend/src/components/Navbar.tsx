import { useState, useEffect, useRef, FormEvent } from 'react';
import { Link, NavLink } from 'react-router-dom';
// Use ALIAS path for AuthContext
import { useAuth } from '@/context/AuthContext';
import { toast } from "sonner"; // Import toast

// --- USING LUCIDE-REACT ICONS ---
import {
    Gamepad2, // Replaced GameController
    Wallet,
    PlusCircle,
    User, // Replaced UserCircle
    LogOut, // Replaced SignOut
    DollarSign, // Replaced CurrencyDollar
    List, // Hamburger menu
    X, // Close menu
    Home, // Replaced House
    Users as UsersIcon, // Keep as UsersIcon
    Medal, // Replaced Medal
    BarChart2, // Replaced ChartBar
    Info, // Replaced Info
    Loader2, // Replaced Spinner
    CreditCard // For payment form
} from "lucide-react";

// Inline SVG for MetaMask Fox icon (since it's not in Lucide)
const MetaMaskIcon = () => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor">
    <path d="M29.5 13.9c-.1-.1-.2-.1-.2-.2l-3.3-3.3c-.2-.2-.5-.2-.7 0l-1.8 1.8c-.2.2-.2.5 0 .7l1.3 1.3c.2.2.2.5 0 .7l-2.6 2.6c-.2.2-.5.2-.7 0l-1.3-1.3c-.2-.2-.5-.2-.7 0l-1.8 1.8c-.2.2-.2.5 0 .7l3.3 3.3c.1.1.2.1.2.2 4.1-2.2 5.5-7.1 4.3-10.9zm-27-4.1c-1.1 3.8.2 8.7 4.3 10.9.1.1.2.1.2.2l3.3 3.3c.2.2.5.2.7 0l1.8-1.8c-.2-.2-.2-.5 0-.7l-1.3-1.3c-.2-.2-.2-.5 0-.7l2.6-2.6c.2-.2.5-.2.7 0l1.3 1.3c.2.2.5.2.7 0l1.8-1.8c.2-.2.2-.5 0-.7l-3.3-3.3c-.1-.1-.2-.1-.2-.2C8.7 5 7.3.1 3.5 1.3c-.5.2-.9.7-.9 1.3l-.1 7.2zm12.3 4.9c-.2-.2-.5-.2-.7 0l-1.3 1.3c-.2.2-.2.5 0 .7l2.6 2.6c.2.2.5.2.7 0l1.3-1.3c.2-.2.2-.5 0-.7l-2.6-2.6z" />
  </svg>
);

// --- Detect MetaMask Provider ---
// We check if the user has a Web3 wallet (like MetaMask) installed.
const getEthereum = () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
        return (window as any).ethereum;
    }
    return null;
}

const Navbar = () => {
  const { user, logout, walletBalance, addFunds } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // --- Add Funds Modal State ---
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState<number | ''>(''); // Allow empty string
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  // --- UPDATED PAYMENT STEP STATE ---
  const [paymentStep, setPaymentStep] = useState<'amount' | 'connect' | 'pay'>('amount');
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  // --- Close dropdowns when clicking outside ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
         if (!(event.target instanceof Element && event.target.closest('#mobile-menu-button'))) {
              setIsMobileMenuOpen(false);
         }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

   const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
     `nav-link ${isActive ? 'active' : ''}`;

   // --- Close and reset Add Funds Modal ---
   const closeAddFundsModal = () => {
     setIsAddFundsOpen(false);
     setIsAddingFunds(false);
     setAmountToAdd('');
     setPaymentStep('amount'); // Reset to first step
     setConnectedWallet(null); // Clear connected wallet
   }

   // --- Add Funds Logic (Step 1: Get Amount) ---
   const handleAmountSubmit = (e: FormEvent) => {
     e.preventDefault(); 
     const numericAmount = Number(amountToAdd);
     if (numericAmount <= 0) {
       toast.error("Please enter a valid positive amount.");
       return;
     }
     // Go to the next step
     setPaymentStep('connect');
   };

   // --- NEW (Step 2: Connect Wallet) ---
   const handleConnectWallet = async () => {
     const ethereum = getEthereum();
     if (!ethereum) {
         toast.error("MetaMask not detected. Please install the browser extension.");
         return;
     }
     try {
         const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
         const account = accounts[0];
         setConnectedWallet(account);
         setPaymentStep('pay'); // Move to final payment step
         toast.success("Wallet connected!");
     } catch (err: any) {
         console.error("Wallet connection error:", err);
         if (err.code === 4001) { // User rejected the request
             toast.error("Wallet connection was rejected.");
         } else {
             toast.error(err.message || "Failed to connect wallet.");
         }
     }
   };
   
   // --- UPDATED (Step 3: Mock Payment & Submit) ---
   const handlePaymentSubmit = async (e: FormEvent) => {
     e.preventDefault();
     setIsAddingFunds(true);
     const numericAmount = Number(amountToAdd);

     // Simulate payment processing delay
     toast.loading("Sending mock transaction... Please wait.", { duration: 2500 });
     await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5 second delay

     try {
       // After "payment" is "approved", call our real backend endpoint
       await addFunds(numericAmount);
       toast.success(`$${numericAmount.toFixed(2)} added to your wallet!`);
       closeAddFundsModal(); // Close and reset modal on success
     } catch (error) {
       toast.error("Failed to add funds. Please try again.");
       console.error("Add Funds Error:", error);
       // Don't close modal on error, stay on payment step
       setIsAddingFunds(false);
     }
   };
   // --- End Add Funds Logic ---

  return (
    <>
      <header className="sticky top-0 z-50 w-full h-20 backdrop-blur-md bg-gray-950/60 border-b border-purple-500/30">
        <div className="container mx-auto px-4 flex h-full items-center justify-between">
          {/* Logo and Desktop Nav */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 mr-6">
              <Gamepad2 size={32} className="text-purple-400" />
              <span data-font-orbitron className="font-bold text-xl text-white tracking-wider text-glow-purple">GameVerse</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-2">
              <NavLink to="/games" className={navLinkClasses}>Games</NavLink>
              <NavLink to="/leaderboard" className={navLinkClasses}>Leaderboard</NavLink>
              <NavLink to="/achievements" className={navLinkClasses}>Achievements</NavLink>
              <NavLink to="/about" className={navLinkClasses}>About</NavLink>
              {user && (
                <>
                  <NavLink to="/friends" className={navLinkClasses}>Friends</NavLink>
                  <NavLink to="/dashboard" className={navLinkClasses}>Dashboard</NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Right Side - Auth / User Profile / Mobile Toggle */}
          <div className="flex items-center gap-4">
            {user ? (
              // --- User Profile Dropdown ---
              <div className="relative" ref={profileRef}>
                <button
                  onClick={toggleProfile}
                  className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white focus:outline-none"
                >
                   <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-purple-600 ring-2 ring-purple-500/50">
                     <span className="text-sm font-medium leading-none text-white">{user.name ? user.name.charAt(0).toUpperCase() : '?'}</span>
                   </span>
                  <span className="hidden sm:inline">Welcome, {user.name || 'User'}</span>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-md shadow-lg py-1 bg-gray-800/90 backdrop-blur-md ring-1 ring-purple-500/30 focus:outline-none z-50">
                     <div className="px-4 py-3 border-b border-purple-500/20">
                         <p className="text-sm font-medium text-white truncate">{user.name || 'User'}</p>
                     </div>
                     <div className='px-4 py-3 border-b border-purple-500/20'>
                         <p className="text-xs text-gray-400 mb-1">Wallet Balance</p>
                         <div className='flex items-center justify-between'>
                            <p className="text-lg font-semibold text-purple-300">${walletBalance.toFixed(2)}</p>
                            <button
                               onClick={() => { setIsAddFundsOpen(true); setIsProfileOpen(false); }}
                               className='text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1'
                            >
                                <PlusCircle size={14}/> Add Funds
                            </button>
                         </div>
                     </div>
                    <NavLink
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-purple-600/30 hover:text-white w-full text-left"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Dashboard
                    </NavLink>
                    <button
                      onClick={() => { logout(); setIsProfileOpen(false); }}
                      className="block px-4 py-2 text-sm text-red-400 hover:bg-red-600/30 hover:text-red-300 w-full text-left"
                    >
                      <LogOut size={16} className="inline mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // --- Login/Sign Up Buttons ---
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors">Login</Link>
                <Link to="/register" className="neon-button-small">Sign Up</Link>
              </div>
            )}

            {/* --- Mobile Menu Button --- */}
            <button
              id="mobile-menu-button"
              onClick={toggleMobileMenu}
              className="md:hidden text-gray-300 hover:text-purple-400 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={28} /> : <List size={28} />}
            </button>
          </div>
        </div>

         {/* --- Mobile Menu --- */}
         {isMobileMenuOpen && (
             <div ref={mobileMenuRef} className="md:hidden absolute top-20 left-0 w-full bg-gray-900/95 backdrop-blur-md border-b border-purple-500/30 shadow-lg z-40 animate-fade-in-down">
                 <nav className="px-2 pt-2 pb-4 space-y-1">
                     <NavLink to="/" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-purple-600/30 text-white' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`} onClick={closeMobileMenu}> <Home size={20}/> Home</NavLink>
                     <NavLink to="/games" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-purple-600/30 text-white' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`} onClick={closeMobileMenu}> <Gamepad2 size={20}/> Games</NavLink>
                     <NavLink to="/leaderboard" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-purple-600/30 text-white' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`} onClick={closeMobileMenu}> <BarChart2 size={20}/> Leaderboard</NavLink>
                     <NavLink to="/achievements" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-purple-600/30 text-white' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`} onClick={closeMobileMenu}> <Medal size={20}/> Achievements</NavLink>
                     <NavLink to="/about" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-purple-600/3D text-white' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`} onClick={closeMobileMenu}> <Info size={20}/> About</NavLink>
                     {user && (
                        <>
                             <NavLink to="/friends" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-purple-600/30 text-white' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`} onClick={closeMobileMenu}> <UsersIcon size={20}/> Friends</NavLink>
                             <NavLink to="/dashboard" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-purple-600/30 text-white' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`} onClick={closeMobileMenu}> <User size={20}/> Dashboard</NavLink>
                         </>
                     )}
                     {!user && (
                         <div className="pt-4 pb-2 px-2 border-t border-purple-500/20 space-y-2">
                             <Link to="/login" className="block w-full text-center px-4 py-2 text-base font-medium text-gray-300 bg-gray-700/50 rounded-md hover:bg-gray-700" onClick={closeMobileMenu}>Login</Link>
                             <Link to="/register" className="block w-full text-center px-4 py-2 text-base font-medium text-white bg-purple-600 rounded-md hover:bg-purple-500" onClick={closeMobileMenu}>Sign Up</Link>
                         </div>
                     )}
                 </nav>
             </div>
         )}
      </header>

      {/* --- Add Funds Modal (UPDATED with 3 steps) --- */}
      {isAddFundsOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="modal-content w-full max-w-sm">
                   
                   {/* Step 1: Enter Amount */}
                   <div className={paymentStep === 'amount' ? 'block' : 'hidden'}>
                       <form onSubmit={handleAmountSubmit}>
                           <div className="flex justify-between items-center mb-4">
                              <h3 data-font-orbitron className="text-xl font-semibold text-white text-glow-purple">Add Funds</h3>
                               <button type="button" onClick={closeAddFundsModal} className="text-gray-400 hover:text-white"><X size={20} /></button>
                           </div>
                           <p className="text-sm text-gray-400 mb-4">Current Balance: ${walletBalance.toFixed(2)}</p>
                           <div className="space-y-4">
                               <div>
                                   <label htmlFor="amount-to-add" className="modal-label">Amount ($)</label>
                                   <input
                                       id="amount-to-add"
                                       type="number"
                                       min="1"
                                       step="0.01"
                                       value={amountToAdd}
                                       onChange={(e) => setAmountToAdd(e.target.value === '' ? '' : Number(e.target.value))}
                                       required
                                       className="modal-input"
                                       placeholder="e.g., 20"
                                   />
                               </div>
                               <div className="flex justify-end gap-3 pt-4">
                                   <button type="button" onClick={closeAddFundsModal} className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors">Cancel</button>
                                   <button type="submit" className="neon-button-small inline-flex items-center gap-2">
                                       Proceed
                                   </button>
                               </div>
                           </div>
                       </form>
                   </div>

                   {/* Step 2: Connect Wallet */}
                   <div className={paymentStep === 'connect' ? 'block' : 'hidden'}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 data-font-orbitron className="text-xl font-semibold text-white text-glow-purple">Connect Wallet</h3>
                            <button type="button" onClick={closeAddFundsModal} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <p className="text-sm text-gray-400 mb-6">To continue, please connect your MetaMask wallet.</p>
                        <button 
                            type="button" 
                            onClick={handleConnectWallet} 
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-md bg-gray-700/80 hover:bg-gray-700 border border-gray-600 transition-colors"
                        >
                            <MetaMaskIcon />
                            <span className="font-semibold text-white">Connect with MetaMask</span>
                        </button>
                        <button type="button" onClick={() => setPaymentStep('amount')} className="w-full mt-3 px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors">Back</button>
                   </div>


                   {/* Step 3: Mock Payment Form */}
                   <div className={paymentStep === 'pay' ? 'block' : 'hidden'}>
                       <form onSubmit={handlePaymentSubmit}>
                           <div className="flex justify-between items-center mb-4">
                              <h3 data-font-orbitron className="text-xl font-semibold text-white text-glow-purple">Confirm Payment</h3>
                               <button type="button" onClick={closeAddFundsModal} className="text-gray-400 hover:text-white"><X size={20} /></button>
                           </div>
                           <div className="space-y-3 mb-6">
                                <p className="text-sm text-gray-400">You are adding: <strong className="text-white">${Number(amountToAdd).toFixed(2)}</strong></p>
                                <p className="text-sm text-gray-400">Connected Wallet:</p>
                                <p className="text-xs font-mono text-purple-300 bg-gray-900/50 p-2 rounded border border-purple-500/30 truncate">
                                    {connectedWallet}
                                </p>
                           </div>
                           
                           <p className="text-xs text-gray-500 mb-4">
                               This is a simulation. Clicking 'Confirm' will automatically approve the transaction and add funds to your account.
                           </p>

                           <div className="flex justify-end gap-3 pt-4">
                               <button type="button" onClick={() => setPaymentStep('connect')} className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors">Back</button>
                               <button type="submit" disabled={isAddingFunds} className="neon-button-small inline-flex items-center justify-center gap-2 w-[160px]">
                                   {isAddingFunds ? <Loader2 size={16} className="animate-spin"/> : `Confirm in MetaMask`}
                               </button>
                           </div>
                       </form>
                   </div>

              </div>
          </div>
      )}
    </>
  );
};

export default Navbar;

