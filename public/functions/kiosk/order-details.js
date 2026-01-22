/**
 * Represents a single order containing employee and cost details.
 * @class
 */
class Order {
    /**
     * Creates an instance of Order.
     * @param {string|number} orderId - The unique identifier for the order.
     * @param {string|number} employeeId - The ID of the employee processing the order.
     * @param {number} totalCost - The total cost of the order.
     * @param {string} timeStamp - The timestamp when the order was created.
     */
    constructor(orderId, employeeId, totalCost, timeStamp) {
        this.orderId = orderId;
        this.employeeId = employeeId;
        this.totalCost = totalCost;
        this.timeStamp = timeStamp;
    }
}

/**
 * Validates the current order stored in local storage.
 * Checks if the order requires kitchen verification (10+ items or >= $150).
 * If verification is needed, sends a request to '/notify-kitchen' and redirects to employee verification.
 * * @async
 * @returns {Promise<void|string>} Redirects to '/employee-verify' if verification is successful.
 */
async function validateOrder() {
    const order = JSON.parse(localStorage.getItem('Totalorder'));
    const verified = localStorage.getItem('verified');

    if (verified === 'true') {
        return;
    }
    if (order.entries.length === 10 || order.totalPrice >= 150) {
        //send request to kitchen view
        
        const response = await fetch('/customer/notify-kitchen', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({  type: 'Verify'})
        });

        const data = await response.json();

        if (data.success) {
            alert('Kitchen has been notified for order verification.');
            return window.location.href = '/customer/employee-verify';
        }
        else {
            alert('Failed to notify kitchen: ' + data.error);
        }        
    }
}



/**
 * Window load event handler.
 * Automatically triggers order validation when the page loads.
 */
window.onload = async function() {
    const totalorder = JSON.parse(localStorage.getItem('Totalorder'));
    if (!totalorder || totalorder.entries.length === 0) { 
        this.document.getElementById('complete-order-button').disabled = true;
        return;
    }
    await validateOrder();
};

/**
 * Prompts the user for confirmation before submitting the order.
 * If confirmed, calls submitOrder().
 * * @async
 * @returns {Promise<void>}
 */
async function confirmOrder() {
    const confirmation = Boolean(localStorage.getItem('foo')) || false;
    if (confirmation) {
        await submitOrder();
    }
    else {
        openMissAnything();
    }
}

/**
 * Finalizes the order and submits it to the backend.
 * Checks if the order is empty before sending.
 * On success, clears local storage and redirects to the home page.
 * * @async
 * @returns {Promise<void>}
 */
async function submitOrder() {
    const order = JSON.parse(localStorage.getItem('Totalorder'));

    if (order.entries.length === 0) {
        document.getElementById('complete-order-button').disabled = true;
        alert('Your order is empty. Please add items before completing the order.');
        return;
    }

    try {
        const response = await fetch('/customer/finalize-order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                entries: JSON.stringify(order.entries),
                totalCost: order.totalPrice,
                orderId: JSON.parse(localStorage.getItem('orderId'))
            })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.clear();
            window.location.href = '/';
        }
        else {
            alert('Failed to finalize order: ' + data.error);
        }
    } catch (error) {
        console.error('Error finalizing order:', error);
        alert('An error occurred while finalizing the order.');
    }
}

/**
 * Redirects the user to the item selection page to add more items.
 * * @async
 * @returns {Promise<void>}
 */
async function orderMore() {
    window.location.href = '../customer/item-selection';
}

/**
 * Deletes a specific entry from the order based on its ID.
 * Updates the 'Totalorder' in local storage, recalculates the total price,
 * syncs with the server via '/store-order', and reloads the page.
 * * @async
 * @param {string|number} entryID - The ID of the entry to be deleted.
 * @returns {Promise<void>} Reloads the window upon completion.
 */
async function deleteEntry(entryID) {
    let Totalorder = JSON.parse(localStorage.getItem('Totalorder'));

    Totalorder.entries = Totalorder.entries.filter(entry => entry.entryId != entryID);
    Totalorder.totalPrice = Totalorder.entries.reduce((sum, entry) => sum + entry.price, 0);
    localStorage.setItem('Totalorder', JSON.stringify(Totalorder));

    await fetch('/customer/store-order', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(Totalorder)
    });
    window.location.reload();

}

/**
 * Prepares an entry for editing.
 * Moves the entry to sessionStorage, removes it from the active order,
 * syncs the updated order with the server, and redirects the user to the appropriate
 * menu page based on the item size or type.
 * * @async
 * @param {string|number} entryId - The ID of the entry to be edited.
 * @returns {Promise<void>} Redirects to the specific item page.
 */
async function editEntry(entryId) {
    let Totalorder = JSON.parse(localStorage.getItem('Totalorder'));

    let entry = Totalorder.entries.find(entry => entry.entryId == entryId);
    sessionStorage.setItem('editEntry', JSON.stringify(entry));
    Totalorder.entries = Totalorder.entries.filter(entry => entry.entryId != entryId);
    Totalorder.totalPrice = Totalorder.entries.reduce((sum, entry) => sum + entry.price, 0);
    localStorage.setItem('Totalorder', JSON.stringify(Totalorder));

    await fetch('/customer/store-order', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(Totalorder)
    });

    if (entry.size === 'Appetizer') {
        window.location.href = '/customer/apps?item=Appetizer';
    }
    if (entry.size === 'Drink') {
        window.location.href = '/customer/drinks?item=Drink';
    }
    if (entry.size === 'Small' || entry.size === 'Medium' || entry.size === 'Large') {
        window.location.href = '/customer/menu-items?item=Al a Carte';
    }
    else{
        window.location.href = '/customer/menu-items?item=' + entry.size;
    }
}

/**
 * Prompts the user for confirmation before cancelling the entire order.
 * If confirmed, calls submitCancellation().
 * * @async
 * @returns {Promise<void>}
 */
async function cancelOrder() {
    const confirmCancel = confirm("Are you sure you want to cancel the entire order? This action cannot be undone.");
    if (confirmCancel) {
        await submitCancellation();
    }
}

/**
 * Submits a cancellation request to the backend.
 * Clears the local storage and redirects the user to the home page.
 * * @async
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
    window.location.href = '/customer';
}

/**
 * Opens the "Miss Anything" modal and sets a flag in local storage.
 */
function openMissAnything() {
    console.log("Opening modal");
    document.getElementById('miss-anything-modal').style.display = 'block';
    localStorage.setItem('foo', 'true');
}

/**
 * Closes the "Miss Anything" modal.
 */
function closeMissAnythingModal() {
    document.getElementById('miss-anything-modal').style.display = 'none';
}

/**
 * Redirects to the drinks menu page.
 */
function gotoDrinks() {
    window.location.href = '../customer/drinks?item=Drink';
}

/** 
 * Redirects to the appetizers menu page.
 */
function gotoApps() {
    window.location.href = '../customer/apps?item=Appetizer';
}

/**
 * Window click event handler to close the modal when clicking outside of it.
 */
window.onclick = function(event) {
    const modal = document.getElementById('miss-anything-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

