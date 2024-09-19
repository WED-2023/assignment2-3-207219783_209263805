const axios = require("axios");
const DButils = require('./DButils');
const api_domain = "https://api.spoonacular.com/recipes";
require('dotenv').config();


/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */

async function getRecipeInformation(recipe_id) {
    try {
      // check if the recipe is myRecipe
      const recipeIdStr = String(recipe_id);
      if (recipeIdStr.includes("MR")) { // unique identifier for a newly created recipe
        return await getMyRecipeInformation(recipe_id); // fetch the recipe from the local DB
      }
      const response = await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
          includeNutrition: false,
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

  async function getMyRecipeInformation(recipe_id) {
    const user_recipe = await DButils.execQuery(`SELECT * FROM recipes WHERE recipe_id='${recipe_id}'`);
  
    if (user_recipe.length === 0) {
        throw new Error("Recipe not found");
    }
  
    // Rename the recipe_id to avoid conflicts
    let { recipe_id: user_recipe_id, title, image, readyInMinutes, vegetarian, vegan, glutenFree, instructions, servings } = user_recipe[0];
    console.log("Instructions from DB:", instructions);

    return {
        id: user_recipe_id,  // Use the renamed variable
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

async function getRecipesDetails(recipe_ids) {
    try {
      const recipeDetailsPromises = recipe_ids.map(id => getRecipeInformation(id));
      const recipes = await Promise.all(recipeDetailsPromises);
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
async function getRandomRecipes() {
  try {
    const response = await axios.get(`${api_domain}/random`, {
      params: {
        number: 3,  // count of random recipes
        // apiKey: process.env.SPOONACULAR_API_KEY || "286e5a606e124fbe8cf4e627c135ab92"
        // apiKey: "759b5cca589c4f24af5d1423d1e6de1a"
        apiKey: process.env.SPOONACULAR_API_KEY
      }
    });
    const recipes = response.data.recipes;
    // console.log(recipes);
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


exports.getRecipesDetails = getRecipesDetails;
exports.getRandomRecipes = getRandomRecipes;
exports.getRecipeInformation = getRecipeInformation;
exports.getMyRecipeInformation = getMyRecipeInformation;


