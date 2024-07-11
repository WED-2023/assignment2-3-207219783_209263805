var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
require("dotenv").config();

const axios = require('axios'); 

router.get("/", (req, res) => res.send("im here"));

/**
 * This path is for searching a recipe
 */
router.get("/search", async (req, res, next) => {
  try {
    const recipeName = req.query.recipeName;
    const cuisine = req.query.cuisine;
    const diet = req.query.diet;
    const intolerance = req.query.intolerance;
    const number = req.query.number || 5;
    const results = await recipes_utils.searchRecipe(recipeName, cuisine, diet, intolerance, number);
    res.send(results);
  } catch (error) {
    next(error);
  }
});

// Route to fetch random recipes
router.get('/random', async (req, res, next) => {
  try {
    const ap = "286e5a606e124fbe8cf4e627c135ab92";
    const amountToFetch = 3;
    const response = await axios.get(`https://api.spoonacular.com/recipes/random?number=${amountToFetch}&apiKey=${ap}`);
    res.status(200).send(response.data);
  } catch (error) {
    next(error);
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
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
