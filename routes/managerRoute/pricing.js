/**
 * @fileoverview Pricing management route for manager operations.
 * Handles menu pricing based on portion sizes.
 * Manages the price points for different serving sizes
 * @module routes/managerRoute/pricing
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');

/**
 * GET /manager/pricing
 * Retrieves and displays all menu pricing entries ordered by size.
 * 
 * @name GetPricing
 * @route {GET} /manager/pricing
 * @returns {View} Renders the pricing management view with all price entries
 * @throws {Error} Returns 500 status with error message if database query fails
 */
router.get('/', async(req, res) => {
    try{    
        const result = await db.query("SELECT * FROM menuprice ORDER BY size");
        res.render('manager_views/pricing', { pricing: result.rows});
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error loading pricing"); 

    }
});  

/**
 * POST /manager/pricing/update
 * Updates the price for an existing menu size.
 * 
 * @name UpdatePrice
 * @route {POST} /manager/pricing/update
 * @bodyparam {string} size - The size identifier 
 * @bodyparam {number} price - The new price for this size
 * @returns {Redirect} Redirects to /manager/pricing on success
 * @throws {Error} Returns 500 status with error message if update fails
 */
router.post('/update', async(req, res) => {
    const{size, price} = req.body;

    try{
        await db.query(
            "UPDATE menuprice SET price = $2 WHERE size = $1", 
            [size, price]
        );
        res.redirect('/manager/pricing');
    }
    catch(err){
        console.error(err);
        res.redirect('/manager/pricing?error=Error updating pricing item');

    }
}); 

/**
 * POST /manager/pricing/add
 * Adds a new price entry for a menu size.
 * Performs duplicate checking to ensure each size is unique.
 * 
 * @name AddPrice
 * @route {POST} /manager/pricing/add
 * @bodyparam {string} size - The size identifier
 * @bodyparam {number} price - The price for this size
 * @returns {Redirect} Redirects to /manager/pricing on success
 * @returns {Redirect} Redirects with error query param if duplicate size exists
 * @throws {Error} Returns 500 status with error message if database operation fails
 */
router.post('/add', async(req, res) => {
    const{size, price} = req.body;
    console.log(size);

    try{
        const dupeCheck = await db.query(
            "SELECT * FROM menuprice WHERE size = $1",
            [size]
        );
        if(dupeCheck.rows.length > 0){
            return res.redirect("/manager/pricing?error=This item already exists");
        }
        
        await db.query(
            "INSERT INTO menuprice (size, price) VALUES ($1, $2)", 
            [size, price]
        );
        res.redirect('/manager/pricing');
    }
    catch(err){
        console.error(err);
        res.redirect('/manager/pricing?error=Error adding pricing item');
    }
}); 

/**
 * POST /manager/pricing/delete
 * Removes a pricing entry from the database by size.
 * 
 * @name DeletePrice
 * @route {POST} /manager/pricing/delete
 * @bodyparam {string} size - The size identifier of the pricing entry to delete
 * @returns {Redirect} Redirects to /manager/pricing on success
 * @throws {Error} Returns 500 status with error message if deletion fails
 */
router.post('/delete', async(req, res) => {
    const{ size } = req.body;

    try{
        await db.query(
            "DELETE FROM menuprice WHERE size = $1", 
            [size]
        );
        res.redirect('/manager/pricing');
    }
    catch(err){
        console.error(err);
        res.redirect('/manager/pricing?error=Error deleting pricing item');

    }
});

module.exports = router;