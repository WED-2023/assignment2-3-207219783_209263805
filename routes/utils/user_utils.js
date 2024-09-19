const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id){
    await DButils.execQuery(`INSERT INTO FavoriteRecipes VALUES ('${user_id}',${recipe_id})`);
}

async function removeFavorite(user_id, recipe_id) {
    return DButils.execQuery(`DELETE FROM FavoriteRecipes WHERE user_id = '${user_id}' AND recipe_id = '${recipe_id}'`);
  }
  

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`SELECT recipe_id FROM FavoriteRecipes WHERE user_id='${user_id}'`);
    return recipes_id;
}

async function getMyRecipes(user_id){
    const myRecipesList= await DButils.execQuery(`SELECT * FROM recipes WHERE user_id = '${user_id}'`);
    return myRecipesList;
}

async function getLastThreeViewedRecipes(user_id) {
    try {
      // get 3 latests recipes where 'is_recent'=true
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

      return result.map(row => row.recipe_id);
    } catch (error) {
      console.error('Error fetching last three viewed recipes:', error);
      throw error;
    }
  }
  

async function updateLastViewedRecipe(user_id, recipe_id, is_recent) {
    await DButils.execQuery(`
      INSERT INTO last_viewed_recipes (user_id, recipe_id, viewed_at, is_recent) 
      VALUES ('${user_id}', '${recipe_id}', NOW(), ${is_recent}) 
      ON DUPLICATE KEY UPDATE viewed_at=NOW(), is_recent=${is_recent}
    `);
  }

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getMyRecipes = getMyRecipes;
exports.removeFavorite = removeFavorite;
exports.updateLastViewedRecipe = updateLastViewedRecipe;
exports.getLastThreeViewedRecipes =getLastThreeViewedRecipes;
