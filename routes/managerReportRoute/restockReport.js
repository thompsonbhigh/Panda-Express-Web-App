/**
 * @fileoverview Restock report route for manager inventory management.
 * Generates reports identifying inventory items below minimum threshold levels
 * and provides automated restocking functionality to replenish inventory to maximum levels.
 * Integrates with the restock table to track min/max quantities and shelf life.
 * @module routes/managerReportRoute/restockReport
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');

/**
 * GET /manager/managerReports/restock
 * Generates and displays a restock report showing all items needing replenishment.
 * Identifies inventory items at or below their minimum threshold levels.
 * 
 * @name GetRestockReport
 * @route {GET} /manager/managerReports/restock
 * @returns {View} Renders the restock report view with items needing replenishment
 * @throws {Error} Returns 500 status with error message if database operations fail
 */
router.get('/', async (req, res) => {
     try {

        // Run both database queries in parallel
        const [reportItems] = await Promise.all([ generateRestockReport()]);

        // Render the page, passing all data to the template
        res.render('manager_reports/restock-report', {
            reportItems: reportItems,
        });
    } catch (error) {
        // Handle a critical error (e.g., database connection failed)
        console.error("Critical error in main route:", error);
        res.status(500).send("An error occurred while fetching the sales report.");
    }
});

/**
 * GET /manager/managerReports/restock/api/restock-items
 * Executes automated restocking for all items below minimum threshold.
 * Replenishes each low-stock item to its maximum quantity level.
 * Processes all items in sequence, logging successes and failures individually.
 * 
 * @name RestockItems
 * @route {GET} /manager/managerReports/restock/api/restock-items
 * @returns {Redirect} Redirects to restock report page after completion
 * @returns {Object} Returns error object if critical failure occurs
 * @throws {Error} Logs individual item failures but continues processing remaining items
 * 
 * @example
 * // Item at 10 units with max of 100 will be restocked to 100 units
 * // Multiple items are processed in sequence with error tolerance
 */
router.get('/api/restock-items', async (req, res) => {
    const sql = "UPDATE inventory SET quantity = $1 WHERE item_id = $2";
    let success = true;

    try {
        const allRestocks = await FindRestock(); 

        for (const r of allRestocks) {
            const inventoryData = await findByIdInventory(r.item_id);

            if (inventoryData.length > 0) {
                const inv = inventoryData[0];
                const currentQuantity = parseFloat(inv.quantity);
                const maxQuantity = parseFloat(r.max);
                const newQuantity = currentQuantity + (maxQuantity - currentQuantity); 
                
                try {
                    await db.query(sql, [newQuantity, r.item_id]);
                } catch (updateErr) {
                    console.error(`Failed to update item_id ${r.item_id}:`, updateErr.message);
                    success = false; // Mark as failed but continue loop (similar to Java's catch logic)
                }
            }
        }

        if (success) {
            console.log("SUCCESS: Restock order placed successfully.");
        } else {
            console.log("WARNING: Restock order finished, but some updates failed. Check logs.");
        }
        return res.redirect('/manager/managerReports/restock');

    } catch (e) {
        console.error("CRITICAL ERROR during restock process:", e.message);
        return { status: 'error', message: 'Critical failure during restock.' };
    }
});

/**
 * Generates a restock report by identifying inventory items at or below minimum levels.
 * Joins inventory and restock tables to compare current quantities against thresholds.
 * Returns detailed information for each item including restock status.
 * 
 * @async
 * @function generateRestockReport
 * @returns {Promise<Array<Object>>} Array of objects containing restock information
 * @returns {string} returns[].itemName - Name of the inventory item
 * @returns {number} returns[].onHand - Current quantity in inventory
 * @returns {number} returns[].minimum - Minimum threshold quantity
 * @returns {boolean} returns[].needsRestock - True if current quantity is at or below minimum
 * @throws {Error} Logs error and returns empty array if database query fails
 */
async function generateRestockReport() {
    const entries = [];
    
    try {
        const allRestocks = await FindRestock(); 

        for (const r of allRestocks) {
            const inventoryData = await findByIdInventory(r.item_id);

            if (inventoryData.length > 0) {
                const inv = inventoryData[0];
                
                const itemName = inv.item_name;
                const onHand = parseFloat(inv.quantity);
                const minimum = parseFloat(r.min); 
                const needsRestock = onHand <= minimum;

                entries.push({ itemName, onHand, minimum, needsRestock });
            }
        }
        
        return entries;

    } catch (err) {
        console.error("Error generating restock report:", err.message);
        return [];
    }
}
/**
 * Retrieves complete inventory details for a specific item by ID.
 * Returns all fields including quantity, unit, and item name.
 * 
 * @async
 * @function findByIdInventory
 * @param {number} item_id - The ID of the inventory item to retrieve
 * @returns {Promise<Array<Object>>} Array containing the inventory item (or empty if not found)
 * @returns {number} returns[].item_id - The inventory item ID
 * @returns {string} returns[].item_name - Name of the item
 * @returns {number} returns[].quantity - Current quantity in stock
 * @returns {string} returns[].unit - Unit of measurement (e.g., "lbs", "oz", "each")
 * @throws {Error} Logs error and returns empty array if database query fails
 */
async function findByIdInventory(item_id) {
    const query = `Select * from inventory WHERE  item_id = $1`;

    try {
        const res = await db.query(query, [item_id]);
        return res.rows.map(row => ({
            item_id: row.item_id,
            item_name: row.item_name,
            quantity: row.quantity,
            unit: row.unit
        }));
    } catch (err) {
        console.error("Error generating restock report- findByInventoryID:", err.message);
        return [];
    }
}
/**
 * Finds all inventory items that are at or below their minimum threshold levels.
 * Joins inventory and restock tables to identify items needing replenishment.
 * Returns restock configuration data including min/max quantities and shelf life.
 * 
 * @async
 * @function FindRestock
 * @returns {Promise<Array<Object>>} Array of objects containing restock data for low-stock items
 * @returns {number} returns[].restock_id - The restock configuration ID
 * @returns {number} returns[].item_id - The inventory item ID
 * @returns {number} returns[].max - Maximum quantity threshold
 * @returns {number} returns[].min - Minimum quantity threshold
 * @returns {number} returns[].shelf_life - Shelf life in days
 * @returns {Date} returns[].lastRestock - Timestamp of last restock operation
 * @throws {Error} Logs error and returns empty array if database query fails
 */ 
 async function FindRestock() {
    const query = `Select * from inventory i JOIN restock r on i.item_id = r.item_id WHERE i.quantity <= r.min`;
    
    try {
        const res = await db.query(query);
        return res.rows.map(row => ({
            restock_id: row.restock_id,
            item_id: row.item_id,
            max: row.max,
            min: row.min,
            shelf_life: row.shelf_life,
            lastRestock: row.last_restock
        }));
    } catch (err) {
        console.error("Error generating restock report - FindRestock:", err.message);
        return [];
    }
}

module.exports = router;