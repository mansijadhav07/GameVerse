const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db'); // Your database connection module
require('dotenv').config(); // Make sure dotenv is configured

const app = express();
const PORT = process.env.PORT || 3001; // Use environment port or default

// --- Middleware ---
app.use(cors({
    // Configure CORS properly for production later
    // origin: 'YOUR_DEPLOYED_FRONTEND_URL'
}));
app.use(express.json());

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401); // if there isn't any token

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
        console.error("JWT Verification Error:", err.message); // Log error
        return res.sendStatus(403); // if token is invalid
    }
    req.user = user;
    next(); // pass the execution off to whatever request the client intended
  });
};

// Middleware to verify Admin role
const verifyAdmin = (req, res, next) => {
    // Ensure req.user exists from verifyToken before checking role
    if (!req.user || req.user.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
    }
    next();
};


// --- API ROUTES ---

// ============================================================================
// == USER & AUTH Routes ==
// ============================================================================
app.post('/api/signup', async (req, res) => {
  const { f_name, l_name, email, password, role } = req.body;
  if (!f_name || !l_name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const date_of_join = new Date();
    // Ensure role defaults to 'user' if not provided or invalid
    const userRole = (role === 'admin' || role === 'user') ? role : 'user';

    const newUser = await db.query(
      'INSERT INTO "user" (f_name, l_name, date_of_join, email, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, email, f_name, role',
      [f_name, l_name, date_of_join, email, password_hash, userRole]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error("Signup Error:", err.message); // Log specific error
    if (err.code === '23505') { // Unique violation (email exists)
        return res.status(409).json({ message: 'User with this email already exists.' }); // Use 409 Conflict
    }
    res.status(500).send('Server error during signup.');
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await db.query('SELECT * FROM "user" WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." }); // Use 401 Unauthorized
    }
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." }); // Use 401 Unauthorized
    }
    // Payload includes necessary user info
    const payload = {
      user: {
        id: user.user_id,
        name: user.f_name, // You might want f_name + l_name
        role: user.role
        // DO NOT include password hash here
      }
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }, // Consider a longer duration or refresh tokens
      (err, token) => {
        if (err) throw err;
        // Send user details along with token for easier frontend state management
        res.status(200).json({ token, user: payload.user });
      }
    );
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).send('Server error during login.');
  }
});

app.post('/api/user/wallet/add', verifyToken, async (req, res) => {
    const userId = req.user.user.id;
    const { amount } = req.body;
    const numericAmount = Number(amount); // Ensure amount is a number

    // Validate amount
    if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: "Invalid or non-positive amount." });
    }

    try {
        const result = await db.query(
            'UPDATE "user" SET wallet_balance = wallet_balance + $1 WHERE user_id = $2 RETURNING wallet_balance',
            [numericAmount, userId]
        );
        // Check if the user was found and updated
        if (result.rows.length === 0) {
             return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json({ message: "Funds added successfully!", newBalance: result.rows[0].wallet_balance });
    } catch (err) {
        console.error("Error adding funds:", err.message);
        res.status(500).send('Server error adding funds.');
    }
});

app.get('/api/user/wallet', verifyToken, async (req, res) => {
    const userId = req.user.user.id;
    try {
        const result = await db.query('SELECT wallet_balance FROM "user" WHERE user_id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json({ wallet_balance: result.rows[0].wallet_balance });
    } catch (err) {
        console.error("Error fetching wallet balance:", err.message);
        res.status(500).send('Server error fetching wallet balance.');
    }
});


// ============================================================================
// == GAMES, REVIEWS, OWNERSHIP Routes ==
// ============================================================================
app.get('/api/games/featured', async (req, res) => {
    try {
        // Fetching image_url, price, and ordering by created_at (most recent first)
        const featuredGames = await db.query('SELECT game_id, title, genre, rating, image_url, price, created_at FROM game ORDER BY created_at DESC NULLS LAST LIMIT 4');
        res.status(200).json(featuredGames.rows);
    } catch (err) {
        console.error("Error fetching featured games:", err.message);
        res.status(500).send('Server error fetching featured games.');
    }
});

app.get('/api/games', async (req, res) => {
    try {
        // Fetching essential game details including image_url and price, ordered by title
        const allGames = await db.query('SELECT game_id, title, genre, rating, image_url, price FROM game ORDER BY title ASC');
        res.status(200).json(allGames.rows);
    } catch (err) {
        console.error("Error fetching all games:", err.message);
        res.status(500).send('Server error fetching all games.');
    }
});

// Admin route to add a new game
app.post('/api/games', verifyToken, verifyAdmin, async (req, res) => {
  const { title, genre, rating, image_url, price } = req.body;
  // Basic validation
  if (!title || !genre || rating === undefined || price === undefined) {
      return res.status(400).json({ message: "Missing required game fields (title, genre, rating, price)." });
  }
  try {
    const newGame = await db.query(
        // Use COALESCE for optional image_url, ensure price is included
        'INSERT INTO game (title, genre, rating, image_url, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [title, genre, rating, image_url || null, price]
    );
    res.status(201).json(newGame.rows[0]);
  } catch (err) {
    console.error("Error adding game:", err.message);
    res.status(500).send('Server error adding game.');
  }
});

// Admin route to update an existing game
app.put('/api/games/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const gameId = parseInt(id, 10);
         if (isNaN(gameId)) return res.status(400).json({ message: "Invalid game ID format."});

        const { title, genre, rating, image_url, price } = req.body;
         // Basic validation
         if (!title || !genre || rating === undefined || price === undefined) {
             return res.status(400).json({ message: "Missing required game fields (title, genre, rating, price)." });
         }

        const updatedGame = await db.query(
            "UPDATE game SET title = $1, genre = $2, rating = $3, image_url = $4, price = $5 WHERE game_id = $6 RETURNING *",
            [title, genre, rating, image_url || null, price, gameId]
        );
        // Check if a game was actually updated
        if (updatedGame.rows.length === 0) return res.status(404).json({ message: "Game not found." });
        res.status(200).json(updatedGame.rows[0]);
    } catch (err) {
        console.error("Error updating game:", err.message);
        res.status(500).send("Server error updating game.");
    }
});

// Admin route to delete a game
app.delete('/api/games/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const gameId = parseInt(id, 10);
        if (isNaN(gameId)) return res.status(400).json({ message: "Invalid game ID format."});

        const deleteOp = await db.query("DELETE FROM game WHERE game_id = $1", [gameId]);
        // Check if a row was actually deleted
        if (deleteOp.rowCount === 0) return res.status(404).json({ message: "Game not found." });
        res.status(200).json({ message: "Game was deleted successfully." });
    } catch (err) {
        console.error("Error deleting game:", err.message);
        res.status(500).send("Server error deleting game.");
    }
});

// Get games owned by the logged-in user
app.get('/api/my-games', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user.id;
    // Query joins user, owns, license, belong_to, and game tables
    const ownedGames = await db.query(
      `SELECT g.game_id, g.title, g.genre, g.rating, g.image_url, g.price
       FROM "user" u
       JOIN owns o ON u.user_id = o.user_id
       JOIN license l ON o.lic_id = l.lic_id
       JOIN belong_to bt ON l.lic_id = bt.lic_id
       JOIN game g ON bt.game_id = g.game_id
       WHERE u.user_id = $1 ORDER BY g.title ASC`, // Added ORDER BY
      [userId]
    );
    res.status(200).json(ownedGames.rows);
  } catch (err) {
    console.error("Error fetching my-games:", err.message);
    res.status(500).send('Server error fetching my-games.');
  }
});

// Purchase a game license
app.post('/api/purchase', verifyToken, async (req, res) => {
  const { game_id, price } = req.body;
  const userId = req.user.user.id;

  console.log(`--- Purchase Attempt Start ---`);
  console.log(`User ID: ${userId}, Game ID: ${game_id}, Price: ${price}`);

  if (!game_id || price === undefined || price === null) { // More robust check
    console.error("Purchase failed: Missing game_id or price.");
    return res.status(400).json({ message: "Game ID and price are required." });
  }

  const numericPrice = Number(price); // Ensure price is treated as a number
  if (isNaN(numericPrice) || numericPrice < 0) {
     console.error(`Purchase failed: Invalid price format (${price}).`);
     return res.status(400).json({ message: "Invalid price format." });
  }
   console.log(`Numeric Price for comparison: ${numericPrice}`);

  const client = await db.pool.connect(); // Use pool for transactions
  try {
    await client.query('BEGIN'); // Start transaction

    // Get current balance and lock the row
    const userWallet = await client.query('SELECT wallet_balance FROM "user" WHERE user_id = $1 FOR UPDATE', [userId]);
    if (userWallet.rows.length === 0) {
        await client.query('ROLLBACK');
        console.error(`Purchase failed: User ${userId} not found.`);
        return res.status(404).json({ message: "User not found." });
    }

    const currentBalance = Number(userWallet.rows[0].wallet_balance); // Ensure balance is number
    console.log(`Current Balance from DB: ${currentBalance}`);

     if (isNaN(currentBalance)) { // Check if balance is a valid number
         await client.query('ROLLBACK');
         console.error(`Purchase failed: User ${userId} has invalid wallet balance (${userWallet.rows[0].wallet_balance}).`);
         return res.status(500).json({ message: "Internal error: Invalid wallet balance." });
    }

    // Check funds
    if (currentBalance < numericPrice) {
      await client.query('ROLLBACK');
      console.log(`Purchase failed: Insufficient funds for User ${userId}. Balance: ${currentBalance}, Price: ${numericPrice}`);
      return res.status(400).json({ message: "Insufficient funds." });
    }
    
    // --- CHECK IF FIRST PURCHASE ---
    const gamesOwnedResult = await client.query('SELECT COUNT(*) FROM owns WHERE user_id = $1', [userId]);
    const isFirstPurchase = parseInt(gamesOwnedResult.rows[0].count, 10) === 0;
    console.log(`Is this user's first purchase? ${isFirstPurchase}`);
    // --- END CHECK ---

    // Deduct price
    const newBalance = currentBalance - numericPrice;
    console.log(`Calculated New Balance: ${newBalance}`);
    await client.query('UPDATE "user" SET wallet_balance = $1 WHERE user_id = $2', [newBalance, userId]);
    console.log("Wallet balance updated.");

    // Create license
    const newLicense = await client.query(
      `INSERT INTO license (price, validity, date_of_purchase) VALUES ($1, INTERVAL '1 year', CURRENT_DATE) RETURNING lic_id`,
      [numericPrice] // Use the numeric price
    );
    const newLicId = newLicense.rows[0].lic_id;
    console.log(`New License ID: ${newLicId}`);

    // Link license to game
    await client.query(
      'INSERT INTO belong_to (lic_id, game_id) VALUES ($1, $2)',
      [newLicId, game_id]
    );
    console.log(`belong_to record inserted: Lic ${newLicId}, Game ${game_id}`);

    // Link user to license
    await client.query(
      'INSERT INTO owns (user_id, lic_id) VALUES ($1, $2)',
      [userId, newLicId]
    );
    console.log(`owns record inserted: User ${userId}, Lic ${newLicId}`);

    await client.query('COMMIT'); // Commit transaction
    console.log("Transaction committed successfully.");

    // --- GRANT ACHIEVEMENT (after commit) ---
    if (isFirstPurchase) {
        // We use db.grantAchievement which uses the main pool,
        // this is fine as the transaction is already committed.
        // --- ACHIEVEMENT ID 3 ---
        const granted = await db.grantAchievement(userId, 3); // Grant "First Purchase" (ID 3)
        if(granted) {
            console.log(`Granted 'First Purchase' (ID 3) to user ${userId}`);
        }
    }
    // --- END GRANT ---

    res.status(201).json({ message: "Purchase successful!", newBalance });

  } catch (err) {
    await client.query('ROLLBACK'); // Rollback on any error
    console.error('Purchase Transaction Error:', err.message, err.stack); // Log full error stack
    res.status(500).send('Server error during purchase.');
  } finally {
    client.release(); // Release client back to pool
  }
});

// Endpoint to get game details AND reviews
app.get('/api/game/:id/reviews', async (req, res) => {
  const gameId = parseInt(req.params.id, 10);
  if (isNaN(gameId)) return res.status(400).json({ message: 'Invalid game ID format' });
  try {
    // Fetch game details (ensure price and image_url are included)
    const gameResult = await db.query(
      'SELECT game_id, title, genre, rating, image_url, price FROM game WHERE game_id = $1',
      [gameId]
    );
    // Handle game not found
    if (gameResult.rows.length === 0) return res.status(404).json({ message: 'Game not found' });

    // Fetch reviews associated with the game
    const reviewsResult = await db.query(
      `SELECT r.review_id, r.user_exp, r.feedback, r.recommendations, u.f_name, u.l_name
       FROM review r JOIN "user" u ON r.user_id = u.user_id
       WHERE r.game_id = $1 ORDER BY r.review_id DESC`, // Order by newest first
      [gameId]
    );
    // Send both game and reviews back
    res.status(200).json({ game: gameResult.rows[0], reviews: reviewsResult.rows });
  } catch (err) {
    console.error("Error fetching game/reviews:", err.message);
    res.status(500).send('Server error fetching game/reviews.');
  }
});

// Post a review for a game
app.post('/api/game/:id/review', verifyToken, async (req, res) => {
    const gameId = parseInt(req.params.id, 10);
    if (isNaN(gameId)) return res.status(400).json({ message: 'Invalid game ID format' });

    const userId = req.user.user.id;
    const { user_exp, feedback, recommendations } = req.body;

    // Validate input
    if (!user_exp || !feedback || !recommendations) return res.status(400).json({ message: "All review fields are required." });

    try {
        // --- CHECK IF FIRST REVIEW ---
        const reviewCountResult = await db.query('SELECT COUNT(*) FROM review WHERE user_id = $1', [userId]);
        const isFirstReview = parseInt(reviewCountResult.rows[0].count, 10) === 0;
        console.log(`Is this user's first review? ${isFirstReview}`);
        // --- END CHECK ---

        // Insert the new review
        const newReview = await db.query(
            `INSERT INTO review (game_id, user_id, user_exp, feedback, recommendations) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [gameId, userId, user_exp, feedback, recommendations]
        );

        // --- GRANT ACHIEVEMENT ---
        if (isFirstReview) {
            // --- ACHIEVEMENT ID 1 ---
            const granted = await db.grantAchievement(userId, 1); // Grant "Community Voice" (ID 1)
            if(granted) {
                console.log(`Granted 'Community Voice' (ID 1) to user ${userId}`);
            }
        }
        // --- END GRANT ---

        res.status(201).json(newReview.rows[0]);
    } catch (err) {
        console.error("Error posting review:", err.message);
         // Check for specific DB errors like foreign key violation if gameId doesn't exist
         if (err.code === '23503') { // Foreign key violation
            return res.status(404).json({ message: "Cannot post review: Game not found." });
         } else if (err.code === '23505') { // Unique constraint violation (if you added one for user+game)
             return res.status(409).json({ message: "You have already reviewed this game." });
         }
        res.status(500).send('Server error posting review.');
    }
});

// --- Admin routes for reviews ---
app.put('/api/admin/reviews/:review_id', verifyToken, verifyAdmin, async (req, res) => {
    const reviewId = parseInt(req.params.review_id, 10);
    if (isNaN(reviewId)) return res.status(400).json({ message: 'Invalid review ID format' });
    const { user_exp, feedback, recommendations } = req.body;
     // Validate input
     if (!user_exp || !feedback || !recommendations) return res.status(400).json({ message: "All review fields are required." });

    try {
        // Use the imported db function
        const updatedReview = await db.updateReview(reviewId, { user_exp, feedback, recommendations });
         // Check if the review was found and updated
         if (!updatedReview) return res.status(404).json({ message: "Review not found." });
        res.status(200).json(updatedReview);
    } catch (err) {
        console.error("Error updating review (admin):", err.message);
        res.status(500).send('Server error updating review.');
    }
});

app.delete('/api/admin/reviews/:review_id', verifyToken, verifyAdmin, async (req, res) => {
    const reviewId = parseInt(req.params.review_id, 10);
    if (isNaN(reviewId)) return res.status(400).json({ message: 'Invalid review ID format' });

    try {
         // Use the imported db function
        const deletedCount = await db.deleteReview(reviewId);
         // Check if a review was actually deleted
         if (deletedCount === 0) return res.status(404).json({ message: "Review not found." });
        res.status(200).json({ message: "Review deleted successfully." });
    } catch (err) {
        console.error("Error deleting review (admin):", err.message);
        res.status(500).send('Server error deleting review.');
    }
});
// --- END Admin routes ---


// ============================================================================
// == WISHLIST Routes ==
// ============================================================================
app.get('/api/my-wishlist', verifyToken, async (req, res) => {
    const userId = req.user.user.id;
    try {
        const wishlistGames = await db.query(
            `SELECT g.game_id, g.title, g.genre, g.rating, g.image_url, g.price
             FROM game g
             JOIN wishlist_items wi ON g.game_id = wi.game_id
             JOIN user_list ul ON wi.list_id = ul.list_id
             WHERE ul.user_id = $1 ORDER BY g.title ASC`, // Added ORDER BY
            [userId]
        );
        res.status(200).json(wishlistGames.rows);
    } catch (err) {
        console.error("Error fetching wishlist:", err.message);
        res.status(500).send('Server error fetching wishlist.');
    }
});

app.post('/api/wishlist', verifyToken, async (req, res) => {
    const userId = req.user.user.id;
    const { game_id } = req.body;
    if (!game_id) return res.status(400).json({ message: "Game ID is required." });

    const client = await db.pool.connect(); // Use pool for transactions
    try {
        await client.query('BEGIN'); // Start transaction

        // Find or create the user's wishlist
        let listResult = await client.query('SELECT list_id FROM user_list WHERE user_id = $1', [userId]);
        let listId;
        if (listResult.rows.length === 0) {
            // Create a new list if one doesn't exist
            const newList = await client.query('INSERT INTO user_list (user_id, no_of_games) VALUES ($1, 0) RETURNING list_id', [userId]);
            listId = newList.rows[0].list_id;
        } else {
            listId = listResult.rows[0].list_id;
        }

        // Add game to wishlist_items, ignore if it already exists
        const insertResult = await client.query(
            'INSERT INTO wishlist_items (list_id, game_id) VALUES ($1, $2) ON CONFLICT (list_id, game_id) DO NOTHING RETURNING *',
             [listId, game_id]
        );

        // Only update count if something was actually inserted
        if (insertResult.rowCount > 0) {
             // Recalculate count to ensure accuracy
             await client.query(`UPDATE user_list SET no_of_games = (SELECT COUNT(*) FROM wishlist_items WHERE list_id = $1) WHERE list_id = $1`, [listId]);
        }

        await client.query('COMMIT'); // Commit transaction
        res.status(201).json({ message: "Game added to wishlist." });
    } catch (err) {
        await client.query('ROLLBACK'); // Rollback on error
        console.error("Error adding to wishlist:", err.message);
        res.status(500).send('Server error adding to wishlist.');
    } finally {
        client.release(); // Release client
    }
});

// --- Route to remove item from wishlist ---
app.delete('/api/wishlist/:game_id', verifyToken, async (req, res) => {
    const userId = req.user.user.id;
    const gameId = parseInt(req.params.game_id, 10);
     if (isNaN(gameId)) return res.status(400).json({ message: "Invalid game ID format." });

    try {
         // Use the imported db function
        const deletedCount = await db.removeWishlistItem(userId, gameId);
         // Check if an item was actually deleted
         if (deletedCount === 0) return res.status(404).json({ message: "Game not found in wishlist." });
        res.status(200).json({ message: "Game removed from wishlist." });
    } catch (err) {
        console.error("Error removing from wishlist:", err.message);
        res.status(500).send('Server error removing from wishlist.');
    }
});
// --- END ---


// ============================================================================
// == LEADERBOARD, ACHIEVEMENTS, FRIENDS, ADMIN Routes ==
// ============================================================================

// --- UPDATED: Leaderboard route ---
// This route now fetches the new achievement-based leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        // Use the new DB function
        const leaderboardData = await db.getAchievementLeaderboard();
        res.status(200).json(leaderboardData);
    } catch (err) {
        console.error("Error fetching achievement leaderboard:", err.message);
        res.status(500).send('Server error fetching leaderboard.');
    }
});
// --- END UPDATED ---

// Keep /api/achievements
app.get('/api/achievements', async (req, res) => {
    try {
        const allAchievements = await db.query('SELECT * FROM achievements ORDER BY achievement_name');
        res.status(200).json(allAchievements.rows);
    } catch (err) {
        console.error("Error fetching all achievements:", err.message);
        res.status(500).send('Server error fetching all achievements.');
    }
});

// Keep /api/my-achievements
app.get('/api/my-achievements', verifyToken, async (req, res) => {
    const userId = req.user.user.id;
    try {
        const myAchievements = await db.query(
            `SELECT a.achievement_id, a.description, ua.unlocked_at,
             a.achievement_name -- Simplified query
             FROM achievements a
             JOIN user_achievements ua ON a.achievement_id = ua.achievement_id
             WHERE ua.user_id = $1 ORDER BY ua.unlocked_at DESC`,
            [userId]
        );
        res.status(200).json(myAchievements.rows);
    } catch (err) {
        console.error("Error fetching user achievements:", err.message);
        res.status(500).send('Server error fetching user achievements.');
    }
});

// Keep Friends routes: /api/users, /api/friends, /api/friends/request (POST & PUT)
 app.get('/api/users', verifyToken, async (req, res) => {
    const currentUserId = req.user.user.id;
    try {
        // Find users who are NOT the current user AND do not have an existing friends entry (pending or accepted)
        const users = await db.query(
            `SELECT user_id, f_name, l_name
             FROM "user" u
             WHERE user_id != $1
             AND NOT EXISTS (
                 SELECT 1 FROM friends f
                 WHERE (f.user_one_id = $1 AND f.user_two_id = u.user_id)
                 OR (f.user_one_id = u.user_id AND f.user_two_id = $1)
             )`, [currentUserId]
        );
        res.status(200).json(users.rows);
    } catch (err) {
        console.error("Error fetching users:", err.message);
        res.status(500).send('Server error fetching users.');
    }
});

app.get('/api/friends', verifyToken, async (req, res) => {
    const currentUserId = req.user.user.id;
    try {
        // Select friend details based on who is user_one_id vs user_two_id
        const friendsData = await db.query(
            `SELECT f.status, f.action_user_id,
                    CASE WHEN f.user_one_id = $1 THEN f.user_two_id ELSE f.user_one_id END as friend_user_id,
                    u.f_name, u.l_name
             FROM friends f JOIN "user" u ON u.user_id = CASE WHEN f.user_one_id = $1 THEN f.user_two_id ELSE f.user_one_id END
             WHERE f.user_one_id = $1 OR f.user_two_id = $1`,
            [currentUserId]
        );
        res.status(200).json(friendsData.rows);
    } catch (err) {
        console.error("Error fetching friends:", err.message);
        res.status(500).send('Server error fetching friends.');
    }
});

app.post('/api/friends/request', verifyToken, async (req, res) => {
    const currentUserId = req.user.user.id;
    const { targetUserId } = req.body;
     const targetUserIdInt = parseInt(targetUserId, 10);
     if (isNaN(targetUserIdInt)) return res.status(400).json({ message: "Invalid target user ID."});

    if (currentUserId === targetUserIdInt) {
        return res.status(400).json({ message: "You cannot add yourself as a friend." });
    }
    // Ensure consistent ordering of user IDs
    const user_one_id = Math.min(currentUserId, targetUserIdInt);
    const user_two_id = Math.max(currentUserId, targetUserIdInt);
    try {
        // Check if target user exists
         const targetUser = await db.query('SELECT 1 FROM "user" WHERE user_id = $1', [targetUserIdInt]);
         if (targetUser.rows.length === 0) {
              return res.status(404).json({ message: "Target user not found." });
         }
        // Insert friend request, action_user_id is the sender
        await db.query(
            `INSERT INTO friends (user_one_id, user_two_id, status, action_user_id) VALUES ($1, $2, 'pending', $3)`,
            [user_one_id, user_two_id, currentUserId]
        );
        res.status(201).json({ message: "Friend request sent." });
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation (request already exists)
             // Use 409 Conflict for existing resource collision
             return res.status(409).json({ message: "A friend request already exists or you are already friends." });
         }
        console.error("Error sending friend request:", err.message);
        res.status(500).send('Server error sending friend request.');
    }
});

app.put('/api/friends/request', verifyToken, async (req, res) => {
    const currentUserId = req.user.user.id; // The user accepting/declining
    const { senderId, action } = req.body;
     const senderIdInt = parseInt(senderId, 10);
     if (isNaN(senderIdInt)) return res.status(400).json({ message: "Invalid sender ID."});

     // Ensure consistent ordering of user IDs
    const user_one_id = Math.min(currentUserId, senderIdInt);
    const user_two_id = Math.max(currentUserId, senderIdInt);

    try {
        // Find the request first to ensure it exists and the current user is the recipient (action_user_id was the sender)
         const requestResult = await db.query(
             `SELECT * FROM friends
              WHERE user_one_id = $1 AND user_two_id = $2 AND status = 'pending' AND action_user_id = $3`,
             [user_one_id, user_two_id, senderIdInt] // Action user MUST be the sender
         );

         // If no row found, the request doesn't exist or doesn't belong to this user to action
         if (requestResult.rows.length === 0) {
             return res.status(404).json({ message: "Friend request not found or you are not authorized to respond." });
         }

        if (action === 'accept') {
            // Update status and set the current user (the accepter) as the action user
            const updateResult = await db.query(
                "UPDATE friends SET status = 'accepted', action_user_id = $1 WHERE user_one_id = $2 AND user_two_id = $3 AND status = 'pending' AND action_user_id = $4", // Double check conditions
                 [currentUserId, user_one_id, user_two_id, senderIdInt]
             );
             if (updateResult.rowCount === 0) throw new Error("Failed to update friend status to accepted (concurrency issue?)."); // Should not happen if check above passed
            res.status(200).json({ message: "Friend request accepted." });
        } else if (action === 'decline') {
            // Delete the request entirely
            const deleteResult = await db.query(
                "DELETE FROM friends WHERE user_one_id = $1 AND user_two_id = $2 AND status = 'pending' AND action_user_id = $3",
                [user_one_id, user_two_id, senderIdInt]
            );
             if (deleteResult.rowCount === 0) throw new Error("Failed to delete friend request (concurrency issue?)."); // Should not happen
            res.status(200).json({ message: "Friend request declined." });
        } else {
            res.status(400).json({ message: "Invalid action." });
        }
    } catch (err) {
        console.error("Error responding to friend request:", err.message);
        res.status(500).send('Server error responding to friend request.');
    }
});


// Keep /api/admin/stats
app.get('/api/admin/stats', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const totalUsers = await db.query('SELECT COUNT(*) FROM "user"');
        const totalGames = await db.query('SELECT COUNT(*) FROM game');
        const totalLicensesSold = await db.query('SELECT COUNT(*) FROM license');
        // Get the most wishlisted game, handle case where no games are wishlisted
        const mostWishlistedGame = await db.query(
            `SELECT g.title, COUNT(wi.game_id)::integer as wish_count
             FROM wishlist_items wi JOIN game g ON wi.game_id = g.game_id
             GROUP BY g.title ORDER BY wish_count DESC LIMIT 1` // Cast count to integer
        );
        res.status(200).json({
            totalUsers: totalUsers.rows[0].count,
            totalGames: totalGames.rows[0].count,
            totalLicensesSold: totalLicensesSold.rows[0].count,
            mostWishlistedGame: mostWishlistedGame.rows[0] || { title: 'N/A', wish_count: 0 } // Default if no results
        });
    } catch (err) {
        console.error("Error fetching admin stats:", err.message);
        res.status(500).send('Server error fetching admin stats.');
    }
});

// --- UPDATED: Contact Form Endpoint ---
app.post('/api/contact', async (req, res) => { // Make async
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "Please fill out all fields." });
    }
    
    try {
        // --- SAVE TO DATABASE ---
        await db.saveContactSubmission(name, email, subject, message);
        console.log("--- New Contact Form Submission Saved ---");
        console.log(`Name: ${name}, Email: ${email}`);
        // --- END SAVE ---
        
        res.status(200).json({ message: "Thank you for your message! We'll get back to you soon." });

    } catch(err) {
        console.error("Error saving contact form submission:", err.message);
        res.status(500).send("Server error processing contact form.");
    }
});
// --- END UPDATED ---

// --- NEW: Admin Endpoint to GET Contact Submissions ---
app.get('/api/admin/contact-submissions', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const submissions = await db.getContactSubmissions();
        res.status(200).json(submissions);
    } catch (err) {
         console.error("Error fetching contact submissions:", err.message);
        res.status(500).send('Server error fetching submissions.');
    }
});
// --- END NEW ---

// ============================================================================
// == MESSAGE SYSTEM (NEW) ==
// ============================================================================

// Get chat history with a specific friend
app.get('/api/chat/:friendId', verifyToken, async (req, res) => {
    const currentUserId = req.user.user.id;
    const friendId = parseInt(req.params.friendId, 10);

    if (isNaN(friendId)) {
        return res.status(400).json({ message: "Invalid friend ID." });
    }

    try {
        // TODO: Add a check here to ensure the user and friendId are *actually* friends (status = 'accepted')
        // This is important for security so you can't just fetch messages for any user.
        // For now, we'll fetch directly.

        const messages = await db.getChatMessages(currentUserId, friendId);
        res.status(200).json(messages);
    } catch (err) {
        console.error("Error fetching chat messages:", err.message);
        res.status(500).send("Server error fetching chat.");
    }
});

// Send a new message
app.post('/api/chat/send', verifyToken, async (req, res) => {
    const senderId = req.user.user.id;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
        return res.status(400).json({ message: "Receiver ID and content are required." });
    }
    
    if (senderId === receiverId) {
        return res.status(400).json({ message: "Cannot send a message to yourself." });
    }

    try {
        // TODO: Add a check here to ensure the sender and receiver are *actually* friends.

        const newMessage = await db.sendMessage(senderId, receiverId, content);
        res.status(201).json(newMessage);
    } catch (err) {
        console.error("Error sending message:", err.message);
        res.status(500).send("Server error sending message.");
    }
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Backend server is running on http://localhost:${PORT}`);
});

