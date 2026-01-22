/**
 * @fileoverview X and Z Report routes for manager analytics.
 * Handles cash register reporting for shift management and end-of-day reconciliation.
 * - X Report: Mid-shift report showing hourly sales since last Z Report without clearing totals
 * - Z Report: End-of-day report that displays sales and sets a new baseline timestamp
 * Uses cookies to track the last Z Report time for accurate reporting windows.
 * @module routes/managerReportRoute/XandZReport
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');

/**
 * GET /manager/managerReports/xAndzReport/xReport
 * Generates and displays an X Report (mid-shift sales report).
 * Shows hourly sales breakdown since the last Z Report was run.
 * Does not modify any state or clear totals - purely informational.
 * 
 * @name GetXReport
 * @route {GET} /manager/managerReports/xAndzReport/xReport
 * @cookie {string} latestZReport - ISO timestamp of the last Z Report (used as baseline)
 * @returns {View} Renders the X Report view with hourly sales data and total
 * @throws {Error} Returns 500 status with error message if database operations fail
 */
router.get('/xReport', async (req, res) => {
     try {
        const latestZReport = req.cookies.latestZReport || '';

        // Run both database queries in parallel
        const [reportItems] = await Promise.all([
            generateXReport(latestZReport)
        ]);

        // Render the page, passing all data to the template
        res.render('manager_reports/x-report', {
            reportItems: reportItems,
            total: reportItems?.[0]?.total ?? -1
        });
    } catch (error) {
        // Handle a critical error (e.g., database connection failed)
        console.error("Critical error in main route:", error);
        res.status(500).send("An error occurred while fetching the sales report.");
    }
});

/**
 * GET /manager/managerReports/xAndzReport/zReport
 * Generates and displays a Z Report (end-of-day sales report).
 * Shows hourly sales breakdown since the last Z Report.
 * This endpoint displays the report but does not clear totals - use the API endpoint to finalize.
 * 
 * @name GetZReport
 * @route {GET} /manager/managerReports/xAndzReport/zReport
 * @cookie {string} latestZReport - ISO timestamp of the last Z Report (used as baseline)
 * @returns {View} Renders the Z Report view with hourly sales data and total
 * @throws {Error} Returns 500 status with error message if database operations fail
 */
router.get('/zReport', async (req, res) => {
     try {
        const latestZReport = req.cookies.latestZReport || '';

        // Run both database queries in parallel
        const [reportItems] = await Promise.all([
            generateXReport(latestZReport)
        ]);

        // Render the page, passing all data to the template
        res.render('manager_reports/z-report', {
            reportItems: reportItems,
            total: reportItems?.[0]?.total ?? -1
        });
    } catch (error) {
        // Handle a critical error (e.g., database connection failed)
        console.error("Critical error in main route:", error);
        res.status(500).send("An error occurred while fetching the sales report.");
    }
});

/**
 * GET /manager/managerReports/xAndzReport/api/set-z-report-time
 * Finalizes a Z Report by setting the current timestamp as the new baseline.
 * Sets a long-lived cookie to track when the last Z Report was completed.
 * This creates a new reporting window for subsequent X and Z Reports.
 * After setting the timestamp, redirects back to the Z Report view.
 * 
 * @name SetZReportTime
 * @route {GET} /manager/managerReports/xAndzReport/api/set-z-report-time
 * @returns {Redirect} Redirects to Z Report view after setting the cookie
 * @cookie {string} latestZReport - Sets cookie with current ISO timestamp (1 year expiration)
 * @throws {Error} Returns 500 status with error message if operation fails
 */
router.get('/api/set-z-report-time', async (req, res) => {
    try {
        // Assume SetZReportTime handles setting the cookie and saving the timestamp
       const timestamp = new Date().toISOString(); // The time of the completed Z-Report.
    
        // Set the cookie
        res.cookie('latestZReport', timestamp, {
            maxAge: 3600000 * 24 * 365, // Keep the cookie for a year (or longer)
            httpOnly: true,             // Makes it inaccessible to client-side JS (security best practice)
            secure: process.env.NODE_ENV === 'production', // Use 'secure' in production (HTTPS)
            sameSite: 'strict'          // Security measure
        });

       return res.redirect('/manager/managerReports/xAndzReport/zReport');
        
    } catch (error) {
        console.error("Error setting Z-Report time:", error);
        res.status(500).send({ error: "Failed to set Z-Report time." });
    }
});

/**
 * Generates an X or Z Report showing hourly sales breakdown.
 * Analyzes orders since the last Z Report timestamp (or since start of current day if no Z Report exists).
 * Groups sales by hour and includes a TOTAL row summarizing all sales in the period.
 * 
 * @async
 * @function generateXReport
 * @param {string} latestZReport - ISO timestamp of the last Z Report, or empty string for current day
 * @returns {Promise<Array<Object>>} Array of objects containing hourly sales data plus total row
 * @returns {string} returns[].itemName - Hour range (e.g., "09:00 - 09:59") or "TOTAL"
 * @returns {number} returns[].qty - Number of orders in this hour/period
 * @returns {number} returns[].total - Total sales revenue for this hour/period
 * @throws {Error} Logs error and returns empty array if database query fails
 */
async function generateXReport(latestZReport) {
    // 1. Determine the starting timestamp/date
    let startDateParam;
    
    // Check if latestZReport is provided and not empty
    if (latestZReport && latestZReport.trim() !== "") {
        // Use the timestamp from the last Z-Report
        startDateParam = latestZReport.trim();
    } else {
        // Fallback: Use the current date string (YYYY-MM-DD)
        // For Postgres/SQL comparison: DATE(time_stamp) = 'YYYY-MM-DD'
        startDateParam = new Date().toISOString().split('T')[0];
    }

    // 2. Define the parameterized SQL query
    const query = `
        SELECT
            hour_range,
            number_of_orders,
            total_sales
        FROM (
            SELECT
                TO_CHAR(time_stamp, 'HH24') || ':00 - ' || TO_CHAR(time_stamp, 'HH24') || ':59' AS hour_range,
                COUNT(order_id) AS number_of_orders,
                SUM(total_cost) AS total_sales
            FROM orders
            -- Use $1 for the date comparison, which now holds either the latestZReport timestamp
            -- or today's date string. We use DATE() function to compare the date part.
            WHERE time_stamp >= $1 
            AND DATE(time_stamp) = DATE($1)
            GROUP BY TO_CHAR(time_stamp, 'HH24')

            UNION ALL

            SELECT
                'TOTAL' AS hour_range,
                COUNT(order_id) AS number_of_orders,
                SUM(total_cost) AS total_sales
            FROM orders
            WHERE time_stamp >= $1 
            AND DATE(time_stamp) = DATE($1)
        ) t
        ORDER BY
            CASE WHEN hour_range = 'TOTAL' THEN 2 ELSE 1 END,
            hour_range;
    `;
    
    // 3. Execute the query and process results
    try {
        // We pass startDateParam as the value for $1
        const res = await db.query(query, [startDateParam]);
        
        // Map the database rows to the desired XReportItem format
        return res.rows.map(row => ({
            itemName: row.hour_range, // Maps 'hour_range' to 'itemName'
            qty: parseInt(row.number_of_orders, 10), // Maps 'number_of_orders' to 'qty'
            total: parseFloat(row.total_sales) // Maps 'total_sales' to 'total'
        }));
    } catch (err) {
        // Log the error and return an empty array on failure
        console.error("Error generating X-Report:", err.message);
        return [];
    }
}

module.exports = router;