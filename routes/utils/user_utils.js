const DButils = require("./DButils");

/**
 * @function markAsFavorite
 * @desc Adds a recipe to the user's list of favorite recipes.
 * @param {string} user_id - The unique ID of the user.
 * @param {number} recipe_id - The unique ID of the recipe to be added to favorites.
 * @returns {Promise<void>}
 */
async function markAsFavorite(user_id, recipe_id) {
    await DButils.execQuery(`INSERT INTO FavoriteRecipes VALUES ('${user_id}',${recipe_id})`);
}

/**
 * @function removeFavorite
 * @desc Removes a recipe from the user's list of favorite recipes.
 * @param {string} user_id - The unique ID of the user.
 * @param {number} recipe_id - The unique ID of the recipe to be removed from favorites.
 * @returns {Promise<void>}
 */
async function removeFavorite(user_id, recipe_id) {
    return DButils.execQuery(`DELETE FROM FavoriteRecipes WHERE user_id = '${user_id}' AND recipe_id = '${recipe_id}'`);
}

/**
 * @function getFavoriteRecipes
 * @desc Retrieves all favorite recipes of a user.
 * @param {string} user_id - The unique ID of the user.
 * @returns {Promise<Array>} - Returns an array of recipe IDs that the user has marked as favorite.
 */
async function getFavoriteRecipes(user_id) {
    const recipes_id = await DButils.execQuery(`SELECT recipe_id FROM FavoriteRecipes WHERE user_id='${user_id}'`);
    return recipes_id;
}

/**
 * @function getMyRecipes
 * @desc Retrieves all custom recipes created by a specific user.
 * @param {string} user_id - The unique ID of the user.
 * @returns {Promise<Array>} - Returns an array of recipes created by the user.
 */
async function getMyRecipes(user_id) {
    const myRecipesList = await DButils.execQuery(`SELECT * FROM recipes WHERE user_id = '${user_id}'`);
    return myRecipesList;
}

/**
 * @function getLastThreeViewedRecipes
 * @desc Retrieves the last three recipes that the user has recently viewed.
 * @param {string} user_id - The unique ID of the user.
 * @returns {Promise<Array>} - Returns an array of the last three recipe IDs viewed by the user.
 */
async function getLastThreeViewedRecipes(user_id) {
    try {
        const result = await DButils.execQuery(`
            SELECT recipe_id 
            FROM last_viewed_recipes 
            WHERE user_id='${user_id}' AND is_recent=true
            ORDER BY viewed_at DESC
            LIMIT 3
        `);

        if (result.length === 0) {
            console.log("No recent recipes found for user: ", user_id);
        }

        return result.map(row => row.recipe_id); // Extract recipe IDs from the result
    } catch (error) {
        console.error('Error fetching last three viewed recipes:', error);
        throw error;
    }
}

/**
 * @function updateLastViewedRecipe
 * @desc Updates the last viewed status for a specific recipe.
 * @param {string} user_id - The unique ID of the user.
 * @param {string} recipe_id - The unique ID of the recipe.
 * @param {boolean} is_recent - Indicates whether the recipe was recently viewed.
 * @returns {Promise<void>}
 */
async function updateLastViewedRecipe(user_id, recipe_id, is_recent) {
    await DButils.execQuery(`
      INSERT INTO last_viewed_recipes (user_id, recipe_id, viewed_at, is_recent) 
      VALUES ('${user_id}', '${recipe_id}', NOW(), ${is_recent}) 
      ON DUPLICATE KEY UPDATE viewed_at=NOW(), is_recent=${is_recent}
    `);
}

// Exporting functions for use in other modules
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getMyRecipes = getMyRecipes;
exports.removeFavorite = removeFavorite;
exports.updateLastViewedRecipe = updateLastViewedRecipe;
exports.getLastThreeViewedRecipes = getLastThreeViewedRecipes;
