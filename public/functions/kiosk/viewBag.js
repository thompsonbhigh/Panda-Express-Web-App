/**
 * Redirects the user to the order details page to view the contents of their current bag/order.
 * @async
 * @returns {Promise<void>} Resolves when the redirection initiates.
 */
async function viewBag() {
    href = '/customer/order-details'
    window.location.href = href;
}