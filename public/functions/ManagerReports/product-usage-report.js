/**
 * @fileoverview Client-side script for rendering product usage report charts.
 * Initializes and displays a bar chart visualization of inventory item consumption
 * using Chart.js library. Data is injected from the server via EJS templates.
 * @requires Chart.js - Must be loaded in the HTML before this script
 */
document.addEventListener('DOMContentLoaded', () => {

    console.log("is this thing working");
    console.log("is this thing working 1: " + typeof reportData !== 'undefined');
    console.log("is this thing working2: " + reportData.length);
    // Check if the global variable 'reportData' was injected (from EJS)
    if (typeof reportData !== 'undefined' && reportData.length > 0) {
        // Hide the placeholder message div
        const messageDiv = document.getElementById('chartMessage');
        if (messageDiv) {
            messageDiv.style.display = 'none';
        }

        // Show the canvas (if it was hidden by default)
        const canvas = document.getElementById('barChartCanvas');
        if (canvas) {
            canvas.style.display = 'block';
        }

        renderProductUsageChart(reportData);
    }
    // If reportData is undefined or empty, the EJS file handles displaying a message.
});

/**
 * Renders a bar chart visualization of product usage data using Chart.js.
 * Creates a vertical bar chart showing total quantity used for each inventory item.
 * The chart is responsive and includes axis labels, grid lines, and a title.
 * 
 * @function renderProductUsageChart
 * @param {Array<Object>} data - Array of product usage data objects
 * @param {string} data[].itemName - Name of the inventory item
 * @param {number} data[].totalUsed - Total quantity of the item consumed
 * 
 */
function renderProductUsageChart(data) {
    const canvas = document.getElementById('barChartCanvas');
    if (!canvas) return; // Exit if canvas is not found

    // Extract labels (Item Names) and data values (Total Used)
    const labels = data.map(item => item.itemName);
    const totalUsedData = data.map(item => item.totalUsed);
    console.log("Chart Data Values:", totalUsedData); // <--- ADD THIS

    const chartConfig = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Used Quantity',
                data: totalUsedData,
                // TEMPORARY: Set a high-contrast color (e.g., pure red)
                backgroundColor: 'rgba(255, 0, 0, 1)', 
                borderColor: 'rgba(0, 0, 0, 1)', 
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Quantity Used' }
                },
                x: {
                    title: { display: true, text: 'Inventory Item' }
                }
            },
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Product Usage Report' }
            }
        }
    };

    // Store the initialized chart object
    const myChart = new Chart(canvas, chartConfig);
    
    // Log the object to the console
    console.log("Chart Object Data:", myChart.data); 
}