var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
require("dotenv").config();
const axios = require('axios');

/**
 * @route GET /
 * @desc Basic route to test if the server is running.
 * @access Public
 */
router.get("/", (req, res) => res.send("im here"));

/**
 * @route GET /search
 * @desc Search for recipes using query parameters.
 * @param {string} query - The search keyword for recipes (e.g., "pasta").
 * @param {number} [number=3] - The number of recipes to return (default is 3).
 * @access Public
 */
router.get("/search", async (req, res, next) => {
  const { query, number } = req.query;
  const apiKey = process.env.SPOONACULAR_API_KEY;
  const url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&query=${query}&number=${number || 3}&addRecipeInformation=true`;

  try {
    // Fetch recipes from the Spoonacular API
    const response = await axios.get(url);
    res.status(200).send(response.data);
  } catch (error) {
    console.error('Error fetching recipes from Spoonacular:', error);
    res.status(500).send({ message: "Failed to fetch recipes" });
  }
});

/**
 * @route GET /random
 * @desc Fetches random recipes from the database or external API.
 * @access Public
 */
router.get("/random", async (req, res, next) => {
  try {
    // Get random recipes from recipes_utils
    const randomRecipes = await recipes_utils.getRandomRecipes();
    res.status(200).send(randomRecipes);
  } catch (error) {
    console.error('Error fetching random recipes:', error);
    next(error);
  }
});

/**
 * @route GET /recipeId/:recipeId
 * @desc Get full details of a recipe by its ID.
 * @param {string} recipeId - The unique ID of the recipe.
 * @access Public
 */
router.get("/recipeId/:recipeId", async (req, res, next) => {
  try {
    const { recipeId } = req.params;

    // Fetch detailed recipe information from recipes_utils
    const recipe = await recipes_utils.getRecipeInformation(recipeId);

    if (recipe) {
      res.status(200).send(recipe); // Send recipe details if found
    } else {
      res.status(404).send({ message: "Recipe not found" });
    }
  } catch (error) {
    next(error); // Forward the error to the error-handling middleware
  }
});

module.exports = router;
