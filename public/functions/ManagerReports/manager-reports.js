/**
 * @fileoverview Navigation functions for manager report pages.
 * Provides client-side navigation helpers to route between different manager reports
 * and perform report-related actions. All functions handle navigation errors gracefully.
 */

/**
 * Navigates to the Sales Report page.
 * 
 * @async
 * @function GoToSalesReport
 * @returns {Promise<void>}
 * @throws {Error} Logs error to console if navigation fails
 */
async function GoToSalesReport() {
    try {
        window.location.href = `/manager/managerReports/salesReport`;
    } catch (error) {
        console.error("Error starting order:", error);
    }
}

/**
 * Navigates to the X Report page.
 * 
 * @async
 * @function GoToXReport
 * @throws {Error} Logs error to console if navigation fails
 */
async function GoToXReport() {
    try {
        window.location.href = `/manager/managerReports/xAndzReport/xReport`;
    } catch (error) {
        console.error("Error starting order:", error);
    }
}

/**
 * Navigates to the Z Report page.
 * 
 * @async
 * @function GoToZReport
 * @throws {Error} Logs error to console if navigation fails
 */
async function GoToZReport() {
    try {
        window.location.href = `/manager/managerReports/xAndzReport/zReport`;
    } catch (error) {
        console.error("Error starting order:", error);
    }
}

/**
 * Navigates to the Product Usage Report page.
 * 
 * @async
 * @function GoToProductUsageReport
 * @throws {Error} Logs error to console if navigation fails
 */
async function GoToProductUsageReport() {
    try {
        window.location.href = `/manager/managerReports/productUsageReport`;
    } catch (error) {
        console.error("Error starting order:", error);
    }
}

/**
 * Navigates to the Restock Report page.
 * 
 * @async
 * @function GoToRestock
 * @throws {Error} Logs error to console if navigation fails
 */
async function GoToRestock() {
    try {
        window.location.href = `/manager/managerReports/restock`;
    } catch (error) {
        console.error("Error starting order:", error);
    }
}

/**
 * Navigates to the main Manager Reports dashboard.
 * 
 * @async
 * @function GoToManagerReports
 * @throws {Error} Logs error to console if navigation fails
 */
async function GoToManagerReports() {
        try {
        window.location.href = `/manager/managerReports`;
    } catch (error) {
        console.error("Error starting order:", error);
    }
}

/**
 * Navigates to the Z Report time configuration endpoint.
 * 
 * @async
 * @function SetZReportTime
 * @throws {Error} Logs error to console if navigation fails
 */
async function SetZReportTime() {
        try {
        window.location.href = `/manager/managerReports/xAndzReport/api/set-z-report-time`;
    } catch (error) {
        console.error("Error starting order:", error);
    }
}


/**
 * Navigates to the restock items action endpoint.
 * 
 * @async
 * @function RestockItems
 * @throws {Error} Logs error to console if navigation fails
 */
async function RestockItems() {
    try {
        window.location.href = `/manager/managerReports/restock/api/restock-items`;
    } catch (error) {
        console.error("Error starting order:", error);
    }
}
