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
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});




module.exports = router;
