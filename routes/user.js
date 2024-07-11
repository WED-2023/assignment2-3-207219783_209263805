var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  console.log(`Middleware triggered for ${req.method} ${req.url}`);
  console.log('Session:', req.session);
  console.log('User username:', req.session.user.username);
  
  if (req.session && req.session.user) { // Ensure session contains user information
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


// router.use(async function (req, res, next) {
//   console.log(`Middleware triggered for ${req.method} ${req.url}`);
//   console.log('Session:', req.session);
  
//   if (req.session && req.session.user_id) {
//     try {
//       const users = await DButils.execQuery("SELECT user_id FROM users WHERE user_id = ?", [req.session.user_id]);
//       if (users.length > 0) {
//         req.user_id = req.session.user_id;
//         next();
//       } else {
//         res.sendStatus(401);
//       }
//     } catch (err) {
//       next(err);
//     }
//   } else {
//     res.sendStatus(401);
//   }
// });

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
// TODO: Maybe do delete the Serving count !!!
router.post("/myRecipes", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const result = await DButils.execQuery(`SELECT COUNT(*) AS record_count FROM recipes`);
    console.log(result[0].record_count);
    const id = result[0].record_count + 1;
    const recipe_id = 'MR' + id; // Generates a unique recipe_id like 'MR101' if there are 100 recipes
    console.log(recipe_id);

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
    const user_id = req.session.user_id;
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


module.exports = router;
