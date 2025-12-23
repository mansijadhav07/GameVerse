import { Link } from "react-router-dom";
import { Trophy, Lightning, Users, SealCheck } from "@phosphor-icons/react";
import GameCard from "../components/GameCard";

// --- DYNAMIC API URL CONFIGURATION ---
// Even if not used yet, keeping this here allows for future dynamic features
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Home = () => {
  // Use placeholder images for featured games
  const featuredGames = [
    { id: 1, title: "Cyber Warfare", genre: "FPS", rating: 4.8, players: "150K+", image: "https://placehold.co/600x600/1a1a2e/e0e0e0?text=Cyber+Warfare" },
    { id: 2, title: "Mystic Realms", genre: "RPG", rating: 4.9, players: "200K+", image: "https://placehold.co/600x600/1a1a2e/e0e0e0?text=Mystic+Realms" },
    { id: 3, title: "Neon Rush", genre: "Racing", rating: 4.7, players: "120K+", image: "https://placehold.co/600x600/1a1a2e/e0e0e0?text=Neon+Rush" },
    { id: 4, title: "Strategy Command", genre: "Strategy", rating: 4.6, players: "80K+", image: "https://placehold.co/600x600/1a1a2e/e0e0e0?text=Strategy+Command" },
  ];

  const features = [
    {
      icon: Trophy,
      title: "Compete & Win",
      description: "Climb the leaderboards and prove you're the best",
    },
    {
      icon: Lightning, 
      title: "Fast-Paced Action",
      description: "Experience thrilling gameplay with zero lag",
    },
    {
      icon: Users,
      title: "Join Community",
      description: "Connect with millions of gamers worldwide",
    },
    {
      icon: SealCheck, 
      title: "Unlock Achievements",
      description: "Earn badges and showcase your skills",
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative text-white py-40 overflow-hidden min-h-[70vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-blue-900/30 opacity-50 z-0"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 data-font-orbitron className="text-5xl md:text-7xl font-bold mb-6 text-glow-purple leading-tight">
            Welcome to <span className="text-purple-400">GameVerse</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Your ultimate destination for discovering, playing, and competing.
            <br />
            Dive into the universe of games.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/games" className="neon-button text-lg">
              Explore Games
            </Link>
            <Link
              to="/register"
              className="px-8 py-3 rounded-lg text-lg font-semibold text-white bg-gray-700/50 border border-gray-600 hover:bg-gray-700/80 hover:border-gray-500 transition duration-300 backdrop-blur-sm"
            >
              Join Now
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-950/40">
        <div className="container mx-auto px-4">
          <h2 data-font-orbitron className="text-3xl md:text-4xl font-bold text-center mb-16 text-white text-glow-blue">
            Why Choose <span className="text-blue-400">GameVerse</span>?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-gray-800/30 rounded-xl border border-blue-500/30 backdrop-blur-sm hover:border-blue-500/70 hover:bg-gray-800/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2"
              >
                <div className="p-3 bg-blue-600/20 border border-blue-500/50 rounded-lg w-fit mb-4 transition-all duration-300 group-hover:bg-blue-600/40 group-hover:shadow-lg group-hover:shadow-blue-500/20">
                  <feature.icon size={28} className="text-blue-300" />
                </div>
                <h3 className="font-semibold text-xl mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Games Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4">
            <h2 data-font-orbitron className="text-3xl md:text-4xl font-bold text-white text-glow-purple">
              Featured <span className="text-purple-400">Games</span>
            </h2>
            <Link
              to="/games"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-300 group flex items-center gap-1"
            >
              View All Games
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGames.map((game) => (
              <GameCard key={game.id} {...game} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20">
         <div className="container mx-auto px-4 relative z-10 text-center">
           <div className="max-w-3xl mx-auto space-y-6">
             <h2 data-font-orbitron className="text-4xl md:text-5xl font-bold text-white text-glow-purple">
               Ready to Start Your Journey?
             </h2>
             <p className="text-xl text-gray-300">
               Join thousands of gamers and experience gaming like never before.
             </p>
             <Link to="/register" className="neon-button inline-block text-lg">
               Create Free Account
             </Link>
           </div>
         </div>
      </section>
    </>
  );
};

export default Home;