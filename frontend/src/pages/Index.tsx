import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Spinner, ArrowRight } from '@phosphor-icons/react';
import { toast } from 'sonner';
import GameCard from '../components/GameCard'; // Corrected relative path

interface Game {
  game_id: number;
  title: string;
  genre: string;
  rating: number | string;
  price: number;
  image_url?: string;
}

const Index = () => {
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedGames = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:3001/api/games/featured');
        setFeaturedGames(response.data);
      } catch (error) {
        console.error("Failed to fetch featured games:", error);
        toast.error("Could not load featured games.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeaturedGames();
  }, []);

  return (
    <>
      {/* Hero Section - Enhanced with dynamic background and stronger neon */}
      <section className="relative text-white py-40 overflow-hidden min-h-[70vh] flex items-center hero-background-warp">
        {/* Removed static gradient, now handled by .hero-background-warp::before */}
        <div className="absolute inset-0 z-0 opacity-20">
          {/* Example of subtle pattern / texture overlay, could be SVG or another image */}
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center animate-fade-in">
          <h1 data-font-orbitron className="text-4xl md:text-7xl font-bold mb-4 text-glow-blue-strong leading-tight">
             Enter the <span className='text-blue-400'>WarpZone</span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Your ultimate destination for discovering, playing, and competing. Dive into the universe of games.
          </p>
          <div className="animation-delay-400">
            <Link to="/games" className="neon-button neon-button-pulse inline-flex items-center gap-2 text-lg">
              Explore Games <ArrowRight size={20} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Games Section - Retains previous styling */}
      <section className="py-16 bg-gray-950/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4">
            <h2 data-font-orbitron className="text-3xl font-bold text-white text-glow-purple">
              Featured <span className='text-purple-400'>Games</span>
            </h2>
             <Link
               to="/games"
               className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-300 group flex items-center gap-1"
             >
               View All Games
               <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
             </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size={40} className="text-purple-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredGames.map((game) => (
                <GameCard
                  key={game.game_id}
                  id={game.game_id}
                  title={game.title}
                  genre={game.genre}
                  rating={Number(game.rating)}
                  players="N/A"
                  image={game.image_url || `https://placehold.co/600x600/1F2937/A78BFA?text=${encodeURIComponent(game.title)}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Index;

