import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
// Use RELATIVE path for AuthContext
import { useAuth } from '../context/AuthContext';
// --- SWITCHED BACK TO LUCIDE-REACT ---
import {
    Loader2, // Spinner
    UserPlus,
    UserCheck,
    UserX, // Use UserX for Decline
    Users, // Main icon
    MessageCircle // <-- NEW ICON
} from 'lucide-react';
// --- END SWITCH ---
import { Link } from 'react-router-dom'; // <-- NEW IMPORT

// --- Interfaces ---
interface Friend {
  friend_user_id: number;
  f_name: string;
  l_name: string;
  status: 'accepted' | 'pending';
  action_user_id: number; // ID of the user who last acted (sent request or accepted)
}

interface UserSearchResult {
    user_id: number;
    f_name: string;
    l_name: string;
}

const Friends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [allUsers, setAllUsers] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null); // Track submitting state by user ID
  const [isResponding, setIsResponding] = useState<number | null>(null); // Track responding state by user ID
  const [activeTab, setActiveTab] = useState<'connections' | 'add'>('connections'); // State for tabs

  // Wrap fetchData in useCallback
  const fetchData = useCallback(async () => {
    if (isLoading) {
    } else {
    }

    if (!user) {
       setIsLoading(false); // No user, nothing to load
       return;
    }
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No auth token found.");

        const [friendsRes, usersRes] = await Promise.all([
            axios.get('http://localhost:3001/api/friends', { headers: { Authorization: `Bearer ${token}` } }),
            axios.get('http://localhost:3001/api/users', { headers: { Authorization: `Bearer ${token}` } }) // Endpoint to find users
        ]);

        setFriends(friendsRes.data);
        // Filter out the current user from the 'allUsers' list immediately
        setAllUsers(usersRes.data.filter((u: UserSearchResult) => u.user_id !== user.id));

    } catch (error: any) {
        toast.error(error.response?.data?.message || "Could not load friends data.");
        console.error("Failed to fetch friends data:", error);
    } finally {
        setIsLoading(false); // Set loading false after fetches complete or fail
    }
  }, [user, isLoading]); // Depend on user object and isLoading

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Run fetchData when it changes (i.e., when user logs in/out)


  // --- Event Handlers ---
  const handleSendRequest = async (targetUserId: number) => {
     setIsSubmitting(targetUserId); // Set loading state for this specific button
     try {
         const token = localStorage.getItem('token');
         await axios.post('http://localhost:3001/api/friends/request',
           { targetUserId },
           { headers: { Authorization: `Bearer ${token}` } }
         );
         toast.success("Friend request sent!");
         fetchData(); // Refresh data to show pending status and update 'Add Friends' list
     } catch (error: any) {
         toast.error(error.response?.data?.message || "Failed to send request.");
          console.error("Send Request Error:", error.response || error);
     } finally {
          setIsSubmitting(null); // Clear loading state
     }
  }

  const handleRespondRequest = async (senderId: number, action: 'accept' | 'decline') => {
      setIsResponding(senderId); // Set loading state for these buttons
      try {
          const token = localStorage.getItem('token');
          // Pass the correct senderId and action to the backend
          await axios.put('http://localhost:3001/api/friends/request',
            { senderId, action }, // Backend expects senderId
            { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success(`Friend request ${action}ed.`);
          fetchData(); // Refresh data
      } catch (error: any) {
          toast.error(error.response?.data?.message || `Failed to ${action} request.`);
          console.error("Respond Request Error:", error.response || error);
      } finally {
           setIsResponding(null); // Clear loading state
      }
  }

  // --- Filtering Logic (Improved with useMemo) ---
  const [acceptedFriends, pendingRequests, sentRequests] = useMemo(() => {
    if (!user) return [[], [], []];
    const accepted = friends.filter(f => f.status === 'accepted');
    // Pending requests where the *other* user was the action_user_id (they sent it)
    const pending = friends.filter(f => f.status === 'pending' && f.action_user_id !== user.id);
    // Sent requests where the *current* user was the action_user_id
    const sent = friends.filter(f => f.status === 'pending' && f.action_user_id === user.id);
    return [accepted, pending, sent];
  }, [friends, user]);

  const usersYouCanAdd = useMemo(() => {
      // Combine IDs of current friends and anyone involved in a pending request
      const excludedUserIds = new Set(friends.map(f => f.friend_user_id));
      // Users you can add are those in allUsers not in the excluded set
      return allUsers.filter(u => !excludedUserIds.has(u.user_id));
  }, [allUsers, friends]);


  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[calc(100vh-160px)]">
        <Loader2 size={48} className="animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    // Removed Navbar
    <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
      {/* Page Header */}
      <div className="space-y-1 mb-10">
        <h1 data-font-orbitron className="text-3xl md:text-4xl font-bold text-white text-glow-blue flex items-center gap-3">
          <Users size={32} className="text-blue-400" /> Manage Friends
        </h1>
        <p className="text-gray-400">Connect with other players on GameVerse.</p>
      </div>

      {/* Tabs */}
      <div>
        {/* Tab Headers */}
        <div className="mb-6 border-b border-purple-500/30">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('connections')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'connections'
                  ? 'border-purple-400 text-purple-300'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'
              }`}
            >
              My Connections
            </button>
            <button
               onClick={() => setActiveTab('add')}
               className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'add'
                  ? 'border-purple-400 text-purple-300'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'
               }`}
            >
              Add Friends
            </button>
          </nav>
        </div>

        {/* Tab Content Area */}
        <div>
          {/* My Connections Tab */}
          <div className={`${activeTab === 'connections' ? 'block' : 'hidden'} space-y-6`}>
              {/* Incoming Requests */}
              {pendingRequests.length > 0 && (
                  <div className="admin-card p-6">
                      <h3 className="text-lg font-semibold text-blue-300 mb-4">Incoming Friend Requests</h3>
                      <div className="space-y-3">
                          {pendingRequests.map(req => (
                              <div key={req.friend_user_id} className="flex flex-col sm:flex-row justify-between items-center p-3 bg-gray-700/40 rounded-lg">
                                  <p className="font-medium text-white mb-2 sm:mb-0">{req.f_name} {req.l_name}</p>
                                  <div className="flex gap-2 flex-shrink-0">
                                      <button
                                         onClick={() => handleRespondRequest(req.friend_user_id, 'accept')}
                                         disabled={isResponding === req.friend_user_id}
                                         className="neon-button-small !px-3 !py-1 bg-green-600 hover:bg-green-500 hover:shadow-green-500/40 focus:ring-green-500 inline-flex items-center gap-1 disabled:opacity-50"
                                      >
                                         {isResponding === req.friend_user_id ? <Loader2 size={14} className="animate-spin"/> : <UserCheck size={14}/>} Accept
                                      </button>
                                      <button
                                         onClick={() => handleRespondRequest(req.friend_user_id, 'decline')}
                                         disabled={isResponding === req.friend_user_id}
                                         className="neon-button-small !px-3 !py-1 bg-red-600 hover:bg-red-500 hover:shadow-red-500/40 focus:ring-red-500 inline-flex items-center gap-1 disabled:opacity-50"
                                       >
                                         {isResponding === req.friend_user_id ? <Loader2 size={14} className="animate-spin"/> : <UserX size={14}/>} Decline
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Friends List */}
              <div className="admin-card p-6">
                  <h3 className="text-lg font-semibold text-purple-300 mb-4">Your Friends ({acceptedFriends.length})</h3>
                  {acceptedFriends.length > 0 ? (
                     <ul className="space-y-3">
                         {acceptedFriends.map(f => (
                             <li key={f.friend_user_id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-700/30 transition-colors">
                                 <p className="font-medium text-white">{f.f_name} {f.l_name}</p>
                                 {/* --- NEW MESSAGE BUTTON --- */}
                                 <Link
                                    to={`/chat/${f.friend_user_id}`}
                                    state={{ friendName: `${f.f_name} ${f.l_name}` }} // Pass friend's name
                                    className="neon-button-small !px-3 !py-1 bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/40 focus:ring-blue-500 inline-flex items-center gap-1"
                                 >
                                    <MessageCircle size={14} /> Message
                                 </Link>
                                 {/* --- END NEW --- */}
                             </li>
                         ))}
                     </ul>
                  ) : <p className="text-gray-500 text-center py-4">You haven't added any friends yet.</p>}
              </div>

              {/* Sent Requests */}
              {sentRequests.length > 0 && (
                  <div className="admin-card p-6">
                      <h3 className="text-lg font-semibold text-gray-400 mb-4">Sent Requests ({sentRequests.length})</h3>
                       <ul className="space-y-2">
                           {sentRequests.map(req => (
                               <li key={req.friend_user_id} className="p-2 text-gray-500 italic">{req.f_name} {req.l_name} (Pending)</li>
                           ))}
                       </ul>
                  </div>
              )}
          </div>

          {/* Add Friends Tab */}
           <div className={`${activeTab === 'add' ? 'block' : 'hidden'}`}>
                <div className="admin-card p-6">
                    <h3 className="text-lg font-semibold text-blue-300 mb-4">Find Players</h3>
                    <div className="space-y-3">
                        {usersYouCanAdd.length > 0 ? usersYouCanAdd.map(u => (
                            <div key={u.user_id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-700/30 transition-colors">
                                <p className="font-medium text-white">{u.f_name} {u.l_name}</p>
                                <button
                                   onClick={() => handleSendRequest(u.user_id)}
                                   disabled={isSubmitting === u.user_id}
                                   className="neon-button-small !px-3 !py-1 inline-flex items-center gap-1 disabled:opacity-50"
                                >
                                   {isSubmitting === u.user_id ? <Loader2 size={14} className="animate-spin"/> : <UserPlus size={14}/>} Send Request
                                </button>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-center py-4">No new players found to add.</p>
                        )}
                    </div>
                </div>
           </div>
        </div> {/* End Tab Content Area */}
      </div> {/* End Tabs Wrapper */}
    </main>
    // Removed Footer
  );
};

export default Friends;

