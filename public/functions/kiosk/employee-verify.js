/**
 * Verifies an employee ID against the server to authorize a high-value or large order.
 * Prevents default form submission, checks credentials via '/verify-employee', 
 * and on success, updates local storage, clears backend notifications, and redirects to order details.
 * @async
 * @param {Event} event - The form submission event.
 * @returns {Promise<void>}
 */
async function verifyEmployee(event) {
    event.preventDefault();
    const employeeId = document.getElementById('employee-id').value;

    try {
        const response = await fetch('/customer/verify-employee', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ employeeId: employeeId })
        });
        const data = await response.json();

        if (data.verified) {
            alert('Employee verified successfully. Proceeding to complete the order.');
            localStorage.setItem('verified', true);
            await removeNotification();
            window.location.href = '/customer/order-details';
        } else {
            alert('Invalid Employee ID. Please try again.');
        }
    } catch (error) {
        console.error('Error verifying employee:', error);
        alert('An error occurred while verifying the employee. Please try again later.');
    }
}

/**
 * Submits a cancellation request for the current order.
 * Retrieves the order ID from local storage, notifies the backend via '/cancel-order',
 * clears all local storage data, removes any active notifications, and redirects to the home page.
 * @async
 * @returns {Promise<void>}
 */
async function submitCancellation() {
    const orderId = JSON.parse(localStorage.getItem('orderId'));

    try {
        const response = await fetch('/customer/cancel-order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ orderId: orderId })
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        alert('An error occurred while cancelling the order.');
    }


    localStorage.clear();
    await removeNotification();
    window.location.href = '/customer';
}

/**
 * Sends a request to the backend to remove the 'Verify' notification
 * from the kitchen or manager view.
 * @async
 * @returns {Promise<void>}
 */
async function removeNotification() {
    const response = await fetch('/customer/remove-notification', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ type: 'Verify'})
    });

    const data = await response.json();

    if (data.success) {
        console.log('Notification removed successfully.');
    }
    else {
        console.error('Failed to remove notification: ' + data.error);
    }
}