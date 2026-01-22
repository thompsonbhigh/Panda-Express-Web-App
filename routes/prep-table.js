/**
 * @fileoverview Prep Table route for refilling at the kitchen
 * @module routes/prep-table
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('./login');

/**
 * GET /prep-table
 * Renders the prep table screen
 * 
 * @name GetPrepTableScreen
 * @route {GET} /prep-table
 * @returns {View} Renders the prep-table screen
 */
router.get('/', auth, async (req, res) => {
    if (req.user.role == 'customer') {
        return res.redirect('customer');
    }
    if (req.user.role != 'admin') {
        return res.redirect('login');
    }
    try {
        const kitchenFunctions = require('../public/functions/employee/prep-table')(pool);
        const { lowItems } = kitchenFunctions;
        const lowItem = await lowItems();

        res.render('prep-table', { 
            page: 'prep-table',
            lowItem: lowItem
        });
    } catch (error) {
        console.error("Error loading kitchen page:", error.message);
        res.status(500).send("Failed to load kitchen page.");
    }
});

/**
 * POST /prep-table/delete
 * Deletes an item from prep table
 * 
 * @name DeleteInPrepTable
 * @route {POST} /prep-table/delete
 * @returns {View} Renders the prep table screen
 */
router.post('/delete/:name', async (req, res) => {
    const itemname = req.params.name;

    try {
        await pool.query('DELETE FROM kitchen WHERE itemname = $1', [itemname]);
        const { rows }  = await pool.query('SELECT menuitem_id FROM menuitem WHERE menuitem_name = $1', [itemname]);
        const menuitemId = rows.at(0).menuitem_id;
        const enable = await pool.query('UPDATE menuitem SET in_stock = TRUE WHERE menuitem_name = $1', [itemname]);
        console.log(menuitemId);
        res.sendStatus(200);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;