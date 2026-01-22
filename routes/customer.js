const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('./login');

router.get('/', auth, (req, res) => {
    if (req.user.role != 'customer') {
        return res.redirect('login');
    } 
    res.render('kiosk/index', {page:'index'});
});

// router.get('/', (req, res) => {
//     res.render('kiosk/index', {page:'index'});
// });

async function getPrice() {
        const query = `
            SELECT * from menuprice;
        `;
        
        try {
        const res = await pool.query(query);
        return res.rows;
        } catch (err) {
            console.error("Error generating prices:", err.message);
            return [];
        }
    }

router.get('/item-selection', async (req, res) => {
    const rawPrices = await getPrice();
        const priceMap = {};
        
        if (rawPrices) {
            rawPrices.forEach(item => {
                const cleanSize = item.size.trim();
                priceMap[cleanSize] = item.price;
            });
        }
    const orderId = req.session.orderId || null;
    res.render('kiosk/item-selection', {page:'item-selection', orderId, prices: priceMap});
});


router.get('/menu-items', async (req, res) => {
    try {
        const kioskFunctions = require('../public/functions/kiosk/getEntrees')(pool);
        const { getEntreeNames } = kioskFunctions; 
        const entreeNames = await getEntreeNames();
        const mealType = req.query.item || "Plate";


        res.render('kiosk/menu-items', {
            page:'menu-items', 
            entreeNames: entreeNames,
            mealType: mealType,

        });
    } catch (error) {
        console.error("Error retrieving menu items:", error.message);
        res.status(500).send("Failed to load menu items.");
    }
});


router.get('/drinks', async (req, res) => {
    try {
        const kioskFunctions = require('../public/functions/kiosk/getEntrees')(pool);
        const { getEntreeNames } = kioskFunctions; 
        const entreeNames = await getEntreeNames();
        const mealType = req.query.item || "Plate";


        res.render('kiosk/drinks', {
            page:'drinks', 
            entreeNames: entreeNames,
            mealType: mealType,

        });
    } catch (error) {
        console.error("Error retrieving menu items:", error.message);
        res.status(500).send("Failed to load menu items.");
    }
});

router.get('/apps', async (req, res) => {
    try {
        const kioskFunctions = require('../public/functions/kiosk/getEntrees')(pool);
        const { getEntreeNames } = kioskFunctions; 
        const entreeNames = await getEntreeNames();
        const mealType = req.query.item || "Plate";

        res.render('kiosk/apps', {
            page:'apps', 
            entreeNames: entreeNames,
            mealType: mealType,
        });
    } catch (error) {
        console.error("Error retrieving menu items:", error.message);
        res.status(500).send("Failed to load menu items.");     
    }
});

router.post('/start-order', async (req, res) => {
    const { employee_id, total_cost, } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO orders (employee_id, total_cost, time_stamp) VALUES ($1, $2, NOW()) RETURNING order_id',
            [employee_id, total_cost]
        );
        const orderId = result.rows[0].order_id;
        console.log(orderId);
        req.session.orderId = orderId;
        res.json({ orderId });
    } catch (error) {
        console.error('Error starting order:', error);
        res.status(500).json({ error: 'Failed to start order' });
    }
});
router.post('/store-order', (req, res) => {
    req.session.order = req.body;
    console.log("order total price stored in session:", req.session.order.totalPrice);
    res.json({ success: true });
});

router.get('/get-price', async (req, res) => {
    const mealType = req.query.item || "Plate";
    try {
        const priceResult = await pool.query(
            'Select price from menuprice where size=$1',
            [mealType]
        );
        res.json({ price: priceResult.rows[0].price });
    } catch (error) {
        console.error("Error retrieving price:", error.message);
        res.status(500).send("Failed to retrieve price.");
    }
});



router.get('/order-details', async (req, res) => {
    const order = req.session.order || {orderId: null, entries: [], totalPrice: 0.0};

    const { rows } = await pool.query('SELECT COUNT(*) FROM completedorders');
    const numOrders = rows.at(0);
    const waitTime = numOrders.count * 3 + 3;
    
    res.render('kiosk/order-details', {order, waitTime});
});
router.get('/employee-verify', (req, res) => {
    res.render('kiosk/employee-verify', {page:'employee-verify'});
});

router.post('/verify-employee', async (req, res) => {
    const { employeeId } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM employees WHERE employee_id = $1',
            [employeeId]
        );
        if (result.rows.length > 0) {
            res.json({ verified: true });
        } else {
            res.json({ verified: false });
        }  
    } catch (error) {
        console.error('Error verifying employee:', error);
        res.status(500).json({ error: 'Failed to verify employee' });
    }
});

router.post('/remove-notification', async (req, res) => {
    try {
        const { type } = req.body;
        if (type === 'Verify'){
            await pool.query("Update alert set active = false where type = 'Verify';");
            res.json({ success: true });
        }
        else if (type === 'Help'){
            await pool.query("Update alert set active = false where type = 'Help';");
            res.json({ success: true });
        }
        else {
            return res.status(400).json({ error: 'Invalid alert type' });
        }
    } catch (error) {
        console.error('Error removing notification:', error);
        res.status(500).json({ error: 'Failed to remove notification' });
    }
});


router.post('/finalize-order', async (req, res) => {

    console.log("FINALIZE DEBUG:", {
        rawBody: req.body,
        orderId: req.body.orderId,
        totalCost: req.body.totalCost,
        parsedTotalCost: parseFloat(req.body.totalCost)
    });


    const entries = JSON.parse(req.body.entries);
    const totalCost = Number(req.body.totalCost);
    const orderId = Number(req.body.orderId);
    try {
        for (let entry of entries) {
            
            //push entries first
            if (entry.menuItems && entry.menuItems.length > 0) {
                const insertPromises = entry.menuItems.map(item => {
                    return pool.query(
                        'insert into orderentry (order_id, menuitem_id, size, price) values ($1, $2, $3, $4)',
                        [orderId, item.id, entry.size, entry.price]
                    );
                });
                await Promise.all(insertPromises);
            }
        }

        console.log("total, servr side:", totalCost);
            const orderResult = await pool.query(
                'UPDATE orders SET total_cost = $1 WHERE order_id = $2 RETURNING *',
                [totalCost, orderId]
            );
        console.log("Order updated:", orderResult.rows.length);

        for (let entry of entries) {
            let items = [];
            const itemNames = [];
            if (entry.menuItems && entry.menuItems.length > 0) {
                const { rows } = await pool.query('SELECT menuitem_id, menuitem_name FROM menuitem');
                console.log(rows);
                entry.menuItems.forEach(item => {
                    items.push(item.id);
                });
                rows.forEach(menuitem => {
                    items.forEach(itemid => {
                        if (itemid == menuitem.menuitem_id) {
                            itemNames.push(" " + menuitem.menuitem_name);
                        }
                    })
                })
                console.log(itemNames);
                const compOrder = await pool.query(
                    'insert into completedorders (order_id, menuitem, size) values ($1, $2, $3)',
                    [entry.orderId, itemNames.toString(), entry.size]);
            }    
        }

    } catch (error) {
        console.error('Error finalizing order:', error);
        res.status(500).json({ error: 'Failed to finalize order' });
    }

    req.session.destroy();
    res.json({ success: true });
    
});


router.post('/cancel-order', async (req, res) => {
    const { orderId } = req.body;
    try {
        await pool.query('DELETE FROM orders WHERE order_id = $1', [orderId]);
        req.session.destroy();
        res.json({ success: true });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
});

router.post('/notify-kitchen', async (req, res) => {
    try {
        const { type } = req.body;

        if (type === 'Verify'){
            await pool.query("Update alert set active = true where type = 'Verify';");
            res.json({ success: true });
        }
        else if (type === 'Help'){
            await pool.query("Update alert set active = true where type = 'Help';");
            res.json({ success: true });
        }
        else {
            return res.status(400).json({ error: 'Invalid alert type' });
        }

        
    } catch (error) {
        console.error('Error notifying kitchen:', error);
        res.status(500).json({ error: 'Failed to notify kitchen' });
    }
});
module.exports = router;