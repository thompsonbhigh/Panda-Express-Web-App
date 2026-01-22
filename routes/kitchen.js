/**
 * @fileoverview Kitchen route for receiving orders from the kiosk
 * @module routes/kitchen
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('./login');

/**
 * GET /kitchen
 * Renders the kitchen screen
 * 
 * @name GetKitchenScreen
 * @route {GET} /kitchen
 * @returns {View} Renders the kitchen screen
 */
router.get('/', auth, async (req, res) => {
    if (req.user.role == 'customer') {
        return res.redirect('customer');
    }
    if (req.user.role != 'admin') {
        return res.redirect('login');
    }
    const { rows } = await db.query('SELECT * FROM completedorders ORDER BY order_id ASC');
    const orders = { orders: rows };
    const alert = await db.query('SELECT * FROM alert');
    const verifyAlert = alert.rows.at(0).active;
    const helpAlert = alert.rows.at(1).active;
    console.log(verifyAlert);
    console.log(helpAlert);
    res.render('kitchen', {orders: orders, verify: verifyAlert, help: helpAlert});
});

/**
 * POST /kitchen/mark-complete
 * Completes an order
 * 
 * @name markCompleteKitchen
 * @route {POST} /kitchen/mark-complete
 * @returns {View} Renders the kitchen screen
 */
router.post('/mark-complete', async (req, res) => {
    
    const orderId = req.body.orderid;
    console.log(orderId);

    try {
        await db.query('DELETE FROM completedorders WHERE order_id = $1', [orderId]);
    } catch (error) {
        console.error('Error marking order as complete:', error);
        res.status(500).json({ success: false, error: 'Failed to mark order as complete' });
    }
    res.redirect('../kitchen');
});

/**
 * POST /kitchen/help-complete
 * Completes a help request
 * 
 * @name markHelpComplete
 * @route {POST} /kitchen/help-complete
 * @returns {View} Renders the kitchen screen
 */
router.post('/help-complete', async (req, res) => {
    try {
        await db.query("UPDATE alert SET active = 'f' WHERE type = 'Help'");
    } catch (error) {
        console.error('Error completing help', error);
    }
    res.redirect('../kitchen');
});

module.exports = router;