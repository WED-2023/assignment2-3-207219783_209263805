const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id){
    await DButils.execQuery(`insert into FavoriteRecipes values ('${user_id}',${recipe_id})`);
}

async function removeFavorite(user_id, recipe_id) {
    const query = `DELETE FROM FavoriteRecipes WHERE user_id = '${user_id}' AND recipe_id = '${recipe_id}'`;
    return DButils.execQuery(query);
  }
  

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from FavoriteRecipes where user_id='${user_id}'`);
    return recipes_id;
}

async function getMyRecipes(user_id){
    const myRecipesList= await DButils.execQuery(`SELECT user_id, recipe_id, title, image, readyInMinutes ,vegetarian, vegan , glutenFree, ingredients, instructions, servings
    FROM recipes WHERE user_id = '${user_id}'`);
    return myRecipesList;
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getMyRecipes = getMyRecipes;
exports.removeFavorite = removeFavorite;
