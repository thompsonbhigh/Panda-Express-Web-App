/**
 * @fileoverview Product usage report route for manager analytics.
 * Generates reports showing inventory item consumption based on orders within a date range.
 * Calculates total quantity used for each inventory item by using the recipes and order entries.
 * @module routes/managerReportRoute/productUsageReport
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');

/**
 * GET /manager/managerReports/productUsageReport
 * Generates and displays a product usage report for a specified date range.
 * Shows how much of each inventory item was consumed based on orders placed.
 * Defaults to October 2025 if no date range is specified.
 * 
 * @name GetProductUsageReport
 * @route {GET} /manager/managerReports/productUsageReport
 * @queryparam {string} [from_date=2025-10-01] - Start date for the report (YYYY-MM-DD format)
 * @queryparam {string} [to_date=2025-10-30] - End date for the report (YYYY-MM-DD format)
 * @returns {View} Renders the product usage report view with consumption data
 * @throws {Error} Returns 500 status with error message if database operations fail
 */
router.get('/', async (req, res) => {
     try {
        const { from_date = '2025-10-01', to_date = '2025-10-30' } = req.query;

        // Run both database queries in parallel
        const [reportItems] = await Promise.all([
            generateProductUsageReport(from_date, to_date),
        ]);

        // Render the page, passing all data to the template
        res.render('manager_reports/product-usage-report', {
            reportItems: reportItems,
            from_date: from_date, 
            to_date: to_date
        });
    } catch (error) {
        // Handle a critical error (e.g., database connection failed)
        console.error("Critical error in main route:", error);
        res.status(500).send("An error occurred while fetching the sales report.");
    }
});

/**
 * Generates a product usage report by calculating total inventory item consumption.
 * Analyzes orders, order entries, and recipes to determine how much of each
 * inventory item was used to fulfill orders within the specified date range.
 * 
 * @async
 * @function generateProductUsageReport
 * @param {string} from_date - Start date for the report period (YYYY-MM-DD format)
 * @param {string} to_date - End date for the report period (YYYY-MM-DD format)
 * @returns {Promise<Array<Object>>} Array of objects containing item usage data
 * @returns {string} returns[].itemName - Name of the inventory item
 * @returns {number} returns[].totalUsed - Total quantity of the item used in the date range
 * @throws {Error} Logs error and returns empty array if database query fails
 * 
 */
async function generateProductUsageReport(from_date, to_date) {
    const query = `
        SELECT 
            i.Item_Name,
            SUM(r.Quantity_Required) AS Total_Used  -- Alias Total_Used
        FROM Orders o
        JOIN OrderEntry oe ON o.order_id = oe.order_id
        JOIN Recipes r ON oe.MenuItem_ID = r.MenuItem_ID
        JOIN Inventory i ON r.Item_ID = i.Item_ID
        WHERE o.time_stamp BETWEEN $1 AND $2
        GROUP BY i.Item_Name;
        `;
    
    try {
        const res = await db.query(query, [from_date, to_date]);
        return res.rows.map(row => ({
            itemName: row.item_name, 
            totalUsed: parseFloat(row.total_used) 
        }));
    } catch (err) {
        console.error("Error generating sales report:", err.message);
        return [];
    }
}

module.exports = router;