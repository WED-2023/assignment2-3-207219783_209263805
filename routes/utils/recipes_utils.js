const axios = require("axios");
const DButils = require('./DButils');
const api_domain = "https://api.spoonacular.com/recipes";
require('dotenv').config();

/**
 * @function getRecipeInformation
 * @desc Retrieves detailed information about a recipe by its ID from Spoonacular API or the local database if it is a custom recipe.
 * @param {string} recipe_id - The unique ID of the recipe.
 * @returns {Promise<Object>} - The detailed recipe information.
 */
async function getRecipeInformation(recipe_id) {
  try {
    // Check if the recipe is a user-created recipe (MyRecipe)
    const recipeIdStr = String(recipe_id);
    if (recipeIdStr.includes("MR")) {
      // Fetch the recipe from the local database
      return await getMyRecipeInformation(recipe_id);
    }
    
    // Fetch recipe information from Spoonacular API
    const response = await axios.get(`${api_domain}/${recipe_id}/information`, {
      params: {
        includeNutrition: false, // Exclude nutrition info for simplicity
        apiKey: process.env.SPOONACULAR_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error(`No results found for recipe ID: ${recipe_id}`);
      throw { status: 404, message: "No results were found" };
    } else {
      console.error(`Error fetching recipe information for ID ${recipe_id}:`, error);
      throw error;
    }
  }
}

/**
 * @function getMyRecipeInformation
 * @desc Retrieves detailed information about a user-created (MyRecipe) recipe from the local database.
 * @param {string} recipe_id - The unique ID of the custom recipe.
 * @returns {Promise<Object>} - The detailed recipe information.
 */
async function getMyRecipeInformation(recipe_id) {
  const user_recipe = await DButils.execQuery(`SELECT * FROM recipes WHERE recipe_id='${recipe_id}'`);

  if (user_recipe.length === 0) {
    throw new Error("Recipe not found");
  }

  // Extract recipe details from the result and return it in the correct format
  let { recipe_id: user_recipe_id, title, image, readyInMinutes, vegetarian, vegan, glutenFree, instructions, servings } = user_recipe[0];

  return {
    id: user_recipe_id,
    title: title,
    readyInMinutes: readyInMinutes,
    image: image,
    vegan: vegan,
    vegetarian: vegetarian,
    glutenFree: glutenFree,
    instructions: instructions,
    servings: servings
  };
}

/**
 * @function getRecipesDetails
 * @desc Retrieves detailed information for multiple recipes by their IDs, either from the Spoonacular API or local database if the recipes are custom.
 * @param {Array<string>} recipe_ids - Array of recipe IDs to retrieve details for.
 * @returns {Promise<Array<Object>>} - An array of detailed recipe information.
 */
async function getRecipesDetails(recipe_ids) {
  try {
    // Map over recipe IDs and fetch details for each one
    const recipeDetailsPromises = recipe_ids.map(id => getRecipeInformation(id));
    const recipes = await Promise.all(recipeDetailsPromises);

    // Extract relevant information from each recipe
    return recipes.map(recipe_info => {
      const { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info;
      return {
        id,
        title,
        readyInMinutes,
        image,
        popularity: aggregateLikes,
        vegan,
        vegetarian,
        glutenFree
      };
    });
  } catch (error) {
    console.error(`Error fetching recipe details:`, error);
    throw error;
  }
}

/**
 * @function getRandomRecipes
 * @desc Retrieves a set of random recipes from the Spoonacular API.
 * @returns {Promise<Array<Object>>} - An array of random recipe information.
 */
async function getRandomRecipes() {
  try {
    // Fetch random recipes from Spoonacular API
    const response = await axios.get(`${api_domain}/random`, {
      params: {
        number: 3, // Number of random recipes to retrieve
        apiKey: process.env.SPOONACULAR_API_KEY
      }
    });

    const recipes = response.data.recipes;

    // Extract relevant information from each recipe
    return recipes.map(recipe_info => {
      const { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info;
      return {
        id,
        title,
        readyInMinutes,
        image,
        popularity: aggregateLikes,
        vegan,
        vegetarian,
        glutenFree
      };
    });
  } catch (error) {
    console.error(`Error fetching random recipes:`, error);
    throw error;
  }
}

// Exporting the functions for use in other modules
exports.getRecipesDetails = getRecipesDetails;
exports.getRandomRecipes = getRandomRecipes;
exports.getRecipeInformation = getRecipeInformation;
exports.getMyRecipeInformation = getMyRecipeInformation;
