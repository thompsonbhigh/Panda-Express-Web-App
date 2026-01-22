/**
 * @fileoverview Menu management route for manager operations.
 * Handles  viewing, adding, updating item details, and removing items from the menu system.
 * @module routes/managerRoute/menu
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');  


/**
 * GET /manager/menu
 * Retrieves and displays all menu items ordered by menuitem_id.
 * Includes error messaging support via query parameters.
 * 
 * @name GetMenu
 * @route {GET} /manager/menu
 * @queryparam {string} [error] - Optional error message to display to user
 * @returns {View} Renders the menu management view with all items
 * @throws {Error} Returns 500 status with error message if database query fails
 */
router.get('/', async(req, res) => {
    try{    
        const result = await db.query("SELECT * FROM menuitem ORDER BY menuitem_id");
        res.render('manager_views/menu', { menu: result.rows, error:req.query.error || null});
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error loading menu"); 

    }
});

/**
 * POST /manager/menu/update
 * Updates an existing menu item's name and/or category.
 * Performs duplicate name checking
 * 
 * @name UpdateMenuItem
 * @route {POST} /manager/menu/update
 * @bodyparam {string} menuitem_name - The new name for the menu item
 * @bodyparam {string} category - The category of the menu item
 * @bodyparam {number} menuitem_id - The ID of the menu item to update
 * @returns {Redirect} Redirects to /manager/menu on success
 * @returns {Redirect} Redirects with error query param if duplicate name exists
 * @throws {Error} Returns 500 status with error message if update fails
 */
router.post('/update', async(req, res) => {
    const{menuitem_name, category, menuitem_id, full_name, calories} = req.body; 

    try{
        let dupeCheck;

        if (menuitem_name === "EMPTY") {
            dupeCheck = { rows: [] }; // pretend no duplicates
        } else {
            dupeCheck = await db.query(
            "SELECT * FROM menuitem WHERE menuitem_name = $1 AND menuitem_id != $2",
            [menuitem_name, menuitem_id]
        );
        }
        if(dupeCheck.rows.length > 0){
            return res.redirect('/manager/menu?error=This item name already exists');
        }

        await db.query(
            "UPDATE menuitem SET menuitem_name = $1, category = $2, full_name = $4, calories = $5 WHERE menuitem_id = $3", 
            [menuitem_name, category, menuitem_id, full_name, calories]
        );
        res.redirect('/manager/menu');
    }
    catch(err){
        console.error(err);
        res.redirect('/manager/menu?error=Error updating menu item');

    }
}); 

/**
 * POST /manager/menu/add
 * Adds a new item to the menu. Performs duplicate checking by item name.
 * If menuitem_id is not provided, automatically generates the next available ID.
 * 
 * @name AddMenuItem
 * @route {POST} /manager/menu/add
 * @bodyparam {number} [menuitem_id] - Optional ID for the new item 
 * @bodyparam {string} menuitem_name - Name of the menu item
 * @bodyparam {string} category - Category of the menu item (e.g., "Entree", "Side", "Drink")
 * @returns {Redirect} Redirects to /manager/menu on success
 * @returns {Redirect} Redirects with error query param if duplicate name exists
 * @throws {Error} Redirects with error message if database operation fails
 */
router.post('/add', async(req, res) => {
    let{menuitem_id, menuitem_name, category, full_name, calories} = req.body; 

    try{
        const dupeCheck = await db.query(
            "SELECT * from menuitem where menuitem_name = $1", 
            [menuitem_name]
        );
        if(dupeCheck.rows.length > 0){
            return res.redirect('/manager/menu?error=This item already exists')
        }

        if(!menuitem_id || menuitem_id.trim() === ''){
            const maxIdResult = await db.query(
                "SELECT COALESCE(MAX(menuitem_id), 0) + 1 AS next_id FROM menuitem"
            );
            menuitem_id = maxIdResult.rows[0].next_id;
        }

        await db.query(
            "INSERT INTO menuitem (menuitem_id, menuitem_name, category, full_name, calories) VALUES ($1, $2, $3, $4, $5)", 
            [menuitem_id, menuitem_name, category, full_name, calories]
        );
        res.redirect('/manager/menu');
    }
    catch(err){
        console.error(err);
        res.redirect('/manager/menu?error=Error adding menu item');

    }
});

/**
 * POST /manager/menu/delete
 * Removes a menu item from the database by menuitem_id.
 * 
 * @name DeleteMenuItem
 * @route {POST} /manager/menu/delete
 * @bodyparam {number} menuitem_id - The ID of the menu item to delete
 * @returns {Redirect} Redirects to /manager/menu on success
 * @throws {Error} Returns 500 status with error message if deletion fails
 */
router.post('/delete', async(req, res) => {
    const{ menuitem_id } = req.body;

    try{
        await db.query("DELETE FROM menuitem WHERE menuitem_id = $1", [menuitem_id]);
        res.redirect('/manager/menu');
    }
    catch(err){
        console.error(err);
        res.redirect('/manager/menu?error=Error deleting menu item');

    }
});

module.exports = router;
