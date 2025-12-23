import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
// --- Using LUCIDE-REACT icons ---
import {
    Loader2, // Spinner
    Trophy, // Main icon
    Crown // Rank icon
} from 'lucide-react';
// --- END ---

// Define shapes for our new data
interface LeaderboardEntry {
  f_name: string;
  l_name: string;
  achievements_unlocked: number | string; // Can be string from COUNT(*)
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(true);

  // Fetch the new global leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoadingScores(true);
      try {
        const response = await axios.get(`http://localhost:3001/api/leaderboard`);
        setLeaderboard(response.data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Could not load leaderboard.");
        setLeaderboard([]);
      } finally {
        setIsLoadingScores(false);
      }
    };

    fetchLeaderboard();
  }, []); // Runs once on mount
  
  const getRankIcon = (index: number) => {
      // Increased icon size to size={22}
      if (index === 0) return <Crown size={22} className="text-yellow-400 fill-yellow-400" />;
      if (index === 1) return <Crown size={22} className="text-gray-400 fill-gray-400" />;
      if (index === 2) return <Crown size={22} className="text-yellow-600 fill-yellow-600" />; // Bronze
      return <span className="font-bold text-lg text-gray-300">{index + 1}</span>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="space-y-1 mb-10">
          <h1 data-font-orbitron className="text-3xl md:text-4xl font-bold text-white text-glow-blue flex items-center gap-3">
            <Trophy size={32} className="text-blue-400" />Leaderboard
          </h1>
          <p className="text-gray-400">See who is dominating the top charts by achievements unlocked.</p>
        </div>

        <div className="admin-card overflow-hidden">
          <div className="p-6 border-b border-purple-500/30">
            <h3 data-font-orbitron className="text-xl font-semibold text-white">Top Players</h3>
            <p className="text-sm text-gray-400">Ranking based on total achievements unlocked.</p>
          </div>
        <div className="p-0">
            {isLoadingScores ? (
              <div className="flex justify-center items-center h-60">
                <Loader2 size={40} className="animate-spin text-purple-400" />
              </div>
            ) : (
            <div className="overflow-x-auto">
              {/* Removed table-fixed. Widths are set on headers. */}
               <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-700/30">
                    <tr>
                      {/* --- COLUMN WIDTHS FIXED --- */}
                      <th scope="col" className="px-6 py-4 w-[100px] text-center">Rank</th>
                      <th scope="col" className="px-6 py-4">Player</th> {/* Let this column be flexible */}
                    <th scope="col" className="px-6 py-4 w-[200px] text-right">Achievements Unlocked</th>
                      {/* --- END FIX --- */}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.length > 0 ? leaderboard.map((entry, index) => (
                      <tr key={index} className="border-b border-gray-700 even:bg-gray-700/10 hover:bg-gray-700/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-center">
                              <div className="flex items-center justify-center h-full">
                                {getRankIcon(index)}
                              </div>
                          </td>
                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{entry.f_name} {entry.l_name}</td>                   <td className="px-6 py-4 text-right font-bold text-purple-300">{String(entry.achievements_unlocked)}</td>
                      </tr>
                  )) : (
                      <tr>
                        <td colSpan={3} className="text-center h-40 text-gray-500">
                            No scores recorded yet.
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
            </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;

