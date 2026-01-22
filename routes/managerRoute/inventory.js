/**
 * @fileoverview Inventory management route for manager operations.
 * Handles viewing, adding, updating quantities, and deleting items from the inventory system.
 * @module routes/managerRoute/inventory
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');

/**
 * GET /manager/inventory
 * Retrieves and displays all inventory items ordered by item_id.
 * 
 * @name GetInventory
 * @route {GET} /manager/inventory
 * @queryparam {string} [error] - Optional error message to display to user
 * @returns {View} Renders the inventory management view with all items
 * @throws {Error} Returns 500 status with error message if database query fails
 */
router.get('/', async(req, res) => {
    try{    
        const result = await db.query("SELECT * FROM inventory ORDER BY item_id");
        res.render('manager_views/inventory', { inventory: result.rows, error:req.query.error || null});
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error loading inventory"); 

    }
});
/**
 * POST /manager/inventory/update
 * Updates the quantity of an existing inventory item.
 * 
 * @name UpdateInventoryItem
 * @route {POST} /manager/inventory/update
 * @bodyparam {number} item_id - The ID of the inventory item to update
 * @bodyparam {number} quantity - The new quantity value for the item
 * @returns {Redirect} Redirects to /manager/inventory on success
 * @throws {Error} Returns 500 status with error message if update fails
 */
router.post('/update', async(req, res) => {
    const{item_id, quantity} = req.body;

    try{
        await db.query(
            "UPDATE inventory SET quantity = $1 WHERE item_id = $2", 
            [quantity, item_id]
        );
        res.redirect('/manager/inventory');
    }
    catch(err){
        console.error(err);
        res.redirect('/manager/inventory?error=Error updating inventory item');

    }
}); 

/**
 * POST /manager/inventory/add
 * Adds a new item to the inventory. Performs duplicate checking by item name.
 * If item_id is not provided, automatically generates the next available ID.
 * 
 * @name AddInventoryItem
 * @route {POST} /manager/inventory/add
 * @bodyparam {number} [item_id] - Optional ID for the new item
 * @bodyparam {string} item_name - Name of the inventory item
 * @bodyparam {number} quantity - Initial quantity of the item
 * @bodyparam {string} unit - Unit of measurement 
 * @returns {Redirect} Redirects to /manager/inventory on success
 * @returns {Redirect} Redirects with error query param if duplicate name exists
 * @throws {Error} Redirects with error message if database operation fails
 */
router.post('/add', async(req, res) => {
    let{item_id, item_name, quantity, unit} = req.body;

    try{
        const dupeCheck = await db.query(
            "SELECT * from inventory where item_name = $1",
            [item_name]
        );
        if(dupeCheck.rows.length > 0){
            return res.redirect('/manager/inventory?error=This item already exists')
        }

        if(!item_id || item_id.trim() === ''){
            const maxIdResult = await db.query(
                "SELECT COALESCE(MAX(item_id), 0) + 1 AS next_id FROM inventory"
            );
            item_id = maxIdResult.rows[0].next_id;
        }

        await db.query(
            "INSERT INTO inventory (item_id, item_name, quantity, unit) VALUES ($1, $2, $3, $4)", 
            [item_id, item_name, quantity, unit]
        );
        res.redirect('/manager/inventory');
    }
    catch(err){
        console.error(err);
        res.redirect('/manager/inventory?error=Error adding inventory item');

    }
});

/**
 * POST /manager/inventory/delete
 * Removes an inventory item from the database by item_id.
 * 
 * @name DeleteInventoryItem
 * @route {POST} /manager/inventory/delete
 * @bodyparam {number} item_id - The ID of the inventory item to delete
 * @returns {Redirect} Redirects to /manager/inventory on success
 * @throws {Error} Returns 500 status with error message if deletion fails
 */
router.post('/delete', async(req, res) => {
    const{ item_id } = req.body;

    try{
        await db.query(
            "DELETE FROM inventory WHERE item_id = $1", 
            [item_id]
        );
        res.redirect('/manager/inventory');
    }
    catch(err){
        console.error(err);
        res.redirect('/manager/inventory?error=Error deleting inventory item');

    }
});

module.exports = router;