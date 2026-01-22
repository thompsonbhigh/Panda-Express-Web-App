/**
 * @fileoverview Sales report route for manager analytics.
 * Generates comprehensive sales reports showing menu item quantities sold and total revenue
 * within a specified date range. Provides parallel query execution for optimal performance.
 * @module routes/managerReportRoute/salesReport
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');

/**
 * Generates a sales report showing quantity sold for each menu item within a date range.
 * Joins orders, order entries, and menu items to aggregate sales data by menu item.
 * Results are grouped by menu item name and category, ordered alphabetically.
 * 
 * @async
 * @function generateSalesReport
 * @param {string} from_date - Start date for the report period (YYYY-MM-DD format)
 * @param {string} to_date - End date for the report period (YYYY-MM-DD format)
 * @returns {Promise<Array<Object>>} Array of objects containing sales data per menu item
 * @returns {string} returns[].menu_item - Name of the menu item
 * @returns {number} returns[].quantitySold - Total quantity sold in the date range
 * @throws {Error} Logs error and returns empty array if database query fails
 *
 */
async function generateSalesReport(from_date, to_date) {
    const query = `
        SELECT 
            mi.menuitem_name, 
            COUNT(*) AS quantity 
        FROM orders o 
        JOIN orderentry oe ON o.order_id = oe.order_id 
        JOIN menuitem mi ON oe.menuitem_id = mi.menuitem_id 
        WHERE DATE(time_stamp) >= $1
        AND DATE(time_stamp) <= $2
        GROUP BY mi.menuitem_name, mi.category 
        ORDER BY mi.menuitem_name;
    `;
    
    try {
        const res = await db.query(query, [from_date, to_date]);
        return res.rows.map(row => ({
            menu_item: row.menuitem_name,
            quantitySold: parseInt(row.quantity, 10)
        }));
    } catch (err) {
        console.error("Error generating sales report:", err.message);
        return [];
    }
}

/**
 * Calculates the total revenue generated from all orders within a date range.
 * Sums the total_cost field from all orders placed between the specified dates.
 * 
 * @async
 * @function generateTotalCost
 * @param {string} from_date - Start date for the calculation period (YYYY-MM-DD format)
 * @param {string} to_date - End date for the calculation period (YYYY-MM-DD format)
 * @returns {Promise<number>} Total revenue as a float, or 0.0 if no orders found or on error
 * @throws {Error} Logs error and returns 0.0 if database query fails
 * 
 */
async function generateTotalCost(from_date, to_date) {
    const sql = `
        SELECT SUM(total_cost) AS total 
        FROM orders 
        WHERE DATE(time_stamp) >= $1 
        AND DATE(time_stamp) <= $2
    `;
    
    try {
        const res = await db.query(sql, [from_date, to_date]);
        if (res.rows.length > 0) {
            // Use Math.round for better floating point precision handling if needed,
            // or just ensure it's a number.
            return parseFloat(res.rows[0].total) || 0.0;
        }
        return 0.0;
    } catch (err) {
        console.error("Error generating total cost:", err.message);
        return 0.0;
    }
}

/**
 * GET /manager/managerReports/salesReport
 * Generates and displays a comprehensive sales report for a specified date range.
 * Shows both item-level sales quantities and total revenue. Executes database queries
 * in parallel for optimal performance. Defaults to October 2025 if no date range specified.
 * 
 * @name GetSalesReport
 * @route {GET} /manager/managerReports/salesReport
 * @queryparam {string} [from_date=2025-10-01] - Start date for the report (YYYY-MM-DD format)
 * @queryparam {string} [to_date=2025-10-30] - End date for the report (YYYY-MM-DD format)
 * @returns {View} Renders the sales report view with item quantities and total revenue
 * @throws {Error} Returns 500 status with error message if database operations fail
 */
router.get('/', async (req, res) => {
     try {
        const { from_date = '2025-10-01', to_date = '2025-10-30' } = req.query;

        // Run both database queries in parallel
        const [reportItems, totalCost] = await Promise.all([
            generateSalesReport(from_date, to_date),
            generateTotalCost(from_date, to_date)
        ]);

        // Render the page, passing all data to the template
        res.render('manager_reports/sales-report', {
            reportItems: reportItems,
            totalCost: totalCost,
            from_date: from_date, 
            to_date: to_date
        });
    } catch (error) {
        // Handle a critical error (e.g., database connection failed)
        console.error("Critical error in main route:", error);
        res.status(500).send("An error occurred while fetching the sales report.");
    }
});
module.exports = router;