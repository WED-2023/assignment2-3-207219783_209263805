var express = require("express");
var router = express.Router();
const axios = require('axios');
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Middleware to authenticate all incoming requests.
 * Ensures the user is logged in before allowing access to routes.
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user) {
    const { username } = req.session.user;
    try {
      const users = await DButils.execQuery(`SELECT username FROM users WHERE username = '${username}'`);
      if (users.length > 0) {
        req.user = req.session.user; // Store user data in req object for subsequent use
        next();
      } else {
        res.sendStatus(401); // Unauthorized access
      }
    } catch (err) {
      next(err); // Handle errors by passing to next middleware
    }
  } else {
    res.sendStatus(401); // No session or user, unauthorized
  }
});

/**
 * @route POST /favorites
 * @desc Add a recipe to the user's favorites list.
 * @access Private (authenticated users only)
 */
router.post('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id, recipe_id); // Mark recipe as favorite
    res.status(200).send("The Recipe successfully saved as favorite");
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /favorites
 * @desc Remove a recipe from the user's favorites list.
 * @access Private (authenticated users only)
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

    await user_utils.removeFavorite(user_id, recipe_id); // Remove the recipe from favorites
    res.status(200).send("Recipe successfully removed from favorites");
  } catch (error) {
    console.error(`Error removing recipe from favorites:`, error);
    next(error);
  }
});

/**
 * @route GET /favorites
 * @desc Get all favorite recipes of the logged-in user.
 * @access Private (authenticated users only)
 */
router.get('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user.user_id;
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    if (recipes_id.length === 0) {
      return res.status(404).send({ message: "No favorite recipes found" });
    }

    let recipes_id_array = recipes_id.map(element => element.recipe_id); // Extract recipe IDs
    const results = await recipe_utils.getRecipesDetails(recipes_id_array);
    if (results.length == 0) {
      throw { status: 404, message: "no results were found" };
    } else {
      res.status(200).send(results);
    }
  } catch (error) {
    console.error(`Error fetching favorite recipes:`, error);
    next(error);
  }
});

/**
 * @route POST /myRecipes
 * @desc Create a new recipe for the logged-in user.
 * @access Private (authenticated users only)
 */
router.post("/myRecipes", async (req, res, next) => {
  try {
    const user_id = req.session.user.user_id;
    const result = await DButils.execQuery(`SELECT COUNT(*) AS record_count FROM recipes`);
    const id = result[0].record_count + 1;
    const recipe_id = 'MR' + id; // Generate a unique recipe ID (e.g., 'MR101')

    let { title, image, readyInMinutes, vegetarian, vegan, glutenFree, ingredients, instructions, servings } = req.body;
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
 * @route GET /myRecipes
 * @desc Get all custom recipes created by the logged-in user.
 * @access Private (authenticated users only)
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

/**
 * @route POST /lastViewed
 * @desc Mark a recipe as recently viewed for the logged-in user.
 * @access Private (authenticated users only)
 */
router.post('/lastViewed', async (req, res, next) => {
  try {
    const user_id = req.body.user_id;
    const recipe_id = String(req.body.recipeId);
    
    // Skip marking custom recipes as last viewed
    if (recipe_id.includes("MR")) {
      return;
    }

    let last_viewed_recipes = await user_utils.getLastThreeViewedRecipes(user_id);

    if (!last_viewed_recipes.includes(recipe_id)) {
      last_viewed_recipes.push(recipe_id);

      if (last_viewed_recipes.length > 3) {
        last_viewed_recipes.shift(); // Remove oldest viewed recipe
      }
    }

    await DButils.execQuery(`UPDATE last_viewed_recipes SET is_recent=false WHERE user_id='${user_id}'`);

    for (let recipe_id of last_viewed_recipes) {
      await user_utils.updateLastViewedRecipe(user_id, recipe_id, true);
    }

    await DButils.execQuery(`INSERT INTO last_viewed_recipes (user_id, recipe_id, viewed_at) VALUES ('${user_id}', '${recipe_id}', NOW()) ON DUPLICATE KEY UPDATE viewed_at=NOW()`);

    res.status(200).send({
      message: "The recipe has been successfully saved as recently viewed",
      status: 200,
      success: true
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /lastViewed
 * @desc Get the last 3 viewed recipes for the logged-in user.
 * @access Private (authenticated users only)
 */
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
