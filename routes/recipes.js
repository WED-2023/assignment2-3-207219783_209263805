var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
require("dotenv").config();

const axios = require('axios'); 

router.get("/", (req, res) => res.send("im here"));

/**
 * This path is for searching a recipe
 */
// router.get("/search", async (req, res, next) => {
//   try {
//     const recipeName = req.query.recipeName;
//     const cuisine = req.query.cuisine;
//     const diet = req.query.diet;
//     const intolerance = req.query.intolerance;
//     const number = req.query.number || 5;
//     const results = await recipes_utils.searchRecipe(recipeName, cuisine, diet, intolerance, number);
//     if (results.length === 0){
//       throw { status: 404, message: "no results were found" };
//     }
//     else{
//       res.status(200).send(results);
//     }  
//   } catch (error) {
//     next(error);
//   }
// });

// Server-side endpoint to handle recipe search
router.get("/search", async (req, res, next) => {
  const { query, number } = req.query;
  const apiKey = process.env.SPOONACULAR_API_KEY
  const url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&query=${query}&number=${number}&addRecipeInformation=true`;

  try {
    const response = await axios.get(url);
    res.status(200).send(response.data);
  } catch (error) {
    console.error('Error fetching recipes from Spoonacular:', error);
    res.status(500).send({ message: "Failed to fetch recipes" });
  }
});

// Route to fetch last viewed recipes
router.get('/last-viewed', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    if (!user_id) {
      return res.status(401).send({ message: "Unauthorized", success: false });
    }
    const lastRecipes = await DButils.execQuery(`SELECT * FROM last_viewed_recipes WHERE user_id = '${user_id}' ORDER BY viewed_at DESC LIMIT 3`);
    res.status(200).send(lastRecipes);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns random recipes
 */
router.get("/random", async (req, res, next) => {
  try{
    const randomRecipes = await recipes_utils.getRandomRecipes();
    // console.log(randomRecipes);
    res.status(200).send(randomRecipes);
  } catch (error) {
    console.error('Error fetching random recipes:', error);
    next(error);
  }
});

/**
 * This path returns a full details of a recipe by its id
 */
router.get("/recipeId/:recipeId", async (req, res, next) => {
  try {
    const { recipeId } = req.params;
    // console.log("Fetching recipe with ID:", recipeId);

    const recipe = await recipes_utils.getRecipeInformation(recipeId);
    if (recipe) {
      res.status(200).send(recipe); // מחזיר את המתכון אם נמצא
    } else {
      res.status(404).send({ message: "Recipe not found" }); // מחזיר 404 אם המתכון לא נמצא
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
