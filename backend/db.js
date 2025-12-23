const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- From previous steps (Achievements, Leaderboard) ---
const grantAchievement = async (userId, achievementId) => {
    try {
         const result = await pool.query(
            `INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, achievement_id) DO NOTHING`,
            [userId, achievementId]
         );
         return result.rowCount > 0;
    } catch (err) {
         console.error(`Error granting achievement ${achievementId} to user ${userId}:`, err.message);
         return false;
    }
};

const getAchievementLeaderboard = async () => {
    try {
        const result = await pool.query(
           `SELECT
                u.f_name,
                u.l_name,
                COUNT(ua.achievement_id) AS achievements_unlocked
            FROM "user" u
            LEFT JOIN user_achievements ua ON u.user_id = ua.user_id
            GROUP BY u.user_id, u.f_name, u.l_name
            ORDER BY achievements_unlocked DESC, u.f_name ASC
            LIMIT 10`
        );
        return result.rows;
    } catch (err) {
        console.error("Error fetching achievement leaderboard:", err.message);
        throw err;
    }
};

// --- From previous steps (Contact Form) ---
const saveContactSubmission = async (name, email, subject, message) => {
    try {
        const result = await pool.query(
            `INSERT INTO contact_submissions (name, email, subject, message)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [name, email, subject, message]
        );
        return result.rows[0];
    } catch (err) {
        console.error("Error saving contact submission:", err.message);
        throw err;
    }
};

const getContactSubmissions = async () => {
    try {
        const result = await pool.query(
            `SELECT * FROM contact_submissions ORDER BY received_at DESC`
        );
        return result.rows;
    } catch (err) {
        console.error("Error fetching contact submissions:", err.message);
        throw err;
    }
};

// --- From previous steps (Admin Reviews) ---
const updateReview = async (reviewId, { user_exp, feedback, recommendations }) => {
    const result = await pool.query(
        'UPDATE review SET user_exp = $1, feedback = $2, recommendations = $3 WHERE review_id = $4 RETURNING *',
        [user_exp, feedback, recommendations, reviewId]
    );
    return result.rows[0] || null;
};

const deleteReview = async (reviewId) => {
    const result = await pool.query(
        'DELETE FROM review WHERE review_id = $1',
        [reviewId]
    );
    return result.rowCount; // Returns 1 if deleted, 0 if not found
};

// --- From previous steps (Wishlist) ---
const removeWishlistItem = async (userId, gameId) => {
    const listResult = await pool.query('SELECT list_id FROM user_list WHERE user_id = $1', [userId]);
    if (listResult.rows.length === 0) {
        return 0; // User has no wishlist
    }
    const listId = listResult.rows[0].list_id;

    const deleteResult = await pool.query(
        'DELETE FROM wishlist_items WHERE list_id = $1 AND game_id = $2',
        [listId, gameId]
    );
    
    if (deleteResult.rowCount > 0) {
         await pool.query(`UPDATE user_list SET no_of_games = (SELECT COUNT(*) FROM wishlist_items WHERE list_id = $1) WHERE list_id = $1`, [listId]);
    }
    return deleteResult.rowCount; // Returns 1 if deleted, 0 if not found
};

// --- NEW Function to get chat messages ---
const getChatMessages = async (userId1, userId2) => {
    try {
        const result = await pool.query(
            `SELECT * FROM messages
             WHERE (sender_id = $1 AND receiver_id = $2)
                OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at ASC`,
            [userId1, userId2]
        );
        return result.rows;
    } catch (err) {
        console.error("Error fetching chat messages:", err.message);
        throw err;
    }
};

// --- NEW Function to send a message ---
const sendMessage = async (senderId, receiverId, content) => {
    try {
        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, content)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [senderId, receiverId, content]
        );
        return result.rows[0];
    } catch (err) {
        console.error("Error sending message:", err.message);
        throw err;
    }
};


module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  // Existing functions
  grantAchievement,
  getAchievementLeaderboard,
  saveContactSubmission,
  getContactSubmissions,
  updateReview,
  deleteReview,
  removeWishlistItem,
  // --- NEWLY ADDED ---
  getChatMessages,
  sendMessage
};

