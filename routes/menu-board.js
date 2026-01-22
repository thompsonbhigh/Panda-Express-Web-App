/**
 * @fileoverview Route for displaying and traversing Menu Board
 * @module routes/menu=board
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('./login');

/**
 * GET /menu-board
 * Renders the main menu board view.
 * Implements role-based access control:
 * - Redirects customers to the customer portal
 * - Redirects non-admin users to the login page
 * - Only allows admin users to access the menu board
 * 
 * @name GetMenu-Board
 * @route {GET} /menu-board
 * @authentication Requires authentication via auth middleware
 * @authorization Requires 'admin' role
 * @returns {Redirect} Redirects to /customer if user role is 'customer'
 * @returns {Redirect} Redirects to /login if user role is not 'admin'
 * @returns {View} Renders the universal menu-board for admin users
 */
router.get('/', auth, async (req, res) => {
    if (req.user.role == 'customer') {
        return res.redirect('customer');
    }
    if (req.user.role != 'admin') {
        return res.redirect('login');
    }
    try {
        const priceFunc = require('../public/functions/kiosk/getPrice')(pool);
        const { getPrice } = priceFunc; 
        const price = await getPrice();
        const prices = {};
        price.forEach(row => {
            prices[row.size] = row.price;            
        });
        const appPrice = price.find(p => p.size === "Appetizer")?.price || null;
        const drinkPrice     = price.find(p => p.size === "Drink")?.price || null;
        const entreeFunc = require('../public/functions/kiosk/getEntrees')(pool);
        const { getEntreeNames } = entreeFunc; 
        const entreeNames = await getEntreeNames();
        res.render('menu-board/menu-board', {
            page:'menu-board/menu-board', 
            entreeNames: entreeNames,
            appPrice: appPrice,
            drinkPrice: drinkPrice,
            price: price,
            prices

        });
    } catch (error) {
        console.error("Error retrieving menu items:", error.message);
        res.status(500).send("Failed to load menu items.");
    }
});

/**
 * GET /menu-board/sizes
 * Renders the menu board size view.
 * 
 * @name GetSizes
 * @route {GET} /menu-board/sizes
 * @returns {View} Renders the menu-board's sizes page
 */
router.get('/sizes', async (req, res)  =>{
    try {
        const kioskFunctions = require('../public/functions/kiosk/getPrice')(pool);
        const { getPrice } = kioskFunctions; 
        const result = await getPrice();
        const prices = {};
        result.forEach(row => {
            prices[row.size] = row.price;            
        });

        res.render('menu-board/sizes', {
            page:'menu-board/sizes', 
            prices
        });
    } catch (error) {
        console.error("Error retrieving menu items:", error.message);
        res.status(500).send("Failed to load menu items.");
    }
});

/**
 * GET /menu-board/entrees
 * Renders the menu board entree view.
 * 
 * @name GetEntrees
 * @route {GET} /menu-board/entrees
 * @returns {View} Renders the menu-board's entrees page
 */
router.get('/entrees', async (req, res)  =>{
    try {
        const kioskFunctions = require('../public/functions/kiosk/getEntrees')(pool);
        const { getEntreeNames } = kioskFunctions; 
        const entreeNames = await getEntreeNames();


        res.render('menu-board/entrees', {
            page:'menu-board/entrees', 
            entreeNames: entreeNames,

        });
    } catch (error) {
        console.error("Error retrieving menu items:", error.message);
        res.status(500).send("Failed to load menu items.");
    }
});

/**
 * GET /menu-board/sides-and-a-la-carte
 * Renders the menu board size view.
 * 
 * @name GetSidesAndALaCarte
 * @route {GET} /menu-board/sides-and-a-la-carte
 * @returns {View} Renders the menu-board's sides and a la carte page
 */
router.get('/sides-and-a-la-carte', async (req, res)  =>{
    try {
        const kioskFunctions = require('../public/functions/kiosk/getEntrees')(pool);
        const { getEntreeNames } = kioskFunctions; 
        const entreeNames = await getEntreeNames();

        const priceFunctions = require('../public/functions/kiosk/getPrice')(pool);
        const { getPrice } = priceFunctions; 
        const price = await getPrice();
        
        const prices = {};
        
        price.forEach(row => {
            prices[row.size] = row.price;            
        });

        res.render('menu-board/sides-and-a-la-carte', {
            page:'menu-board/sides-and-a-la-carte', 
            entreeNames: entreeNames,
            price: price,
            prices

        });
    } catch (error) {
        console.error("Error retrieving menu items:", error.message);
        res.status(500).send("Failed to load menu items.");
    }
});

/**
 * GET /menu-board/appetizers-and-drinks
 * Renders the menu board appetizers and drinks view.
 * 
 * @name GetAppetizersAndDrinks
 * @route {GET} /menu-board/appetizers-and-drinks
 * @returns {View} Renders the menu-board's appetizers and drinks page
 */
router.get('/appetizers-and-drinks', async (req, res)  =>{
    try {
        const kioskFunctions = require('../public/functions/kiosk/getEntrees')(pool);
        const { getEntreeNames } = kioskFunctions; 
        const entreeNames = await getEntreeNames();

        const priceFunctions = require('../public/functions/kiosk/getPrice')(pool);
        const { getPrice } = priceFunctions; 
        const price = await getPrice();
        const appPrice = price.find(p => p.size === "Appetizer")?.price || null;
        const drinkPrice     = price.find(p => p.size === "Drink")?.price || null;


        res.render('menu-board/appetizers-and-drinks', {
            page:'menu-board/appetizers-and-drinks', 
            entreeNames: entreeNames,
            appPrice: appPrice,
            drinkPrice: drinkPrice,

        });
    } catch (error) {
        console.error("Error retrieving menu items:", error.message);
        res.status(500).send("Failed to load menu items.");
    }
});

module.exports = router;