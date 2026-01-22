/**
 * @fileoverview Client-side logic for handling order initiation and navigation
 * within the Point of Sale (POS) or Kiosk interface.
 */

/**
 * Initiates the new order process.
 * * This function performs the following actions:
 * 1. Calculates the center of the clicked button to trigger a specific CSS expansion animation.
 * 2. Sends a POST request to the backend to create a new order entry.
 * 3. Waits for both the API response and a minimum animation duration.
 * 4. Stores the new Order ID in local storage.
 * 5. Redirects the user to the item selection screen.
 * * @async
 * @function startOrder
 * @returns {Promise<void>} Resolves when the navigation begins or handles errors if the request fails.
 * @description Relies on DOM elements with ID 'transition-overlay' and class '.start-order-btn'.
 */
async function startOrder() {
   const overlay = document.getElementById('transition-overlay');
    const button = document.querySelector('.start-order-btn');

    if (overlay && button) {
        const rect = button.getBoundingClientRect();
        const centerX = rect.left + (rect.width / 2);
        const centerY = rect.top + (rect.height / 2);
        overlay.style.setProperty('--x', `${centerX}px`);
        overlay.style.setProperty('--y', `${centerY}px`);
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
    }
    const animationTimer = new Promise(resolve => setTimeout(resolve, 320));
    const totalCost = 0.0;
    try {
        const response = await fetch('customer/start-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                employee_id: 103,
                total_cost: totalCost
            }),
        });

        console.log("response:", response.status);
        const data = await response.json();
        console.log("data:", data);

        if (response.ok) {
            const orderId = data.orderId;
            console.log("Order started with ID:", orderId);
            localStorage.setItem("orderId", orderId);
            await animationTimer;
            window.location.href = `/customer/item-selection?orderId=${orderId}`;
            if (overlay) overlay.classList.remove('active');
        } else {
            console.error("Failed to start order");
            if (overlay) overlay.classList.remove('active');
        }
    } catch (error) {
        console.error("Error starting order:", error);
        if (overlay) overlay.classList.remove('active');
    }
}

/**
 * Navigates the current window to the Manager interface.
 * * @async
 * @function GoToManagerView
 * @returns {Promise<void>}
 */
async function GoToManagerView() {
    try {
        window.location.href = `/manager`;
    } catch (error) {
        console.error("Error starting order:", error);
    }
}

