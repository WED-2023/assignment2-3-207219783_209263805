var express = require("express");
var router = express.Router();
const axios = require('axios');
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user) { 
    const { username } = req.session.user;
    try {
      const users = await DButils.execQuery(`SELECT username FROM users WHERE username = '${username}'`);
      if (users.length > 0) {
        req.user = req.session.user;
        next();
      } else {
        res.sendStatus(401);
      }
    } catch (err) {
      next(err);
    }
  } else {
    res.sendStatus(401);
  }
});

/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 * Mark as favorite
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

/**
 * This route removes a recipe from the favorites list of the logged-in user
 * Remove from favorites
 */
router.delete('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user.user_id;
    const recipe_id = req.query.recipeId;
    const favorites = await user_utils.getFavoriteRecipes(user_id);
    const favoriteExists = favorites.some(fav => fav.recipe_id == recipe_id);

    if (!favoriteExists) {
      return res.status(404).send("Recipe not found in favorites");
    }

    // Remove the recipe from favorites
    await user_utils.removeFavorite(user_id, recipe_id);
    res.status(200).send("Recipe successfully removed from favorites");
  } catch (error) {
    console.error(`Error removing recipe from favorites:`, error);
    next(error);
  }
});


/**
 * This path returns the favorites recipes that were saved by the logged-in user
 * Get all Favorites
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user.user_id;
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    if (recipes_id.length === 0) {
      return res.status(404).send({ message: "No favorite recipes found" });
    }
    
    let recipes_id_array = recipes_id.map((element) => element.recipe_id); // Extracting the recipe IDs into an array
    const results = await recipe_utils.getRecipesDetails(recipes_id_array);
    if(results.length == 0){
      throw { status: 404, message: "no results were found" };
    }
    else{
      res.status(200).send(results);
    }
  } catch(error){
    console.error(`Error fetching favorite recipes:`, error);
    next(error);  }
});


/**
 * This path is for creating a new recipe 
 * Create a new Recipe
 */
router.post("/myRecipes", async (req, res, next) => {
  try {
    const user_id = req.session.user.user_id;
    const result = await DButils.execQuery(`SELECT COUNT(*) AS record_count FROM recipes`);
    const id = result[0].record_count + 1;
    const recipe_id = 'MR' + id; // Generates a unique recipe_id like 'MR101' if there are 100 recipes

    let { title, image, readyInMinutes , vegetarian, vegan , glutenFree, ingredients, instructions, servings} = req.body;
    let ingredientsJSON = JSON.stringify(ingredients);

    // Convert boolean values to integers
    vegetarian = vegetarian ? 1 : 0;
    vegan = vegan ? 1 : 0;
    glutenFree = glutenFree ? 1 : 0;
    let query = `INSERT INTO Recipes VALUES ('${user_id}','${recipe_id}','${title}','${image}','${readyInMinutes}','${vegetarian}','${vegan}', '${glutenFree}','${ingredientsJSON}','${instructions}','${servings}')`;
    await DButils.execQuery(query);
    res.status(201).send("A new recipe has been added");

  } catch (error) {
    next(error);
  }
});

/**
 * This path is for get all recipe s
 * Get Recipes for the user
 */
router.get("/myRecipes", async (req, res, next) => {
  try {
    const user_id = req.session.user.user_id;
    if (!user_id) {
      return res.status(401).send({ message: "User not authenticated" });
    }
    
    const myRecipes = await user_utils.getMyRecipes(user_id);
    if (myRecipes.length === 0) {
      return res.status(404).send({ message: "No recipes found for this user" });
    }
    res.status(200).send(myRecipes);
  } catch (error) {
    console.error('Error fetching user recipes:', error);
    next(error);
  }
});

router.post('/lastViewed', async (req,res,next) => {
  try {
    const user_id = req.body.user_id;
    const recipe_id = String(req.body.recipeId);
    if (recipe_id.includes("MR")) { 
      return 
    }    
    let last_viewed_recipes = await user_utils.getLastThreeViewedRecipes(user_id);
    
    if (!last_viewed_recipes.includes(recipe_id)) {
      last_viewed_recipes.push(recipe_id);

      if (last_viewed_recipes.length > 3) {
        last_viewed_recipes.shift();
      }
    }

    await DButils.execQuery(
      `UPDATE last_viewed_recipes SET is_recent=false WHERE user_id='${user_id}'`
    );

    for (let recipe_id of last_viewed_recipes) {
      await user_utils.updateLastViewedRecipe(user_id, recipe_id, true);
    }

    await DButils.execQuery(`
      INSERT INTO last_viewed_recipes (user_id, recipe_id, viewed_at)
      VALUES ('${user_id}', '${recipe_id}', NOW()) 
      ON DUPLICATE KEY UPDATE viewed_at=NOW()
    `);

    res.status(200).send({
      message: "The recipe has been successfully saved as recently viewed",
      status: 200,
      success: true
    });
  } catch (error) {
    next(error);
  }
});

router.get('/lastViewed', async (req, res, next) => {
  try {
    const username = req.session.user ? req.session.user.username : null;
    if (!username) {
      return res.status(401).json({ message: 'User is not logged in', status: 401 });
    }

    const recipeIds = await user_utils.getLastThreeViewedRecipes(username);
    if (!recipeIds || recipeIds.length === 0) {
      return res.status(200).json({ message: 'No recipes viewed recently', status: 200 });
    }

    const recipePreviews = await Promise.all(recipeIds.map(async (recipeId) => {
      try {
        const response = await axios.get(`http://localhost:3000/recipes/recipeId/${recipeId}`);
        return response.data;
      } catch (error) {
        console.error(`Failed to fetch recipe ${recipeId} from Spoonacular:`, error);
        return null; 
      }
    }));

    const validRecipes = recipePreviews.filter(recipe => recipe !== null);

    res.status(200).json(validRecipes);
  } catch (error) {
    console.error('Error fetching last viewed recipes:', error);
    next(error);
  }
});



module.exports = router;
