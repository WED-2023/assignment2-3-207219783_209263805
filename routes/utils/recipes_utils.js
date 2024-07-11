const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
require('dotenv').config();


/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {
    try {
      const response = await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
          includeNutrition: false,
          apiKey: process.env.SPOONACULAR_API_KEY || "286e5a606e124fbe8cf4e627c135ab92"
        }
      });
      console.log(`Received data for recipe ID ${recipe_id}:`, response.data);
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
        apiKey: process.env.SPOONACULAR_API_KEY || "286e5a606e124fbe8cf4e627c135ab92"
      }
    });
    const recipes = response.data.recipes;
    console.log(recipes);
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

async function searchRecipe(recipeName, cuisine, diet, intolerance, number) {
  try{
    const response = await axios.get(`${api_domain}/complexSearch`, {
      params: {
          query: recipeName,
          cuisine: cuisine,
          diet: diet,
          intolerances: intolerance,
          number: number,
          apiKey: process.env.SPOONACULAR_API_KEY || "286e5a606e124fbe8cf4e627c135ab92"
        }
  });
  console.log(AAAAAAAAAAAAAAAAAA);
  const recipeIds = response.data.results.map(element => element.id);
  console.log(`User ${username} searched for recipes with query: ${recipeName}`);
  console.log(BBBBBBBBBB);
  return getRecipesDetails(recipeIds);
  } catch (error) {
    throw error;
  }
  // return getRecipesPreview(response.data.results.map((element) => element.id), username);
}


exports.getRecipesDetails = getRecipesDetails;
exports.getRandomRecipes = getRandomRecipes;
exports.searchRecipe = searchRecipe;
exports.getRecipeInformation = getRecipeInformation;


