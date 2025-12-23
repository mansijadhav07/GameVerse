import { useEffect, useState, FormEvent, useCallback } from 'react';
import axios from 'axios';
// Use RELATIVE path for AuthContext
import { useAuth } from '../context/AuthContext';
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import { format } from 'date-fns'; // Used for formatting dates
// --- SWITCHED ALL ICONS BACK TO LUCIDE-REACT ---
import {
    // Shared
    Loader2, Star, Trophy, Gamepad, Heart, User, PlusCircle, DotsThree, Trash2, Pencil, X,
    // Admin Specific
    Users as UsersIcon, // For Total Users
    Library, // For Total Games
    DollarSign, // For Licenses Sold
    MessageSquare, // For Contact Submissions
    // User Specific
     // Heart, Trophy, Gamepad, X already included
} from 'lucide-react';
// --- END SWITCH ---


// --- Interfaces ---
interface Game {
  game_id: number;
  title: string;
  genre: string;
  rating: number | string;
  image_url?: string;
  price?: number;
}

interface UserAchievement {
    achievement_id: number;
    achievement_name: string;
    description: string;
    unlocked_at: string; // Keep as string from DB
}

interface AdminStats {
    totalUsers: string | number;
    totalGames: string | number;
    totalLicensesSold: string | number;
    mostWishlistedGame: {
        title: string;
        wish_count: string | number;
    };
}

// --- NEW Interface for Contact Submissions ---
interface Submission {
  submission_id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  received_at: string;
}
// --- END NEW ---

// --- Helper to format rating ---
const formatRating = (r: number | string | undefined): string => {
   if (r === undefined || r === null) return 'N/A';
   const numRating = Number(r);
   if (isNaN(numRating)) return 'N/A';
   return numRating.toFixed(1);
}

// ============================================================================
// == ADMIN VIEW COMPONENT ==
// ============================================================================
const AdminDashboardView = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]); // <-- NEW State for messages
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [formData, setFormData] = useState<Partial<Game>>({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for modals

  const fetchData = useCallback(async () => { // Wrap in useCallback
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Admin auth token not found");

      const [gamesRes, statsRes, submissionsRes] = await Promise.all([ // <-- Added submissionsRes
          axios.get('http://localhost:3001/api/games'),
          axios.get('http://localhost:3001/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:3001/api/admin/contact-submissions', { headers: { Authorization: `Bearer ${token}` } }) // <-- NEW API Call
      ]);
      setGames(gamesRes.data);
      setStats(statsRes.data);
      setSubmissions(submissionsRes.data); // <-- NEW State update
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch admin data.');
      console.error(err);
      setSubmissions([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array, runs once

  useEffect(() => { fetchData(); }, [fetchData]); // Use fetchData in dependency array

  const getAuthHeaders = () => {
      const token = localStorage.getItem('token');
      return { headers: { Authorization: `Bearer ${token}` } };
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // --- CRUD Handlers ---
  const handleAddGame = async (e: FormEvent) => {
    e.preventDefault();
     setIsSubmitting(true);
    try {
      await axios.post('http://localhost:3001/api/games', formData, getAuthHeaders());
      toast.success(`Game "${formData.title}" added successfully!`);
      setIsAddModalOpen(false);
       setFormData({}); // Clear form data
      fetchData();
    } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to add game.');
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleEditGame = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedGame) return;
     setIsSubmitting(true);
    try {
      await axios.put(`http://localhost:3001/api/games/${selectedGame.game_id}`, formData, getAuthHeaders());
      toast.success(`Game "${formData.title}" updated successfully!`);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to update game.');
    } finally {
       setIsSubmitting(false);
    }
  }

  const handleDeleteGame = async () => {
    if (!selectedGame) return;
    try {
      await axios.delete(`http://localhost:3001/api/games/${selectedGame.game_id}`, getAuthHeaders());
      toast.success(`Game "${selectedGame.title}" deleted.`);
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete game.');
         setIsDeleteModalOpen(false); // Close modal even on error
    }
  }

  // --- Modal Openers ---
   const openAddModal = () => { setFormData({}); setIsAddModalOpen(true); } // Clear form on open
   const openEditModal = (game: Game) => { setSelectedGame(game); setFormData(game); setIsEditModalOpen(true); }
   const openDeleteModal = (game: Game) => { setSelectedGame(game); setIsDeleteModalOpen(true); }

  // --- Render Logic ---
  if (isLoading) return <div className="flex-1 p-8 flex items-center justify-center"><Loader2 size={48} className="animate-spin text-purple-400" /></div>;

  return (
    <main className="flex-1 p-4 md:p-8 space-y-8 container mx-auto max-w-7xl">
       {/* Stat Cards */}
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
           {stats && (
               <>
                   {/* Stat Card Example */}
                   <div className="admin-card p-6 flex flex-col justify-between">
                       <div className='flex justify-between items-start mb-4'>
                            <h3 className="text-sm font-medium text-gray-400">Total Users</h3>
                            <UsersIcon size={20} className="text-purple-400" />
                       </div>
                       <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                   </div>
                    <div className="admin-card p-6 flex flex-col justify-between">
                       <div className='flex justify-between items-start mb-4'>
                            <h3 className="text-sm font-medium text-gray-400">Total Games</h3>
                            <Library size={20} className="text-blue-400" />
                       </div>
                       <p className="text-3xl font-bold text-white">{stats.totalGames}</p>
                   </div>
                    <div className="admin-card p-6 flex flex-col justify-between">
                       <div className='flex justify-between items-start mb-4'>
                            <h3 className="text-sm font-medium text-gray-400">Licenses Sold</h3>
                            <DollarSign size={20} className="text-green-400" />
                       </div>
                       <p className="text-3xl font-bold text-white">{stats.totalLicensesSold}</p>
                   </div>
                    <div className="admin-card p-6 flex flex-col justify-between">
                       <div className='flex justify-between items-start mb-4'>
                            <h3 className="text-sm font-medium text-gray-400">Most Wishlisted</h3>
                            <Heart size={20} className="text-yellow-400" />
                       </div>
                       <p className="text-xl font-bold text-white truncate">{stats.mostWishlistedGame?.title || 'N/A'}</p>
                       <p className="text-xs text-gray-500">{stats.mostWishlistedGame?.wish_count || 0} wishes</p>
                   </div>
               </>
           )}
       </div>

      {/* Game Management Table */}
      <div className="admin-card overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h2 data-font-orbitron className="text-xl font-semibold text-white">Game Management</h2>
            <p className="text-sm text-gray-400">Add, edit, or delete games from the database.</p>
          </div>
          <button onClick={openAddModal} className="neon-button-small mt-4 sm:mt-0 inline-flex items-center gap-2">
            <PlusCircle size={18} /> Add New Game
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-700/30">
              <tr>
                <th scope="col" className="px-6 py-3">Title</th>
                <th scope="col" className="px-6 py-3">Genre</th>
                <th scope="col" className="px-6 py-3 text-right">Rating</th>
                 <th scope="col" className="px-6 py-3 text-right">Price</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.game_id} className="border-b border-gray-700 hover:bg-gray-700/20">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{game.title}</td>
                  <td className="px-6 py-4">{game.genre}</td>
                  <td className="px-6 py-4 text-right">{formatRating(game.rating)}</td>
                   <td className="px-6 py-4 text-right">${Number(game.price || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                     {/* Simple Edit/Delete Buttons */}
                     <button onClick={() => openEditModal(game)} className="p-1 text-blue-400 hover:text-blue-300 mr-2"><Pencil size={18} /></button>
                     <button onClick={() => openDeleteModal(game)} className="p-1 text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {games.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-500">No games found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* --- NEW: Contact Form Submissions Table --- */}
       <div className="admin-card overflow-hidden">
        <div className="p-6">
          <h2 data-font-orbitron className="text-xl font-semibold text-white flex items-center gap-2">
            <MessageSquare size={24} className="text-green-400" />
            Contact Form Messages
          </h2>
          <p className="text-sm text-gray-400">Messages received from the "About Us" page.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-700/30">
              <tr>
                <th scope="col" className="px-6 py-3">Received</th>
                <th scope="col" className="px-6 py-3">From</th>
                <th scope="col" className="px-6 py-3">Subject</th>
                <th scope="col" className="px-6 py-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.submission_id} className="border-b border-gray-700 hover:bg-gray-700/20">
                  <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                    {format(new Date(sub.received_at), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    {sub.name}
                    <br/>
                    <a href={`mailto:${sub.email}`} className="text-xs text-blue-400 hover:underline">{sub.email}</a>
                  </td>
                  <td className="px-6 py-4">{sub.subject}</td>
                  <td className="px-6 py-4 text-gray-300 max-w-sm whitespace-pre-wrap break-words">{sub.message}</td>
                </tr>
              ))}
              {submissions.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-500">No messages received yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* --- END NEW SECTION --- */}
       
      {/* --- Modals --- */}
      {/* Add Game Modal */}
      {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="modal-content w-full max-w-lg">
                     <div className="flex justify-between items-center mb-4">
                         <h3 data-font-orbitron className="text-xl font-semibold text-white">Add New Game</h3>
                         <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                     </div>
                     <form onSubmit={handleAddGame} className="space-y-4">
                         <div><label htmlFor="title" className="modal-label">Title</label><input id="title" name="title" onChange={handleInputChange} required className="modal-input" /></div>
                         <div><label htmlFor="genre" className="modal-label">Genre</label><input id="genre" name="genre" onChange={handleInputChange} required className="modal-input" /></div>
                         <div><label htmlFor="rating" className="modal-label">Rating (/10)</label><input id="rating" name="rating" type="number" step="0.1" min="0" max="10" onChange={handleInputChange} required className="modal-input" /></div>
                         <div><label htmlFor="price" className="modal-label">Price ($)</label><input id="price" name="price" type="number" step="0.01" min="0" onChange={handleInputChange} required className="modal-input" /></div>
                         <div><label htmlFor="image_url" className="modal-label">Image URL (Optional)</label><input id="image_url" name="image_url" type="url" placeholder="https://..." onChange={handleInputChange} className="modal-input" /></div>
                         <div className="flex justify-end gap-3 pt-4">
                             <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors">Cancel</button>
                             <button type="submit" disabled={isSubmitting} className="neon-button-small inline-flex items-center gap-2 disabled:opacity-50">
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />} Add Game
                             </button>
                         </div>
                     </form>
                </div>
            </div>
       )}
       {/* Edit Game Modal */}
        {isEditModalOpen && selectedGame && (
             <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                 <div className="modal-content w-full max-w-lg">
                     <div className="flex justify-between items-center mb-4">
                         <h3 data-font-orbitron className="text-xl font-semibold text-white">Edit: {selectedGame.title}</h3>
                          <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                     </div>
                     <form onSubmit={handleEditGame} className="space-y-4">
                         <div><label htmlFor="edit-title" className="modal-label">Title</label><input id="edit-title" name="title" value={formData.title || ''} onChange={handleInputChange} required className="modal-input" /></div>
                         <div><label htmlFor="edit-genre" className="modal-label">Genre</label><input id="edit-genre" name="genre" value={formData.genre || ''} onChange={handleInputChange} required className="modal-input" /></div>
                         <div><label htmlFor="edit-rating" className="modal-label">Rating (/10)</label><input id="edit-rating" name="rating" type="number" step="0.1" min="0" max="10" value={formData.rating || ''} onChange={handleInputChange} required className="modal-input" /></div>
                         <div><label htmlFor="edit-price" className="modal-label">Price ($)</label><input id="edit-price" name="price" type="number" step="0.01" min="0" value={formData.price || ''} onChange={handleInputChange} required className="modal-input" /></div>
                         <div><label htmlFor="edit-image_url" className="modal-label">Image URL (Optional)</label><input id="edit-image_url" name="image_url" type="url" value={formData.image_url || ''} placeholder="https://..." onChange={handleInputChange} className="modal-input" /></div>
                          <div className="flex justify-end gap-3 pt-4">
                             <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors">Cancel</button>
                             <button type="submit" disabled={isSubmitting} className="neon-button-small inline-flex items-center gap-2 disabled:opacity-50">
                                 {isSubmitting && <Loader2 size={16} className="animate-spin" />} Save Changes
                             </button>
                         </div>
                     </form>
                 </div>
             </div>
        )}
       {/* Delete Game Modal */}
       {isDeleteModalOpen && selectedGame && (
           <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="modal-content w-full max-w-md">
                     <h3 className="text-xl font-semibold mb-2 text-white">Confirm Deletion</h3>
                     <p className="text-gray-300 mb-6">Are you sure you want to delete the game "{selectedGame?.title}"? This action cannot be undone.</p>
                     <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors">Cancel</button>
                          <button type="button" onClick={handleDeleteGame} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 transition-colors font-medium">Yes, Delete</button>
                     </div>
                </div>
            </div>
       )}
    </main>
  );
};

// ============================================================================
// == USER VIEW COMPONENT ==
// ============================================================================
const UserDashboardView = () => {
    const [myGames, setMyGames] = useState<Game[]>([]);
    const [wishlist, setWishlist] = useState<Game[]>([]);
    const [myAchievements, setMyAchievements] = useState<UserAchievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

     // --- Handler for removing wishlist item ---
     const handleRemoveWishlist = async (gameIdToRemove: number) => {
         const token = localStorage.getItem('token');
         if (!token) return; // Should be logged in to see dashboard anyway

         // Optimistic UI update: Remove immediately from state
         const originalWishlist = wishlist;
         setWishlist(current => current.filter(g => g.game_id !== gameIdToRemove));

         try {
             await axios.delete(`http://localhost:3001/api/wishlist/${gameIdToRemove}`, {
                 headers: { Authorization: `Bearer ${token}` }
             });
             toast.success("Game removed from wishlist.");
             // Refetch data to confirm removal and update count accurately
             fetchData(); // Refetch all dashboard data
         } catch (error: any) {
             toast.error(error.response?.data?.message || "Failed to remove game from wishlist.");
             console.error("Error removing wishlist item:", error);
             // Revert optimistic update if it failed
             setWishlist(originalWishlist);
         }
     }
     // --- END ---

    // Wrap fetchData in useCallback
    const fetchData = useCallback(async () => {
        // Only set loading true on the *initial* load
        // setIsLoading(true); // This would cause a flicker on refetch, let's keep it on initial load only
        
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("No auth token found.");

            // Fetch all data concurrently
            const [gamesRes, wishlistRes, achievementsRes] = await Promise.all([
                axios.get('http://localhost:3001/api/my-games', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:3001/api/my-wishlist', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:3001/api/my-achievements', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setMyGames(gamesRes.data);
            setWishlist(wishlistRes.data);
            setMyAchievements(achievementsRes.data);

        } catch (error: any) {
            console.error("Failed to fetch dashboard data", error);
            toast.error(error.response?.data?.message || "Could not load your dashboard data.");
            // Set states to empty arrays on error
            setMyGames([]);
            setWishlist([]);
            setMyAchievements([]);
        } finally {
            setIsLoading(false); // Set loading false after fetches complete or fail
        }
    }, []); // Empty dependency array, runs once on mount

    useEffect(() => {
        setIsLoading(true); // Set loading true only on mount
        fetchData();
    }, [fetchData]); // Run fetchData on mount

    if (isLoading) {
        return <div className="flex-1 p-8 flex items-center justify-center min-h-[calc(100vh-160px)]"><Loader2 size={48} className="animate-spin text-purple-400" /></div>;
    }

    return (
        <main className="flex-1 p-4 md:p-8 container mx-auto max-w-7xl">
            {/* Header */}
            <div className="space-y-1 mb-10">
                <h1 data-font-orbitron className="text-3xl md:text-4xl font-bold text-white text-glow-purple">Your Dashboard</h1>
                <p className="text-gray-400">Welcome back! Manage your games, wishlist, and achievements.</p>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* My Games Library (Wider Column) */}
                <div className="admin-card lg:col-span-2 overflow-hidden">
                    <div className='p-6 border-b border-purple-500/30'>
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                             <Gamepad size={24} className="text-purple-400" /> My Games Library
                        </h2>
                    </div>
                    <div className="p-6">
                        {myGames.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2">
                                {myGames.map(game => (
                                    // Simple card for owned games
                                    <div key={game.game_id} className="bg-gray-700/30 p-4 rounded-lg border border-gray-600/50 flex flex-col">
                                        <img
                                            src={game.image_url || `https://placehold.co/600x400/1a1a2e/e0e0e0?text=${encodeURIComponent(game.title)}`}
                                            alt={game.title}
                                            className="aspect-video w-full object-cover rounded mb-3"
                                             onError={(e) => {
                                                 const target = e.target as HTMLImageElement;
                                                 target.onerror = null; // Prevent loop
                                                 target.src = `https://placehold.co/600x400/1a1a2e/e0e0e0?text=${encodeURIComponent(game.title)}`;
                                              }}
                                        />
                                        <h3 className="font-semibold text-lg text-white truncate">{game.title}</h3>
                                        <p className="text-sm text-gray-400 mb-2">{game.genre}</p>
                                        <div className="flex justify-between items-center mt-auto pt-2">
                                            <span className="text-xs font-semibold flex items-center gap-1 text-amber-400">
                                                <Star size={14} className="fill-current"/> {formatRating(game.rating)}
                                            </span>
                                            {/* "Play Now" could link to game detail or launch if integrated */}
                                            <Link to={`/game/${game.game_id}`} className="text-xs px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 transition-colors">
                                                View Game
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="text-center py-16 px-6">
                                <Gamepad size={48} className="text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500">You don't own any games yet.</p>
                                <Link to="/games" className="neon-button-small inline-block mt-4">
                                     Browse Games
                                 </Link>
                             </div>
                        )}
                    </div>
                </div>

                {/* Sidebar (Wishlist & Achievements) */}
                <div className="space-y-8">
                    {/* My Wishlist */}
                    <div className="admin-card overflow-hidden">
                         <div className='p-6 border-b border-purple-500/30'>
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Heart size={24} className="text-pink-400" /> My Wishlist
                            </h2>
                        </div>
                        <div className="p-6">
                            {wishlist.length > 0 ? (
                                <ul className="space-y-4">
                                    {wishlist.map(game => (
                                        <li key={game.game_id} className="flex justify-between items-center text-sm group">
                                            <Link to={`/game/${game.game_id}`} className="flex items-center gap-3 group flex-1 min-w-0">
                                                <img src={game.image_url || `https://placehold.co/40x40/1a1a2e/e0e0e0?text=${encodeURIComponent(game.title[0])}`} alt="" className="h-8 w-8 object-cover rounded flex-shrink-0 bg-gray-700"/>
                                                <span className="text-gray-200 group-hover:text-purple-300 transition-colors truncate flex-1">{game.title}</span>
                                            </Link>
                                             {/* --- Remove Button --- */}
                                            <button
                                                 onClick={() => handleRemoveWishlist(game.game_id)}
                                                 title="Remove from Wishlist"
                                                 className="ml-2 p-1 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X size={16} />
                                            </button>
                                            {/* --- End Remove Button --- */}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8 px-6">
                                    <Heart size={36} className="text-gray-600 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">Your wishlist is empty.</p>
                                 </div>
                            )}
                        </div>
                    </div>

                    {/* My Achievements */}
                    <div className="admin-card overflow-hidden">
                       <div className='p-6 border-b border-purple-500/30'>
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Trophy size={24} className="text-yellow-400" /> My Achievements
                            </h2>
                       </div>
                        <div className="p-6 text-center">
                            <p className="text-5xl font-bold text-white mb-1">{myAchievements.length}</p>
                            <p className="text-sm text-gray-400 mb-4">trophies unlocked</p>
                             <Link to="/achievements" className="neon-button-small w-full justify-center">
                                 View All Achievements
                             </Link>
                        </div>
                    </div>
                </div> {/* End Sidebar */}

            </div> {/* End Layout Grid */}
        </main>
    )
}


// ============================================================================
// == MAIN DASHBOARD COMPONENT (Decides Admin vs User view) ==
// ============================================================================
const UserDashboard = () => {
  const { user, isLoading: isAuthLoading } = useAuth(); // Renamed loading state

  // Show loading spinner while auth state is being determined
  if (isAuthLoading) {
    return (
        // No Navbar during initial auth check (handled by MainLayout, but this runs first)
        <div className="min-h-screen flex flex-col bg-gray-950">
           <div className="flex-1 flex items-center justify-center">
               <Loader2 size={48} className="animate-spin text-purple-400" />
           </div>
        </div>
    )
  }

  // If auth check is done but there's no user (shouldn't happen with ProtectedRoute, but good fallback)
  if (!user) {
      return (
           <div className="min-h-screen flex flex-col bg-gray-950">
               <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                   <p className='text-red-400 mb-4'>Authentication error or user not found.</p>
                   <Link to="/login" className="neon-button">Go to Login</Link>
               </div>
           </div>
      )
  }

  // Render the correct dashboard based on user role
  return (
    // Navbar/Footer are handled by MainLayout in App.tsx
     <>
        {user.role === 'admin' ? <AdminDashboardView /> : <UserDashboardView />}
     </>
  );
};

export default UserDashboard;

