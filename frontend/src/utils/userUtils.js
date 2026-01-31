// User utility functions
// Standardizes user ID access across the application

/**
 * Gets the user ID from a user object
 * Handles both _id and id properties for consistency
 * @param {Object} user - User object
 * @returns {string|undefined} User ID
 */
export const getUserId = (user) => {
    if (!user) return undefined;
    return user._id || user.id;
};

/**
 * Checks if a user ID matches the current user
 * @param {Object} currentUser - Current user object
 * @param {string} userId - User ID to compare
 * @returns {boolean}
 */
export const isCurrentUser = (currentUser, userId) => {
    return getUserId(currentUser) === userId;
};
