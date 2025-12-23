import { useEffect, useState } from 'react';
import axios from 'axios';
// Use relative path for GameCard
import GameCard from "../components/GameCard";
// Use Phosphor icons (ensure @phosphor-icons/react is installed!)
import { Spinner, ShoppingCart, WarningCircle } from "@phosphor-icons/react";
import { toast } from 'sonner';
// Use relative path for AuthContext
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

// Define shapes for our data (matching API response)
interface GameFromApi {
  game_id: number;
  title: string;
  genre: string;
  rating: number | string;
  price: number;
  image_url?: string | null; // Allow null from API
}

// Define shape expected by GameCard (ensuring image is always string)
interface GameForCard {
    game_id: number;
    title: string;
    genre: string;
    rating: number | string;
    price: number;
    image: string; // Ensure image is always a string (URL or placeholder)
}


const Games = () => {
  const [games, setGames] = useState<GameForCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // State for fetch errors
  const [selectedGame, setSelectedGame] = useState<GameFromApi | null>(null); // Use API shape here
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { user, updateUserBalance } = useAuth();
  const navigate = useNavigate();

  const fetchGames = async () => {
      setIsLoading(true);
      setError(null); // Reset error on new fetch
      try {
        const response = await axios.get<GameFromApi[]>('http://localhost:3001/api/games');
        // Map API data to the format needed by GameCard, including placeholders
        const gamesForCard = response.data.map(game => ({
            ...game,
            // Provide placeholder if image_url is null or undefined
            image: game.image_url || `https://placehold.co/600x400/1a1a2e/e0e0e0?text=${encodeURIComponent(game.title)}`,
        }));
        setGames(gamesForCard);
      } catch (err) {
        console.error("Failed to fetch games", err);
        setError("Could not load the game catalog. Please try again later.");
        toast.error("Could not load the game catalog.");
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchGames();
  }, []);

  const openConfirmation = (e: React.MouseEvent, game: GameFromApi) => { // Use API shape here
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
          toast.error("Please log in to purchase a game.");
          navigate('/login');
          return;
      }
      setSelectedGame(game);
      setIsConfirmModalOpen(true);
  }

  const handleConfirmPurchase = async () => {
    if (!selectedGame) return;
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://localhost:3001/api/purchase',
        { game_id: selectedGame.game_id, price: selectedGame.price },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Successfully purchased a license for "${selectedGame.title}"!`);
      if (updateUserBalance) { // Check if function exists
          updateUserBalance(response.data.newBalance);
      }
      setIsConfirmModalOpen(false);
      setSelectedGame(null); // Clear selected game
    } catch (error: any) {
      console.error("Purchase failed:", error);
      toast.error(error.response?.data?.message || "Purchase failed. Please try again later.");
      setIsConfirmModalOpen(false); // Close modal on error too
      setSelectedGame(null); // Clear selected game
    }
  };

  return (
    // Removed Navbar from here
    <main className="flex-1 p-4 md:p-8 container mx-auto">
      <div className="space-y-2 mb-12">
        <h1 data-font-orbitron className="text-4xl font-bold text-glow-purple text-white">
            Game <span className="text-purple-400">Catalog</span>
        </h1>
        <p className="text-gray-400">Explore our vast library of games available for purchase.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size={48} className="animate-spin text-purple-400" />
        </div>
      ) : error ? (
           <div className="flex flex-col items-center justify-center h-64 text-center text-red-400 admin-card p-8">
                <WarningCircle size={48} className="mb-4 text-red-500" />
                <p className="text-xl font-semibold mb-2">Error Loading Games</p>
                <p className="text-gray-400 mb-6">{error}</p>
                <button onClick={fetchGames} className="neon-button-small">
                    Retry
                </button>
            </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map(game => (
            // Pass necessary props to GameCard
            <GameCard
                key={game.game_id}
                id={game.game_id}
                title={game.title}
                genre={game.genre}
                rating={Number(game.rating)} // Ensure rating is number if possible
                players="N/A" // Add players if available, otherwise placeholder
                image={game.image} // Use the processed image URL (real or placeholder)
                price={game.price} // Pass the price
                onPurchaseClick={(e) => openConfirmation(e, game)} // Pass the click handler
            />
          ))}
        </div>
      )}

      {/* Confirmation Modal - Styled with Tailwind */}
      {isConfirmModalOpen && selectedGame && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="modal-content w-full max-w-md"> {/* Use modal-content class */}
                <h3 className="text-xl font-semibold mb-3 text-white" data-font-orbitron>Confirm Purchase</h3>
                <p className="text-gray-300 mb-6">
                    Purchase <strong>{selectedGame.title}</strong> for <strong className="text-purple-400">${Number(selectedGame.price).toFixed(2)}</strong>?
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => { setIsConfirmModalOpen(false); setSelectedGame(null); }}
                        className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                     <button
                        type="button"
                        onClick={handleConfirmPurchase}
                        className="neon-button-small inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/40 focus:ring-blue-500" // Blue confirm
                    >
                        <ShoppingCart size={16} /> Confirm Purchase
                    </button>
                </div>
            </div>
         </div>
      )}
    </main>
  );
};

export default Games;

