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
          apiKey: process.env.SPOONACULAR_API_KEY
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



async function getRecipeDetails(recipe_ids) {
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
async function searchRecipe(recipeName, cuisine, diet, intolerance, number, username) {
    const response = await axios.get(`${api_domain}/complexSearch`, {
        params: {
            query: recipeName,
            cuisine: cuisine,
            diet: diet,
            intolerances: intolerance,
            number: number,
            apiKey: process.env.spooncular_apiKey
        }
    });

    return getRecipesPreview(response.data.results.map((element) => element.id), username);
}



exports.getRecipeDetails = getRecipeDetails;



