/**
 * @fileoverview Cashier routes for creating and submitting orders
 * @module routes/newCashier
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('./login');

/**
 * Holds current size of order
 * @type {string}
 */
let size = '';

/**
 * Order ID of order
 * @type {number}
 */
let orderId;

/**
 * Decides if order contains more than one item
 * @type {boolean}
 */
let newItem;

/**
 * All sizes available in database
 * @type {string[]}
 */
let sizeList = [];

/**
 * List of entry IDs for the order
 * @type {number[]}
 */
let entryList = [];

/**
 * Holds index in list of fullEntry objects
 * @type {number}
 */
let index = 0;

/**
 * Class representing an order entry
 */
class fullEntry {
    /**
     * Constructs an order entry
     * @param {string} size - The size of the entry
     * @param {number} price - The price of the entry
     * @param {string[]} menuItems - The menu items included in the entry
     * @param {number[]} entryIdList - Entry Ids associated with the order
     * @param {number} index - index of entry in list of entries
     */
    constructor(size, price, menuItems, entryIdList, index) {
        this.size = size;
        this.price = price;
        this.menuItems = menuItems;
        this.entryIdList = entryIdList;
        this.index = index;
    }
}

/**
 * @description Gets the total price of an order
 * @param {number} id The order id
 * @returns {number} The total price of order
 */
async function getTotalPrice(id) {
    const { rows } = await db.query('SELECT total_cost FROM orders WHERE order_id = $1', [id]);
    const totalPrice = rows.at(0).total_cost;
    return totalPrice;
}

router.get('/', auth, async (req, res) => {
    if (req.user.role == 'customer') {
        return res.redirect('customer');
    }
    if (req.user.role != 'admin') {
        return res.redirect('login');
    }
    trackedItems = [];
    entryList = [];
    index = 0;
    const { rows } = await db.query('SELECT menuitem_name, menuitem_id FROM menuitem');
    res.render('cashierStart', { rows });
});

router.post('/', async (req, res) => {
    const { rows } = await db.query('INSERT INTO orders (employee_id, time_stamp) VALUES (44, NOW()) RETURNING order_id');
    orderId = rows.at(0);
    newItem = false;
    res.redirect('newCashier/sizes');
})

router.get('/sizes', async (req, res) => {
    const { rows } = await db.query('SELECT * FROM menuprice');
    const sizes = { sizes: rows };
    sizes.sizes.forEach(size => {
        sizeList.push(size.size);
    });
    const totalPrice = await getTotalPrice(orderId.order_id);
    res.render('newCashier', {sizes: sizes, entries: entryList, sizeNames: sizeList, price: totalPrice});
});

router.post('/sizes', async (req, res) => {
    size = req.body;
    const { rows } = await db.query('SELECT price FROM menuprice WHERE size = $1', [size.Size]);
    const sizePrice = rows.at(0);
    entryList.push(new fullEntry(size.Size, sizePrice.price, [], [], index++));
    res.redirect('items');
})

router.get('/items', async (req, res) => {
    const { rows } = await db.query('SELECT * FROM menuitem ORDER BY category');
    const items = { items: rows };
    const totalPrice = await getTotalPrice(orderId.order_id);
    res.render('cashierItems', {items: items, size: size, entries: entryList, sizeNames: sizeList, price: totalPrice});
});

router.post('/back', async (req, res) => {
    newItem = true;
    res.redirect('sizes');
})

router.post('/trackItem', async (req, res) => {
    const itemID = req.body;
    const menuItem = await db.query('SELECT menuitem_name FROM menuitem WHERE menuitem_id = $1', [itemID.itemID]);
    const menuItemName = menuItem.rows.at(0);
    entryList.at(-1).menuItems.push(menuItemName.menuitem_name);
    
    if (itemID.itemID <= 4 && !(size.Size == 'Small' || size.Size == 'Medium' || size.Size == 'Large')) {
        itemSize = 'Side';
    } else {
        itemSize = size.Size;
    }
    
    const { rows } = await db.query('SELECT price FROM menuprice WHERE size = $1',[itemSize]);
    const price = rows.at(0);
    const insertEntry = await db.query(
        'INSERT INTO orderentry (order_id, menuitem_id, size) VALUES ($1, $2, $3) RETURNING entry_id',
        [orderId.order_id, itemID.itemID, itemSize]);
        entryList.at(-1).entryIdList.push(insertEntry.rows.at(0).entry_id);
        
        if (newItem || (size.Size == 'Small' || size.Size == 'Medium' || size.Size == 'Large')) {
            const orderEntry = await db.query('SELECT entry_id FROM orderentry ORDER BY entry_id DESC LIMIT 1');
            const entryId = orderEntry.rows.at(0);
            const updatePrice = await db.query(
                'UPDATE orderentry SET price = price + $1 WHERE entry_id = $2 AND price = 0',
                [price.price, entryId.entry_id]);
                newItem = false;
            };
            
    res.redirect('items');
});

router.post('/submitOrder', async (req, res) => {
    res.redirect('../newCashier');
});

router.post('/cancel', async (req, res) => {
    const deleteOrderEntries = await db.query('DELETE FROM orderentry WHERE order_id = $1', [orderId.order_id]);
    const deleteOrders = await db.query('DELETE FROM orders WHERE order_id = $1', [orderId.order_id]);
    res.redirect('../newCashier');
});

router.post('/refill', async (req, res) => {
    const refillName = req.body.refill;
    const addToPrep = await db.query('INSERT INTO kitchen (itemname) VALUES ($1)', [refillName]);
    const disable = await db.query('UPDATE menuitem SET in_stock = FALSE WHERE menuitem_name = $1', [refillName]);
    res.redirect('../newCashier');
});

router.post('/delete', async (req, res) => {
    const deleteIndex = req.body.index;
    try {
    entryList.at(deleteIndex).entryIdList.forEach(async entry => {
        await db.query('DELETE FROM orderentry WHERE entry_id = $1', [entry]);
    });
    await db.query('UPDATE orders SET total_cost = (SELECT SUM(price) FROM orderentry WHERE order_id = $1) WHERE order_id = $1', [orderId.order_id]);
    } catch {}
    for (let i = 0; i < 5; i++) {
        entryList.at(deleteIndex).size = '';
        entryList.at(deleteIndex).price = '';
        entryList.at(deleteIndex).menuItems = [];
        entryList.at(deleteIndex).entryIdList = [];
        entryList.at(deleteIndex).index = null;
    }
    
    res.redirect('sizes');
});

module.exports = router;