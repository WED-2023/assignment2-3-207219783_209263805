var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    try {
      const users = await DButils.execQuery("SELECT user_id FROM users");
      if (users.find((x) => x.user_id === req.session.user_id)) {
        console.log(`${req.session.user_id} is authenticated`);
        req.user_id = req.session.user_id;
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
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 * Get all Favorites
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    if (recipes_id.length === 0) {
      return res.status(404).send({ message: "No favorite recipes found" });
    }
    
    let recipes_id_array = recipes_id.map((element) => element.recipe_id); // Extracting the recipe IDs into an array
    const results = await recipe_utils.getRecipeDetails(recipes_id_array);
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






module.exports = router;
