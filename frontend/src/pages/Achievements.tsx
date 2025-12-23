import { useEffect, useState } from 'react';
import axios from 'axios';
// Removed Navbar import
// Removed shadcn imports
// Use Phosphor Icons
import { Spinner, Trophy as TrophyIcon, LockKey } from '@phosphor-icons/react';
import { toast } from 'sonner';
// Use relative path for AuthContext
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns'; // Keep date-fns

// --- Interfaces (kept the same) ---
interface Achievement {
  achievement_id: number;
  achievement_name: string;
  description: string;
}
interface UserAchievement extends Achievement {
  unlocked_at: string;
}

const Achievements = () => {
  const { user } = useAuth();
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [myAchievements, setMyAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Fetch Achievements (Kept the same logic) ---
  useEffect(() => {
    const fetchAchievements = async () => {
      setIsLoading(true);
      try {
        const allAchievementsPromise = axios.get('http://localhost:3001/api/achievements');
        const myAchievementsPromise = user
          ? axios.get('http://localhost:3001/api/my-achievements', {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
          : Promise.resolve({ data: [] });

        const [allAchievementsResponse, myAchievementsResponse] = await Promise.all([
          allAchievementsPromise,
          myAchievementsPromise
        ]);

        setAllAchievements(allAchievementsResponse.data);
        setMyAchievements(myAchievementsResponse.data);

      } catch (error) {
        toast.error("Could not load achievements.");
        console.error("Failed to fetch achievements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, [user]); // Rerun when user logs in or out

  // --- Logic for separating achievements (Kept the same) ---
  const unlockedIds = new Set(myAchievements.map(a => a.achievement_id));
  const unlockedList = allAchievements.filter(a => unlockedIds.has(a.achievement_id));
  const lockedList = allAchievements.filter(a => !unlockedIds.has(a.achievement_id));
  const myAchievementsDetails = myAchievements
    .map(myAch => {
      const details = allAchievements.find(a => a.achievement_id === myAch.achievement_id);
      return details ? { ...details, unlocked_at: myAch.unlocked_at } : null; // Add check if details exist
    })
    .filter(Boolean) as (Achievement & { unlocked_at: string })[]; // Filter out nulls and assert type

  return (
    // Removed outer div and Navbar
    <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="space-y-2 mb-8">
        <h1 data-font-orbitron className="text-3xl font-bold flex items-center gap-2 text-white text-glow-blue">
          <TrophyIcon size={32} className="text-yellow-400" weight="fill" />
          Achievements
        </h1>
        <p className="text-gray-400">Track your progress and unlocked trophies.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size={40} className="text-purple-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Unlocked Achievements Section */}
          {user && (
            <div className="admin-card"> {/* Using admin-card style */}
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-xl font-semibold text-white">Your Unlocked Achievements ({unlockedList.length} / {allAchievements.length})</h2>
                <p className="text-sm text-gray-400 mt-1">Trophies you have earned on your journey.</p>
              </div>
              <div className="p-4 space-y-4">
                {myAchievementsDetails.length > 0 ? myAchievementsDetails.map(ach => (
                  // Styling for unlocked achievement
                  <div key={ach.achievement_id} className="flex items-start sm:items-center gap-4 p-4 bg-yellow-900/20 border border-yellow-600/50 rounded-lg">
                    <TrophyIcon size={32} weight="fill" className="text-yellow-400 flex-shrink-0 mt-1 sm:mt-0" />
                    <div className="flex-1">
                      <p className="font-bold text-yellow-300">{ach.achievement_name}</p>
                      <p className="text-sm text-yellow-100/80">{ach.description}</p>
                    </div>
                    <p className="text-xs text-yellow-200/70 whitespace-nowrap mt-1 sm:mt-0">
                      {format(new Date(ach.unlocked_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-4">You haven't unlocked any achievements yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Locked Achievements Section */}
          <div className="admin-card"> {/* Using admin-card style */}
            <div className="p-4 border-b border-gray-700/50">
              <h2 className="text-xl font-semibold text-white">Available Achievements</h2>
              <p className="text-sm text-gray-400 mt-1">Challenges that await you in the GameVerse.</p>
            </div>
            <div className="p-4 space-y-4">
              {lockedList.map(ach => (
                 // Styling for locked achievement
                <div key={ach.achievement_id} className="flex items-start sm:items-center gap-4 p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg opacity-60">
                  <LockKey size={32} className="text-gray-500 flex-shrink-0 mt-1 sm:mt-0" />
                  <div className="flex-1">
                    <p className="font-bold text-gray-300">{ach.achievement_name}</p>
                    <p className="text-sm text-gray-400">{ach.description}</p>
                  </div>
                </div>
              ))}
               {lockedList.length === 0 && allAchievements.length > 0 && (
                   <p className="text-center text-green-400 font-semibold py-4">You've unlocked all available achievements!</p>
               )}
                {allAchievements.length === 0 && (
                   <p className="text-center text-gray-500 py-4">No achievements are currently available.</p>
               )}
            </div>
          </div>
        </div>
      )}
    </main>
    // Removed outer div
  );
};

export default Achievements;

/* Add to index.css if not already added:
.admin-card {
     @apply bg-gray-900/60 backdrop-blur-md border border-purple-500/30 rounded-lg shadow-lg shadow-purple-500/10 overflow-hidden;
}
*/

