/**
 * @fileoverview Menu management route for manager operations.
 * Handles  viewing, adding, updating item details, and removing items from the recipe system.
 * @module routes/managerRoute/recipes
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');

/**
 * GET /manager/recipes
 * Retrieves and displays all recipes ordered by recipe_id.
 * Recipes define which inventory items are needed for each menu item.
 * Includes error messaging support via query parameters.
 * 
 * @name GetRecipes
 * @route {GET} /manager/recipes
 * @queryparam {string} [error] - Optional error message to display to user
 * @returns {View} Renders the recipes management view with all recipe entries
 * @throws {Error} Returns 500 status with error message if database query fails
 */
router.get('/', async(req, res) => {
    try{    
        const result = await db.query("SELECT * FROM recipes ORDER BY recipe_id");
        res.render('manager_views/recipes', { recipes: result.rows, error:req.query.error || null});
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error loading recipes"); 
    }
});

/**
 * POST /manager/recipes/update
 * Updates the quantity required for an existing recipe entry.
 * This modifies how much of an inventory item is needed for a menu item.
 * 
 * @name UpdateRecipeQuantity
 * @route {POST} /manager/recipes/update
 * @bodyparam {number} recipe_id - The ID of the recipe entry to update
 * @bodyparam {number} quantity_required - The new quantity required of the inventory item
 * @returns {Redirect} Redirects to /manager/recipes on success
 * @throws {Error} Returns 500 status with error message if update fails
 */
router.post('/update', async(req, res) => {
    const{recipe_id, quantity_required} = req.body;

    try{
        await db.query(
            "UPDATE recipes SET quantity_required = $1 WHERE recipe_id = $2", 
            [quantity_required, recipe_id]
        );
        res.redirect('/manager/recipes');
    }
    catch(err){
        console.error(err);
        res.redirect("/manager/recipes?error=Error updating recipe item");

    }
}); 

/**
 * POST /manager/recipes/add
 * Adds a new recipe entry that links a menu item to an inventory item with a required quantity.
 * Performs validation to ensure both menu item and inventory item exist.
 * Checks for duplicate recipes (same menu item + inventory item combination).
 * If recipe_id is not provided, automatically generates the next available ID.
 * 
 * @name AddRecipe
 * @route {POST} /manager/recipes/add
 * @bodyparam {number} [recipe_id] - Optional ID for the new recipe 
 * @bodyparam {number} menuitem_id - The ID of the menu item this recipe is for
 * @bodyparam {number} item_id - The ID of the inventory item required
 * @bodyparam {number} quantity_required - How much of the inventory item is needed
 * @returns {Redirect} Redirects to /manager/recipes on success
 * @returns {Redirect} Redirects with error query param if duplicate recipe exists
 * @returns {Redirect} Redirects with error query param if menu item or inventory item doesn't exist
 * @throws {Error} Redirects with error message if database operation fails
 */
router.post('/add', async(req, res) => {
    let recipe_id = req.body.recipe_id;
    const menuitem_id = req.body.menuitem_id;
    const item_id = req.body.item_id;
    const quantity_required = req.body.quantity_required;

    try{ 
        const menuCheck = await db.query("SELECT menuitem_id FROM menuitem WHERE menuitem_id = $1", [menuitem_id]);
        if (menuCheck.rows.length === 0) {
            return res.redirect("/manager/recipes?error=Menu item does not exist");
        }

        const itemCheck = await db.query("SELECT item_id FROM inventory WHERE item_id = $1", [item_id]);
        if (itemCheck.rows.length === 0) {
            return res.redirect("/manager/recipes?error=Inventory item does not exist");
        }

        const dupeCheck = await db.query(
            "SELECT * FROM recipes WHERE menuitem_id = $1 and item_id = $2",
            [menuitem_id, item_id]
        );
        if(dupeCheck.rows.length > 0){
            return res.redirect("/manager/recipes?error=This item already exists");
        }

        if(!recipe_id || recipe_id.trim() === ''){
            const maxIdResult = await db.query(
                "SELECT COALESCE(MAX(recipe_id), 0) + 1 AS next_id FROM recipes"
            );
            recipe_id = maxIdResult.rows[0].next_id;
        }

        await db.query(
            "INSERT INTO recipes (recipe_id, menuitem_id, item_id, quantity_required) VALUES ($1, $2, $3, $4)", 
            [recipe_id, menuitem_id, item_id, quantity_required]
        );
        res.redirect("/manager/recipes");
    }
    catch(err){
        console.error(err);
        res.redirect("/manager/recipes?error=Error adding recipe item");

    }
});

/**
 * POST /manager/recipes/delete
 * Removes a recipe entry from the database by recipe_id.
 * This deletes the relationship between a menu item and an inventory item.
 * 
 * @name DeleteRecipe
 * @route {POST} /manager/recipes/delete
 * @bodyparam {number} recipe_id - The ID of the recipe entry to delete
 * @returns {Redirect} Redirects to /manager/recipes on success
 * @throws {Error} Returns 500 status with error message if deletion fails
 */
router.post('/delete', async(req, res) => {
    const{ recipe_id } = req.body;

    try{
        await db.query(
            "DELETE FROM recipes WHERE recipe_id = $1", 
            [recipe_id]
        );
        res.redirect('/manager/recipes');
    }
    catch(err){
        console.error(err);
        res.redirect("/manager/recipes?error=Error deleting recipe item");

    }
});

module.exports = router;