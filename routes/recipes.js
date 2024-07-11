var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

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
    res.status(200).send(results);
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
    const recipe = await recipes_utils.getRecipesDetails([req.params.recipeId]);
    res.status(200).send(recipe);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
