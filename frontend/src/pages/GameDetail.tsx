import { useEffect, useState, FormEvent, ChangeEvent, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
// Use alias path for AuthContext
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  GameController,
  Spinner,
  Star,
  User as UserIcon, // Renamed to avoid conflict
  Heart,
  PencilSimple, // Edit Icon
  TrashSimple, // Delete Icon
  ShoppingCart // Purchase Icon
} from '@phosphor-icons/react';

// Define shapes for our data
interface Game {
  game_id: number;
  title: string;
  genre: string;
  rating: number | string;
  image_url?: string;
  price?: number;
}

interface Review {
  review_id: number;
  f_name: string;
  l_name: string;
  user_exp: string;
  feedback: string;
  recommendations: string;
}

// Interface for the edit form data
interface EditReviewData {
    user_exp: string;
    feedback: string;
    recommendations: string;
}

const GameDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, updateUserBalance } = useAuth(); // Get updateUserBalance
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for the NEW review form
  const [newReviewData, setNewReviewData] = useState({
    user_exp: '',
    feedback: '',
    recommendations: ''
  });

  // --- State for Purchase Modal (copied from Games.tsx) ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedGameForPurchase, setSelectedGameForPurchase] = useState<Game | null>(null);
  // --- End Purchase Modal State ---

  // --- State for Admin Edit/Delete ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [editFormData, setEditFormData] = useState<EditReviewData>({
      user_exp: '',
      feedback: '',
      recommendations: ''
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  // --- End Admin State ---

  const fetchGameDetails = useCallback(async () => { // Wrap in useCallback
    if (!id) return; // Exit if id is not available
    setIsLoading(true); // Set loading true at the start
    try {
      // --- CORRECTED ENDPOINT ---
      const response = await axios.get(`http://localhost:3001/api/game/${id}/reviews`);
      // --- END CORRECTION ---

      setGame(response.data.game || null); // Ensure game becomes null if not found
      setReviews(response.data.reviews || []); // Ensure reviews is always an array
    } catch (error: any) {
      console.error("Failed to fetch game details", error);
      toast.error(error.response?.data?.message || "Could not load game details or game not found.");
      setGame(null); // Set game to null on error
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Dependency array includes id

  useEffect(() => {
    fetchGameDetails();
  }, [fetchGameDetails]); // Run fetchGameDetails when it changes (essentially on id change)

  // --- Handlers for NEW Review ---
  const handleNewReviewChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewReviewData({ ...newReviewData, [e.target.name]: e.target.value });
  }

  const handleNewReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!user || !token) {
      toast.error("You must be logged in to submit a review.");
      return;
    }
    // Simple validation
    if (!newReviewData.user_exp.trim() || !newReviewData.feedback.trim() || !newReviewData.recommendations.trim()) {
        toast.error("Please fill out all fields in the review.");
        return;
    }
    try {
      await axios.post(
        `http://localhost:3001/api/game/${id}/review`,
        newReviewData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Your review has been submitted!");
      setNewReviewData({ user_exp: '', feedback: '', recommendations: '' }); // Clear form
      fetchGameDetails(); // Refresh reviews
    } catch (error: any) {
      console.error("Failed to submit review:", error);
      toast.error(error.response?.data?.message || "Failed to submit review. Please try again.");
    }
  }
  // --- End NEW Review Handlers ---

   // --- Handlers for Purchase (copied from Games.tsx) ---
   const openConfirmation = (e: React.MouseEvent, gameToPurchase: Game | null) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            toast.error("Please log in to purchase a game.");
            navigate('/login');
            return;
        }
        if (!gameToPurchase) return; // Should not happen here, but good check
        setSelectedGameForPurchase(gameToPurchase);
        setIsConfirmModalOpen(true);
    }

   const handleConfirmPurchase = async () => {
        if (!selectedGameForPurchase) return;
        const token = localStorage.getItem('token');
        try {
            const response = await axios.post(
                'http://localhost:3001/api/purchase',
                { game_id: selectedGameForPurchase.game_id, price: selectedGameForPurchase.price },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Successfully purchased a license for "${selectedGameForPurchase.title}"!`);
            if (updateUserBalance) { // Check if function exists before calling
                updateUserBalance(response.data.newBalance); // Update balance in context
            }
            setIsConfirmModalOpen(false);
            setSelectedGameForPurchase(null);
            // Optionally: You might want to update the UI to show "Owned" or disable purchase
        } catch (error: any) {
            console.error("Purchase failed:", error);
            // Display specific error from backend if available
            toast.error(error.response?.data?.message || "Purchase failed. Please try again later.");
            setIsConfirmModalOpen(false); // Close modal even on error
            setSelectedGameForPurchase(null);
        }
    };
    // --- End Purchase Handlers ---

  // --- Handlers for ADMIN Edit/Delete ---
  const openEditModal = (review: Review) => {
    setSelectedReview(review);
    setEditFormData({
        user_exp: review.user_exp,
        feedback: review.feedback,
        recommendations: review.recommendations
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setIsSubmittingEdit(true);
    const token = localStorage.getItem('token');
    try {
        await axios.put(
            `http://localhost:3001/api/admin/reviews/${selectedReview.review_id}`, // Your NEW backend endpoint
            editFormData,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Review updated successfully!");
        setIsEditModalOpen(false);
        fetchGameDetails(); // Refresh reviews
    } catch (error: any) {
        console.error("Failed to update review:", error);
        toast.error(error.response?.data?.message || "Failed to update review.");
    } finally {
        setIsSubmittingEdit(false);
    }
  };

  const openDeleteModal = (review: Review) => {
    setSelectedReview(review);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteReview = async () => {
    if (!selectedReview) return;
    const token = localStorage.getItem('token');
    try {
        await axios.delete(
            `http://localhost:3001/api/admin/reviews/${selectedReview.review_id}`, // Your NEW backend endpoint
            { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Review deleted successfully!");
        setIsDeleteModalOpen(false);
        fetchGameDetails(); // Refresh reviews
    } catch (error: any) {
        console.error("Failed to delete review:", error);
        toast.error(error.response?.data?.message || "Failed to delete review.");
        setIsDeleteModalOpen(false); // Close modal even on error
    }
  };
  // --- End ADMIN Handlers ---


  const handleAddToWishlist = async () => {
     if (!user) {
         toast.error("You must be logged in to add to your wishlist.");
         navigate('/login');
         return;
     }
     const token = localStorage.getItem('token');
     try {
         await axios.post(
             'http://localhost:3001/api/wishlist',
             { game_id: id },
             { headers: { Authorization: `Bearer ${token}` } }
         );
         toast.success(`${game?.title} has been added to your wishlist!`);
     } catch (error: any) {
         toast.error(error.response?.data?.message || "Failed to add to wishlist. Maybe it's already there?");
         console.error("Error adding to wishlist", error);
     }
  }


  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-160px)]">
        <Spinner size={48} className="text-purple-500 animate-spin" />
      </div>
    );
  }

  // Use a more specific error message based on the API response or game state
  if (!game) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-160px)] text-red-400 text-xl">
        <p>Could not load game details or game not found.</p>
      </div>
    );
  }

  return (
    // Removed Navbar from here
    <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
      {/* Game Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
          {/* Use Game Image if available, otherwise placeholder */}
          <img
            src={game.image_url || `https://placehold.co/600x800/1a1a2e/e0e0e0?text=${encodeURIComponent(game.title)}`}
            alt={`${game.title} cover`}
            className="w-full md:w-1/3 h-auto object-cover rounded-lg shadow-lg border border-purple-500/30"
            onError={(e) => {
                 const target = e.target as HTMLImageElement;
                 target.onerror = null; // Prevent infinite loop
                 target.src = `https://placehold.co/600x800/1a1a2e/e0e0e0?text=${encodeURIComponent(game.title)}`;
              }}
           />
          <div className="w-full md:w-2/3">
              <h1 data-font-orbitron className="text-4xl lg:text-5xl font-bold mb-3 text-white text-glow-purple">{game.title}</h1>
              <p className="text-lg text-blue-300 mb-5">{game.genre}</p>
              <div className="flex items-center gap-2 mb-6">
                  <Star size={24} weight="fill" className="text-amber-400" />
                  <span className="text-2xl font-bold text-white">{typeof game.rating === 'number' ? game.rating.toFixed(1) : game.rating}</span>
                  <span className="text-gray-400">/ 10</span>
              </div>
              {/* Optional: Add Description */}
              {/* Removed description display as it's not in the corrected query */}
              {/* {game.description && (
                   <p className="text-gray-300 mb-6 leading-relaxed">{game.description}</p>
              )} */}
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                 {user && (
                      <button onClick={handleAddToWishlist} className="neon-button-small inline-flex items-center gap-2">
                          <Heart size={16} />
                          Add to Wishlist
                      </button>
                  )}
                 {/* --- Purchase Button --- */}
                 {user && game.price !== undefined && game.price !== null && (
                     <button
                         onClick={(e) => openConfirmation(e, game)} // Use openConfirmation
                         className="neon-button flex items-center gap-2 bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/40 focus:ring-blue-500" // Use blue
                     >
                         <ShoppingCart size={20} /> Purchase (${Number(game.price).toFixed(2)})
                     </button>
                 )}
                 {/* --- END Purchase Button --- */}
              </div>
          </div>
      </div>

      {/* Separator Line */}
      <hr className="border-t border-purple-500/30 my-12" />

      {/* Reviews Section */}
      <div className="space-y-8">
          <h2 data-font-orbitron className="text-3xl font-bold text-white text-glow-blue">Community Reviews</h2>

          {/* Form to write a new review (Only if logged in) */}
          {user && (
              <div className="admin-card p-6"> {/* Reusing admin-card style */}
                  <h3 className="text-xl font-semibold mb-4 text-white">Write Your Review</h3>
                   <form onSubmit={handleNewReviewSubmit} className="space-y-4">
                       <textarea name="user_exp" placeholder="Describe your user experience..." value={newReviewData.user_exp} onChange={handleNewReviewChange} required className="modal-input min-h-[80px]" />
                       <textarea name="feedback" placeholder="What feedback do you have for the developers?" value={newReviewData.feedback} onChange={handleNewReviewChange} required className="modal-input min-h-[80px]" />
                       <textarea name="recommendations" placeholder="Any recommendations for other players?" value={newReviewData.recommendations} onChange={handleNewReviewChange} required className="modal-input min-h-[80px]" />
                       <button type="submit" className="neon-button">Submit Review</button>
                   </form>
              </div>
          )}

          {/* List of existing reviews */}
          <div className="space-y-6">
              {reviews.length > 0 ? (
                  reviews.map(review => (
                      <div key={review.review_id} className="admin-card p-6 relative"> {/* Added relative positioning */}
                          <div className="flex items-center gap-3 mb-4">
                              <UserIcon size={32} className="text-gray-400" />
                              <h4 className="text-lg font-semibold text-white">{review.f_name} {review.l_name}</h4>
                          </div>
                          <div className="space-y-4 text-gray-300 text-sm">
                              <div>
                                  <h5 className="font-semibold text-purple-300 mb-1">User Experience</h5>
                                  <p>{review.user_exp}</p>
                              </div>
                              <div>
                                  <h5 className="font-semibold text-purple-300 mb-1">Feedback</h5>
                                  <p>{review.feedback}</p>
                              </div>
                              <div>
                                  <h5 className="font-semibold text-purple-300 mb-1">Recommendations</h5>
                                  <p>{review.recommendations}</p>
                              </div>
                          </div>
                          {/* --- Admin Edit/Delete Buttons --- */}
                          {user?.role === 'admin' && (
                              <div className="absolute top-4 right-4 flex gap-2">
                                  <button
                                      onClick={() => openEditModal(review)}
                                      title="Edit Review"
                                      className="p-1.5 rounded-md text-blue-300 hover:bg-blue-900/50 transition-colors"
                                  >
                                      <PencilSimple size={18} />
                                  </button>
                                  <button
                                      onClick={() => openDeleteModal(review)}
                                      title="Delete Review"
                                      className="p-1.5 rounded-md text-red-400 hover:bg-red-900/50 transition-colors"
                                  >
                                      <TrashSimple size={18} />
                                  </button>
                              </div>
                          )}
                          {/* --- End Admin Buttons --- */}
                      </div>
                  ))
              ) : (
                  <p className="text-center text-gray-500 py-10">Be the first to write a review for this game!</p>
              )}
          </div>
      </div>

       {/* --- Purchase Confirmation Modal (Copied from Games.tsx) --- */}
       {isConfirmModalOpen && selectedGameForPurchase && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="modal-content w-full max-w-md"> {/* Use modal-content */}
                    <h3 data-font-orbitron className="text-xl font-semibold mb-4 text-white text-glow-purple">Confirm Purchase</h3>
                    <p className="text-gray-300 mb-6">
                        Purchase <strong>{selectedGameForPurchase?.title}</strong> for <strong className="text-purple-400">${Number(selectedGameForPurchase?.price).toFixed(2)}</strong>?
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsConfirmModalOpen(false); setSelectedGameForPurchase(null); }}
                            className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmPurchase}
                            className="neon-button-small bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/40 focus:ring-blue-500" // Use blue
                        >
                            Confirm Purchase
                        </button>
                    </div>
                </div>
            </div>
        )}

       {/* --- Admin Edit Review Modal --- */}
       {isEditModalOpen && selectedReview && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="modal-content w-full max-w-lg">
                    <h3 className="text-xl font-semibold mb-4 text-white">Edit Review by {selectedReview.f_name} {selectedReview.l_name}</h3>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="edit_user_exp" className="modal-label">User Experience</label>
                            <textarea id="edit_user_exp" name="user_exp" value={editFormData.user_exp} onChange={handleEditChange} required className="modal-input min-h-[80px]" />
                        </div>
                        <div>
                            <label htmlFor="edit_feedback" className="modal-label">Feedback</label>
                            <textarea id="edit_feedback" name="feedback" value={editFormData.feedback} onChange={handleEditChange} required className="modal-input min-h-[80px]" />
                        </div>
                        <div>
                            <label htmlFor="edit_recommendations" className="modal-label">Recommendations</label>
                            <textarea id="edit_recommendations" name="recommendations" value={editFormData.recommendations} onChange={handleEditChange} required className="modal-input min-h-[80px]" />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors">Cancel</button>
                            <button type="submit" disabled={isSubmittingEdit} className="neon-button-small inline-flex items-center gap-2 disabled:opacity-50">
                                {isSubmittingEdit && <Spinner size={16} className="animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
       )}

        {/* --- Admin Delete Review Modal --- */}
       {isDeleteModalOpen && selectedReview && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="modal-content w-full max-w-md">
                    <h3 className="text-xl font-semibold mb-2 text-white">Confirm Deletion</h3>
                    <p className="text-gray-300 mb-6">Are you sure you want to delete the review by {selectedReview.f_name} {selectedReview.l_name}? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                         <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors">Cancel</button>
                         <button type="button" onClick={handleDeleteReview} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 transition-colors font-medium">Yes, Delete</button>
                    </div>
                </div>
            </div>
       )}

    </main>
  );
};

export default GameDetail;

