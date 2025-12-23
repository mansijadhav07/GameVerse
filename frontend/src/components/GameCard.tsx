import { Link } from 'react-router-dom';
// Use Phosphor icons
import { Star, Users, ShoppingCart } from "@phosphor-icons/react";

interface GameCardProps {
  id: number;
  title: string;
  genre: string;
  rating: number | string; // Allow string for rating from API
  players: string; // Keep this prop, even if not always available from API
  image: string;
  price?: number | string; // Allow string for price from API
  onPurchaseClick?: (event: React.MouseEvent<HTMLButtonElement>) => void; // Optional click handler
}

const GameCard = ({ id, title, genre, rating, players, image, price, onPurchaseClick }: GameCardProps) => {
  const handlePurchaseWrapper = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Stop event bubbling
    if (onPurchaseClick) {
      onPurchaseClick(e);
    }
  };

  // --- NEW: Helper to safely format price ---
  const formatPrice = (p: number | string | undefined): string | null => {
      if (p === undefined || p === null) return null;
      const numPrice = Number(p); // Attempt to convert to number
      if (isNaN(numPrice)) return null; // Return null if conversion fails
      return numPrice.toFixed(2);
  }
  const displayPrice = formatPrice(price);
  // --- END NEW ---

  // --- NEW: Helper to safely format rating ---
   const formatRating = (r: number | string | undefined): string => {
       if (r === undefined || r === null) return 'N/A';
       const numRating = Number(r);
       if (isNaN(numRating)) return 'N/A';
       return numRating.toFixed(1);
   }
   const displayRating = formatRating(rating);
   // --- END NEW ---


  return (
    // Uses .game-card style from index.css
    <div className="game-card group flex flex-col h-full">
      <Link to={`/game/${id}`} className="block aspect-video overflow-hidden relative">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          // Add error handling for images
          onError={(e) => {
             const target = e.target as HTMLImageElement;
             target.onerror = null; // Prevent infinite loop
             target.src = `https://placehold.co/600x400/1a1a2e/e0e0e0?text=${encodeURIComponent(title)}`; // Fallback placeholder
          }}
        />
      </Link>

      <div className="p-4 flex flex-col flex-grow"> {/* Use flex-grow here */}
        <h3 className="font-bold text-lg text-white mb-1 group-hover:text-purple-400 transition-colors truncate">
          {title}
        </h3>
        <p className="text-sm text-gray-400 mb-3">{genre}</p>

        <div className="flex items-center justify-between text-sm mb-4 mt-auto"> {/* Use mt-auto here */}
          <div className="flex items-center gap-1 text-amber-400">
            <Star size={16} weight="fill" />
            {/* Use formatted rating */}
            <span className="font-semibold">{displayRating}</span>
          </div>
           {/* Display price here only if NOT shown via purchase button */}
           {displayPrice !== null && !onPurchaseClick && (
              <span className="font-bold text-lg text-purple-400">${displayPrice}</span>
           )}
        </div>

        {/* Buttons Section */}
        <div className="flex items-stretch gap-2">
          <Link to={`/game/${id}`} className="neon-button-small flex-1 text-center">
            View Details
          </Link>
          {/* Conditional Purchase Button - Use formatted price */}
          {displayPrice !== null && onPurchaseClick && (
            <button
              onClick={handlePurchaseWrapper}
              className="neon-button-small flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/40 focus:ring-blue-500" // Use blue for purchase
            >
              <ShoppingCart size={16} /> Purchase (${displayPrice}) {/* Use displayPrice */}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameCard;

